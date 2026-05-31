package repository

import (
	"time"

	"floor-settlement/internal/model"

	"github.com/google/uuid"
)

type DeliveryRepository struct{}

func (r *DeliveryRepository) Create(receipt *model.DeliveryReceipt) error {
	return db.Create(receipt).Error
}

func (r *DeliveryRepository) FindByID(id uuid.UUID) (*model.DeliveryReceipt, error) {
	var receipt model.DeliveryReceipt
	if err := db.First(&receipt, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &receipt, nil
}

func (r *DeliveryRepository) Update(receipt *model.DeliveryReceipt) error {
	return db.Save(receipt).Error
}

func (r *DeliveryRepository) Filter(projectID, teamID uuid.UUID, receiptStatus, materialName, startDate, endDate string, page, pageSize int) ([]model.DeliveryReceipt, int64, error) {
	query := db.Model(&model.DeliveryReceipt{})

	if projectID != uuid.Nil {
		query = query.Where("project_id = ?", projectID)
	}
	if teamID != uuid.Nil {
		query = query.Where("team_id = ?", teamID)
	}
	if receiptStatus != "" {
		query = query.Where("receipt_status = ?", receiptStatus)
	}
	if materialName != "" {
		query = query.Where("material_name ILIKE ?", "%"+materialName+"%")
	}
	if startDate != "" {
		query = query.Where("delivery_date >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("delivery_date <= ?", endDate)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset, limit := Paginate(page, pageSize)
	var receipts []model.DeliveryReceipt
	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&receipts).Error; err != nil {
		return nil, 0, err
	}

	return receipts, total, nil
}

func (r *DeliveryRepository) CountByStatus(projectID uuid.UUID, status string) (int64, error) {
	var count int64
	err := db.Model(&model.DeliveryReceipt{}).Where("project_id = ? AND receipt_status = ?", projectID, status).Count(&count).Error
	return count, err
}

func (r *DeliveryRepository) FindUnconfirmedByTeamAndDateRange(teamID uuid.UUID, startDate, endDate time.Time) ([]model.DeliveryReceipt, error) {
	var records []model.DeliveryReceipt
	query := db.Where("team_id = ? AND (receipt_status = ? OR receipt_status = ?)", teamID, "pending", "partial")
	if !startDate.IsZero() {
		query = query.Where("delivery_date >= ?", startDate)
	}
	if !endDate.IsZero() {
		query = query.Where("delivery_date <= ?", endDate)
	}
	err := query.Find(&records).Error
	return records, err
}
