package model

import (
	"time"

	"github.com/google/uuid"
)

type AsyncTask struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	TaskType   string    `gorm:"size:64;not null;index" json:"task_type"`
	Status     string    `gorm:"size:32;not null;default:'pending';index" json:"status"`
	Payload    MapJSON   `gorm:"type:jsonb" json:"payload"`
	Result     MapJSON   `gorm:"type:jsonb" json:"result"`
	Error      string    `gorm:"type:text" json:"error"`
	CreatedBy  uuid.UUID `gorm:"type:uuid;not null" json:"created_by"`
	StartedAt  *time.Time `json:"started_at"`
	CompletedAt *time.Time `json:"completed_at"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

func (AsyncTask) TableName() string { return "async_tasks" }
