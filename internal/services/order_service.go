package services

import (
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

type OrderService struct{}

func NewOrderService() *OrderService {
	return &OrderService{}
}

func (s *OrderService) CreateOrder(c *fiber.Ctx, req *schemas.CreateOrderRequest) (*models.Order, error) {
	userID, _ := uuid.Parse(req.UserID)
	merchantID, _ := uuid.Parse(req.MerchantID)

	order := &models.Order{
		OrderNo:          utils.GenerateOrderNo("ORD"),
		UserID:           userID,
		MerchantID:       merchantID,
		Status:           models.OrderStatusPending,
		OrderType:        req.OrderType,
		GoodsDescription: req.GoodsDescription,
		GoodsValue:       req.GoodsValue,
		DeliveryFee:      req.DeliveryFee,
		TotalAmount:      req.GoodsValue + req.DeliveryFee,
		PickupAddress:    req.PickupAddress,
		DeliveryAddress:  req.DeliveryAddress,
		ExpectedTime:     &req.ExpectedTime,
		Remark:           req.Remark,
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(order).Error; err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		return nil, err
	}

	utils.LogOperation(c, models.ActionUpdateOrder, order.ID, "order", nil, order, "创建订单")
	return order, nil
}

func (s *OrderService) GetOrderByID(id uuid.UUID) (*models.Order, error) {
	var order models.Order
	if err := database.DB.Preload("User").Preload("Runner").Preload("Merchant").
		Preload("Refunds").Preload("Appeals").Preload("Subsidies").
		Where("id = ?", id).First(&order).Error; err != nil {
		return nil, err
	}
	return &order, nil
}

func (s *OrderService) QueryOrders(query *schemas.OrderQuery) ([]models.Order, int64, error) {
	var orders []models.Order
	var total int64

	db := database.DB.Model(&models.Order{}).Preload("User").Preload("Runner").Preload("Merchant")

	if query.OrderNo != "" {
		db = db.Where("order_no LIKE ?", "%"+query.OrderNo+"%")
	}
	if query.Status != "" {
		db = db.Where("status = ?", query.Status)
	}
	if query.UserID != "" {
		db = db.Where("user_id = ?", query.UserID)
	}
	if query.RunnerID != "" {
		db = db.Where("runner_id = ?", query.RunnerID)
	}
	if query.MerchantID != "" {
		db = db.Where("merchant_id = ?", query.MerchantID)
	}
	if query.StartDate != "" {
		db = db.Where("created_at >= ?", query.StartDate)
	}
	if query.EndDate != "" {
		db = db.Where("created_at <= ?", query.EndDate)
	}

	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (query.Page - 1) * query.PageSize
	if err := db.Offset(offset).Limit(query.PageSize).Order("created_at DESC").Find(&orders).Error; err != nil {
		return nil, 0, err
	}

	return orders, total, nil
}

func (s *OrderService) AssignOrder(c *fiber.Ctx, orderID uuid.UUID, req *schemas.AssignOrderRequest) (*models.Order, error) {
	runnerID, _ := uuid.Parse(req.RunnerID)
	operatorID := utils.GetCurrentUser(c).UserID

	var order models.Order
	if err := database.DB.Where("id = ?", orderID).First(&order).Error; err != nil {
		return nil, errors.New("order not found")
	}

	oldOrder := order

	if order.Status != models.OrderStatusPending && order.Status != models.OrderStatusAssigned {
		return nil, errors.New("order cannot be assigned in current status")
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		order.RunnerID = &runnerID
		order.Status = models.OrderStatusAssigned
		if err := tx.Save(&order).Error; err != nil {
			return err
		}

		assignment := &models.Assignment{
			OrderID:    orderID,
			RunnerID:   runnerID,
			AssignedBy: operatorID,
			AssignedAt: time.Now(),
			IsActive:   true,
			Reason:     req.Reason,
		}
		if err := tx.Create(assignment).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	utils.LogOperation(c, models.ActionAssignOrder, orderID, "order", &oldOrder, &order, req.Reason)
	return &order, nil
}

func (s *OrderService) UpdateOrderStatus(c *fiber.Ctx, orderID uuid.UUID, req *schemas.UpdateOrderStatusRequest) (*models.Order, error) {
	var order models.Order
	if err := database.DB.Where("id = ?", orderID).First(&order).Error; err != nil {
		return nil, errors.New("order not found")
	}

	oldOrder := order

	order.Status = req.Status
	if req.TimeoutReason != "" {
		order.TimeoutReason = req.TimeoutReason
	}
	if req.Remark != "" {
		order.Remark = req.Remark
	}

	now := time.Now()
	switch req.Status {
	case models.OrderStatusPickedUp:
		order.ActualPickupTime = &now
	case models.OrderStatusDelivering:
		if order.ActualPickupTime == nil {
			order.ActualPickupTime = &now
		}
	case models.OrderStatusCompleted, models.OrderStatusRefunded:
		order.ActualDeliveryTime = &now
	}

	if err := database.DB.Save(&order).Error; err != nil {
		return nil, err
	}

	utils.LogOperation(c, models.ActionUpdateOrder, orderID, "order", &oldOrder, &order, req.Remark)
	return &order, nil
}
