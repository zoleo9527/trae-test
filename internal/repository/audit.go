package repository

import (
	"camp-management/internal/model"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AuditRepository struct {
	baseRepository
}

func NewAuditRepository(db *gorm.DB) *AuditRepository {
	return &AuditRepository{baseRepository{db: db}}
}

func (r *AuditRepository) Create(log *model.AuditLog) error {
	return r.db.Create(log).Error
}

func (r *AuditRepository) Log(userID uuid.UUID, action model.AuditAction, resourceType string, resourceID *uuid.UUID, oldValues, newValues interface{}, changes map[string]interface{}, ip, userAgent, remark string) error {
	oldJSON, _ := json.Marshal(oldValues)
	newJSON, _ := json.Marshal(newValues)
	changesJSON, _ := json.Marshal(changes)

	log := &model.AuditLog{
		UserID:       userID,
		Action:       action,
		ResourceType: resourceType,
		ResourceID:   resourceID,
		OldValues:    string(oldJSON),
		NewValues:    string(newJSON),
		Changes:      string(changesJSON),
		IPAddress:    ip,
		UserAgent:    userAgent,
		Remark:       remark,
		CreatedAt:    time.Now(),
	}
	return r.db.Create(log).Error
}

func (r *AuditRepository) Query(opts QueryOptions) ([]model.AuditLog, int64, error) {
	var logs []model.AuditLog
	opts.Preload = []string{"User"}
	total, err := r.baseRepository.Query(&logs, opts)
	return logs, total, err
}

func (r *AuditRepository) GetByResource(resourceType string, resourceID uuid.UUID) ([]model.AuditLog, error) {
	var logs []model.AuditLog
	err := r.db.Preload("User").
		Where("resource_type = ? AND resource_id = ?", resourceType, resourceID).
		Order("created_at DESC").
		Find(&logs).Error
	return logs, err
}

func (r *AuditRepository) GetByUser(userID uuid.UUID, limit int) ([]model.AuditLog, error) {
	var logs []model.AuditLog
	err := r.db.Preload("User").
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Find(&logs).Error
	return logs, err
}
