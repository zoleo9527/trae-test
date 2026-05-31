package service

import (
	"time"

	"floor-settlement/internal/dto"
	"floor-settlement/internal/model"
	"floor-settlement/internal/repository"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type DeliveryService struct {
	repo *repository.DeliveryRepository
}

func NewDeliveryService() *DeliveryService {
	return &DeliveryService{repo: &repository.DeliveryRepository{}}
}

func (s *DeliveryService) Create(ctx *fiber.Ctx, req *dto.DeliveryCreate) (*model.DeliveryReceipt, error) {
	claims := getUserClaims(ctx)
	projectID, _ := uuid.Parse(req.ProjectID)
	teamID, _ := uuid.Parse(req.TeamID)
	deliveryDate, _ := time.Parse("2006-01-02", req.DeliveryDate)

	receipt := &model.DeliveryReceipt{
		ProjectID:     projectID,
		TeamID:        teamID,
		MaterialName:  req.MaterialName,
		Specification: req.Specification,
		Quantity:      req.Quantity,
		Unit:          req.Unit,
		DeliveryDate:  deliveryDate,
		ReceivedBy:    req.ReceivedBy,
		ReceiptStatus: req.ReceiptStatus,
		Remark:        req.Remark,
		CreatedBy:     claims.ID,
	}

	if err := s.repo.Create(receipt); err != nil {
		return nil, err
	}

	RecordAudit(ctx, "delivery_receipt", receipt.ID, "create", nil, toMap(receipt), "")

	return receipt, nil
}

func (s *DeliveryService) FindByID(id uuid.UUID) (*model.DeliveryReceipt, error) {
	return s.repo.FindByID(id)
}

func (s *DeliveryService) Update(ctx *fiber.Ctx, id uuid.UUID, req *dto.DeliveryCreate) (*model.DeliveryReceipt, error) {
	before, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	beforeMap := toMap(before)

	deliveryDate, _ := time.Parse("2006-01-02", req.DeliveryDate)
	before.ProjectID, _ = uuid.Parse(req.ProjectID)
	before.TeamID, _ = uuid.Parse(req.TeamID)
	before.MaterialName = req.MaterialName
	before.Specification = req.Specification
	before.Quantity = req.Quantity
	before.Unit = req.Unit
	before.DeliveryDate = deliveryDate
	before.ReceivedBy = req.ReceivedBy
	before.ReceiptStatus = req.ReceiptStatus
	before.Remark = req.Remark

	if err := s.repo.Update(before); err != nil {
		return nil, err
	}

	RecordAudit(ctx, "delivery_receipt", id, "update", beforeMap, toMap(before), "")

	return before, nil
}

func (s *DeliveryService) Filter(ctx *fiber.Ctx, filter *dto.DeliveryFilter) ([]model.DeliveryReceipt, int64, error) {
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

	return s.repo.Filter(projectID, teamID, filter.ReceiptStatus, filter.MaterialName, filter.StartDate, filter.EndDate, filter.Page, filter.PageSize)
}
