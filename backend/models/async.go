package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AsyncTaskStatus string
type AsyncTaskType string

const (
	TaskStatusPending    AsyncTaskStatus = "pending"
	TaskStatusProcessing AsyncTaskStatus = "processing"
	TaskStatusCompleted  AsyncTaskStatus = "completed"
	TaskStatusFailed     AsyncTaskStatus = "failed"
	TaskStatusCancelled  AsyncTaskStatus = "cancelled"

	TaskTypeExportTickets      AsyncTaskType = "export_tickets"
	TaskTypeExportActivities   AsyncTaskType = "export_activities"
	TaskTypeSendNotification   AsyncTaskType = "send_notification"
	TaskTypeGenerateReport     AsyncTaskType = "generate_report"
	TaskTypeBatchVerify        AsyncTaskType = "batch_verify"
	TaskTypeSyncData           AsyncTaskType = "sync_data"
)

type AsyncTask struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	TaskNo      string         `gorm:"size:50;uniqueIndex;not null" json:"task_no"`
	Type        AsyncTaskType  `gorm:"size:50;index;not null" json:"type"`
	Title       string         `gorm:"size:200" json:"title"`
	Description string         `gorm:"type:text" json:"description"`
	Params      string         `gorm:"type:json" json:"params"`
	Status      AsyncTaskStatus `gorm:"size:30;index;default:pending" json:"status"`
	Priority    int            `gorm:"default:0" json:"priority"`
	Result      string         `gorm:"type:json" json:"result"`
	ErrorMessage string        `gorm:"type:text" json:"error_message"`
	Progress    int            `gorm:"default:0" json:"progress"`
	TotalItems  int            `gorm:"default:0" json:"total_items"`
	CompletedItems int         `gorm:"default:0" json:"completed_items"`
	CreatedBy   uint           `json:"created_by"`
	StartedAt   *time.Time     `json:"started_at"`
	CompletedAt *time.Time     `json:"completed_at"`
	ExpiresAt   *time.Time     `json:"expires_at"`
	RetryCount  int            `gorm:"default:0" json:"retry_count"`
	MaxRetry    int            `gorm:"default:3" json:"max_retry"`
	CreatedAt   time.Time      `gorm:"index" json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`

	Creator *User `gorm:"foreignKey:CreatedBy" json:"creator,omitempty"`
}

type Notification struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	UserID      uint           `gorm:"index" json:"user_id"`
	Title       string         `gorm:"size:200" json:"title"`
	Content     string         `gorm:"type:text" json:"content"`
	Type        string         `gorm:"size:50;index" json:"type"`
	Module      string         `gorm:"size:50" json:"module"`
	ResourceID  *uint          `json:"resource_id"`
	ResourceNo  string         `gorm:"size:50" json:"resource_no"`
	IsRead      bool           `gorm:"default:false;index" json:"is_read"`
	ReadAt      *time.Time     `json:"read_at"`
	CreatedAt   time.Time      `gorm:"index" json:"created_at"`

	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (t *AsyncTask) BeforeCreate(tx *gorm.DB) error {
	if t.TaskNo == "" {
		t.TaskNo = "TASK" + time.Now().Format("20060102") + uuid.New().String()[:6]
	}
	return nil
}
