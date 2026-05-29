package services

import (
	"encoding/json"
	"exhibition-system/internal/database"
	"exhibition-system/internal/models"
	"reflect"
)

type AuditService struct{}

func NewAuditService() *AuditService {
	return &AuditService{}
}

func (s *AuditService) Log(
	operatorID uint,
	action models.AuditAction,
	resourceType models.ResourceType,
	resourceID uint,
	projectID *uint,
	oldValue interface{},
	newValue interface{},
	changeLog string,
	ipAddress string,
	userAgent string,
) error {
	auditLog := &models.AuditLog{
		OperatorID:   operatorID,
		Action:       action,
		ResourceType: resourceType,
		ResourceID:   resourceID,
		ProjectID:    projectID,
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
		ChangeLog:    changeLog,
	}

	if oldValue != nil {
		oldMap := structToMap(oldValue)
		auditLog.OldValues = oldMap
	}

	if newValue != nil {
		newMap := structToMap(newValue)
		auditLog.NewValues = newMap
	}

	return database.DB.Create(auditLog).Error
}

func structToMap(v interface{}) map[string]interface{} {
	data, err := json.Marshal(v)
	if err != nil {
		return nil
	}
	var result map[string]interface{}
	if err := json.Unmarshal(data, &result); err != nil {
		return nil
	}
	delete(result, "Password")
	return result
}

func (s *AuditService) GetChanges(oldValue, newValue interface{}) string {
	if oldValue == nil || newValue == nil {
		return ""
	}

	oldMap := structToMap(oldValue)
	newMap := structToMap(newValue)

	var changes string
	for key, oldVal := range oldMap {
		newVal, exists := newMap[key]
		if !exists {
			continue
		}
		if !reflect.DeepEqual(oldVal, newVal) {
			oldStr, _ := json.Marshal(oldVal)
			newStr, _ := json.Marshal(newVal)
			changes += key + ": " + string(oldStr) + " -> " + string(newStr) + "; "
		}
	}
	return changes
}

func (s *AuditService) List(resourceType *models.ResourceType, resourceID *uint, projectID *uint, page, pageSize int) ([]models.AuditLog, int64, error) {
	var logs []models.AuditLog
	var total int64

	query := database.DB.Model(&models.AuditLog{}).Preload("Operator")

	if resourceType != nil {
		query = query.Where("resource_type = ?", *resourceType)
	}
	if resourceID != nil {
		query = query.Where("resource_id = ?", *resourceID)
	}
	if projectID != nil {
		query = query.Where("project_id = ?", *projectID)
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&logs).Error

	return logs, total, err
}

func (s *AuditService) GetByID(id uint) (*models.AuditLog, error) {
	var log models.AuditLog
	err := database.DB.Preload("Operator").Preload("Project").First(&log, id).Error
	return &log, err
}
