package service

import (
	"camp-system/internal/database"
	"camp-system/internal/model"
	"encoding/json"
	"time"
)

type LogService struct{}

func NewLogService() *LogService {
	return &LogService{}
}

func (s *LogService) LogOperation(userID, userName, userRole, action, entityType, entityID string, oldValue, newValue interface{}, ip, userAgent string) error {
	oldJSON, _ := json.Marshal(oldValue)
	newJSON, _ := json.Marshal(newValue)

	log := &model.OperationLog{
		UserID:     userID,
		UserName:   userName,
		UserRole:   userRole,
		Action:     action,
		EntityType: entityType,
		EntityID:   entityID,
		OldValue:   string(oldJSON),
		NewValue:   string(newJSON),
		IPAddress:  ip,
		UserAgent:  userAgent,
		CreatedAt:  time.Now(),
	}

	return database.DB.Create(log).Error
}

func (s *LogService) LogStatusChange(entityType, entityID, oldStatus, newStatus, changedBy, remark string) error {
	history := &model.StatusHistory{
		EntityType: entityType,
		EntityID:   entityID,
		OldStatus:  oldStatus,
		NewStatus:  newStatus,
		ChangedBy:  changedBy,
		ChangedAt:  time.Now(),
		Remark:     remark,
	}

	return database.DB.Create(history).Error
}

func (s *LogService) GetEntityHistory(entityType, entityID string) ([]model.StatusHistory, error) {
	var histories []model.StatusHistory
	err := database.DB.Where("entity_type = ? AND entity_id = ?", entityType, entityID).
		Order("changed_at DESC").
		Find(&histories).Error
	return histories, err
}

func (s *LogService) GetOperationLogs(entityType, entityID string, page, pageSize int) ([]model.OperationLog, int64, error) {
	var logs []model.OperationLog
	var total int64

	query := database.DB.Model(&model.OperationLog{})
	if entityType != "" {
		query = query.Where("entity_type = ?", entityType)
	}
	if entityID != "" {
		query = query.Where("entity_id = ?", entityID)
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	err := query.Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&logs).Error

	return logs, total, err
}

func (s *LogService) GetUserOperationLogs(userID string, page, pageSize int) ([]model.OperationLog, int64, error) {
	var logs []model.OperationLog
	var total int64

	query := database.DB.Model(&model.OperationLog{}).Where("user_id = ?", userID)
	query.Count(&total)

	offset := (page - 1) * pageSize
	err := query.Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&logs).Error

	return logs, total, err
}

func (s *LogService) GetCamperFullHistory(camperID string) (map[string]interface{}, error) {
	result := make(map[string]interface{})

	var checkIns []model.CheckIn
	database.DB.Where("camper_id = ?", camperID).Order("check_in_time DESC").Find(&checkIns)
	result["check_ins"] = checkIns

	var medicalReports []model.MedicalReport
	database.DB.Where("camper_id = ?", camperID).Order("report_time DESC").Find(&medicalReports)
	result["medical_reports"] = medicalReports

	var roomChanges []model.RoomChangeLog
	database.DB.Where("camper_id = ?", camperID).Order("change_time DESC").Find(&roomChanges)
	result["room_changes"] = roomChanges

	var followUps []model.FollowUp
	database.DB.Where("camper_id = ?", camperID).Order("created_at DESC").Find(&followUps)
	result["follow_ups"] = followUps

	var materialIssues []model.MaterialIssue
	database.DB.Where("camper_id = ?", camperID).Order("request_time DESC").Find(&materialIssues)
	result["material_issues"] = materialIssues

	var statusHistories []model.StatusHistory
	database.DB.Where("entity_type = 'camper' AND entity_id = ?", camperID).Order("changed_at DESC").Find(&statusHistories)
	result["status_history"] = statusHistories

	var operationLogs []model.OperationLog
	database.DB.Where("entity_type = 'camper' AND entity_id = ?", camperID).Order("created_at DESC").Find(&operationLogs)
	result["operation_logs"] = operationLogs

	return result, nil
}
