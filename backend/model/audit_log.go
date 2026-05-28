package model

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

type JSONMap map[string]any

func (j JSONMap) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}

func (j *JSONMap) Scan(value any) error {
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
	ID         uint      `gorm:"primaryKey" json:"id"`
	UserID     uint      `gorm:"not null;index" json:"user_id"`
	Action     string    `gorm:"size:50;not null;index" json:"action"`
	EntityType string    `gorm:"size:50;not null;index" json:"entity_type"`
	EntityID   uint      `gorm:"not null;index" json:"entity_id"`
	OldValue   JSONMap   `gorm:"type:jsonb" json:"old_value,omitempty"`
	NewValue   JSONMap   `gorm:"type:jsonb" json:"new_value,omitempty"`
	IPAddress  string    `gorm:"size:50" json:"ip_address,omitempty"`
	CreatedAt  time.Time `json:"created_at"`

	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (AuditLog) TableName() string { return "audit_logs" }
