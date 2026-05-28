package audit

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"water-delivery-service/internal/database"
	"water-delivery-service/internal/models"
	"water-delivery-service/internal/utils"
	"water-delivery-service/pkg/types"
)

func LogCreate(entityType string, entityID uuid.UUID, userID uuid.UUID, metadata interface{}) error {
	metadataStr := utils.ToJSON(metadata)
	log := &models.AuditLog{
		EntityType: entityType,
		EntityID:   entityID,
		Action:     types.AuditActionCreate,
		UserID:     userID,
		Metadata:   &metadataStr,
	}
	return database.DB.Create(log).Error
}

func LogUpdate(entityType string, entityID uuid.UUID, userID uuid.UUID, fieldName string, oldValue interface{}, newValue interface{}, metadata interface{}) error {
	oldVal := utils.ToJSON(oldValue)
	newVal := utils.ToJSON(newValue)
	metadataStr := utils.ToJSON(metadata)
	log := &models.AuditLog{
		EntityType: entityType,
		EntityID:   entityID,
		Action:     types.AuditActionUpdate,
		UserID:     userID,
		FieldName:  &fieldName,
		OldValue:   &oldVal,
		NewValue:   &newVal,
		Metadata:   &metadataStr,
	}
	return database.DB.Create(log).Error
}

func LogStatusChange(entityType string, entityID uuid.UUID, userID uuid.UUID, oldStatus string, newStatus string, notes string) error {
	metadata := map[string]interface{}{"notes": notes}
	metadataStr := utils.ToJSON(metadata)
	log := &models.AuditLog{
		EntityType: entityType,
		EntityID:   entityID,
		Action:     types.AuditActionStatusChange,
		UserID:     userID,
		FieldName:  utils.Ptr("status"),
		OldValue:   &oldStatus,
		NewValue:   &newStatus,
		Metadata:   &metadataStr,
	}
	return database.DB.Create(log).Error
}

func LogUpload(entityType string, entityID uuid.UUID, userID uuid.UUID, fileURL string, fileHash string) error {
	metadata := map[string]interface{}{"file_url": fileURL, "file_hash": fileHash}
	metadataStr := utils.ToJSON(metadata)
	log := &models.AuditLog{
		EntityType: entityType,
		EntityID:   entityID,
		Action:     types.AuditActionUpload,
		UserID:     userID,
		Metadata:   &metadataStr,
	}
	return database.DB.Create(log).Error
}

func LogApprove(entityType string, entityID uuid.UUID, userID uuid.UUID, approved bool, notes string) error {
	metadata := map[string]interface{}{"notes": notes}
	metadataStr := utils.ToJSON(metadata)
	action := types.AuditActionApprove
	if !approved {
		action = types.AuditActionReject
	}
	log := &models.AuditLog{
		EntityType: entityType,
		EntityID:   entityID,
		Action:     action,
		UserID:     userID,
		Metadata:   &metadataStr,
	}
	return database.DB.Create(log).Error
}

func LogAssign(entityType string, entityID uuid.UUID, userID uuid.UUID, oldAssignee *uuid.UUID, newAssignee uuid.UUID) error {
	oldVal := ""
	if oldAssignee != nil {
		oldVal = oldAssignee.String()
	}
	newVal := newAssignee.String()
	log := &models.AuditLog{
		EntityType: entityType,
		EntityID:   entityID,
		Action:     types.AuditActionAssign,
		UserID:     userID,
		FieldName:  utils.Ptr("assigned_to"),
		OldValue:   &oldVal,
		NewValue:   &newVal,
	}
	return database.DB.Create(log).Error
}

func GetAuditLogs(entityType string, entityID uuid.UUID) ([]models.AuditLog, error) {
	var logs []models.AuditLog
	err := database.DB.Where("entity_type = ? AND entity_id = ?", entityType, entityID).
		Order("created_at DESC").
		Preload("User").
		Find(&logs).Error
	return logs, err
}

func GetComplaintAuditLogsWithTx(tx *gorm.DB, complaintID uuid.UUID) ([]models.AuditLog, error) {
	var logs []models.AuditLog
	err := tx.Where(
		"(entity_type = ? AND entity_id = ?) OR "+
			"entity_id IN (SELECT id FROM redeliveries WHERE complaint_id = ?) OR "+
			"entity_id IN (SELECT id FROM compensations WHERE complaint_id = ?) OR "+
			"entity_id IN (SELECT id FROM complaint_photos WHERE complaint_id = ?)",
		"complaint", complaintID, complaintID, complaintID, complaintID,
	).
		Order("created_at DESC").
		Find(&logs).Error
	return logs, err
}

func LogStatusChangeWithTx(tx *gorm.DB, entityType string, entityID uuid.UUID, userID uuid.UUID, oldStatus string, newStatus string, notes string) error {
	metadata := map[string]interface{}{"notes": notes}
	metadataStr := utils.ToJSON(metadata)
	log := &models.AuditLog{
		EntityType: entityType,
		EntityID:   entityID,
		Action:     types.AuditActionStatusChange,
		UserID:     userID,
		FieldName:  utils.Ptr("status"),
		OldValue:   &oldStatus,
		NewValue:   &newStatus,
		Metadata:   &metadataStr,
	}
	return tx.Create(log).Error
}

func LogCreateWithTx(tx *gorm.DB, entityType string, entityID uuid.UUID, userID uuid.UUID, metadata interface{}) error {
	metadataStr := utils.ToJSON(metadata)
	log := &models.AuditLog{
		EntityType: entityType,
		EntityID:   entityID,
		Action:     types.AuditActionCreate,
		UserID:     userID,
		Metadata:   &metadataStr,
	}
	return tx.Create(log).Error
}

func LogUpdateWithTx(tx *gorm.DB, entityType string, entityID uuid.UUID, userID uuid.UUID, fieldName string, oldValue interface{}, newValue interface{}, metadata interface{}) error {
	oldVal := utils.ToJSON(oldValue)
	newVal := utils.ToJSON(newValue)
	metadataStr := utils.ToJSON(metadata)
	log := &models.AuditLog{
		EntityType: entityType,
		EntityID:   entityID,
		Action:     types.AuditActionUpdate,
		UserID:     userID,
		FieldName:  &fieldName,
		OldValue:   &oldVal,
		NewValue:   &newVal,
		Metadata:   &metadataStr,
	}
	return tx.Create(log).Error
}

func LogAssignWithTx(tx *gorm.DB, entityType string, entityID uuid.UUID, userID uuid.UUID, oldAssignee *uuid.UUID, newAssignee uuid.UUID) error {
	oldVal := ""
	if oldAssignee != nil {
		oldVal = oldAssignee.String()
	}
	newVal := newAssignee.String()
	log := &models.AuditLog{
		EntityType: entityType,
		EntityID:   entityID,
		Action:     types.AuditActionAssign,
		UserID:     userID,
		FieldName:  utils.Ptr("assigned_to"),
		OldValue:   &oldVal,
		NewValue:   &newVal,
	}
	return tx.Create(log).Error
}

func LogApproveWithTx(tx *gorm.DB, entityType string, entityID uuid.UUID, userID uuid.UUID, approved bool, notes string) error {
	metadata := map[string]interface{}{"notes": notes}
	metadataStr := utils.ToJSON(metadata)
	action := types.AuditActionApprove
	if !approved {
		action = types.AuditActionReject
	}
	log := &models.AuditLog{
		EntityType: entityType,
		EntityID:   entityID,
		Action:     action,
		UserID:     userID,
		Metadata:   &metadataStr,
	}
	return tx.Create(log).Error
}

func LogUploadWithTx(tx *gorm.DB, entityType string, entityID uuid.UUID, userID uuid.UUID, fileURL string, fileHash string) error {
	metadata := map[string]interface{}{"file_url": fileURL, "file_hash": fileHash}
	metadataStr := utils.ToJSON(metadata)
	now := time.Now()
	log := &models.AuditLog{
		BaseModel:  models.BaseModel{CreatedAt: now, UpdatedAt: now},
		EntityType: entityType,
		EntityID:   entityID,
		Action:     types.AuditActionUpload,
		UserID:     userID,
		Metadata:   &metadataStr,
	}
	return tx.Create(log).Error
}
