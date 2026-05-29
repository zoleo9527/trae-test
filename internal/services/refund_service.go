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
	"gorm.io/gorm"
)

type RefundService struct{}

func NewRefundService() *RefundService {
	return &RefundService{}
}

func (s *RefundService) CreateRefund(c *fiber.Ctx, req *schemas.CreateRefundRequest) (*models.Refund, error) {
	orderID, _ := uuid.Parse(req.OrderID)
	user := utils.GetCurrentUser(c)

	if user.Role == models.RoleUser {
		var order models.Order
		if err := database.DB.Where("id = ?", orderID).First(&order).Error; err != nil {
			return nil, errors.New("order not found")
		}
		if order.UserID != user.UserID {
			return nil, errors.New("you can only create refunds for your own orders")
		}
	}

	var order models.Order
	if err := database.DB.Where("id = ?", orderID).First(&order).Error; err != nil {
		return nil, errors.New("order not found")
	}

	if order.Status == models.OrderStatusRefunded {
		return nil, errors.New("order has already been refunded")
	}

	var existingRefund models.Refund
	if err := database.DB.Where("order_id = ? AND status IN ?", orderID,
		[]models.RefundStatus{models.RefundStatusPending, models.RefundStatusReviewing, models.RefundStatusApproved, models.RefundStatusProcessing}).First(&existingRefund).Error; err == nil {
		return nil, errors.New("a refund is already in progress for this order")
	}

	refund := &models.Refund{
		RefundNo:             utils.GenerateRefundNo(),
		OrderID:              orderID,
		UserID:               user.UserID,
		Status:               models.RefundStatusPending,
		Reason:               req.Reason,
		Amount:               req.Amount,
		Description:          req.Description,
		EvidenceImages:       req.EvidenceImages,
		OriginalOrderStatus:  order.Status,
	}

	recalcRefundSplit(refund, &order)

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(refund).Error; err != nil {
			return err
		}

		if err := tx.Model(&order).Update("status", models.OrderStatusRefunded).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	utils.LogOperation(c, models.ActionCreateRefund, refund.ID, "refund", nil, refund, "创建退款申请")
	s.enqueueRefundNotification(refund)
	return refund, nil
}

func (s *RefundService) GetRefundByID(c *fiber.Ctx, id uuid.UUID) (*models.Refund, error) {
	var refund models.Refund
	if err := database.DB.Preload("Order").Preload("User").Preload("Reviewer").
		Preload("Processor").Preload("Remarks.Author").Preload("Appeals").
		Where("id = ?", id).First(&refund).Error; err != nil {
		return nil, err
	}

	if err := checkRefundAccess(c, &refund); err != nil {
		return nil, err
	}

	return &refund, nil
}

func (s *RefundService) QueryRefunds(c *fiber.Ctx, query *schemas.RefundQuery) ([]models.Refund, int64, error) {
	var refunds []models.Refund
	var total int64

	user := utils.GetCurrentUser(c)
	db := database.DB.Model(&models.Refund{}).Preload("Order").Preload("User").Preload("Reviewer")

	if !user.Role.IsStaff() {
		switch user.Role {
		case models.RoleUser:
			db = db.Where("refunds.user_id = ?", user.UserID)
		case models.RoleRunner:
			db = db.Joins("JOIN orders ON orders.id = refunds.order_id").
				Where("orders.runner_id = ?", user.UserID)
		case models.RoleMerchant:
			db = db.Joins("JOIN orders ON orders.id = refunds.order_id").
				Where("orders.merchant_id = ?", user.UserID)
		}
	}

	if query.OrderNo != "" {
		db = db.Joins("JOIN orders ON orders.id = refunds.order_id").
			Where("orders.order_no LIKE ?", "%"+query.OrderNo+"%")
	}
	if query.Status != "" {
		db = db.Where("refunds.status = ?", query.Status)
	}
	if query.Reason != "" {
		db = db.Where("refunds.reason = ?", query.Reason)
	}
	if query.UserID != "" {
		db = db.Where("refunds.user_id = ?", query.UserID)
	}
	if query.StartDate != "" {
		db = db.Where("refunds.created_at >= ?", query.StartDate)
	}
	if query.EndDate != "" {
		db = db.Where("refunds.created_at <= ?", query.EndDate)
	}

	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (query.Page - 1) * query.PageSize
	if err := db.Offset(offset).Limit(query.PageSize).Order("refunds.created_at DESC").Find(&refunds).Error; err != nil {
		return nil, 0, err
	}

	return refunds, total, nil
}

func (s *RefundService) UpdateRefund(c *fiber.Ctx, id uuid.UUID, req *schemas.UpdateRefundRequest) (*models.Refund, error) {
	var refund models.Refund
	if err := database.DB.Where("id = ?", id).First(&refund).Error; err != nil {
		return nil, errors.New("refund not found")
	}

	user := utils.GetCurrentUser(c)
	if !user.Role.IsStaff() && refund.UserID != user.UserID {
		return nil, errors.New("you can only update your own refunds")
	}

	oldRefund := refund

	if refund.Status != models.RefundStatusPending && refund.Status != models.RefundStatusReviewing {
		return nil, errors.New("refund cannot be updated in current status")
	}

	amountChanged := false
	if req.Reason != nil {
		refund.Reason = *req.Reason
	}
	if req.Amount != nil {
		refund.Amount = *req.Amount
		amountChanged = true
	}
	if req.Description != nil {
		refund.Description = *req.Description
	}
	if req.EvidenceImages != nil {
		refund.EvidenceImages = *req.EvidenceImages
	}

	if amountChanged {
		var order models.Order
		if err := database.DB.Where("id = ?", refund.OrderID).First(&order).Error; err != nil {
			return nil, errors.New("associated order not found")
		}
		recalcRefundSplit(&refund, &order)
	}

	if err := database.DB.Save(&refund).Error; err != nil {
		return nil, err
	}

	utils.LogOperation(c, models.ActionUpdateRefund, id, "refund", &oldRefund, &refund, "更新退款申请")
	return &refund, nil
}

func (s *RefundService) ReviewRefund(c *fiber.Ctx, id uuid.UUID, req *schemas.ReviewRefundRequest) (*models.Refund, error) {
	var refund models.Refund
	if err := database.DB.Where("id = ?", id).First(&refund).Error; err != nil {
		return nil, errors.New("refund not found")
	}

	oldRefund := refund
	reviewerID := utils.GetCurrentUser(c).UserID
	now := time.Now()

	if refund.Status != models.RefundStatusPending && refund.Status != models.RefundStatusReviewing {
		return nil, errors.New("refund cannot be reviewed in current status")
	}

	refund.Status = req.Status
	refund.ReviewedBy = &reviewerID
	refund.ReviewedAt = &now

	if req.Status == models.RefundStatusRejected {
		refund.RejectReason = req.RejectReason
	}

	if req.Status == models.RefundStatusProcessing {
		refund.ProcessedBy = &reviewerID
		refund.ProcessedAt = &now
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&refund).Error; err != nil {
			return err
		}

		if req.Status == models.RefundStatusRejected {
			var order models.Order
			if err := tx.Where("id = ?", refund.OrderID).First(&order).Error; err == nil {
				if order.Status == models.OrderStatusRefunded {
					restoreStatus := refund.OriginalOrderStatus
					if restoreStatus == "" {
						restoreStatus = models.OrderStatusCompleted
					}
					if err := tx.Model(&order).Update("status", restoreStatus).Error; err != nil {
						return err
					}
				}
			}
		}

		if req.Status == models.RefundStatusApproved {
			s.enqueueRefundPayment(refund)
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	var action models.OperationAction
	if req.Status == models.RefundStatusApproved || req.Status == models.RefundStatusProcessing {
		action = models.ActionApproveRefund
	} else {
		action = models.ActionRejectRefund
	}

	utils.LogOperation(c, action, id, "refund", &oldRefund, &refund, req.Remark)
	return &refund, nil
}

func (s *RefundService) AddRemark(c *fiber.Ctx, refundID uuid.UUID, req *schemas.AddRemarkRequest) (*models.Remark, error) {
	var refund models.Refund
	if err := database.DB.Where("id = ?", refundID).First(&refund).Error; err != nil {
		return nil, errors.New("refund not found")
	}

	if err := checkRefundAccess(c, &refund); err != nil {
		return nil, err
	}

	user := utils.GetCurrentUser(c)

	remark := &models.Remark{
		TargetID:   refundID,
		TargetType: "refund",
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

	utils.LogOperation(c, models.ActionAddRemark, refundID, "refund", nil, remark, "添加备注")
	return remark, nil
}

func (s *RefundService) GetRefundDetail(c *fiber.Ctx, id uuid.UUID) (*schemas.RefundDetailResponse, error) {
	refund, err := s.GetRefundByID(c, id)
	if err != nil {
		return nil, err
	}

	var logs []models.OperationLog
	if err := database.DB.Where("target_id = ? AND target_type = ?", id, "refund").
		Preload("Operator").
		Order("created_at DESC").
		Find(&logs).Error; err != nil {
		return nil, err
	}

	return &schemas.RefundDetailResponse{
		Refund: refund,
		Logs:   logs,
	}, nil
}

func checkRefundAccess(c *fiber.Ctx, refund *models.Refund) error {
	user := utils.GetCurrentUser(c)
	if user == nil {
		return errors.New("user not authenticated")
	}
	if user.Role.IsStaff() {
		return nil
	}
	switch user.Role {
	case models.RoleUser:
		if refund.UserID != user.UserID {
			return errors.New("access denied")
		}
	case models.RoleRunner, models.RoleMerchant:
		var order models.Order
		if err := database.DB.Where("id = ?", refund.OrderID).First(&order).Error; err != nil {
			return errors.New("access denied")
		}
		if (user.Role == models.RoleRunner && order.RunnerID != nil && *order.RunnerID != user.UserID) ||
			(user.Role == models.RoleMerchant && order.MerchantID != user.UserID) {
			return errors.New("access denied")
		}
	}
	return nil
}

func recalcRefundSplit(refund *models.Refund, order *models.Order) {
	var deliveryFeeRefund float64
	var goodsValueRefund float64

	if refund.Amount >= order.DeliveryFee {
		deliveryFeeRefund = order.DeliveryFee
		goodsValueRefund = refund.Amount - order.DeliveryFee
	} else {
		deliveryFeeRefund = refund.Amount
		goodsValueRefund = 0
	}

	refund.DeliveryFeeRefund = deliveryFeeRefund
	refund.GoodsValueRefund = goodsValueRefund
}

func (s *RefundService) enqueueRefundNotification(refund *models.Refund) {
	payload, _ := json.Marshal(map[string]interface{}{
		"refund_id": refund.ID,
		"refund_no": refund.RefundNo,
		"order_id":  refund.OrderID,
		"amount":    refund.Amount,
		"user_id":   refund.UserID,
		"type":      "new_refund",
	})

	task := &models.TaskQueue{
		TaskType:  "refund_notification",
		Payload:   string(payload),
		Priority:  1,
		ExecuteAt: time.Now(),
	}
	database.DB.Create(task)
}

func (s *RefundService) enqueueRefundPayment(refund models.Refund) {
	payload, _ := json.Marshal(map[string]interface{}{
		"refund_id": refund.ID,
		"refund_no": refund.RefundNo,
		"amount":    refund.Amount,
		"user_id":   refund.UserID,
		"type":      "refund_payment",
	})

	task := &models.TaskQueue{
		TaskType:  "refund_payment",
		Payload:   string(payload),
		Priority:  5,
		ExecuteAt: time.Now().Add(5 * time.Minute),
	}
	database.DB.Create(task)
}
