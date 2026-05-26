package services

import (
	"fmt"
	"tea-distribution/internal/db"
	"tea-distribution/internal/models"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type OrderService struct {
	auditService *AuditService
}

func NewOrderService() *OrderService {
	return &OrderService{
		auditService: NewAuditService(),
	}
}

type OrderFilter struct {
	StoreID     uuid.UUID
	SalesID     uuid.UUID
	Status      string
	StartDate   time.Time
	EndDate     time.Time
	IsActivity  *bool
	Keyword     string
	Page        int
	PageSize    int
}

type CreateOrderRequest struct {
	StoreID      uuid.UUID              `json:"store_id" validate:"required"`
	SalesID      uuid.UUID              `json:"sales_id" validate:"required"`
	ExpectedDate time.Time              `json:"expected_date"`
	Remark       string                 `json:"remark"`
	IsActivity   bool                   `json:"is_activity"`
	ActivityName string                 `json:"activity_name"`
	Items        []CreateOrderItemRequest `json:"items" validate:"required,min=1"`
}

type CreateOrderItemRequest struct {
	ProductID    uuid.UUID `json:"product_id" validate:"required"`
	Quantity     float64   `json:"quantity" validate:"required,gt=0"`
	UnitPrice    float64   `json:"unit_price" validate:"required,gte=0"`
	Remark       string    `json:"remark"`
}

func (s *OrderService) Create(req *CreateOrderRequest, operatorID uuid.UUID, operatorName string) (*models.Order, error) {
	if len(req.Items) == 0 {
		return nil, models.AppErrValidationFailed("订单项不能为空")
	}

	orderNo := generateOrderNo()
	order := &models.Order{
		OrderNo:      orderNo,
		StoreID:      req.StoreID,
		SalesID:      req.SalesID,
		Status:       models.OrderStatusDraft,
		ExpectedDate: req.ExpectedDate,
		Remark:       req.Remark,
		IsActivity:   req.IsActivity,
		ActivityName: req.ActivityName,
	}

	var totalAmount float64
	var discountAmount float64
	var finalAmount float64

	for i, itemReq := range req.Items {
		var product models.Product
		if err := db.DB.First(&product, itemReq.ProductID).Error; err != nil {
			return nil, models.AppErrNotFound(fmt.Sprintf("产品不存在: %d", i+1))
		}

		originalPrice := product.StandardPrice
		discountRate := 0.0
		if originalPrice > 0 {
			discountRate = (originalPrice - itemReq.UnitPrice) / originalPrice * 100
		}

		subtotal := itemReq.Quantity * itemReq.UnitPrice
		totalAmount += itemReq.Quantity * originalPrice
		discountAmount += itemReq.Quantity * (originalPrice - itemReq.UnitPrice)
		finalAmount += subtotal

		orderItem := models.OrderItem{
			ProductID:     itemReq.ProductID,
			Quantity:      itemReq.Quantity,
			UnitPrice:     itemReq.UnitPrice,
			OriginalPrice: originalPrice,
			DiscountRate:  discountRate,
			Subtotal:      subtotal,
			Remark:        itemReq.Remark,
		}
		order.OrderItems = append(order.OrderItems, orderItem)
	}

	order.TotalAmount = totalAmount
	order.DiscountAmount = discountAmount
	order.FinalAmount = finalAmount

	err := db.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(order).Error; err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		return nil, models.AppErrInternal("创建订单失败: " + err.Error())
	}

	s.auditService.LogCreate("order", order.ID, operatorID, operatorName, order)

	return order, nil
}

func (s *OrderService) GetByID(id uuid.UUID) (*models.Order, error) {
	var order models.Order
	if err := db.DB.Preload("OrderItems.Product").Preload("Store").Preload("Sales").
		Preload("Allocations").Preload("PriceApproval").
		First(&order, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, models.AppErrNotFound("订单不存在")
		}
		return nil, models.AppErrInternal("查询订单失败")
	}
	return &order, nil
}

func (s *OrderService) List(filter *OrderFilter) ([]models.Order, int64, error) {
	var orders []models.Order
	var total int64

	query := db.DB.Model(&models.Order{}).Preload("Store").Preload("Sales")

	if filter.StoreID != uuid.Nil {
		query = query.Where("store_id = ?", filter.StoreID)
	}
	if filter.SalesID != uuid.Nil {
		query = query.Where("sales_id = ?", filter.SalesID)
	}
	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}
	if !filter.StartDate.IsZero() {
		query = query.Where("created_at >= ?", filter.StartDate)
	}
	if !filter.EndDate.IsZero() {
		query = query.Where("created_at <= ?", filter.EndDate)
	}
	if filter.IsActivity != nil {
		query = query.Where("is_activity = ?", *filter.IsActivity)
	}
	if filter.Keyword != "" {
		keyword := "%" + filter.Keyword + "%"
		query = query.Joins("JOIN stores ON stores.id = orders.store_id").
			Where("orders.order_no LIKE ? OR stores.name LIKE ?", keyword, keyword)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, models.AppErrInternal("查询订单失败")
	}

	offset := (filter.Page - 1) * filter.PageSize
	if err := query.Order("created_at DESC").Offset(offset).Limit(filter.PageSize).Find(&orders).Error; err != nil {
		return nil, 0, models.AppErrInternal("查询订单失败")
	}

	return orders, total, nil
}

func (s *OrderService) Submit(id uuid.UUID, operatorID uuid.UUID, operatorName string) (*models.Order, error) {
	order, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	if order.Status != models.OrderStatusDraft {
		return nil, models.AppErrStatusConflict("只有草稿状态的订单可以提交")
	}

	oldStatus := order.Status
	needsApproval := order.DiscountAmount > 0 && (order.DiscountAmount/order.TotalAmount > 0.1)

	err = db.DB.Transaction(func(tx *gorm.DB) error {
		if needsApproval {
			order.Status = models.OrderStatusPending
			priceApproval := &models.PriceApproval{
				OrderID:     order.ID,
				Status:      models.ApprovalStatusPending,
				ApplicantID: operatorID,
				Reason:      fmt.Sprintf("订单折扣率超过10%%，实际折扣率: %.2f%%", (order.DiscountAmount/order.TotalAmount)*100),
				SubmittedAt: time.Now(),
			}
			if err := tx.Create(priceApproval).Error; err != nil {
				return err
			}
			order.PriceApprovalID = &priceApproval.ID
		} else {
			order.Status = models.OrderStatusApproved
			now := time.Now()
			order.ApprovedAt = &now
			order.ApprovedBy = &operatorID
		}

		if err := tx.Save(order).Error; err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		return nil, models.AppErrInternal("提交订单失败: " + err.Error())
	}

	s.auditService.LogStatusChange("order", order.ID, oldStatus, order.Status, operatorID, operatorName, "提交订单")

	return order, nil
}

func (s *OrderService) Approve(id uuid.UUID, operatorID uuid.UUID, operatorName string, approvalRemark string) (*models.Order, error) {
	order, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	if order.Status != models.OrderStatusPending {
		return nil, models.AppErrStatusConflict("只有待审批状态的订单可以审批")
	}

	oldStatus := order.Status
	order.Status = models.OrderStatusApproved
	now := time.Now()
	order.ApprovedAt = &now
	order.ApprovedBy = &operatorID

	err = db.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(order).Error; err != nil {
			return err
		}

		if order.PriceApprovalID != nil {
			if err := tx.Model(&models.PriceApproval{}).
				Where("id = ?", *order.PriceApprovalID).
				Updates(map[string]interface{}{
					"status":          models.ApprovalStatusApproved,
					"approver_id":     operatorID,
					"approval_opinion": approvalRemark,
					"approved_at":     now,
				}).Error; err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		return nil, models.AppErrInternal("审批订单失败: " + err.Error())
	}

	s.auditService.LogStatusChange("order", order.ID, oldStatus, order.Status, operatorID, operatorName, approvalRemark)

	return order, nil
}

func (s *OrderService) Reject(id uuid.UUID, operatorID uuid.UUID, operatorName string, rejectReason string) (*models.Order, error) {
	order, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	if order.Status != models.OrderStatusPending {
		return nil, models.AppErrStatusConflict("只有待审批状态的订单可以驳回")
	}

	oldStatus := order.Status
	order.Status = models.OrderStatusRejected

	err = db.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(order).Error; err != nil {
			return err
		}

		if order.PriceApprovalID != nil {
			now := time.Now()
			if err := tx.Model(&models.PriceApproval{}).
				Where("id = ?", *order.PriceApprovalID).
				Updates(map[string]interface{}{
					"status":          models.ApprovalStatusRejected,
					"approver_id":     operatorID,
					"approval_opinion": rejectReason,
					"approved_at":     now,
				}).Error; err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		return nil, models.AppErrInternal("驳回订单失败: " + err.Error())
	}

	s.auditService.LogStatusChange("order", order.ID, oldStatus, order.Status, operatorID, operatorName, rejectReason)

	return order, nil
}

func (s *OrderService) Cancel(id uuid.UUID, operatorID uuid.UUID, operatorName string, cancelReason string) (*models.Order, error) {
	order, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	validStatuses := map[string]bool{
		models.OrderStatusDraft:    true,
		models.OrderStatusPending:  true,
		models.OrderStatusApproved: true,
	}

	if !validStatuses[order.Status] {
		return nil, models.AppErrStatusConflict("当前状态不允许取消")
	}

	oldStatus := order.Status
	order.Status = models.OrderStatusCancelled

	if err := db.DB.Save(order).Error; err != nil {
		return nil, models.AppErrInternal("取消订单失败")
	}

	s.auditService.LogStatusChange("order", order.ID, oldStatus, order.Status, operatorID, operatorName, cancelReason)

	return order, nil
}

func (s *OrderService) BatchSubmit(ids []uuid.UUID, operatorID uuid.UUID, operatorName string) (int, int, []string) {
	success := 0
	failed := 0
	var errors []string

	for _, id := range ids {
		_, err := s.Submit(id, operatorID, operatorName)
		if err != nil {
			failed++
			errors = append(errors, fmt.Sprintf("订单 %s: %s", id, err.Error()))
		} else {
			success++
		}
	}

	return success, failed, errors
}

func (s *OrderService) BatchApprove(ids []uuid.UUID, operatorID uuid.UUID, operatorName string, remark string) (int, int, []string) {
	success := 0
	failed := 0
	var errors []string

	for _, id := range ids {
		_, err := s.Approve(id, operatorID, operatorName, remark)
		if err != nil {
			failed++
			errors = append(errors, fmt.Sprintf("订单 %s: %s", id, err.Error()))
		} else {
			success++
		}
	}

	return success, failed, errors
}

func generateOrderNo() string {
	now := time.Now()
	return fmt.Sprintf("ORD%s%06d", now.Format("20060102150405"), time.Now().UnixNano()%1000000)
}
