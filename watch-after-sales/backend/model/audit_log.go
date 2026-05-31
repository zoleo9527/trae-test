package model

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

type JSONB map[string]interface{}

func (j JSONB) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}

func (j *JSONB) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, j)
}

type AuditLog struct {
	ID          uint       `gorm:"primarykey" json:"id"`
	EntityType  string     `gorm:"size:50;not null;index" json:"entity_type"`
	EntityID    uint       `gorm:"not null;index" json:"entity_id"`
	Action      string     `gorm:"size:30;not null;index" json:"action"`
	OldValue    JSONB      `gorm:"type:jsonb" json:"old_value"`
	NewValue    JSONB      `gorm:"type:jsonb" json:"new_value"`
	OperatorID  uint       `gorm:"not null;index" json:"operator_id"`
	OperatorName string   `gorm:"size:100;not null" json:"operator_name"`
	CreatedAt   time.Time  `json:"created_at"`
}
