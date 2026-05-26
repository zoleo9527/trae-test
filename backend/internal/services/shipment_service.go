package services

import (
	"fmt"
	"tea-distribution/internal/db"
	"tea-distribution/internal/models"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ShipmentService struct {
	auditService *AuditService
}

func NewShipmentService() *ShipmentService {
	return &ShipmentService{
		auditService: NewAuditService(),
	}
}

type ShipmentFilter struct {
	AllocationID uuid.UUID
	Status       string
	StartDate    time.Time
	EndDate      time.Time
	HasAbnormal  *bool
	Page         int
	PageSize     int
}

type CreateShipmentRequest struct {
	AllocationID    uuid.UUID                   `json:"allocation_id" validate:"required"`
	Shipper       string                    `json:"shipper"`
	TrackingNo    string                    `json:"tracking_no"`
	EstimatedArrival *time.Time              `json:"estimated_arrival"`
	Remark        string                    `json:"remark"`
}

type ReviewShipmentRequest struct {
	ShipmentID      uuid.UUID                   `json:"shipment_id" validate:"required"`
	Result          string                    `json:"result" validate:"required"`
	Items           []ReviewShipmentItemRequest `json:"items" validate:"required"`
	HasPriceIssue  bool                      `json:"has_price_issue"`
	PriceIssueRemark string                   `json:"price_issue_remark"`
	HasBatchIssue  bool                      `json:"has_batch_issue"`
	BatchIssueRemark string                   `json:"batch_issue_remark"`
	Remark          string                    `json:"remark"`
}

type ReviewShipmentItemRequest struct {
	ShipmentItemID uuid.UUID `json:"shipment_item_id" validate:"required"`
	ActualQty     float64   `json:"actual_qty" validate:"required,gte=0"`
	LossQty       float64   `json:"loss_qty"`
	LossReason    string    `json:"loss_reason"`
	IsAbnormal    bool      `json:"is_abnormal"`
	AbnormalRemark string   `json:"abnormal_remark"`
}

func (s *ShipmentService) Create(req *CreateShipmentRequest, operatorID uuid.UUID, operatorName string) (*models.Shipment, error) {
	allocation, err := s.validateAllocationForShipment(req.AllocationID)
	if err != nil {
		return nil, err
	}

	shipmentNo := generateShipmentNo()
	shipment := &models.Shipment{
		ShipmentNo:       shipmentNo,
		AllocationID:   req.AllocationID,
		Status:         models.ShipmentStatusPending,
		Shipper:        req.Shipper,
		TrackingNo:     req.TrackingNo,
		EstimatedArrival: req.EstimatedArrival,
		Remark:         req.Remark,
		ShippedAt:      &[]time.Time{time.Now()}[0],
	}

	var totalQty float64

	for _, allocItem := range allocation.AllocationItems {
		shipmentItem := models.ShipmentItem{
			ProductID:   allocItem.ProductID,
			BatchID:     allocItem.BatchID,
			ExpectedQty: allocItem.Quantity,
		}
		shipment.ShipmentItems = append(shipment.ShipmentItems, shipmentItem)
		totalQty += allocItem.Quantity
	}

	shipment.TotalQty = totalQty

	err = db.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(shipment).Error; err != nil {
			return err
		}

		allocation.Status = models.AllocationStatusShipped
		if err := tx.Save(allocation).Error; err != nil {
			return err
		}

		var order models.Order
		if err := tx.First(&order, allocation.OrderID).Error; err != nil {
			return err
		}
		order.Status = models.OrderStatusShipped
		if err := tx.Save(order).Error; err != nil {
			return err
		}

		if err := s.consumeInventory(tx, allocation.WarehouseID, allocation.AllocationItems); err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, models.AppErrInternal("创建发货单失败: " + err.Error())
	}

	s.auditService.LogCreate("shipment", shipment.ID, operatorID, operatorName, shipment)

	return shipment, nil
}

func (s *ShipmentService) validateAllocationForShipment(allocationID uuid.UUID) (*models.Allocation, error) {
	var allocation models.Allocation
	if err := db.DB.Preload("AllocationItems").First(&allocation, allocationID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, models.AppErrNotFound("分仓单不存在")
		}
		return nil, models.AppErrInternal("查询分仓单失败")
	}

	if allocation.Status != models.AllocationStatusPacked {
		return nil, models.AppErrStatusConflict("只有已打包状态的分仓单才能发货")
	}

	var existingShipment int64
	db.DB.Model(&models.Shipment{}).Where("allocation_id = ?", allocationID).Count(&existingShipment)
	if existingShipment > 0 {
		return nil, models.AppErrStatusConflict("该分仓单已创建发货单")
	}

	return &allocation, nil
}

func (s *ShipmentService) consumeInventory(tx *gorm.DB, warehouseID uuid.UUID, items []models.AllocationItem) error {
	for _, item := range items {
		result := tx.Model(&models.Inventory{}).
			Where("warehouse_id = ? AND batch_id = ?", warehouseID, item.BatchID).
			Updates(map[string]interface{}{
				"quantity":   gorm.Expr("quantity - ?", item.Quantity),
				"locked_qty": gorm.Expr("locked_qty - ?", item.Quantity),
			})

		if result.Error != nil {
			return result.Error
		}

		result = tx.Model(&models.Batch{}).
			Where("id = ?", item.BatchID).
			Update("remaining_qty", gorm.Expr("remaining_qty - ?", item.Quantity))

		if result.Error != nil {
			return result.Error
		}
	}
	return nil
}

func (s *ShipmentService) GetByID(id uuid.UUID) (*models.Shipment, error) {
	var shipment models.Shipment
	if err := db.DB.Preload("ShipmentItems.Product").Preload("ShipmentItems.Batch").
		Preload("Allocation.Order.Store").Preload("Reviews.Reviewer").
		First(&shipment, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, models.AppErrNotFound("发货单不存在")
		}
		return nil, models.AppErrInternal("查询发货单失败")
	}
	return &shipment, nil
}

func (s *ShipmentService) List(filter *ShipmentFilter) ([]models.Shipment, int64, error) {
	var shipments []models.Shipment
	var total int64

	query := db.DB.Model(&models.Shipment{}).Preload("Allocation.Order")

	if filter.AllocationID != uuid.Nil {
		query = query.Where("allocation_id = ?", filter.AllocationID)
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

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, models.AppErrInternal("查询发货单失败")
	}

	offset := (filter.Page - 1) * filter.PageSize
	if err := query.Order("created_at DESC").Offset(offset).Limit(filter.PageSize).Find(&shipments).Error; err != nil {
		return nil, 0, models.AppErrInternal("查询发货单失败")
	}

	if filter.HasAbnormal != nil && *filter.HasAbnormal {
		var filteredShipments []models.Shipment
		for _, s := range shipments {
			for _, item := range s.ShipmentItems {
				if item.IsAbnormal {
					filteredShipments = append(filteredShipments, s)
					break
				}
			}
		}
		shipments = filteredShipments
	}

	return shipments, total, nil
}

func (s *ShipmentService) StartReview(id uuid.UUID, operatorID uuid.UUID, operatorName string) (*models.Shipment, error) {
	shipment, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	if shipment.Status != models.ShipmentStatusPending {
		return nil, models.AppErrStatusConflict("只有待复核状态的发货单才能开始复核")
	}

	oldStatus := shipment.Status
	shipment.Status = models.ShipmentStatusReviewing

	if err := db.DB.Save(shipment).Error; err != nil {
		return nil, models.AppErrInternal("开始复核失败")
	}

	s.auditService.LogStatusChange("shipment", shipment.ID, oldStatus, shipment.Status, operatorID, operatorName, "开始复核")

	return shipment, nil
}

func (s *ShipmentService) Review(req *ReviewShipmentRequest, operatorID uuid.UUID, operatorName string) (*models.ShipmentReview, error) {
	shipment, err := s.GetByID(req.ShipmentID)
	if err != nil {
		return nil, err
	}

	if shipment.Status != models.ShipmentStatusReviewing {
		return nil, models.AppErrStatusConflict("只有复核中状态的发货单才能提交复核")
	}

	if req.Result != models.ReviewResultAccepted &&
		req.Result != models.ReviewResultPartial &&
		req.Result != models.ReviewResultRejected {
		return nil, models.AppErrValidationFailed("无效的复核结果")
	}

	var totalLossQty float64
	var totalLossAmount float64

	review := &models.ShipmentReview{
		ShipmentID:      req.ShipmentID,
		ReviewerID:      operatorID,
		Result:          req.Result,
		HasPriceIssue:  req.HasPriceIssue,
		PriceIssueRemark: req.PriceIssueRemark,
		HasBatchIssue:  req.HasBatchIssue,
		BatchIssueRemark: req.BatchIssueRemark,
		Remark:          req.Remark,
		ReviewedAt:    time.Now(),
	}

	err = db.DB.Transaction(func(tx *gorm.DB) error {
		shipmentItemMap := make(map[uuid.UUID]*models.ShipmentItem)
		for i := range shipment.ShipmentItems {
			shipmentItemMap[shipment.ShipmentItems[i].ID] = &shipment.ShipmentItems[i]
		}

		for _, itemReq := range req.Items {
			shipmentItem, exists := shipmentItemMap[itemReq.ShipmentItemID]
			if !exists {
				return models.AppErrValidationFailed(fmt.Sprintf("发货单项不存在: %s", itemReq.ShipmentItemID))
			}

			shipmentItem.ActualQty = itemReq.ActualQty
			shipmentItem.LossQty = itemReq.LossQty
			shipmentItem.LossReason = itemReq.LossReason
			shipmentItem.IsAbnormal = itemReq.IsAbnormal
			shipmentItem.AbnormalRemark = itemReq.AbnormalRemark

			totalLossQty += itemReq.LossQty

			var batch models.Batch
			if err := tx.First(&batch, shipmentItem.BatchID).Error; err == nil {
				totalLossAmount += itemReq.LossQty * batch.CostPrice
			}

			if err := tx.Save(shipmentItem).Error; err != nil {
				return err
			}
		}

		review.TotalLossQty = totalLossQty
		review.TotalLossAmount = totalLossAmount

		if err := tx.Create(review).Error; err != nil {
			return err
		}

		var newStatus string
		switch req.Result {
		case models.ReviewResultAccepted:
			newStatus = models.ShipmentStatusAccepted
		case models.ReviewResultPartial:
			newStatus = models.ShipmentStatusResolved
		case models.ReviewResultRejected:
			newStatus = models.ShipmentStatusDisputed
		}

		oldStatus := shipment.Status
		shipment.Status = newStatus
		shipment.ReceivedAt = &[]time.Time{time.Now()}[0]
		if err := tx.Save(shipment).Error; err != nil {
			return err
		}

		if newStatus == models.ShipmentStatusAccepted || newStatus == models.ShipmentStatusResolved {
			var order models.Order
			if err := tx.First(&order, shipment.Allocation.OrderID).Error; err == nil {
				order.Status = models.OrderStatusCompleted
				tx.Save(&order)
			}
		}

		s.auditService.LogStatusChange("shipment", shipment.ID, oldStatus, newStatus, operatorID, operatorName, req.Remark)

		if req.HasPriceIssue || req.HasBatchIssue {
			s.auditService.Log("shipment", shipment.ID, "review_issue", "", "", operatorID, operatorName, req, "复核发现问题", "", "")
		}

		return nil
	})

	if err != nil {
		return nil, models.AppErrInternal("提交复核失败: " + err.Error())
	}

	return review, nil
}

func (s *ShipmentService) ResolveDispute(id uuid.UUID, operatorID uuid.UUID, operatorName string, resolveRemark string) (*models.Shipment, error) {
	shipment, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	if shipment.Status != models.ShipmentStatusDisputed {
		return nil, models.AppErrStatusConflict("只有争议状态的发货单才能解决")
	}

	oldStatus := shipment.Status
	shipment.Status = models.ShipmentStatusResolved

	if err := db.DB.Save(shipment).Error; err != nil {
		return nil, models.AppErrInternal("解决争议失败")
	}

	s.auditService.LogStatusChange("shipment", shipment.ID, oldStatus, shipment.Status, operatorID, operatorName, resolveRemark)

	return shipment, nil
}

func (s *ShipmentService) ListAbnormalShipments(page, pageSize int) ([]models.Shipment, int64, error) {
	var shipments []models.Shipment
	var total int64

	subQuery := db.DB.Model(&models.ShipmentItem{}).
		Select("DISTINCT shipment_id").
		Where("is_abnormal = ?", true)

	query := db.DB.Model(&models.Shipment{}).
		Preload("ShipmentItems").
		Preload("Allocation.Order.Store").
		Where("id IN (?)", subQuery)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, models.AppErrInternal("查询异常发货单失败")
	}

	offset := (page - 1) * pageSize
	if err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&shipments).Error; err != nil {
		return nil, 0, models.AppErrInternal("查询异常发货单失败")
	}

	return shipments, total, nil
}

func generateShipmentNo() string {
	now := time.Now()
	return fmt.Sprintf("SHP%s%06d", now.Format("20060102150405"), time.Now().UnixNano()%1000000)
}
