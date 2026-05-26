package services

import (
	"encoding/json"
	"tea-distribution/internal/db"
	"tea-distribution/internal/models"

	"github.com/google/uuid"
)

type AuditService struct{}

func NewAuditService() *AuditService {
	return &AuditService{}
}

func (s *AuditService) Log(
	entityType string,
	entityID uuid.UUID,
	action string,
	oldStatus string,
	newStatus string,
	operatorID uuid.UUID,
	operatorName string,
	changes interface{},
	remark string,
	ip string,
	userAgent string,
) error {
	var changesStr string
	if changes != nil {
		changesBytes, _ := json.Marshal(changes)
		changesStr = string(changesBytes)
	}

	log := &models.AuditLog{
		EntityType:   entityType,
		EntityID:     entityID,
		Action:       action,
		OldStatus:    oldStatus,
		NewStatus:    newStatus,
		OperatorID:   operatorID,
		OperatorName: operatorName,
		Changes:      changesStr,
		Remark:       remark,
		IPAddress:    ip,
		UserAgent:    userAgent,
	}

	return db.DB.Create(log).Error
}

func (s *AuditService) LogStatusChange(
	entityType string,
	entityID uuid.UUID,
	oldStatus string,
	newStatus string,
	operatorID uuid.UUID,
	operatorName string,
	remark string,
) error {
	return s.Log(
		entityType,
		entityID,
		"status_change",
		oldStatus,
		newStatus,
		operatorID,
		operatorName,
		nil,
		remark,
		"",
		"",
	)
}

func (s *AuditService) LogCreate(
	entityType string,
	entityID uuid.UUID,
	operatorID uuid.UUID,
	operatorName string,
	data interface{},
) error {
	return s.Log(
		entityType,
		entityID,
		"create",
		"",
		"",
		operatorID,
		operatorName,
		data,
		"创建记录",
		"",
		"",
	)
}

func (s *AuditService) LogUpdate(
	entityType string,
	entityID uuid.UUID,
	operatorID uuid.UUID,
	operatorName string,
	changes interface{},
	remark string,
) error {
	return s.Log(
		entityType,
		entityID,
		"update",
		"",
		"",
		operatorID,
		operatorName,
		changes,
		remark,
		"",
		"",
	)
}

func (s *AuditService) List(entityType string, entityID uuid.UUID, page, pageSize int) ([]models.AuditLog, int64, error) {
	var logs []models.AuditLog
	var total int64

	query := db.DB.Model(&models.AuditLog{}).Preload("Operator")
	if entityType != "" {
		query = query.Where("entity_type = ?", entityType)
	}
	if entityID != uuid.Nil {
		query = query.Where("entity_id = ?", entityID)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, models.AppErrInternal("查询审计日志失败")
	}

	offset := (page - 1) * pageSize
	if err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&logs).Error; err != nil {
		return nil, 0, models.AppErrInternal("查询审计日志失败")
	}

	return logs, total, nil
}
