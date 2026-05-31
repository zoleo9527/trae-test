package repository

import (
	"floor-settlement/internal/model"

	"github.com/google/uuid"
)

type AuditTrailRepository struct{}

func (r *AuditTrailRepository) Create(trail *model.AuditTrail) error {
	return db.Create(trail).Error
}

func (r *AuditTrailRepository) Filter(entityType, entityID, operatorID, action, startDate, endDate string, page, pageSize int) ([]model.AuditTrail, int64, error) {
	query := db.Model(&model.AuditTrail{})

	if entityType != "" {
		query = query.Where("entity_type = ?", entityType)
	}
	if entityID != "" {
		query = query.Where("entity_id = ?", entityID)
	}
	if operatorID != "" {
		query = query.Where("operator_id = ?", operatorID)
	}
	if action != "" {
		query = query.Where("action = ?", action)
	}
	if startDate != "" {
		query = query.Where("created_at >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("created_at <= ?", endDate)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset, limit := Paginate(page, pageSize)
	var trails []model.AuditTrail
	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&trails).Error; err != nil {
		return nil, 0, err
	}

	return trails, total, nil
}

func (r *AuditTrailRepository) FindByEntity(entityType string, entityID uuid.UUID) ([]model.AuditTrail, error) {
	var trails []model.AuditTrail
	err := db.Where("entity_type = ? AND entity_id = ?", entityType, entityID).Order("created_at DESC").Find(&trails).Error
	return trails, err
}

func (r *AuditTrailRepository) RecentByProject(projectID uuid.UUID, limit int) ([]model.AuditTrail, error) {
	var trails []model.AuditTrail
	sql := `
		SELECT DISTINCT a.* FROM audit_trails a
		WHERE (a.entity_type IN ('delivery_receipt', 'change_order', 'quality_inspection', 'rework_record', 'settlement_batch')
		AND EXISTS (
			SELECT 1 FROM delivery_receipts d WHERE d.id = a.entity_id AND d.project_id = $1
		)
		ORDER BY a.created_at DESC
		LIMIT $2
	`
	err := db.Raw(sql, projectID, limit).Scan(&trails).Error
	return trails, err
}
