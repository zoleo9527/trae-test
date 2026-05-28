package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BaseModel struct {
	ID        string         `gorm:"type:uuid;primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	CreatedBy string         `gorm:"type:uuid" json:"created_by"`
	UpdatedBy string         `gorm:"type:uuid" json:"updated_by"`
}

func (b *BaseModel) BeforeCreate(tx *gorm.DB) error {
	if b.ID == "" {
		b.ID = uuid.New().String()
	}
	return nil
}

type StatusHistory struct {
	ID          string    `gorm:"type:uuid;primaryKey" json:"id"`
	EntityType  string    `gorm:"index;not null" json:"entity_type"`
	EntityID    string    `gorm:"index;not null" json:"entity_id"`
	OldStatus   string    `json:"old_status"`
	NewStatus   string    `gorm:"not null" json:"new_status"`
	ChangedBy   string    `gorm:"type:uuid;not null" json:"changed_by"`
	ChangedAt   time.Time `json:"changed_at"`
	Remark      string    `json:"remark"`
}

func (s *StatusHistory) BeforeCreate(tx *gorm.DB) error {
	if s.ID == "" {
		s.ID = uuid.New().String()
	}
	if s.ChangedAt.IsZero() {
		s.ChangedAt = time.Now()
	}
	return nil
}

type OperationLog struct {
	ID          string    `gorm:"type:uuid;primaryKey" json:"id"`
	UserID      string    `gorm:"type:uuid;index" json:"user_id"`
	UserName    string    `json:"user_name"`
	UserRole    string    `json:"user_role"`
	Action      string    `gorm:"index;not null" json:"action"`
	EntityType  string    `gorm:"index" json:"entity_type"`
	EntityID    string    `json:"entity_id"`
	OldValue    string    `gorm:"type:text" json:"old_value"`
	NewValue    string    `gorm:"type:text" json:"new_value"`
	IPAddress   string    `json:"ip_address"`
	UserAgent   string    `json:"user_agent"`
	CreatedAt   time.Time `json:"created_at"`
}

func (o *OperationLog) BeforeCreate(tx *gorm.DB) error {
	if o.ID == "" {
		o.ID = uuid.New().String()
	}
	if o.CreatedAt.IsZero() {
		o.CreatedAt = time.Now()
	}
	return nil
}
