package model

import (
	"time"
)

type TaskStatus string

const (
	TaskStatusPending   TaskStatus = "pending"
	TaskStatusRunning   TaskStatus = "running"
	TaskStatusCompleted TaskStatus = "completed"
	TaskStatusFailed    TaskStatus = "failed"
	TaskStatusCancelled TaskStatus = "cancelled"
)

type TaskType string

const (
	TaskTypeExportEnquiry TaskType = "export_enquiry"
	TaskTypeExportQuote   TaskType = "export_quote"
	TaskTypeExportLock    TaskType = "export_lock"
	TaskTypeBatchLock     TaskType = "batch_lock"
	TaskTypeBatchRelease  TaskType = "batch_release"
	TaskTypeCheckExpire   TaskType = "check_expire"
)

type AsyncTask struct {
	BaseModel
	TaskNo     string     `gorm:"size:50;uniqueIndex;not null" json:"task_no"`
	Type       TaskType   `gorm:"size:30;index;not null" json:"type"`
	Status     TaskStatus `gorm:"size:20;index;not null" json:"status"`
	Title      string     `gorm:"size:200;not null" json:"title"`
	Params     string     `gorm:"type:text" json:"params"`
	Result     string     `gorm:"type:text" json:"result"`
	FileURL    string     `gorm:"size:500" json:"file_url"`
	Progress   int        `gorm:"default:0" json:"progress"`
	Total      int        `gorm:"default:0" json:"total"`
	ErrorMsg   string     `gorm:"type:text" json:"error_msg"`
	CreatedByID uint      `gorm:"not null" json:"created_by_id"`
	CreatedBy  *User      `gorm:"foreignKey:CreatedByID" json:"created_by,omitempty"`
	StartedAt  *time.Time `json:"started_at"`
	FinishedAt *time.Time `json:"finished_at"`
	ExpireAt   *time.Time `json:"expire_at"`
}
