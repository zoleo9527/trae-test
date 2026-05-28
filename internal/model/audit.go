package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AuditAction string

const (
	AuditActionCreate    AuditAction = "create"
	AuditActionUpdate    AuditAction = "update"
	AuditActionDelete    AuditAction = "delete"
	AuditActionStatusChange AuditAction = "status_change"
	AuditActionAssign   AuditAction = "assign"
	AuditActionExport   AuditAction = "export"
	AuditActionImport   AuditAction = "import"
	AuditActionLogin    AuditAction = "login"
	AuditActionLogout   AuditAction = "logout"
)

type AuditLog struct {
	ID            uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	UserID        uuid.UUID  `gorm:"type:uuid;index;not null" json:"user_id"`
	Action        AuditAction `gorm:"type:varchar(50);not null" json:"action"`
	ResourceType  string     `gorm:"type:varchar(50);not null" json:"resource_type"`
	ResourceID    *uuid.UUID `gorm:"type:uuid;index" json:"resource_id,omitempty"`
	OldValues      string     `gorm:"type:text" json:"old_values"`
	NewValues      string     `gorm:"type:text" json:"new_values"`
	Changes        string     `gorm:"type:text" json:"changes"`
	IPAddress     string     `gorm:"type:varchar(50)" json:"ip_address"`
	UserAgent     string     `gorm:"type:varchar(255)" json:"user_agent"`
	Remark        string     `gorm:"type:varchar(500)" json:"remark"`
	CreatedAt     time.Time  `json:"created_at"`

	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (a *AuditLog) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}
