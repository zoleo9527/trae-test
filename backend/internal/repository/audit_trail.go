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
		SELECT a.* FROM audit_trails a
		INNER JOIN (
			SELECT id, 'settlement_batch' as entity_type FROM settlement_batches WHERE project_id = $1
			UNION ALL
			SELECT id, 'change_order' as entity_type FROM change_orders WHERE project_id = $1
			UNION ALL
			SELECT id, 'quality_inspection' as entity_type FROM quality_inspections WHERE project_id = $1
			UNION ALL
			SELECT id, 'rework_record' as entity_type FROM rework_records WHERE project_id = $1
			UNION ALL
			SELECT id, 'delivery_receipt' as entity_type FROM delivery_receipts WHERE project_id = $1
		) e ON a.entity_id = e.id AND a.entity_type = e.entity_type
		ORDER BY a.created_at DESC
		LIMIT $2
	`
	err := db.Raw(sql, projectID, limit).Scan(&trails).Error
	return trails, err
}
