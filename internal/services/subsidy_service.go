package services

import (
	"encoding/json"
	"errors"
	"runner-platform/internal/database"
	"runner-platform/internal/models"
	"runner-platform/internal/schemas"
	"runner-platform/internal/utils"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type SubsidyService struct{}

func NewSubsidyService() *SubsidyService {
	return &SubsidyService{}
}

func (s *SubsidyService) CreateSubsidy(c *fiber.Ctx, req *schemas.CreateSubsidyRequest) (*models.Subsidy, error) {
	orderID, _ := uuid.Parse(req.OrderID)
	payeeID, _ := uuid.Parse(req.PayeeID)

	var order models.Order
	if err := database.DB.Where("id = ?", orderID).First(&order).Error; err != nil {
		return nil, errors.New("order not found")
	}

	var refundID *uuid.UUID
	if req.RefundID != nil {
		rid, _ := uuid.Parse(*req.RefundID)
		refundID = &rid
	}

	var appealID *uuid.UUID
	if req.AppealID != nil {
		aid, _ := uuid.Parse(*req.AppealID)
		appealID = &aid
	}

	subsidy := &models.Subsidy{
		SubsidyNo:   utils.GenerateSubsidyNo(),
		OrderID:     orderID,
		RefundID:    refundID,
		AppealID:    appealID,
		PayeeID:     payeeID,
		PayeeType:   req.PayeeType,
		Status:      models.SubsidyStatusPending,
		Amount:      req.Amount,
		Reason:      req.Reason,
		Description: req.Description,
	}

	if err := database.DB.Create(subsidy).Error; err != nil {
		return nil, err
	}

	utils.LogOperation(c, models.ActionCreateSubsidy, subsidy.ID, "subsidy", nil, subsidy, "创建补贴申请")
	s.enqueueSubsidyNotification(subsidy)
	return subsidy, nil
}

func (s *SubsidyService) GetSubsidyByID(id uuid.UUID) (*models.Subsidy, error) {
	var subsidy models.Subsidy
	if err := database.DB.Preload("Order").Preload("Refund").Preload("Appeal").
		Preload("Payee").Preload("Approver").Preload("Remarks.Author").
		Where("id = ?", id).First(&subsidy).Error; err != nil {
		return nil, err
	}
	return &subsidy, nil
}

func (s *SubsidyService) QuerySubsidies(query *schemas.SubsidyQuery) ([]models.Subsidy, int64, error) {
	var subsidies []models.Subsidy
	var total int64

	db := database.DB.Model(&models.Subsidy{}).Preload("Order").Preload("Payee").Preload("Approver")

	if query.OrderNo != "" {
		db = db.Joins("JOIN orders ON orders.id = subsidies.order_id").
			Where("orders.order_no LIKE ?", "%"+query.OrderNo+"%")
	}
	if query.Status != "" {
		db = db.Where("subsidies.status = ?", query.Status)
	}
	if query.PayeeID != "" {
		db = db.Where("subsidies.payee_id = ?", query.PayeeID)
	}
	if query.PayeeType != "" {
		db = db.Where("subsidies.payee_type = ?", query.PayeeType)
	}
	if query.StartDate != "" {
		db = db.Where("subsidies.created_at >= ?", query.StartDate)
	}
	if query.EndDate != "" {
		db = db.Where("subsidies.created_at <= ?", query.EndDate)
	}

	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (query.Page - 1) * query.PageSize
	if err := db.Offset(offset).Limit(query.PageSize).Order("subsidies.created_at DESC").Find(&subsidies).Error; err != nil {
		return nil, 0, err
	}

	return subsidies, total, nil
}

func (s *SubsidyService) ReviewSubsidy(c *fiber.Ctx, id uuid.UUID, req *schemas.ReviewSubsidyRequest) (*models.Subsidy, error) {
	var subsidy models.Subsidy
	if err := database.DB.Where("id = ?", id).First(&subsidy).Error; err != nil {
		return nil, errors.New("subsidy not found")
	}

	oldSubsidy := subsidy
	approverID := utils.GetCurrentUser(c).UserID
	now := time.Now()

	if subsidy.Status != models.SubsidyStatusPending {
		return nil, errors.New("subsidy cannot be reviewed in current status")
	}

	subsidy.Status = req.Status
	subsidy.ApprovedBy = &approverID
	subsidy.ApprovedAt = &now

	if err := database.DB.Save(&subsidy).Error; err != nil {
		return nil, err
	}

	utils.LogOperation(c, models.ActionApproveSubsidy, id, "subsidy", &oldSubsidy, &subsidy, req.Remark)
	s.enqueueSubsidyResultNotification(subsidy)
	return &subsidy, nil
}

func (s *SubsidyService) MarkPaid(c *fiber.Ctx, id uuid.UUID, req *schemas.MarkPaidRequest) (*models.Subsidy, error) {
	var subsidy models.Subsidy
	if err := database.DB.Where("id = ?", id).First(&subsidy).Error; err != nil {
		return nil, errors.New("subsidy not found")
	}

	oldSubsidy := subsidy
	now := time.Now()

	if subsidy.Status != models.SubsidyStatusApproved {
		return nil, errors.New("subsidy must be approved before marking as paid")
	}

	subsidy.Status = models.SubsidyStatusPaid
	subsidy.PaidAt = &now
	subsidy.PaymentMethod = req.PaymentMethod
	subsidy.TransactionNo = req.TransactionNo

	if err := database.DB.Save(&subsidy).Error; err != nil {
		return nil, err
	}

	utils.LogOperation(c, models.ActionApproveSubsidy, id, "subsidy", &oldSubsidy, &subsidy, "标记已付款")
	s.enqueueSubsidyPaymentNotification(subsidy)
	return &subsidy, nil
}

func (s *SubsidyService) AddRemark(c *fiber.Ctx, subsidyID uuid.UUID, req *schemas.AddRemarkRequest) (*models.Remark, error) {
	user := utils.GetCurrentUser(c)

	remark := &models.Remark{
		TargetID:   subsidyID,
		TargetType: "subsidy",
		AuthorID:   user.UserID,
		Content:    req.Content,
		IsInternal: req.IsInternal,
	}

	if err := database.DB.Create(remark).Error; err != nil {
		return nil, err
	}

	if err := database.DB.Preload("Author").First(remark, remark.ID).Error; err != nil {
		return nil, err
	}

	utils.LogOperation(c, models.ActionAddRemark, subsidyID, "subsidy", nil, remark, "添加备注")
	return remark, nil
}

func (s *SubsidyService) GetSubsidyDetail(id uuid.UUID) (map[string]interface{}, error) {
	subsidy, err := s.GetSubsidyByID(id)
	if err != nil {
		return nil, err
	}

	var logs []models.OperationLog
	if err := database.DB.Where("target_id = ? AND target_type = ?", id, "subsidy").
		Preload("Operator").
		Order("created_at DESC").
		Find(&logs).Error; err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"subsidy":       subsidy,
		"operation_logs": logs,
	}, nil
}

func (s *SubsidyService) enqueueSubsidyNotification(subsidy *models.Subsidy) {
	payload, _ := json.Marshal(map[string]interface{}{
		"subsidy_id": subsidy.ID,
		"subsidy_no": subsidy.SubsidyNo,
		"order_id":   subsidy.OrderID,
		"amount":     subsidy.Amount,
		"payee_id":   subsidy.PayeeID,
		"type":       "new_subsidy",
	})

	task := &models.TaskQueue{
		TaskType:  "subsidy_notification",
		Payload:   string(payload),
		Priority:  3,
		ExecuteAt: time.Now(),
	}
	database.DB.Create(task)
}

func (s *SubsidyService) enqueueSubsidyResultNotification(subsidy models.Subsidy) {
	payload, _ := json.Marshal(map[string]interface{}{
		"subsidy_id": subsidy.ID,
		"subsidy_no": subsidy.SubsidyNo,
		"status":     subsidy.Status,
		"amount":     subsidy.Amount,
		"type":       "subsidy_result",
	})

	task := &models.TaskQueue{
		TaskType:  "subsidy_result_notification",
		Payload:   string(payload),
		Priority:  3,
		ExecuteAt: time.Now(),
	}
	database.DB.Create(task)
}

func (s *SubsidyService) enqueueSubsidyPaymentNotification(subsidy models.Subsidy) {
	payload, _ := json.Marshal(map[string]interface{}{
		"subsidy_id":     subsidy.ID,
		"subsidy_no":     subsidy.SubsidyNo,
		"amount":         subsidy.Amount,
		"transaction_no": subsidy.TransactionNo,
		"type":           "subsidy_payment",
	})

	task := &models.TaskQueue{
		TaskType:  "subsidy_payment_notification",
		Payload:   string(payload),
		Priority:  3,
		ExecuteAt: time.Now(),
	}
	database.DB.Create(task)
}
