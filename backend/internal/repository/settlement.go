package repository

import (
	"floor-settlement/internal/model"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SettlementRepository struct{}

func (r *SettlementRepository) Create(batch *model.SettlementBatch) error {
	return db.Create(batch).Error
}

func (r *SettlementRepository) CreateItems(items []model.SettlementItem) error {
	return db.Create(&items).Error
}

func (r *SettlementRepository) FindByID(id uuid.UUID) (*model.SettlementBatch, error) {
	var batch model.SettlementBatch
	if err := db.Preload("Items").First(&batch, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &batch, nil
}

func (r *SettlementRepository) Update(batch *model.SettlementBatch) error {
	return db.Save(batch).Error
}

func (r *SettlementRepository) Filter(projectID, teamID uuid.UUID, status, startDate, endDate string, page, pageSize int) ([]model.SettlementBatch, int64, error) {
	query := db.Model(&model.SettlementBatch{})

	if projectID != uuid.Nil {
		query = query.Where("project_id = ?", projectID)
	}
	if teamID != uuid.Nil {
		query = query.Where("team_id = ?", teamID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if startDate != "" {
		query = query.Where("period_start >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("period_end <= ?", endDate)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset, limit := Paginate(page, pageSize)
	var batches []model.SettlementBatch
	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&batches).Error; err != nil {
		return nil, 0, err
	}

	return batches, total, nil
}

func (r *SettlementRepository) FindItemsByBatchID(batchID uuid.UUID) ([]model.SettlementItem, error) {
	var items []model.SettlementItem
	if err := db.Where("settlement_batch_id = ?", batchID).Find(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}

func (r *SettlementRepository) SumAmountByProject(projectID uuid.UUID) (float64, error) {
	var total float64
	if err := db.Model(&model.SettlementBatch{}).Where("project_id = ? AND status = ?", projectID, "approved").Select("COALESCE(SUM(total_amount), 0)").Scan(&total).Error; err != nil {
		return 0, err
	}
	return total, nil
}

func (r *SettlementRepository) CountByStatus(projectID uuid.UUID, status string) (int64, error) {
	var count int64
	query := db.Model(&model.SettlementBatch{}).Where("project_id = ?", projectID)
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if err := query.Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}
