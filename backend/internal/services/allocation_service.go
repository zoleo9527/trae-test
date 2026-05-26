package services

import (
	"fmt"
	"tea-distribution/internal/db"
	"tea-distribution/internal/models"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AllocationService struct {
	auditService *AuditService
}

func NewAllocationService() *AllocationService {
	return &AllocationService{
		auditService: NewAuditService(),
	}
}

type AllocationFilter struct {
	OrderID     uuid.UUID
	WarehouseID uuid.UUID
	Status      string
	StartDate   time.Time
	EndDate     time.Time
	Page        int
	PageSize    int
}

type CreateAllocationRequest struct {
	OrderID     uuid.UUID                      `json:"order_id" validate:"required"`
	WarehouseID uuid.UUID                      `json:"warehouse_id" validate:"required"`
	Remark      string                       `json:"remark"`
	Items       []CreateAllocationItemRequest `json:"items" validate:"required,min=1"`
}

type CreateAllocationItemRequest struct {
	OrderItemID uuid.UUID `json:"order_item_id" validate:"required"`
	BatchID     uuid.UUID `json:"batch_id" validate:"required"`
	Quantity    float64   `json:"quantity" validate:"required,gt=0"`
}

func (s *AllocationService) Create(req *CreateAllocationRequest, operatorID uuid.UUID, operatorName string) (*models.Allocation, error) {
	order, err := s.validateOrderForAllocation(req.OrderID)
	if err != nil {
		return nil, err
	}

	if err := s.validateAllocationItems(order, req); err != nil {
		return nil, err
	}

	allocationNo := generateAllocationNo()
	allocation := &models.Allocation{
		AllocationNo: allocationNo,
		OrderID:    req.OrderID,
		WarehouseID: req.WarehouseID,
		Status:     models.AllocationStatusPending,
		OperatorID: operatorID,
		Remark:     req.Remark,
	}

	var totalQty float64
	var hasMixedBatch bool

	for _, itemReq := range req.Items {
		orderItem, err := s.getOrderItem(itemReq.OrderItemID)
		if err != nil {
			return nil, err
		}

		batch, err := s.validateBatch(itemReq.BatchID, orderItem.ProductID, req.WarehouseID, itemReq.Quantity)
		if err != nil {
			return nil, err
		}

		allocationItem := models.AllocationItem{
			OrderItemID: itemReq.OrderItemID,
			ProductID:    orderItem.ProductID,
			BatchID:      batch.ID,
			Quantity:     itemReq.Quantity,
			IsMixedBatch: s.checkMixedBatch(orderItem.ProductID, itemReq.BatchID, req.Items),
		}

		if allocationItem.IsMixedBatch {
			hasMixedBatch = true
		}

		allocation.AllocationItems = append(allocation.AllocationItems, allocationItem)
		totalQty += itemReq.Quantity
	}

	allocation.TotalQty = totalQty

	err = db.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(allocation).Error; err != nil {
			return err
		}

		if err := s.lockInventory(tx, req.WarehouseID, req.Items); err != nil {
			return err
		}

		order.Status = models.OrderStatusAllocated
		if err := tx.Save(order).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, models.AppErrInternal("生成分仓单失败: " + err.Error())
	}

	s.auditService.LogCreate("allocation", allocation.ID, operatorID, operatorName, allocation)

	if hasMixedBatch {
		s.auditService.Log("allocation", allocation.ID, "batch_mixed_warning", "", "", operatorID, operatorName, nil, "包含批次混发标记", "", "")
	}

	return allocation, nil
}

func (s *AllocationService) validateOrderForAllocation(orderID uuid.UUID) (*models.Order, error) {
	var order models.Order
	if err := db.DB.Preload("OrderItems").First(&order, orderID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, models.AppErrNotFound("订单不存在")
		}
		return nil, models.AppErrInternal("查询订单失败")
	}

	if order.Status != models.OrderStatusApproved && order.Status != models.OrderStatusAllocated {
		return nil, models.AppErrStatusConflict("只有已审批或已分仓状态的订单才能分仓")
	}

	return &order, nil
}

func (s *AllocationService) getAlreadyAllocatedQty(orderID uuid.UUID) (map[uuid.UUID]float64, error) {
	allocatedMap := make(map[uuid.UUID]float64)

	var allocations []models.Allocation
	if err := db.DB.Where("order_id = ? AND status IN (?)", orderID, []string{models.AllocationStatusPending, models.AllocationStatusPicking, models.AllocationStatusPacked, models.AllocationStatusShipped}).Find(&allocations).Error; err != nil {
		return nil, err
	}

	for _, alloc := range allocations {
		var allocItems []models.AllocationItem
		if err := db.DB.Where("allocation_id = ?", alloc.ID).Find(&allocItems).Error; err != nil {
			continue
		}
		for _, item := range allocItems {
			allocatedMap[item.OrderItemID] += item.Quantity
		}
	}

	return allocatedMap, nil
}

func (s *AllocationService) validateAllocationItems(order *models.Order, req *CreateAllocationRequest) error {
	orderItemMap := make(map[uuid.UUID]*models.OrderItem)
	for i := range order.OrderItems {
		orderItemMap[order.OrderItems[i].ID] = &order.OrderItems[i]
	}

	alreadyAllocated, err := s.getAlreadyAllocatedQty(order.ID)
	if err != nil {
		return models.AppErrInternal("查询已分配数量失败")
	}

	for _, itemReq := range req.Items {
		orderItem, exists := orderItemMap[itemReq.OrderItemID]
		if !exists {
			return models.AppErrValidationFailed(fmt.Sprintf("订单项不存在: %s", itemReq.OrderItemID))
		}

		totalAllocated := alreadyAllocated[itemReq.OrderItemID] + itemReq.Quantity
		if totalAllocated > orderItem.Quantity {
			return models.AppErrValidationFailed(fmt.Sprintf("产品 %s 分配数量(%.2f)超过订货数量(%.2f)，已分配: %.2f", orderItem.ProductID, totalAllocated, orderItem.Quantity, alreadyAllocated[itemReq.OrderItemID]))
		}
	}

	return nil
}

func (s *AllocationService) getOrderItem(id uuid.UUID) (*models.OrderItem, error) {
	var item models.OrderItem
	if err := db.DB.First(&item, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, models.AppErrNotFound("订单项不存在")
		}
		return nil, models.AppErrInternal("查询订单项失败")
	}
	return &item, nil
}

func (s *AllocationService) validateBatch(batchID, productID, warehouseID uuid.UUID, quantity float64) (*models.Batch, error) {
	var batch models.Batch
	if err := db.DB.First(&batch, batchID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, models.AppErrNotFound("批次不存在")
		}
		return nil, models.AppErrInternal("查询批次失败")
	}

	if batch.ProductID != productID {
		return nil, models.AppErrValidationFailed("批次产品不匹配")
	}

	var inventory models.Inventory
	if err := db.DB.Where("warehouse_id = ? AND batch_id = ?", warehouseID, batchID).First(&inventory).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, models.AppErrInsufficientStock("仓库中无此批次库存")
		}
		return nil, models.AppErrInternal("查询库存失败")
	}

	if inventory.AvailableQty < quantity {
		return nil, models.AppErrInsufficientStock(fmt.Sprintf("库存不足，可用: %.2f，需求: %.2f", inventory.AvailableQty, quantity))
	}

	return &batch, nil
}

func (s *AllocationService) checkMixedBatch(productID, batchID uuid.UUID, items []CreateAllocationItemRequest) bool {
	for _, item := range items {
		orderItem, _ := s.getOrderItem(item.OrderItemID)
		if orderItem != nil && orderItem.ProductID == productID && item.BatchID != batchID {
			return true
		}
	}
	return false
}

func (s *AllocationService) lockInventory(tx *gorm.DB, warehouseID uuid.UUID, items []CreateAllocationItemRequest) error {
	for _, item := range items {
		result := tx.Model(&models.Inventory{}).
			Where("warehouse_id = ? AND batch_id = ? AND available_qty >= ?", warehouseID, item.BatchID, item.Quantity).
			Updates(map[string]interface{}{
				"available_qty": gorm.Expr("available_qty - ?", item.Quantity),
				"locked_qty": gorm.Expr("locked_qty + ?", item.Quantity),
			})

		if result.Error != nil {
			return result.Error
		}

		if result.RowsAffected == 0 {
			return models.AppErrInsufficientStock("库存锁定失败")
		}
	}
	return nil
}

func (s *AllocationService) GetByID(id uuid.UUID) (*models.Allocation, error) {
	var allocation models.Allocation
	if err := db.DB.Preload("AllocationItems.Batch").Preload("AllocationItems.Product").
		Preload("Order.Store").Preload("Warehouse").Preload("Operator").
		First(&allocation, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, models.AppErrNotFound("分仓单不存在")
		}
		return nil, models.AppErrInternal("查询分仓单失败")
	}
	return &allocation, nil
}

func (s *AllocationService) List(filter *AllocationFilter) ([]models.Allocation, int64, error) {
	var allocations []models.Allocation
	var total int64

	query := db.DB.Model(&models.Allocation{}).Preload("Order").Preload("Warehouse").Preload("Operator")

	if filter.OrderID != uuid.Nil {
		query = query.Where("order_id = ?", filter.OrderID)
	}
	if filter.WarehouseID != uuid.Nil {
		query = query.Where("warehouse_id = ?", filter.WarehouseID)
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
		return nil, 0, models.AppErrInternal("查询分仓单失败")
	}

	offset := (filter.Page - 1) * filter.PageSize
	if err := query.Order("created_at DESC").Offset(offset).Limit(filter.PageSize).Find(&allocations).Error; err != nil {
		return nil, 0, models.AppErrInternal("查询分仓单失败")
	}

	return allocations, total, nil
}

func (s *AllocationService) StartPicking(id uuid.UUID, operatorID uuid.UUID, operatorName string) (*models.Allocation, error) {
	allocation, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	if allocation.Status != models.AllocationStatusPending {
		return nil, models.AppErrStatusConflict("只有待处理状态的分仓单才能开始拣货")
	}

	oldStatus := allocation.Status
	allocation.Status = models.AllocationStatusPicking

	if err := db.DB.Save(allocation).Error; err != nil {
		return nil, models.AppErrInternal("更新分仓单状态失败")
	}

	s.auditService.LogStatusChange("allocation", allocation.ID, oldStatus, allocation.Status, operatorID, operatorName, "开始拣货")

	return allocation, nil
}

type ConfirmPackedRequest struct {
	PickedItems []PickedItemRequest `json:"picked_items"`
}

type PickedItemRequest struct {
	AllocationItemID uuid.UUID `json:"allocation_item_id" validate:"required"`
	PickedQty        float64   `json:"picked_qty" validate:"required,gte=0"`
}

func (s *AllocationService) ConfirmPacked(id uuid.UUID, operatorID uuid.UUID, operatorName string, req *ConfirmPackedRequest) (*models.Allocation, error) {
	allocation, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	if allocation.Status != models.AllocationStatusPicking {
		return nil, models.AppErrStatusConflict("只有拣货中状态的分仓单才能确认打包")
	}

	pickedMap := make(map[uuid.UUID]float64)
	for _, item := range req.PickedItems {
		pickedMap[item.AllocationItemID] = item.PickedQty
	}

	err = db.DB.Transaction(func(tx *gorm.DB) error {
		for i := range allocation.AllocationItems {
			item := &allocation.AllocationItems[i]
			if pickedQty, ok := pickedMap[item.ID]; ok {
				item.PickedQty = pickedQty
				if err := tx.Save(item).Error; err != nil {
					return err
				}
			}
		}

		oldStatus := allocation.Status
		allocation.Status = models.AllocationStatusPacked
		if err := tx.Save(allocation).Error; err != nil {
			return err
		}

		s.auditService.LogStatusChange("allocation", allocation.ID, oldStatus, allocation.Status, operatorID, operatorName, "打包完成")

		return nil
	})

	if err != nil {
		return nil, models.AppErrInternal("确认打包失败: " + err.Error())
	}

	return allocation, nil
}

func (s *AllocationService) MarkException(id uuid.UUID, operatorID uuid.UUID, operatorName string, exceptionMsg string) (*models.Allocation, error) {
	allocation, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	validStatuses := map[string]bool{
		models.AllocationStatusPending: true,
		models.AllocationStatusPicking: true,
	}

	if !validStatuses[allocation.Status] {
		return nil, models.AppErrStatusConflict("当前状态不允许标记异常")
	}

	oldStatus := allocation.Status
	allocation.Status = models.AllocationStatusException
	allocation.ExceptionMsg = exceptionMsg

	if err := db.DB.Save(allocation).Error; err != nil {
		return nil, models.AppErrInternal("标记异常失败")
	}

	s.auditService.LogStatusChange("allocation", allocation.ID, oldStatus, allocation.Status, operatorID, operatorName, exceptionMsg)

	return allocation, nil
}

func (s *AllocationService) ResolveException(id uuid.UUID, operatorID uuid.UUID, operatorName string, resolveRemark string) (*models.Allocation, error) {
	allocation, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	if allocation.Status != models.AllocationStatusException {
		return nil, models.AppErrStatusConflict("只有异常状态的分仓单才能解决异常")
	}

	oldStatus := allocation.Status
	allocation.Status = models.AllocationStatusPending

	if err := db.DB.Save(allocation).Error; err != nil {
		return nil, models.AppErrInternal("解决异常失败")
	}

	s.auditService.LogStatusChange("allocation", allocation.ID, oldStatus, allocation.Status, operatorID, operatorName, resolveRemark)

	return allocation, nil
}

func generateAllocationNo() string {
	now := time.Now()
	return fmt.Sprintf("ALC%s%06d", now.Format("20060102150405"), time.Now().UnixNano()%1000000)
}
