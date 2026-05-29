package service

import (
	"time"

	"autoparts/internal/config"
	"autoparts/internal/dto"
	"autoparts/internal/model"
	"autoparts/internal/util"
	apperrors "autoparts/pkg/errors"
)

type QuoteService struct {
	auditService   *AuditService
	enquiryService *EnquiryService
}

func NewQuoteService() *QuoteService {
	return &QuoteService{
		auditService:   NewAuditService(),
		enquiryService: NewEnquiryService(),
	}
}

func (s *QuoteService) Create(user *model.User, req *dto.CreateQuoteRequest, ip string) (*model.Quote, error) {
	enquiry, err := s.enquiryService.GetByID(req.EnquiryID)
	if err != nil {
		return nil, err
	}

	if enquiry.Status != model.EnquiryStatusPending && enquiry.Status != model.EnquiryStatusQuoted {
		return nil, apperrors.NewStateConflictError("询价单状态不允许创建报价")
	}

	validDays := req.ValidDays
	if validDays <= 0 {
		validDays = 7
	}

	quote := &model.Quote{
		QuoteNo:     util.GenerateQuoteNo(),
		EnquiryID:   req.EnquiryID,
		CustomerID:  enquiry.CustomerID,
		CustomerName: enquiry.CustomerName,
		Status:      model.QuoteStatusPending,
		Discount:    req.Discount,
		ValidDays:   validDays,
		ExpireAt:    time.Now().AddDate(0, 0, validDays),
		CreatedByID:  user.ID,
		Remark:       req.Remark,
	}

	tx := config.DB.Begin()
	if tx.Error != nil {
		return nil, apperrors.NewInternalError("开启事务失败", tx.Error)
	}

	var totalAmount float64 = 0
	items := make([]model.QuoteItem, 0, len(req.Items))

	for _, itemReq := range req.Items {
		item := model.QuoteItem{
			EnquiryItemID: itemReq.EnquiryItemID,
			PartID:        itemReq.PartID,
			PartNumber:    itemReq.PartNumber,
			PartName:      itemReq.PartName,
			Brand:         itemReq.Brand,
			Quantity:      itemReq.Quantity,
			QuotePrice:    itemReq.QuotePrice,
			Amount:        itemReq.QuotePrice * float64(itemReq.Quantity),
			Remark:        itemReq.Remark,
		}

		if itemReq.PartID != nil {
			var part model.Part
			if tx.First(&part, *itemReq.PartID).Error == nil {
				item.CostPrice = part.CostPrice
				item.IsStock = true
				item.StockQty = part.AvailableQty()
			}
		}

		totalAmount += item.Amount
		items = append(items, item)
	}

	quote.TotalAmount = totalAmount
	quote.FinalAmount = totalAmount - req.Discount

	if quote.FinalAmount < 0 {
		tx.Rollback()
		return nil, apperrors.NewValidationError("折扣不能大于总金额", nil)
	}

	if err := tx.Create(quote).Error; err != nil {
		tx.Rollback()
		return nil, apperrors.NewInternalError("创建报价单失败", err)
	}

	for i := range items {
		items[i].QuoteID = quote.ID
	}

	if err := tx.Create(&items).Error; err != nil {
		tx.Rollback()
		return nil, apperrors.NewInternalError("创建报价明细失败", err)
	}

	enquiry.Status = model.EnquiryStatusQuoted
	if err := tx.Save(enquiry).Error; err != nil {
		tx.Rollback()
		return nil, apperrors.NewInternalError("更新询价单状态失败", err)
	}

	if err := tx.Commit().Error; err != nil {
		return nil, apperrors.NewInternalError("提交事务失败", err)
	}

	s.auditService.LogCreate(user, "quote", quote.ID, quote.QuoteNo, quote, ip)
	s.auditService.LogStatusChange(user, "enquiry", enquiry.ID, enquiry.EnquiryNo, string(model.EnquiryStatusPending), string(model.EnquiryStatusQuoted), ip)

	return s.GetByID(quote.ID)
}

func (s *QuoteService) GetByID(id uint) (*model.Quote, error) {
	var quote model.Quote
	if err := config.DB.Preload("Items").
		Preload("Items.Part").
		Preload("CreatedBy").
		First(&quote, id).Error; err != nil {
		return nil, apperrors.NewNotFoundError("报价单不存在")
	}
	return &quote, nil
}

func (s *QuoteService) Review(user *model.User, id uint, req *dto.ReviewQuoteRequest, ip string) (*model.Quote, error) {
	quote, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	if quote.Status != model.QuoteStatusPending {
		return nil, apperrors.NewStateConflictError("报价单状态不允许审核")
	}

	if req.Status != model.QuoteStatusAccepted && req.Status != model.QuoteStatusRejected {
		return nil, apperrors.NewValidationError("无效的审核状态", nil)
	}

	oldStatus := quote.Status
	quote.Status = req.Status
	now := time.Now()
	quote.ReviewedAt = &now
	quote.ReviewedByID = &user.ID

	if req.Status == model.QuoteStatusRejected {
		quote.RejectReason = req.RejectReason
	}

	tx := config.DB.Begin()
	if tx.Error != nil {
		return nil, apperrors.NewInternalError("开启事务失败", tx.Error)
	}

	if err := tx.Save(quote).Error; err != nil {
		tx.Rollback()
		return nil, apperrors.NewInternalError("更新报价单失败", err)
	}

	if req.Status == model.QuoteStatusAccepted {
		var enquiry model.Enquiry
		if err := tx.First(&enquiry, quote.EnquiryID).Error; err == nil {
			enquiry.Status = model.EnquiryStatusConfirmed
			tx.Save(&enquiry)
		}
	}

	if err := tx.Commit().Error; err != nil {
		return nil, apperrors.NewInternalError("提交事务失败", err)
	}

	s.auditService.LogStatusChange(user, "quote", quote.ID, quote.QuoteNo, string(oldStatus), string(req.Status), ip)

	if req.Status == model.QuoteStatusAccepted {
		var enquiry model.Enquiry
		if config.DB.First(&enquiry, quote.EnquiryID).Error == nil {
			s.auditService.LogStatusChange(user, "enquiry", enquiry.ID, enquiry.EnquiryNo, string(model.EnquiryStatusQuoted), string(model.EnquiryStatusConfirmed), ip)
		}
	}

	return quote, nil
}

func (s *QuoteService) Cancel(user *model.User, id uint, ip string) (*model.Quote, error) {
	quote, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	if quote.Status == model.QuoteStatusCancelled || quote.Status == model.QuoteStatusExpired {
		return nil, apperrors.NewStateConflictError("报价单状态不允许取消")
	}

	oldStatus := quote.Status
	quote.Status = model.QuoteStatusCancelled

	if err := config.DB.Save(quote).Error; err != nil {
		return nil, apperrors.NewInternalError("取消报价单失败", err)
	}

	s.auditService.LogStatusChange(user, "quote", quote.ID, quote.QuoteNo, string(oldStatus), string(quote.Status), ip)

	return quote, nil
}

func (s *QuoteService) List(filter *dto.QuoteFilter) ([]model.Quote, int64, error) {
	var quotes []model.Quote
	var total int64

	query := config.DB.Model(&model.Quote{}).Preload("Items")

	if filter.EnquiryID != nil {
		query = query.Where("enquiry_id = ?", *filter.EnquiryID)
	}
	if filter.CustomerID != nil {
		query = query.Where("customer_id = ?", *filter.CustomerID)
	}
	if filter.Status != nil {
		query = query.Where("status = ?", *filter.Status)
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

	err := query.Order("created_at DESC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&quotes).Error

	return quotes, total, err
}

func (s *QuoteService) CheckExpired() error {
	var expiredQuotes []model.Quote
	now := time.Now()

	if err := config.DB.Where("status = ? AND expire_at < ?", model.QuoteStatusPending, now).
		Find(&expiredQuotes).Error; err != nil {
		return err
	}

	for _, quote := range expiredQuotes {
		quote.Status = model.QuoteStatusExpired
		config.DB.Save(&quote)
	}

	return nil
}
