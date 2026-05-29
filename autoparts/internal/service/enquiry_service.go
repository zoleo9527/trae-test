package service

import (
	"autoparts/internal/config"
	"autoparts/internal/dto"
	"autoparts/internal/model"
	"autoparts/internal/util"
	apperrors "autoparts/pkg/errors"
)

type EnquiryService struct {
	auditService    *AuditService
	customerService *CustomerService
}

func NewEnquiryService() *EnquiryService {
	return &EnquiryService{
		auditService:    NewAuditService(),
		customerService: NewCustomerService(),
	}
}

func (s *EnquiryService) Create(user *model.User, req *dto.CreateEnquiryRequest, ip string) (*model.Enquiry, error) {
	customer, err := s.customerService.GetByID(req.CustomerID)
	if err != nil {
		return nil, err
	}

	enquiry := &model.Enquiry{
		EnquiryNo:    util.GenerateEnquiryNo(),
		CustomerID:   req.CustomerID,
		CustomerName: customer.Name,
		LicensePlate: customer.LicensePlate,
		CarModel:     customer.CarModel,
		Status:       model.EnquiryStatusPending,
		IsUrgent:     req.IsUrgent,
		Priority:     req.Priority,
		CreatedByID:  user.ID,
		Remark:       req.Remark,
	}

	tx := config.DB.Begin()
	if tx.Error != nil {
		return nil, apperrors.NewInternalError("开启事务失败", tx.Error)
	}

	if err := tx.Create(enquiry).Error; err != nil {
		tx.Rollback()
		return nil, apperrors.NewInternalError("创建询价单失败", err)
	}

	for _, itemReq := range req.Items {
		item := &model.EnquiryItem{
			EnquiryID:  enquiry.ID,
			PartID:     itemReq.PartID,
			PartNumber: itemReq.PartNumber,
			PartName:   itemReq.PartName,
			Brand:      itemReq.Brand,
			Quantity:   itemReq.Quantity,
			Remark:     itemReq.Remark,
		}

		if itemReq.PartID != nil {
			var part model.Part
			if tx.First(&part, *itemReq.PartID).Error == nil {
				item.UnitPrice = part.UnitPrice
				item.Amount = part.UnitPrice * float64(itemReq.Quantity)
			}
		}

		if err := tx.Create(item).Error; err != nil {
			tx.Rollback()
			return nil, apperrors.NewInternalError("创建询价明细失败", err)
		}
	}

	if err := tx.Commit().Error; err != nil {
		return nil, apperrors.NewInternalError("提交事务失败", err)
	}

	s.auditService.LogCreate(user, "enquiry", enquiry.ID, enquiry.EnquiryNo, enquiry, ip)

	return s.GetByID(enquiry.ID)
}

func (s *EnquiryService) Update(user *model.User, id uint, req *dto.UpdateEnquiryRequest, ip string) (*model.Enquiry, error) {
	enquiry, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	if req.Status != nil {
		newStatus := model.EnquiryStatus(*req.Status)
		if !s.isValidStatusTransition(enquiry.Status, newStatus) {
			return nil, apperrors.NewStateConflictError("无效的状态转换: " + string(enquiry.Status) + " -> " + string(newStatus))
		}
	}

	canEditItems := enquiry.Status == model.EnquiryStatusDraft || enquiry.Status == model.EnquiryStatusPending
	if req.Items != nil && len(req.Items) > 0 && !canEditItems {
		return nil, apperrors.NewStateConflictError("询价单状态不允许修改明细")
	}

	tx := config.DB.Begin()
	if tx.Error != nil {
		return nil, apperrors.NewInternalError("开启事务失败", tx.Error)
	}

	if req.IsUrgent != nil {
		enquiry.IsUrgent = *req.IsUrgent
	}
	if req.Priority != nil {
		enquiry.Priority = *req.Priority
	}
	if req.Remark != nil {
		enquiry.Remark = *req.Remark
	}
	if req.Status != nil {
		oldStatus := enquiry.Status
		enquiry.Status = model.EnquiryStatus(*req.Status)
		s.auditService.LogStatusChange(user, "enquiry", enquiry.ID, enquiry.EnquiryNo, string(oldStatus), string(enquiry.Status), ip)
	}

	if err := tx.Save(enquiry).Error; err != nil {
		tx.Rollback()
		return nil, apperrors.NewInternalError("更新询价单失败", err)
	}

	if req.Items != nil && len(req.Items) > 0 {
		if err := tx.Where("enquiry_id = ?", enquiry.ID).Delete(&model.EnquiryItem{}).Error; err != nil {
			tx.Rollback()
			return nil, apperrors.NewInternalError("删除原有明细失败", err)
		}

		for _, itemReq := range req.Items {
			item := &model.EnquiryItem{
				EnquiryID:  enquiry.ID,
				PartID:     itemReq.PartID,
				PartNumber: itemReq.PartNumber,
				PartName:   itemReq.PartName,
				Brand:      itemReq.Brand,
				Quantity:   itemReq.Quantity,
				Remark:     itemReq.Remark,
			}

			if itemReq.PartID != nil {
				var part model.Part
				if tx.First(&part, *itemReq.PartID).Error == nil {
					item.UnitPrice = part.UnitPrice
					item.Amount = part.UnitPrice * float64(itemReq.Quantity)
				}
			}

			if err := tx.Create(item).Error; err != nil {
				tx.Rollback()
				return nil, apperrors.NewInternalError("创建询价明细失败", err)
			}
		}
	}

	if err := tx.Commit().Error; err != nil {
		return nil, apperrors.NewInternalError("提交事务失败", err)
	}

	s.auditService.LogUpdate(user, "enquiry", enquiry.ID, enquiry.EnquiryNo, "info", nil, enquiry, ip)

	return s.GetByID(enquiry.ID)
}

func (s *EnquiryService) GetByID(id uint) (*model.Enquiry, error) {
	var enquiry model.Enquiry
	if err := config.DB.Preload("Items").
		Preload("Quotes").
		Preload("LockOrders").
		Preload("CreatedBy").
		First(&enquiry, id).Error; err != nil {
		return nil, apperrors.NewNotFoundError("询价单不存在")
	}
	return &enquiry, nil
}

func (s *EnquiryService) Delete(user *model.User, id uint, ip string) error {
	enquiry, err := s.GetByID(id)
	if err != nil {
		return err
	}

	if enquiry.Status == model.EnquiryStatusLocked || enquiry.Status == model.EnquiryStatusCompleted {
		return apperrors.NewStateConflictError("已锁定或完成的询价单不能删除")
	}

	tx := config.DB.Begin()
	if err := tx.Where("enquiry_id = ?", id).Delete(&model.EnquiryItem{}).Error; err != nil {
		tx.Rollback()
		return apperrors.NewInternalError("删除询价明细失败", err)
	}

	if err := tx.Delete(enquiry).Error; err != nil {
		tx.Rollback()
		return apperrors.NewInternalError("删除询价单失败", err)
	}

	if err := tx.Commit().Error; err != nil {
		return apperrors.NewInternalError("提交事务失败", err)
	}

	s.auditService.LogDelete(user, "enquiry", enquiry.ID, enquiry.EnquiryNo, ip)

	return nil
}

func (s *EnquiryService) List(filter *dto.EnquiryFilter) ([]model.Enquiry, int64, error) {
	var enquiries []model.Enquiry
	var total int64

	query := config.DB.Model(&model.Enquiry{}).Preload("Items")

	if filter.CustomerID != nil {
		query = query.Where("customer_id = ?", *filter.CustomerID)
	}
	if filter.CustomerName != nil && *filter.CustomerName != "" {
		query = query.Where("customer_name LIKE ?", "%"+*filter.CustomerName+"%")
	}
	if filter.LicensePlate != nil && *filter.LicensePlate != "" {
		query = query.Where("license_plate LIKE ?", "%"+*filter.LicensePlate+"%")
	}
	if filter.Status != nil {
		query = query.Where("status = ?", *filter.Status)
	}
	if filter.IsUrgent != nil {
		query = query.Where("is_urgent = ?", *filter.IsUrgent)
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

	query.Count(&total)

	page := filter.Page
	if page < 1 {
		page = 1
	}
	pageSize := filter.PageSize
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	err := query.Order("is_urgent DESC, priority DESC, created_at DESC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&enquiries).Error

	return enquiries, total, err
}

func (s *EnquiryService) Cancel(user *model.User, id uint, ip string) (*model.Enquiry, error) {
	enquiry, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	if enquiry.Status == model.EnquiryStatusCancelled || enquiry.Status == model.EnquiryStatusCompleted {
		return nil, apperrors.NewStateConflictError("询价单状态不允许取消")
	}

	oldStatus := enquiry.Status
	enquiry.Status = model.EnquiryStatusCancelled

	if err := config.DB.Save(enquiry).Error; err != nil {
		return nil, apperrors.NewInternalError("取消询价单失败", err)
	}

	s.auditService.LogStatusChange(user, "enquiry", enquiry.ID, enquiry.EnquiryNo, string(oldStatus), string(enquiry.Status), ip)

	return enquiry, nil
}

func (s *EnquiryService) UpdateStatus(user *model.User, id uint, newStatus model.EnquiryStatus, ip string) (*model.Enquiry, error) {
	enquiry, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	if !s.isValidStatusTransition(enquiry.Status, newStatus) {
		return nil, apperrors.NewStateConflictError("无效的状态转换")
	}

	oldStatus := enquiry.Status
	enquiry.Status = newStatus

	if err := config.DB.Save(enquiry).Error; err != nil {
		return nil, apperrors.NewInternalError("更新状态失败", err)
	}

	s.auditService.LogStatusChange(user, "enquiry", enquiry.ID, enquiry.EnquiryNo, string(oldStatus), string(newStatus), ip)

	return enquiry, nil
}

func (s *EnquiryService) isValidStatusTransition(current, new model.EnquiryStatus) bool {
	validTransitions := map[model.EnquiryStatus][]model.EnquiryStatus{
		model.EnquiryStatusDraft:     {model.EnquiryStatusPending, model.EnquiryStatusCancelled},
		model.EnquiryStatusPending:   {model.EnquiryStatusQuoted, model.EnquiryStatusCancelled},
		model.EnquiryStatusQuoted:    {model.EnquiryStatusConfirmed, model.EnquiryStatusCancelled},
		model.EnquiryStatusConfirmed: {model.EnquiryStatusLocked, model.EnquiryStatusCancelled},
		model.EnquiryStatusLocked:    {model.EnquiryStatusCompleted, model.EnquiryStatusCancelled},
		model.EnquiryStatusCompleted: {},
		model.EnquiryStatusCancelled: {},
	}

	for _, valid := range validTransitions[current] {
		if valid == new {
			return true
		}
	}
	return false
}

func (s *EnquiryService) GetChainTrace(enquiryID uint) (*dto.EnquiryDetailResponse, error) {
	enquiry, err := s.GetByID(enquiryID)
	if err != nil {
		return nil, err
	}

	resp := &dto.EnquiryDetailResponse{}
	resp.ID = enquiry.ID
	resp.EnquiryNo = enquiry.EnquiryNo
	resp.CustomerID = enquiry.CustomerID
	resp.CustomerName = enquiry.CustomerName
	resp.LicensePlate = enquiry.LicensePlate
	resp.CarModel = enquiry.CarModel
	resp.Status = enquiry.Status
	resp.IsUrgent = enquiry.IsUrgent
	resp.Priority = enquiry.Priority
	resp.QuoteCount = len(enquiry.Quotes)
	resp.LockCount = len(enquiry.LockOrders)
	resp.CreatedByID = enquiry.CreatedByID
	if enquiry.CreatedBy != nil {
		resp.CreatedByName = enquiry.CreatedBy.Name
	}
	resp.Remark = enquiry.Remark
	resp.CreatedAt = enquiry.CreatedAt
	resp.UpdatedAt = enquiry.UpdatedAt

	resp.Items = make([]dto.EnquiryItemResponse, len(enquiry.Items))
	for i, item := range enquiry.Items {
		resp.Items[i] = dto.EnquiryItemResponse{
			ID:         item.ID,
			PartID:     item.PartID,
			PartNumber: item.PartNumber,
			PartName:   item.PartName,
			Brand:      item.Brand,
			Quantity:   item.Quantity,
			UnitPrice:  item.UnitPrice,
			Amount:     item.Amount,
			Remark:     item.Remark,
		}
	}

	resp.Quotes = make([]dto.QuoteSummaryResponse, len(enquiry.Quotes))
	for i, quote := range enquiry.Quotes {
		resp.Quotes[i] = dto.QuoteSummaryResponse{
			ID:          quote.ID,
			QuoteNo:     quote.QuoteNo,
			Status:      quote.Status,
			FinalAmount: quote.FinalAmount,
			CreatedAt:   quote.CreatedAt,
		}
	}

	resp.LockOrders = make([]dto.LockOrderSummaryResponse, len(enquiry.LockOrders))
	for i, lock := range enquiry.LockOrders {
		resp.LockOrders[i] = dto.LockOrderSummaryResponse{
			ID:          lock.ID,
			LockNo:      lock.LockNo,
			Status:      lock.Status,
			TotalAmount: lock.TotalAmount,
			CreatedAt:   lock.CreatedAt,
		}
	}

	enquiryIDs := []uint{enquiryID}
	quoteIDs := make([]uint, len(enquiry.Quotes))
	for i, q := range enquiry.Quotes {
		quoteIDs[i] = q.ID
	}
	lockIDs := make([]uint, len(enquiry.LockOrders))
	for i, l := range enquiry.LockOrders {
		lockIDs[i] = l.ID
	}

	var lockItemIDs []uint
	if len(lockIDs) > 0 {
		var lockItems []model.LockItem
		config.DB.Where("lock_order_id IN ?", lockIDs).Select("id").Find(&lockItems)
		lockItemIDs = make([]uint, len(lockItems))
		for i, item := range lockItems {
			lockItemIDs[i] = item.ID
		}
	}

	var allAuditLogs []model.AuditLog
	query := config.DB.Model(&model.AuditLog{}).Preload("User")

	conditions := make([]string, 0)
	params := make([]interface{}, 0)

	if len(enquiryIDs) > 0 {
		conditions = append(conditions, "(module = ? AND record_id IN ?)")
		params = append(params, "enquiry", enquiryIDs)
	}
	if len(quoteIDs) > 0 {
		conditions = append(conditions, "(module = ? AND record_id IN ?)")
		params = append(params, "quote", quoteIDs)
	}
	if len(lockIDs) > 0 {
		conditions = append(conditions, "(module = ? AND record_id IN ?)")
		params = append(params, "lock", lockIDs)
	}
	if len(lockItemIDs) > 0 {
		conditions = append(conditions, "(module = ? AND record_id IN ?)")
		params = append(params, "lock_item", lockItemIDs)
	}

	if len(conditions) > 0 {
		whereClause := ""
		for i, cond := range conditions {
			if i > 0 {
				whereClause += " OR "
			}
			whereClause += cond
		}
		query = query.Where(whereClause, params...)
	}

	if err := query.Order("created_at DESC").Find(&allAuditLogs).Error; err != nil {
		return nil, err
	}

	resp.AuditLogs = make([]dto.AuditLogResponse, len(allAuditLogs))
	for i, log := range allAuditLogs {
		userName := log.UserName
		if log.User != nil {
			userName = log.User.Name
		}
		resp.AuditLogs[i] = dto.AuditLogResponse{
			ID:        log.ID,
			Action:    log.Action,
			Module:    log.Module,
			RecordID:  log.RecordID,
			RecordNo:  log.RecordNo,
			FieldName: log.FieldName,
			OldValue:  log.OldValue,
			NewValue:  log.NewValue,
			UserID:    log.UserID,
			UserName:  userName,
			IPAddress: log.IPAddress,
			Remark:    log.Remark,
			CreatedAt: log.CreatedAt,
		}
	}

	return resp, nil
}
