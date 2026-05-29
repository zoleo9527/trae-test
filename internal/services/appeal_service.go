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

type AppealService struct{}

func NewAppealService() *AppealService {
	return &AppealService{}
}

func (s *AppealService) CreateAppeal(c *fiber.Ctx, req *schemas.CreateAppealRequest) (*models.Appeal, error) {
	orderID, _ := uuid.Parse(req.OrderID)
	appealerID := utils.GetCurrentUser(c).UserID
	appealer := utils.GetCurrentUser(c)

	var order models.Order
	if err := database.DB.Where("id = ?", orderID).First(&order).Error; err != nil {
		return nil, errors.New("order not found")
	}

	var refundID *uuid.UUID
	if req.RefundID != nil {
		rid, _ := uuid.Parse(*req.RefundID)
		refundID = &rid
	}

	appeal := &models.Appeal{
		AppealNo:     utils.GenerateAppealNo(),
		OrderID:      orderID,
		RefundID:     refundID,
		AppealerID:   appealerID,
		AppealerType: string(appealer.Role),
		Status:       models.AppealStatusPending,
		Title:        req.Title,
		Content:      req.Content,
		Evidence:     req.Evidence,
	}

	if err := database.DB.Create(appeal).Error; err != nil {
		return nil, err
	}

	utils.LogOperation(c, models.ActionCreateAppeal, appeal.ID, "appeal", nil, appeal, "创建申诉")
	s.enqueueAppealNotification(appeal)
	return appeal, nil
}

func (s *AppealService) GetAppealByID(id uuid.UUID) (*models.Appeal, error) {
	var appeal models.Appeal
	if err := database.DB.Preload("Order").Preload("Refund").Preload("Appealer").
		Preload("Handler").Preload("Remarks.Author").
		Where("id = ?", id).First(&appeal).Error; err != nil {
		return nil, err
	}
	return &appeal, nil
}

func (s *AppealService) QueryAppeals(query *schemas.AppealQuery) ([]models.Appeal, int64, error) {
	var appeals []models.Appeal
	var total int64

	db := database.DB.Model(&models.Appeal{}).Preload("Order").Preload("Appealer").Preload("Handler")

	if query.OrderNo != "" {
		db = db.Joins("JOIN orders ON orders.id = appeals.order_id").
			Where("orders.order_no LIKE ?", "%"+query.OrderNo+"%")
	}
	if query.Status != "" {
		db = db.Where("appeals.status = ?", query.Status)
	}
	if query.AppealerID != "" {
		db = db.Where("appeals.appealer_id = ?", query.AppealerID)
	}
	if query.HandlerID != "" {
		db = db.Where("appeals.handler_id = ?", query.HandlerID)
	}
	if query.StartDate != "" {
		db = db.Where("appeals.created_at >= ?", query.StartDate)
	}
	if query.EndDate != "" {
		db = db.Where("appeals.created_at <= ?", query.EndDate)
	}

	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (query.Page - 1) * query.PageSize
	if err := db.Offset(offset).Limit(query.PageSize).Order("appeals.created_at DESC").Find(&appeals).Error; err != nil {
		return nil, 0, err
	}

	return appeals, total, nil
}

func (s *AppealService) HandleAppeal(c *fiber.Ctx, id uuid.UUID, req *schemas.HandleAppealRequest) (*models.Appeal, error) {
	var appeal models.Appeal
	if err := database.DB.Where("id = ?", id).First(&appeal).Error; err != nil {
		return nil, errors.New("appeal not found")
	}

	oldAppeal := appeal
	handlerID := utils.GetCurrentUser(c).UserID
	now := time.Now()

	if appeal.Status != models.AppealStatusPending && appeal.Status != models.AppealStatusReviewing {
		return nil, errors.New("appeal cannot be handled in current status")
	}

	appeal.Status = req.Status
	appeal.HandlerID = &handlerID
	appeal.HandledAt = &now

	if req.Status == models.AppealStatusUpheld {
		appeal.Result = req.Result
	} else if req.Status == models.AppealStatusRejected {
		appeal.RejectReason = req.RejectReason
	}

	if err := database.DB.Save(&appeal).Error; err != nil {
		return nil, err
	}

	var action models.OperationAction
	if req.Status == models.AppealStatusUpheld {
		action = models.ActionUpheldAppeal
	} else {
		action = models.ActionRejectAppeal
	}

	utils.LogOperation(c, action, id, "appeal", &oldAppeal, &appeal, req.Remark)
	s.enqueueAppealResultNotification(appeal)
	return &appeal, nil
}

func (s *AppealService) AddRemark(c *fiber.Ctx, appealID uuid.UUID, req *schemas.AddRemarkRequest) (*models.Remark, error) {
	user := utils.GetCurrentUser(c)

	remark := &models.Remark{
		TargetID:   appealID,
		TargetType: "appeal",
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

	utils.LogOperation(c, models.ActionAddRemark, appealID, "appeal", nil, remark, "添加备注")
	return remark, nil
}

func (s *AppealService) GetAppealDetail(id uuid.UUID) (map[string]interface{}, error) {
	appeal, err := s.GetAppealByID(id)
	if err != nil {
		return nil, err
	}

	var logs []models.OperationLog
	if err := database.DB.Where("target_id = ? AND target_type = ?", id, "appeal").
		Preload("Operator").
		Order("created_at DESC").
		Find(&logs).Error; err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"appeal":        appeal,
		"operation_logs": logs,
	}, nil
}

func (s *AppealService) enqueueAppealNotification(appeal *models.Appeal) {
	payload, _ := json.Marshal(map[string]interface{}{
		"appeal_id":   appeal.ID,
		"appeal_no":   appeal.AppealNo,
		"order_id":    appeal.OrderID,
		"title":       appeal.Title,
		"appealer_id": appeal.AppealerID,
		"type":        "new_appeal",
	})

	task := &models.TaskQueue{
		TaskType:  "appeal_notification",
		Payload:   string(payload),
		Priority:  2,
		ExecuteAt: time.Now(),
	}
	database.DB.Create(task)
}

func (s *AppealService) enqueueAppealResultNotification(appeal models.Appeal) {
	payload, _ := json.Marshal(map[string]interface{}{
		"appeal_id": appeal.ID,
		"appeal_no": appeal.AppealNo,
		"status":    appeal.Status,
		"result":    appeal.Result,
		"type":      "appeal_result",
	})

	task := &models.TaskQueue{
		TaskType:  "appeal_result_notification",
		Payload:   string(payload),
		Priority:  2,
		ExecuteAt: time.Now(),
	}
	database.DB.Create(task)
}
