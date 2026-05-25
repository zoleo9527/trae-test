package utils

import (
	"encoding/json"
	"gallery-system/database"
	"gallery-system/models"
	"time"
)

func CreateAuditLog(module, action, resourceType string, resourceID *uint, resourceNo string, operatorID uint, operatorName, operatorRole string, beforeData, afterData interface{}, ipAddress, userAgent, remark string) error {
	beforeJSON, _ := json.Marshal(beforeData)
	afterJSON, _ := json.Marshal(afterData)

	log := models.AuditLog{
		Module:       module,
		Action:       action,
		ResourceType: resourceType,
		ResourceID:   resourceID,
		ResourceNo:   resourceNo,
		OperatorID:   operatorID,
		OperatorName: operatorName,
		OperatorRole: operatorRole,
		BeforeData:   string(beforeJSON),
		AfterData:    string(afterJSON),
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
		Remark:       remark,
		CreatedAt:    time.Now(),
	}

	return database.DB.Create(&log).Error
}

func CreateSystemLog(level, module, message string, details interface{}, traceID string) error {
	detailsJSON, _ := json.Marshal(details)

	log := models.SystemLog{
		Level:     level,
		Module:    module,
		Message:   message,
		Details:   string(detailsJSON),
		TraceID:   traceID,
		CreatedAt: time.Now(),
	}

	return database.DB.Create(&log).Error
}
