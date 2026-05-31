package service

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"time"

	appErrors "watch-after-sales/backend/errors"
	"watch-after-sales/backend/dto"
	"watch-after-sales/backend/model"

	"gorm.io/gorm"
)

type ExportService struct {
	db *gorm.DB
}

func NewExportService(db *gorm.DB) *ExportService {
	return &ExportService{db: db}
}

func (s *ExportService) ExportRepairsCSV(filter dto.RepairFilterRequest) (*bytes.Buffer, *appErrors.AppError) {
	query := s.db.Model(&model.RepairOrder{})

	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}
	if filter.WatchBrand != "" {
		query = query.Where("watch_brand ILIKE ?", "%"+filter.WatchBrand+"%")
	}
	if filter.AssignedTechnicianID != nil {
		query = query.Where("assigned_technician_id = ?", *filter.AssignedTechnicianID)
	}
	if filter.CustomerID != nil {
		query = query.Where("customer_id = ?", *filter.CustomerID)
	}
	if filter.DateFrom != "" {
		if t, err := time.Parse("2006-01-02", filter.DateFrom); err == nil {
			query = query.Where("created_at >= ?", t)
		}
	}
	if filter.DateTo != "" {
		if t, err := time.Parse("2006-01-02", filter.DateTo); err == nil {
			query = query.Where("created_at <= ?", t.Add(24*time.Hour))
		}
	}
	if filter.Keyword != "" {
		keyword := "%" + filter.Keyword + "%"
		query = query.Where("order_no ILIKE ? OR watch_brand ILIKE ? OR watch_model ILIKE ? OR issue_description ILIKE ?", keyword, keyword, keyword, keyword)
	}

	var orders []model.RepairOrder
	if err := query.Preload("Customer").Preload("AssignedTechnician").Preload("Creator").
		Order("created_at DESC").Find(&orders).Error; err != nil {
		return nil, appErrors.NewInternalError("failed to query repair orders for export")
	}

	buf := &bytes.Buffer{}
	writer := csv.NewWriter(buf)

	headers := []string{"工单号", "客户姓名", "客户电话", "品牌", "型号", "序列号", "问题描述", "状态", "维修技师", "报价", "报价备注", "预计完成时间", "完成时间", "取件时间", "创建人", "创建时间"}
	writer.Write(headers)

	for _, order := range orders {
		technicianName := ""
		if order.AssignedTechnician != nil {
			technicianName = order.AssignedTechnician.DisplayName
		}
		quotationPrice := ""
		if order.QuotationPrice != nil {
			quotationPrice = fmt.Sprintf("%.2f", *order.QuotationPrice)
		}
		quotationNote := ""
		if order.QuotationNote != nil {
			quotationNote = *order.QuotationNote
		}
		estimatedCompletion := ""
		if order.EstimatedCompletion != nil {
			estimatedCompletion = order.EstimatedCompletion.Format("2006-01-02 15:04:05")
		}
		completedAt := ""
		if order.CompletedAt != nil {
			completedAt = order.CompletedAt.Format("2006-01-02 15:04:05")
		}
		pickedUpAt := ""
		if order.PickedUpAt != nil {
			pickedUpAt = order.PickedUpAt.Format("2006-01-02 15:04:05")
		}

		row := []string{
			order.OrderNo,
			order.Customer.Name,
			order.Customer.Phone,
			order.WatchBrand,
			order.WatchModel,
			order.WatchSerial,
			order.IssueDescription,
			string(order.Status),
			technicianName,
			quotationPrice,
			quotationNote,
			estimatedCompletion,
			completedAt,
			pickedUpAt,
			order.Creator.DisplayName,
			order.CreatedAt.Format("2006-01-02 15:04:05"),
		}
		writer.Write(row)
	}

	writer.Flush()

	return buf, nil
}
