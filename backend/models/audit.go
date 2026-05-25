package models

import (
	"time"
)

type AuditLog struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Module       string         `gorm:"size:50;index;not null" json:"module"`
	Action       string         `gorm:"size:100;not null" json:"action"`
	ResourceType string        `gorm:"size:50;index" json:"resource_type"`
	ResourceID   *uint          `json:"resource_id"`
	ResourceNo   string         `gorm:"size:50;index" json:"resource_no"`
	OperatorID   uint           `gorm:"not null" json:"operator_id"`
	OperatorName string         `gorm:"size:100" json:"operator_name"`
	OperatorRole string         `gorm:"size:30" json:"operator_role"`
	BeforeData   string         `gorm:"type:json" json:"before_data"`
	AfterData    string         `gorm:"type:json" json:"after_data"`
	Changes      string         `gorm:"type:json" json:"changes"`
	IPAddress    string         `gorm:"size:50" json:"ip_address"`
	UserAgent    string         `gorm:"size:500" json:"user_agent"`
	Status       string         `gorm:"size:20;default:success" json:"status"`
	ErrorMessage string         `gorm:"type:text" json:"error_message"`
	Remark       string         `gorm:"type:text" json:"remark"`
	CreatedAt    time.Time      `gorm:"index" json:"created_at"`

	Operator *User `gorm:"foreignKey:OperatorID" json:"operator,omitempty"`
}

type SystemLog struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	Level      string    `gorm:"size:20;index" json:"level"`
	Module     string    `gorm:"size:50;index" json:"module"`
	Message    string    `gorm:"type:text" json:"message"`
	Details    string    `gorm:"type:json" json:"details"`
	TraceID    string    `gorm:"size:100;index" json:"trace_id"`
	CreatedAt  time.Time `gorm:"index" json:"created_at"`
}
