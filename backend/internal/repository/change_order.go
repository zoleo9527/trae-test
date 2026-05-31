package repository

import (
	"floor-settlement/internal/model"

	"github.com/google/uuid"
)

type ChangeOrderRepository struct{}

func (r *ChangeOrderRepository) Create(order *model.ChangeOrder) error {
	return db.Create(order).Error
}

func (r *ChangeOrderRepository) FindByID(id uuid.UUID) (*model.ChangeOrder, error) {
	var order model.ChangeOrder
	if err := db.First(&order, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &order, nil
}

func (r *ChangeOrderRepository) Update(order *model.ChangeOrder) error {
	return db.Save(order).Error
}

func (r *ChangeOrderRepository) Filter(projectID, teamID uuid.UUID, status, changeType string, page, pageSize int) ([]model.ChangeOrder, int64, error) {
	query := db.Model(&model.ChangeOrder{})

	if projectID != uuid.Nil {
		query = query.Where("project_id = ?", projectID)
	}
	if teamID != uuid.Nil {
		query = query.Where("team_id = ?", teamID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if changeType != "" {
		query = query.Where("change_type = ?", changeType)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset, limit := Paginate(page, pageSize)
	var orders []model.ChangeOrder
	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&orders).Error; err != nil {
		return nil, 0, err
	}

	return orders, total, nil
}

func (r *ChangeOrderRepository) CountByStatus(projectID uuid.UUID, status string) (int64, error) {
	var count int64
	err := db.Model(&model.ChangeOrder{}).Where("project_id = ? AND status = ?", projectID, status).Count(&count).Error
	return count, err
}
