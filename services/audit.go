package services

import (
	"encoding/json"
	"jewelry-store-system/models"
	"reflect"
	"strings"

	"gorm.io/gorm"
)

type AuditService struct {
	db *gorm.DB
}

func NewAuditService(db *gorm.DB) *AuditService {
	return &AuditService{db: db}
}

func (s *AuditService) LogAction(
	action string,
	module string,
	recordID uint,
	operatorID uint,
	operatorName string,
	oldValues interface{},
	newValues interface{},
	ipAddress string,
	userAgent string,
) error {
	oldJSON, _ := json.Marshal(oldValues)
	newJSON, _ := json.Marshal(newValues)

	changedFields := s.getChangedFields(oldValues, newValues)
	changedJSON, _ := json.Marshal(changedFields)

	log := models.AuditLog{
		Action:        action,
		Module:        module,
		RecordID:      recordID,
		OperatorID:    operatorID,
		OperatorName:  operatorName,
		OldValues:     string(oldJSON),
		NewValues:     string(newJSON),
		ChangedFields: string(changedJSON),
		IPAddress:     ipAddress,
		UserAgent:     userAgent,
	}

	return s.db.Create(&log).Error
}

func (s *AuditService) getChangedFields(oldValues, newValues interface{}) []string {
	if oldValues == nil || newValues == nil {
		return nil
	}

	oldMap := s.structToMap(oldValues)
	newMap := s.structToMap(newValues)

	var changed []string
	for key, oldVal := range oldMap {
		if newVal, exists := newMap[key]; exists {
			if !reflect.DeepEqual(oldVal, newVal) {
				changed = append(changed, key)
			}
		}
	}

	return changed
}

func (s *AuditService) structToMap(v interface{}) map[string]interface{} {
	result := make(map[string]interface{})
	val := reflect.ValueOf(v)

	if val.Kind() == reflect.Ptr {
		val = val.Elem()
	}

	if val.Kind() != reflect.Struct {
		return result
	}

	typ := val.Type()
	for i := 0; i < val.NumField(); i++ {
		field := typ.Field(i)
		fieldName := field.Tag.Get("json")
		if fieldName == "" {
			fieldName = strings.ToLower(field.Name)
		}
		fieldName = strings.Split(fieldName, ",")[0]

		if fieldName != "-" {
			result[fieldName] = val.Field(i).Interface()
		}
	}

	return result
}

func (s *AuditService) AddStatusHistory(
	module string,
	recordID uint,
	oldStatus string,
	newStatus string,
	operatorID uint,
	operatorName string,
	comment string,
) error {
	history := models.StatusHistory{
		Module:       module,
		RecordID:     recordID,
		OldStatus:    oldStatus,
		NewStatus:    newStatus,
		OperatorID:   operatorID,
		OperatorName: operatorName,
		Comment:      comment,
	}

	return s.db.Create(&history).Error
}

func (s *AuditService) GetAuditLogs(module string, recordID uint) ([]models.AuditLog, error) {
	var logs []models.AuditLog
	query := s.db.Order("created_at DESC")

	if module != "" {
		query = query.Where("module = ?", module)
	}
	if recordID > 0 {
		query = query.Where("record_id = ?", recordID)
	}

	err := query.Find(&logs).Error
	return logs, err
}

func (s *AuditService) GetStatusHistory(module string, recordID uint) ([]models.StatusHistory, error) {
	var history []models.StatusHistory
	query := s.db.Order("created_at DESC")

	if module != "" {
		query = query.Where("module = ?", module)
	}
	if recordID > 0 {
		query = query.Where("record_id = ?", recordID)
	}

	err := query.Find(&history).Error
	return history, err
}
