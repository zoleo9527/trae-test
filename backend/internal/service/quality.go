package service

import (
	"encoding/json"
	"time"

	"floor-settlement/internal/dto"
	"floor-settlement/internal/model"
	"floor-settlement/internal/repository"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

var RecordAudit func(c *fiber.Ctx, entityType string, entityID uuid.UUID, action string, before, after map[string]interface{}, remark string) error

func toMap(v interface{}) map[string]interface{} {
	data, _ := json.Marshal(v)
	var m map[string]interface{}
	json.Unmarshal(data, &m)
	return m
}

func getUserClaims(c *fiber.Ctx) *dto.UserSummary {
	claims, ok := c.Locals("user").(*dto.UserSummary)
	if !ok {
		return nil
	}
	return claims
}

type QualityService struct {
	repo *repository.QualityRepository
}

func NewQualityService() *QualityService {
	return &QualityService{repo: &repository.QualityRepository{}}
}

func (s *QualityService) Create(ctx *fiber.Ctx, req *dto.QualityCreate) (*model.QualityInspection, error) {
	claims := getUserClaims(ctx)
	projectID, _ := uuid.Parse(req.ProjectID)
	teamID, _ := uuid.Parse(req.TeamID)
	inspectionDate, _ := time.Parse("2006-01-02", req.InspectionDate)

	inspection := &model.QualityInspection{
		ProjectID:      projectID,
		TeamID:         teamID,
		Area:           req.Area,
		InspectionDate: inspectionDate,
		InspectorID:    claims.ID,
		Result:         req.Result,
		IssuesFound:    req.IssuesFound,
		ReworkRequired: req.ReworkRequired,
		Remark:         req.Remark,
	}

	if err := s.repo.Create(inspection); err != nil {
		return nil, err
	}

	remark := ""
	if req.ReworkRequired {
		remark = "rework required"
	}
	RecordAudit(ctx, "quality_inspection", inspection.ID, "create", nil, toMap(inspection), remark)

	return inspection, nil
}

func (s *QualityService) FindByID(id uuid.UUID) (*model.QualityInspection, error) {
	return s.repo.FindByID(id)
}

func (s *QualityService) Update(ctx *fiber.Ctx, id uuid.UUID, req *dto.QualityCreate) (*model.QualityInspection, error) {
	before, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	beforeMap := toMap(before)

	inspectionDate, _ := time.Parse("2006-01-02", req.InspectionDate)
	before.ProjectID, _ = uuid.Parse(req.ProjectID)
	before.TeamID, _ = uuid.Parse(req.TeamID)
	before.Area = req.Area
	before.InspectionDate = inspectionDate
	before.Result = req.Result
	before.IssuesFound = req.IssuesFound
	before.ReworkRequired = req.ReworkRequired
	before.Remark = req.Remark

	if err := s.repo.Update(before); err != nil {
		return nil, err
	}

	RecordAudit(ctx, "quality_inspection", id, "update", beforeMap, toMap(before), "")

	return before, nil
}

func (s *QualityService) Filter(ctx *fiber.Ctx, filter *dto.QualityFilter) ([]model.QualityInspection, int64, error) {
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

	return s.repo.Filter(projectID, teamID, filter.Result, filter.StartDate, filter.EndDate, filter.Page, filter.PageSize)
}

func (s *QualityService) GetPassRate(projectID uuid.UUID) (float64, error) {
	pass, err := s.repo.CountByResult(projectID, "pass")
	if err != nil {
		return 0, err
	}
	total, err := s.repo.CountByProject(projectID)
	if err != nil {
		return 0, err
	}
	if total == 0 {
		return 0, nil
	}
	return float64(pass) / float64(total), nil
}
