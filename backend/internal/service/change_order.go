package service

import (
	"time"

	"floor-settlement/internal/dto"
	"floor-settlement/internal/model"
	"floor-settlement/internal/repository"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ChangeOrderService struct {
	repo *repository.ChangeOrderRepository
}

func NewChangeOrderService() *ChangeOrderService {
	return &ChangeOrderService{repo: &repository.ChangeOrderRepository{}}
}

func (s *ChangeOrderService) Create(ctx *fiber.Ctx, req *dto.ChangeOrderCreate) (*model.ChangeOrder, error) {
	claims := getUserClaims(ctx)
	projectID, _ := uuid.Parse(req.ProjectID)
	teamID, _ := uuid.Parse(req.TeamID)

	order := &model.ChangeOrder{
		ProjectID:    projectID,
		TeamID:       teamID,
		ChangeType:   req.ChangeType,
		Description:  req.Description,
		BeforeValue:  model.MapJSON(req.BeforeValue),
		AfterValue:   model.MapJSON(req.AfterValue),
		ImpactAmount: req.ImpactAmount,
		RequestedBy:  claims.ID,
		Remark:       req.Remark,
	}

	if err := s.repo.Create(order); err != nil {
		return nil, err
	}

	RecordAudit(ctx, "change_order", order.ID, "create", nil, toMap(order), "change_type: "+req.ChangeType)

	return order, nil
}

func (s *ChangeOrderService) FindByID(id uuid.UUID) (*model.ChangeOrder, error) {
	return s.repo.FindByID(id)
}

func (s *ChangeOrderService) Confirm(ctx *fiber.Ctx, id uuid.UUID, req *dto.ChangeOrderConfirm) (*model.ChangeOrder, error) {
	before, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	beforeMap := toMap(before)

	claims := getUserClaims(ctx)
	before.ConfirmedBy = &claims.ID
	now := time.Now()
	before.ConfirmedAt = &now
	before.Status = req.Status
	before.Remark = req.Remark

	if err := s.repo.Update(before); err != nil {
		return nil, err
	}

	RecordAudit(ctx, "change_order", id, "confirm", beforeMap, toMap(before), "")

	return before, nil
}

func (s *ChangeOrderService) Filter(ctx *fiber.Ctx, filter *dto.ChangeOrderFilter) ([]model.ChangeOrder, int64, error) {
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

	return s.repo.Filter(projectID, teamID, filter.Status, filter.ChangeType, filter.Page, filter.PageSize)
}
