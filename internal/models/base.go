package models

import (
	"time"

	"gorm.io/gorm"
)

type BaseModel struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type Status string

const (
	StatusPending   Status = "pending"
	StatusApproved  Status = "approved"
	StatusRejected  Status = "rejected"
	StatusReviewing Status = "reviewing"
	StatusCompleted Status = "completed"
)

type TaskStatus string

const (
	TaskStatusTodo     TaskStatus = "todo"
	TaskStatusDoing    TaskStatus = "doing"
	TaskStatusDone     TaskStatus = "done"
	TaskStatusBlocked  TaskStatus = "blocked"
	TaskStatusRejected TaskStatus = "rejected"
)
