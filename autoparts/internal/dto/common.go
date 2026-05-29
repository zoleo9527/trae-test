package dto

import (
	"autoparts/internal/model"
	"time"
)

type IDRequest struct {
	ID uint `json:"id" validate:"required"`
}

type IDsRequest struct {
	IDs []uint `json:"ids" validate:"required,min=1"`
}

type PaginationRequest struct {
	Page     int `json:"page" validate:"min=1"`
	PageSize int `json:"page_size" validate:"min=1,max=100"`
}

type AuditLogFilter struct {
	Module     *string           `json:"module"`
	Action     *model.AuditAction `json:"action"`
	UserID     *uint             `json:"user_id"`
	RecordID   *uint             `json:"record_id"`
	RecordNo   *string           `json:"record_no"`
	CreatedStart *time.Time    `json:"created_start"`
	CreatedEnd   *time.Time    `json:"created_end"`
	Page       int               `json:"page" validate:"min=1"`
	PageSize   int               `json:"page_size" validate:"min=1,max=100"`
}

type AuditLogResponse struct {
	ID         uint              `json:"id"`
	UserID     uint              `json:"user_id"`
	UserName   string            `json:"user_name"`
	Action     model.AuditAction `json:"action"`
	Module     string            `json:"module"`
	RecordID   uint              `json:"record_id"`
	RecordNo   string            `json:"record_no"`
	FieldName  string            `json:"field_name"`
	OldValue   string            `json:"old_value"`
	NewValue   string            `json:"new_value"`
	IPAddress  string            `json:"ip_address"`
	Remark     string            `json:"remark"`
	CreatedAt  time.Time         `json:"created_at"`
}

type TaskResponse struct {
	ID         uint             `json:"id"`
	TaskNo     string           `json:"task_no"`
	Type       model.TaskType   `json:"type"`
	Status     model.TaskStatus `json:"status"`
	Title      string           `json:"title"`
	Progress   int              `json:"progress"`
	Total      int              `json:"total"`
	FileURL    string           `json:"file_url"`
	ErrorMsg   string           `json:"error_msg"`
	CreatedAt  time.Time        `json:"created_at"`
	StartedAt  *time.Time       `json:"started_at"`
	FinishedAt *time.Time       `json:"finished_at"`
}

type ExportRequest struct {
	Filter interface{} `json:"filter"`
}
