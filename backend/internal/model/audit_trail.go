package model

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type MapJSON map[string]interface{}

func (m MapJSON) Value() (driver.Value, error) {
	if m == nil {
		return nil, nil
	}
	return json.Marshal(m)
}

func (m *MapJSON) Scan(value interface{}) error {
	if value == nil {
		*m = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, m)
}

type AuditTrail struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	EntityType   string    `gorm:"size:64;not null;index:idx_audit_entity" json:"entity_type"`
	EntityID     uuid.UUID `gorm:"type:uuid;not null;index:idx_audit_entity" json:"entity_id"`
	Action       string    `gorm:"size:32;not null" json:"action"`
	BeforeValue  MapJSON   `gorm:"type:jsonb" json:"before_value"`
	AfterValue   MapJSON   `gorm:"type:jsonb" json:"after_value"`
	OperatorID   uuid.UUID `gorm:"type:uuid;not null;index:idx_audit_operator" json:"operator_id"`
	OperatorName string    `gorm:"size:64;not null" json:"operator_name"`
	OperatorRole string    `gorm:"size:32;not null" json:"operator_role"`
	Remark       string    `gorm:"type:text" json:"remark"`
	CreatedAt    time.Time `gorm:"index:idx_audit_created" json:"created_at"`
}

func (AuditTrail) TableName() string { return "audit_trails" }
