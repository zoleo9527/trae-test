package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var DB *gorm.DB

func SetDB(db *gorm.DB) {
	DB = db
}

func LogOperation(entityType string, entityID uuid.UUID, action string, oldValue, newValue interface{}, remark string, operatorID uuid.UUID, operatorName string, operatorRole Role) error {
	oldJSON, _ := json.Marshal(oldValue)
	newJSON, _ := json.Marshal(newValue)

	log := &OperationLog{
		EntityType:   entityType,
		EntityID:     entityID,
		Action:       action,
		OldValue:     string(oldJSON),
		NewValue:     string(newJSON),
		Remark:       remark,
		OperatorID:   operatorID,
		OperatorName: operatorName,
		OperatorRole: operatorRole,
		CreatedAt:    time.Now(),
	}
	return DB.Create(log).Error
}

func GetOperationLogs(entityType string, entityID uuid.UUID) ([]OperationLog, error) {
	var logs []OperationLog
	err := DB.Where("entity_type = ? AND entity_id = ?", entityType, entityID).
		Order("created_at DESC").
		Find(&logs).Error
	return logs, err
}

func CreateException(exceptionType ExceptionType, title, description, severity string,
	productID, storeID, orderID, inspectionID *uuid.UUID,
	productSKU, productName, storeCode, storeName, orderNo string,
	reportedBy uuid.UUID, reportedByName string, assignedTo *uuid.UUID, assignedToName string) (*ExceptionRecord, error) {

	exception := &ExceptionRecord{
		Type:           exceptionType,
		Title:          title,
		Description:    description,
		Status:         ExceptionStatusOpen,
		Severity:       severity,
		ProductID:      productID,
		ProductSKU:     productSKU,
		ProductName:    productName,
		StoreID:        storeID,
		StoreCode:      storeCode,
		StoreName:      storeName,
		OrderID:        orderID,
		OrderNo:        orderNo,
		InspectionID:   inspectionID,
		ReportedBy:     reportedBy,
		ReportedByName: reportedByName,
		AssignedTo:     assignedTo,
		AssignedToName: assignedToName,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if err := DB.Create(exception).Error; err != nil {
		return nil, err
	}

	if err := LogOperation("exception", exception.ID, "create", nil, exception,
		"创建异常记录", reportedBy, reportedByName, RoleManager); err != nil {
		return nil, err
	}

	return exception, nil
}
