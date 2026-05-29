package service

import (
	"time"

	"autoparts/internal/config"
	"autoparts/internal/dto"
	"autoparts/internal/model"
	"autoparts/internal/util"
	apperrors "autoparts/pkg/errors"
)

type LockService struct {
	auditService   *AuditService
	quoteService   *QuoteService
	enquiryService *EnquiryService
}

func NewLockService() *LockService {
	return &LockService{
		auditService:   NewAuditService(),
		quoteService:   NewQuoteService(),
		enquiryService: NewEnquiryService(),
	}
}

func (s *LockService) Create(user *model.User, req *dto.CreateLockOrderRequest, ip string) (*model.LockOrder, error) {
	quote, err := s.quoteService.GetByID(req.QuoteID)
	if err != nil {
		return nil, err
	}

	if quote.Status != model.QuoteStatusAccepted {
		return nil, apperrors.NewStateConflictError("只有已接受的报价单才能锁库")
	}

	enquiry, err := s.enquiryService.GetByID(quote.EnquiryID)
	if err != nil {
		return nil, err
	}

	if enquiry.Status == model.EnquiryStatusLocked || enquiry.Status == model.EnquiryStatusCompleted {
		return nil, apperrors.NewStateConflictError("该询价单已锁定或完成")
	}

	lockOrder := &model.LockOrder{
		LockNo:       util.GenerateLockNo(),
		EnquiryID:    quote.EnquiryID,
		QuoteID:      &quote.ID,
		CustomerID:   quote.CustomerID,
		CustomerName: quote.CustomerName,
		Status:       model.LockStatusLocked,
		ExpireAt:     time.Now().AddDate(0, 0, 3),
		CreatedByID:  user.ID,
		Remark:       req.Remark,
		ReturnStatus: model.ReturnStatusNone,
	}

	tx := config.DB.Begin()
	if tx.Error != nil {
		return nil, apperrors.NewInternalError("开启事务失败", tx.Error)
	}

	var totalAmount float64 = 0
	items := make([]model.LockItem, 0, len(req.Items))

	for _, itemReq := range req.Items {
		var part model.Part
		if err := tx.First(&part, itemReq.PartID).Error; err != nil {
			tx.Rollback()
			return nil, apperrors.NewNotFoundError("配件不存在")
		}

		if part.AvailableQty() < itemReq.Quantity {
			tx.Rollback()
			return nil, apperrors.NewStateConflictError("配件库存不足: " + part.Name)
		}

		part.LockedQty += itemReq.Quantity
		if err := tx.Save(&part).Error; err != nil {
			tx.Rollback()
			return nil, apperrors.NewInternalError("更新库存失败", err)
		}

		item := model.LockItem{
			QuoteItemID: itemReq.QuoteItemID,
			PartID:      itemReq.PartID,
			PartNumber:  part.PartNumber,
			PartName:    part.Name,
			Brand:       part.Brand,
			Quantity:    itemReq.Quantity,
			LockedQty:   itemReq.Quantity,
			UnitPrice:   part.UnitPrice,
			Amount:      part.UnitPrice * float64(itemReq.Quantity),
			Location:    part.Location,
			ReturnStatus: model.ReturnStatusNone,
		}

		totalAmount += item.Amount
		items = append(items, item)
	}

	lockOrder.TotalAmount = totalAmount

	if err := tx.Create(lockOrder).Error; err != nil {
		tx.Rollback()
		return nil, apperrors.NewInternalError("创建锁库单失败", err)
	}

	for i := range items {
		items[i].LockOrderID = lockOrder.ID
	}

	if err := tx.Create(&items).Error; err != nil {
		tx.Rollback()
		return nil, apperrors.NewInternalError("创建锁库明细失败", err)
	}

	enquiry.Status = model.EnquiryStatusLocked
	if err := tx.Save(enquiry).Error; err != nil {
		tx.Rollback()
		return nil, apperrors.NewInternalError("更新询价单状态失败", err)
	}

	if err := tx.Commit().Error; err != nil {
		return nil, apperrors.NewInternalError("提交事务失败", err)
	}

	s.auditService.Log(user, model.AuditActionLock, "lock", lockOrder.ID, lockOrder.LockNo, "", nil, items, ip, "锁定库存")

	return s.GetByID(lockOrder.ID)
}

func (s *LockService) GetByID(id uint) (*model.LockOrder, error) {
	var lockOrder model.LockOrder
	if err := config.DB.Preload("Items").
		Preload("Items.Part").
		Preload("CreatedBy").
		First(&lockOrder, id).Error; err != nil {
		return nil, apperrors.NewNotFoundError("锁库单不存在")
	}
	return &lockOrder, nil
}

func (s *LockService) Release(user *model.User, id uint, ip string) (*model.LockOrder, error) {
	lockOrder, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	if lockOrder.Status != model.LockStatusLocked {
		return nil, apperrors.NewStateConflictError("只有锁定状态的锁库单才能释放")
	}

	tx := config.DB.Begin()
	if tx.Error != nil {
		return nil, apperrors.NewInternalError("开启事务失败", tx.Error)
	}

	for _, item := range lockOrder.Items {
		var part model.Part
		if err := tx.First(&part, item.PartID).Error; err == nil {
			part.LockedQty -= item.LockedQty - item.PickedQty
			if part.LockedQty < 0 {
				part.LockedQty = 0
			}
			tx.Save(&part)
		}
	}

	oldStatus := lockOrder.Status
	lockOrder.Status = model.LockStatusReleased

	if err := tx.Save(lockOrder).Error; err != nil {
		tx.Rollback()
		return nil, apperrors.NewInternalError("释放锁库单失败", err)
	}

	enquiry, _ := s.enquiryService.GetByID(lockOrder.EnquiryID)
	if enquiry != nil {
		enquiry.Status = model.EnquiryStatusConfirmed
		tx.Save(enquiry)
	}

	if err := tx.Commit().Error; err != nil {
		return nil, apperrors.NewInternalError("提交事务失败", err)
	}

	s.auditService.LogStatusChange(user, "lock", lockOrder.ID, lockOrder.LockNo, string(oldStatus), string(lockOrder.Status), ip)

	return lockOrder, nil
}

func (s *LockService) Pick(user *model.User, id uint, req *dto.PickLockRequest, ip string) (*model.LockOrder, error) {
	lockOrder, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	if lockOrder.Status != model.LockStatusLocked {
		return nil, apperrors.NewStateConflictError("只有锁定状态的锁库单才能拣货")
	}

	tx := config.DB.Begin()
	if tx.Error != nil {
		return nil, apperrors.NewInternalError("开启事务失败", tx.Error)
	}

	pickMap := make(map[uint]int)
	for _, pickItem := range req.Items {
		pickMap[pickItem.LockItemID] = pickItem.Quantity
	}

	var allPicked bool = true
	for i, item := range lockOrder.Items {
		if pickQty, ok := pickMap[item.ID]; ok {
			remaining := item.LockedQty - item.PickedQty
			if pickQty > remaining {
				tx.Rollback()
				return nil, apperrors.NewValidationError("拣货数量超过可拣数量: "+item.PartName, nil)
			}

			lockOrder.Items[i].PickedQty += pickQty

			var part model.Part
			if err := tx.First(&part, item.PartID).Error; err == nil {
				part.StockQty -= pickQty
				part.LockedQty -= pickQty
				if part.StockQty < 0 {
					part.StockQty = 0
				}
				if part.LockedQty < 0 {
					part.LockedQty = 0
				}
				if err := tx.Save(&part).Error; err != nil {
					tx.Rollback()
					return nil, apperrors.NewInternalError("更新库存失败", err)
				}
			}

			if err := tx.Save(&lockOrder.Items[i]).Error; err != nil {
				tx.Rollback()
				return nil, apperrors.NewInternalError("更新锁库明细失败", err)
			}
		}

		if lockOrder.Items[i].PickedQty < lockOrder.Items[i].LockedQty {
			allPicked = false
		}
	}

	if allPicked {
		lockOrder.Status = model.LockStatusPicked
		now := time.Now()
		lockOrder.PickedAt = &now
		lockOrder.PickedByID = &user.ID
	}

	if err := tx.Save(lockOrder).Error; err != nil {
		tx.Rollback()
		return nil, apperrors.NewInternalError("更新锁库单失败", err)
	}

	if err := tx.Commit().Error; err != nil {
		return nil, apperrors.NewInternalError("提交事务失败", err)
	}

	s.auditService.Log(user, model.AuditActionPick, "lock", lockOrder.ID, lockOrder.LockNo, "", nil, req.Items, ip, "拣货出库")

	return s.GetByID(id)
}

func (s *LockService) RequestReturn(user *model.User, id uint, req *dto.ReturnRequest, ip string) (*model.LockOrder, error) {
	lockOrder, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	if lockOrder.Status != model.LockStatusPicked {
		return nil, apperrors.NewStateConflictError("只有已拣货的锁库单才能退货")
	}

	tx := config.DB.Begin()
	if tx.Error != nil {
		return nil, apperrors.NewInternalError("开启事务失败", tx.Error)
	}

	returnMap := make(map[uint]dto.ReturnItemRequest)
	for _, retItem := range req.Items {
		returnMap[retItem.LockItemID] = retItem
	}

	for i, item := range lockOrder.Items {
		if retReq, ok := returnMap[item.ID]; ok {
			if retReq.Quantity > item.PickedQty-item.ReturnedQty {
				tx.Rollback()
				return nil, apperrors.NewValidationError("退货数量超过已拣货数量: "+item.PartName, nil)
			}

			lockOrder.Items[i].ReturnStatus = model.ReturnStatusPending
			lockOrder.Items[i].ReturnReason = retReq.Reason
			lockOrder.Items[i].ReturnQty = retReq.Quantity

			if err := tx.Save(&lockOrder.Items[i]).Error; err != nil {
				tx.Rollback()
				return nil, apperrors.NewInternalError("更新锁库明细退货状态失败", err)
			}
		}
	}

	lockOrder.ReturnStatus = model.ReturnStatusPending
	lockOrder.Remark += "\n退货申请: " + req.Remark

	if err := tx.Save(lockOrder).Error; err != nil {
		tx.Rollback()
		return nil, apperrors.NewInternalError("提交退货申请失败", err)
	}

	if err := tx.Commit().Error; err != nil {
		return nil, apperrors.NewInternalError("提交事务失败", err)
	}

	s.auditService.Log(user, model.AuditActionReturn, "lock", lockOrder.ID, lockOrder.LockNo, "", nil, req.Items, ip, "申请退货")

	return s.GetByID(id)
}

func (s *LockService) ReviewReturn(user *model.User, lockOrderID uint, itemID uint, req *dto.ReviewReturnRequest, ip string) (*model.LockItem, error) {
	lockOrder, err := s.GetByID(lockOrderID)
	if err != nil {
		return nil, err
	}

	var targetItem *model.LockItem
	for i := range lockOrder.Items {
		if lockOrder.Items[i].ID == itemID {
			targetItem = &lockOrder.Items[i]
			break
		}
	}

	if targetItem == nil {
		return nil, apperrors.NewNotFoundError("锁库明细不存在")
	}

	if targetItem.ReturnStatus != model.ReturnStatusPending {
		return nil, apperrors.NewStateConflictError("该明细无需审核")
	}

	if req.Status != model.ReturnStatusApproved && req.Status != model.ReturnStatusRejected {
		return nil, apperrors.NewValidationError("无效的审核状态", nil)
	}

	tx := config.DB.Begin()
	if tx.Error != nil {
		return nil, apperrors.NewInternalError("开启事务失败", tx.Error)
	}

	targetItem.ReturnStatus = req.Status

	if req.Status == model.ReturnStatusApproved {
		returnQty := targetItem.ReturnQty
		targetItem.ReturnedQty += returnQty

		var part model.Part
		if err := tx.First(&part, targetItem.PartID).Error; err == nil {
			part.StockQty += returnQty
			if err := tx.Save(&part).Error; err != nil {
				tx.Rollback()
				return nil, apperrors.NewInternalError("回写库存失败", err)
			}
		}
	}

	if req.Reason != "" {
		targetItem.Remark += "\n审核: " + req.Reason
	}

	if err := tx.Save(targetItem).Error; err != nil {
		tx.Rollback()
		return nil, apperrors.NewInternalError("更新退货状态失败", err)
	}

	allReviewed := true
	hasApproved := false
	var items []model.LockItem
	tx.Where("lock_order_id = ?", lockOrderID).Find(&items)
	for _, item := range items {
		if item.ReturnStatus == model.ReturnStatusPending {
			allReviewed = false
		}
		if item.ReturnStatus == model.ReturnStatusApproved {
			hasApproved = true
		}
	}

	if allReviewed {
		if hasApproved {
			lockOrder.ReturnStatus = model.ReturnStatusDone
			lockOrder.Status = model.LockStatusReturned
		} else {
			lockOrder.ReturnStatus = model.ReturnStatusRejected
		}
		tx.Save(lockOrder)
	}

	if err := tx.Commit().Error; err != nil {
		return nil, apperrors.NewInternalError("提交事务失败", err)
	}

	s.auditService.LogStatusChange(user, "lock_item", targetItem.ID, lockOrder.LockNo, string(model.ReturnStatusPending), string(req.Status), ip)

	return targetItem, nil
}

func (s *LockService) List(user *model.User, filter *dto.LockOrderFilter) ([]model.LockOrder, int64, error) {
	var lockOrders []model.LockOrder
	var total int64

	query := config.DB.Model(&model.LockOrder{}).Preload("Items")

	if filter.EnquiryID != nil {
		query = query.Where("enquiry_id = ?", *filter.EnquiryID)
	}
	if filter.QuoteID != nil {
		query = query.Where("quote_id = ?", *filter.QuoteID)
	}
	if filter.CustomerID != nil {
		query = query.Where("customer_id = ?", *filter.CustomerID)
	}
	if filter.Status != nil {
		query = query.Where("status = ?", *filter.Status)
	}
	if filter.ReturnStatus != nil {
		query = query.Where("return_status = ?", *filter.ReturnStatus)
	}
	if filter.CreatedByID != nil {
		query = query.Where("created_by_id = ?", *filter.CreatedByID)
	}
	if filter.CreatedStart != nil {
		query = query.Where("created_at >= ?", *filter.CreatedStart)
	}
	if filter.CreatedEnd != nil {
		query = query.Where("created_at <= ?", *filter.CreatedEnd)
	}

	if user.Role == model.RoleWarehouse {
		query = query.Where("created_by_id = ?", user.ID)
	}

	query.Count(&total)

	page := filter.Page
	if page < 1 {
		page = 1
	}
	pageSize := filter.PageSize
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	err := query.Order("created_at DESC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&lockOrders).Error

	return lockOrders, total, err
}

func (s *LockService) BatchRelease(user *model.User, ids []uint, ip string) (*dto.BatchOperationResponse, error) {
	response := &dto.BatchOperationResponse{
		FailedItems: make([]dto.FailedBatchItem, 0),
	}

	for _, id := range ids {
		if _, err := s.Release(user, id, ip); err != nil {
			response.FailCount++
			response.FailedItems = append(response.FailedItems, dto.FailedBatchItem{
				ID:    id,
				Error: err.Error(),
			})
		} else {
			response.SuccessCount++
		}
	}

	return response, nil
}

func (s *LockService) CheckExpired() error {
	var expiredLocks []model.LockOrder
	now := time.Now()

	if err := config.DB.Where("status = ? AND expire_at < ?", model.LockStatusLocked, now).
		Find(&expiredLocks).Error; err != nil {
		return err
	}

	for _, lock := range expiredLocks {
		lock.Status = model.LockStatusExpired
		config.DB.Save(&lock)
	}

	return nil
}
