package service

import (
	"time"

	"floor-settlement/internal/dto"
	"floor-settlement/internal/model"
	"floor-settlement/internal/repository"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ReworkService struct {
	repo *repository.ReworkRepository
}

func NewReworkService() *ReworkService {
	return &ReworkService{repo: &repository.ReworkRepository{}}
}

func (s *ReworkService) Create(ctx *fiber.Ctx, req *dto.ReworkCreate) (*model.ReworkRecord, error) {
	claims := getUserClaims(ctx)
	projectID, _ := uuid.Parse(req.ProjectID)
	teamID, _ := uuid.Parse(req.TeamID)
	inspectionID, _ := uuid.Parse(req.QualityInspectionID)

	record := &model.ReworkRecord{
		ProjectID:           projectID,
		TeamID:              teamID,
		QualityInspectionID: inspectionID,
		Reason:              req.Reason,
		Description:         req.Description,
		Cost:                req.Cost,
		ResponsiblePerson:   req.ResponsiblePerson,
		Remark:              req.Remark,
		CreatedBy:           claims.ID,
	}

	if err := s.repo.Create(record); err != nil {
		return nil, err
	}

	RecordAudit(ctx, "rework_record", record.ID, "create", nil, toMap(record), "reason: "+req.Reason)

	return record, nil
}

func (s *ReworkService) FindByID(id uuid.UUID) (*model.ReworkRecord, error) {
	return s.repo.FindByID(id)
}

func (s *ReworkService) UpdateStatus(ctx *fiber.Ctx, id uuid.UUID, req *dto.ReworkStatusUpdate) (*model.ReworkRecord, error) {
	before, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	beforeMap := toMap(before)

	before.Status = req.Status
	if req.Status == "completed" {
		now := time.Now()
		before.CompletedAt = &now
	}
	if req.Cost != nil {
		before.Cost = *req.Cost
	}
	before.Remark = req.Remark

	if err := s.repo.Update(before); err != nil {
		return nil, err
	}

	RecordAudit(ctx, "rework_record", id, "update_status", beforeMap, toMap(before), "")

	return before, nil
}

func (s *ReworkService) Filter(ctx *fiber.Ctx, filter *dto.ReworkFilter) ([]model.ReworkRecord, int64, error) {
	claims := getUserClaims(ctx)
	projectID, _ := uuid.Parse(filter.ProjectID)
	teamID, _ := uuid.Parse(filter.TeamID)

	if claims != nil {
		switch claims.Role {
		case "team_leader":
			if claims.TeamID != nil {
				teamID = *claims.TeamID
			}
		case "project_manager":
			if claims.ProjectID != nil {
				projectID = *claims.ProjectID
			}
		}
	}

	return s.repo.Filter(projectID, teamID, filter.Status, filter.Page, filter.PageSize)
}

func (s *ReworkService) FindByQualityInspection(inspectionID uuid.UUID) ([]model.ReworkRecord, error) {
	return s.repo.FindByQualityInspectionID(inspectionID)
}
