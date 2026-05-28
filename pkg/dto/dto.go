package dto

import (
	"time"

	"github.com/google/uuid"
	"water-delivery-service/pkg/types"
)

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	AccessToken string   `json:"access_token"`
	TokenType   string   `json:"token_type"`
	ExpiresIn   int      `json:"expires_in"`
	User        UserInfo `json:"user"`
}

type UserInfo struct {
	ID        uuid.UUID  `json:"id"`
	Username  string     `json:"username"`
	FullName  string     `json:"full_name"`
	Phone     string     `json:"phone"`
	Role      types.Role `json:"role"`
	StationID *uuid.UUID `json:"station_id,omitempty"`
}

type CreateComplaintRequest struct {
	CustomerID      uuid.UUID            `json:"customer_id"`
	OrderID         *uuid.UUID           `json:"order_id"`
	Type            types.ComplaintType  `json:"type"`
	Title           string               `json:"title"`
	Description     string               `json:"description"`
	EmptyBucketDiff *int                 `json:"empty_bucket_diff"`
	Priority        int                  `json:"priority"`
}

type UpdateComplaintStatusRequest struct {
	Status types.ComplaintStatus `json:"status"`
	Notes  string                `json:"notes"`
}

type AssignComplaintRequest struct {
	AssignedTo uuid.UUID `json:"assigned_to"`
}

type ComplaintQueryFilter struct {
	StationID  *uuid.UUID             `query:"station_id"`
	CustomerID *uuid.UUID             `query:"customer_id"`
	AssignedTo *uuid.UUID             `query:"assigned_to"`
	Status     *types.ComplaintStatus `query:"status"`
	Type       *types.ComplaintType   `query:"type"`
	Priority   *int                   `query:"priority"`
	Search     string                 `query:"search"`
	Page       int                    `query:"page"`
	PageSize   int                    `query:"page_size"`
}

type CreateRedeliveryRequest struct {
	ComplaintID       uuid.UUID `json:"complaint_id"`
	DriverID          *uuid.UUID `json:"driver_id"`
	WaterAmount       int       `json:"water_amount"`
	EmptyBucketAdjust int       `json:"empty_bucket_adjust"`
	ScheduledAt       time.Time `json:"scheduled_at"`
	Notes             string    `json:"notes"`
}

type UpdateRedeliveryStatusRequest struct {
	Status   types.RedeliveryStatus `json:"status"`
	PhotoURL *string                `json:"photo_url"`
	Notes    string                 `json:"notes"`
}

type CreateCompensationRequest struct {
	ComplaintID uuid.UUID              `json:"complaint_id"`
	Type        types.CompensationType `json:"type"`
	Amount      float64                `json:"amount"`
	WaterAmount int                    `json:"water_amount"`
	Description string                 `json:"description"`
}

type ApproveCompensationRequest struct {
	Approved bool   `json:"approved"`
	Notes    string `json:"notes"`
}

type AddNoteRequest struct {
	Content    string `json:"content"`
	IsInternal bool   `json:"is_internal"`
}

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Page       int         `json:"page"`
	PageSize   int         `json:"page_size"`
	Total      int64       `json:"total"`
	TotalPages int         `json:"total_pages"`
}

type ComplaintListResponse struct {
	ID              uuid.UUID                `json:"id"`
	CustomerName    string                   `json:"customer_name"`
	CustomerPhone   string                   `json:"customer_phone"`
	StationName     string                   `json:"station_name"`
	Type            types.ComplaintType      `json:"type"`
	Status          types.ComplaintStatus    `json:"status"`
	Priority        int                      `json:"priority"`
	Title           string                   `json:"title"`
	EmptyBucketDiff *int                     `json:"empty_bucket_diff,omitempty"`
	AssignedName    *string                  `json:"assigned_name,omitempty"`
	ReporterName    string                   `json:"reporter_name"`
	CreatedAt       time.Time                `json:"created_at"`
	HasRedelivery   bool                     `json:"has_redelivery"`
	HasCompensation bool                     `json:"has_compensation"`
	PhotoCount      int64                    `json:"photo_count"`
}

type ComplaintDetailResponse struct {
	ID              uuid.UUID                `json:"id"`
	CustomerID      uuid.UUID                `json:"customer_id"`
	CustomerName    string                   `json:"customer_name"`
	CustomerPhone   string                   `json:"customer_phone"`
	CustomerAddress string                   `json:"customer_address"`
	StationID       uuid.UUID                `json:"station_id"`
	StationName     string                   `json:"station_name"`
	OrderID         *uuid.UUID               `json:"order_id,omitempty"`
	Type            types.ComplaintType      `json:"type"`
	Status          types.ComplaintStatus    `json:"status"`
	Priority        int                      `json:"priority"`
	Title           string                   `json:"title"`
	Description     string                   `json:"description"`
	EmptyBucketDiff *int                     `json:"empty_bucket_diff,omitempty"`
	AssignedTo      *uuid.UUID               `json:"assigned_to,omitempty"`
	AssignedName    *string                  `json:"assigned_name,omitempty"`
	ReportedBy      uuid.UUID                `json:"reported_by"`
	ReporterName    string                   `json:"reporter_name"`
	CreatedAt       time.Time                `json:"created_at"`
	ResolvedAt      *time.Time               `json:"resolved_at,omitempty"`
	Redeliveries    []RedeliveryResponse     `json:"redeliveries,omitempty"`
	Compensations   []CompensationResponse   `json:"compensations,omitempty"`
	Photos          []PhotoResponse          `json:"photos,omitempty"`
	Notes           []NoteResponse           `json:"notes,omitempty"`
	AuditLogs       []AuditLogResponse       `json:"audit_logs,omitempty"`
}

type RedeliveryResponse struct {
	ID                uuid.UUID              `json:"id"`
	ComplaintID       uuid.UUID              `json:"complaint_id"`
	DriverID          *uuid.UUID             `json:"driver_id,omitempty"`
	DriverName        *string                `json:"driver_name,omitempty"`
	WaterAmount       int                    `json:"water_amount"`
	EmptyBucketAdjust int                    `json:"empty_bucket_adjust"`
	Status            types.RedeliveryStatus `json:"status"`
	ScheduledAt       time.Time              `json:"scheduled_at"`
	DeliveredAt       *time.Time             `json:"delivered_at,omitempty"`
	PhotoURL          *string                `json:"photo_url,omitempty"`
	Notes             string                 `json:"notes"`
	CreatedAt         time.Time              `json:"created_at"`
}

type CompensationResponse struct {
	ID           uuid.UUID                `json:"id"`
	ComplaintID  uuid.UUID                `json:"complaint_id"`
	Type         types.CompensationType   `json:"type"`
	Amount       float64                  `json:"amount"`
	WaterAmount  int                      `json:"water_amount"`
	Status       types.CompensationStatus `json:"status"`
	Description  string                   `json:"description"`
	ApprovedBy   *uuid.UUID               `json:"approved_by,omitempty"`
	ApproverName *string                  `json:"approver_name,omitempty"`
	ApprovedAt   *time.Time               `json:"approved_at,omitempty"`
	PaidAt       *time.Time               `json:"paid_at,omitempty"`
	CreatedAt    time.Time                `json:"created_at"`
}

type PhotoResponse struct {
	ID           uuid.UUID `json:"id"`
	ComplaintID  uuid.UUID `json:"complaint_id"`
	UploadedBy   uuid.UUID `json:"uploaded_by"`
	UploaderName string    `json:"uploader_name"`
	FileURL      string    `json:"file_url"`
	Description  string    `json:"description"`
	Verified     bool      `json:"verified"`
	CreatedAt    time.Time `json:"created_at"`
}

type NoteResponse struct {
	ID         uuid.UUID `json:"id"`
	ComplaintID uuid.UUID `json:"complaint_id"`
	CreatedBy  uuid.UUID `json:"created_by"`
	CreatorName string   `json:"creator_name"`
	Content    string    `json:"content"`
	IsInternal bool      `json:"is_internal"`
	CreatedAt  time.Time `json:"created_at"`
}

type AuditLogResponse struct {
	ID         uuid.UUID         `json:"id"`
	EntityType string            `json:"entity_type"`
	EntityID   uuid.UUID         `json:"entity_id"`
	Action     types.AuditAction `json:"action"`
	UserID     uuid.UUID         `json:"user_id"`
	UserName   string            `json:"user_name"`
	FieldName  *string           `json:"field_name,omitempty"`
	OldValue   *string           `json:"old_value,omitempty"`
	NewValue   *string           `json:"new_value,omitempty"`
	Metadata   *string           `json:"metadata,omitempty"`
	NoteID     *uuid.UUID        `json:"note_id,omitempty"`
	IsInternal *bool             `json:"is_internal,omitempty"`
	CreatedAt  time.Time         `json:"created_at"`
}

type UploadResponse struct {
	FileURL     string `json:"file_url"`
	FileHash    string `json:"file_hash"`
	Description string `json:"description"`
}
