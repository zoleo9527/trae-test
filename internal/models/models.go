package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"water-delivery-service/pkg/types"
)

type BaseModel struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (m *BaseModel) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

type WaterStation struct {
	BaseModel
	Name      string     `gorm:"size:100;not null" json:"name"`
	Address   string     `gorm:"size:255" json:"address"`
	Phone     string     `gorm:"size:20" json:"phone"`
	ManagerID *uuid.UUID `gorm:"type:uuid" json:"manager_id"`
}

type User struct {
	BaseModel
	Username     string        `gorm:"uniqueIndex;size:50;not null" json:"username"`
	PasswordHash string        `gorm:"size:255;not null" json:"-"`
	FullName     string        `gorm:"size:100;not null" json:"full_name"`
	Phone        string        `gorm:"size:20" json:"phone"`
	Role         types.Role    `gorm:"size:30;not null;index" json:"role"`
	StationID    *uuid.UUID    `gorm:"type:uuid" json:"station_id,omitempty"`
	IsActive     bool          `gorm:"default:true" json:"is_active"`
}

type Customer struct {
	BaseModel
	Name            string    `gorm:"size:100;not null" json:"name"`
	Phone           string    `gorm:"size:20;index;not null" json:"phone"`
	Address         string    `gorm:"size:255" json:"address"`
	EmptyBuckets    int       `gorm:"default:0" json:"empty_buckets"`
	TotalDeliveries int       `gorm:"default:0" json:"total_deliveries"`
	StationID       uuid.UUID `gorm:"type:uuid;not null;index" json:"station_id"`
}

type DeliveryOrder struct {
	BaseModel
	CustomerID        uuid.UUID  `gorm:"type:uuid;not null;index" json:"customer_id"`
	StationID         uuid.UUID  `gorm:"type:uuid;not null;index" json:"station_id"`
	DriverID          *uuid.UUID `gorm:"type:uuid;index" json:"driver_id,omitempty"`
	WaterAmount       int        `gorm:"not null" json:"water_amount"`
	EmptyBucketReturn int        `gorm:"default:0" json:"empty_bucket_return"`
	ScheduledAt       time.Time  `json:"scheduled_at"`
	DeliveredAt       *time.Time `json:"delivered_at,omitempty"`
	Status            string     `gorm:"size:30;index" json:"status"`
	PhotoURL          *string    `gorm:"size:255" json:"photo_url,omitempty"`
}

type Complaint struct {
	BaseModel
	CustomerID      uuid.UUID              `gorm:"type:uuid;not null;index" json:"customer_id"`
	StationID       uuid.UUID              `gorm:"type:uuid;not null;index" json:"station_id"`
	OrderID         *uuid.UUID             `gorm:"type:uuid;index" json:"order_id,omitempty"`
	Type            types.ComplaintType    `gorm:"size:50;not null;index" json:"type"`
	Status          types.ComplaintStatus  `gorm:"size:30;not null;index;default:pending" json:"status"`
	Priority        int                    `gorm:"default:1;index" json:"priority"`
	Title           string                 `gorm:"size:200;not null" json:"title"`
	Description     string                 `gorm:"type:text" json:"description"`
	EmptyBucketDiff *int                   `json:"empty_bucket_diff,omitempty"`
	AssignedTo      *uuid.UUID             `gorm:"type:uuid;index" json:"assigned_to,omitempty"`
	ReportedBy      uuid.UUID              `gorm:"type:uuid;not null" json:"reported_by"`
	ResolvedAt      *time.Time             `json:"resolved_at,omitempty"`
}

type Redelivery struct {
	BaseModel
	ComplaintID       uuid.UUID              `gorm:"type:uuid;not null;index" json:"complaint_id"`
	DriverID          *uuid.UUID             `gorm:"type:uuid;index" json:"driver_id,omitempty"`
	StationID         uuid.UUID              `gorm:"type:uuid;not null;index" json:"station_id"`
	WaterAmount       int                    `gorm:"not null" json:"water_amount"`
	EmptyBucketAdjust int                    `gorm:"default:0" json:"empty_bucket_adjust"`
	Status            types.RedeliveryStatus `gorm:"size:30;not null;index;default:scheduled" json:"status"`
	ScheduledAt       time.Time              `json:"scheduled_at"`
	DeliveredAt       *time.Time             `json:"delivered_at,omitempty"`
	PhotoURL          *string                `gorm:"size:255" json:"photo_url,omitempty"`
	Notes             string                 `gorm:"type:text" json:"notes"`
}

type Compensation struct {
	BaseModel
	ComplaintID uuid.UUID                `gorm:"type:uuid;not null;index" json:"complaint_id"`
	StationID   uuid.UUID                `gorm:"type:uuid;not null;index" json:"station_id"`
	Type        types.CompensationType   `gorm:"size:30;not null" json:"type"`
	Amount      float64                  `gorm:"default:0" json:"amount"`
	WaterAmount int                      `gorm:"default:0" json:"water_amount"`
	Status      types.CompensationStatus `gorm:"size:30;not null;index;default:pending" json:"status"`
	Description string                   `gorm:"type:text" json:"description"`
	ApprovedBy  *uuid.UUID               `gorm:"type:uuid;index" json:"approved_by,omitempty"`
	ApprovedAt  *time.Time               `json:"approved_at,omitempty"`
	PaidAt      *time.Time               `json:"paid_at,omitempty"`
}

type ComplaintPhoto struct {
	BaseModel
	ComplaintID uuid.UUID  `gorm:"type:uuid;not null;index" json:"complaint_id"`
	UploadedBy  uuid.UUID  `gorm:"type:uuid;not null" json:"uploaded_by"`
	FileURL     string     `gorm:"size:500;not null" json:"file_url"`
	FileHash    string     `gorm:"size:64;index" json:"file_hash"`
	FileSize    int64      `json:"file_size"`
	Description string     `gorm:"size:255" json:"description"`
	Verified    bool       `gorm:"default:false" json:"verified"`
	VerifiedAt  *time.Time `json:"verified_at,omitempty"`
}

type ComplaintNote struct {
	BaseModel
	ComplaintID uuid.UUID `gorm:"type:uuid;not null;index" json:"complaint_id"`
	CreatedBy   uuid.UUID `gorm:"type:uuid;not null" json:"created_by"`
	Content     string    `gorm:"type:text;not null" json:"content"`
	IsInternal  bool      `gorm:"default:false;index" json:"is_internal"`
}

type AuditLog struct {
	BaseModel
	EntityType string            `gorm:"size:50;not null;index" json:"entity_type"`
	EntityID   uuid.UUID         `gorm:"type:uuid;not null;index" json:"entity_id"`
	Action     types.AuditAction `gorm:"size:30;not null;index" json:"action"`
	UserID     uuid.UUID         `gorm:"type:uuid;not null;index" json:"user_id"`
	FieldName  *string           `gorm:"size:50" json:"field_name,omitempty"`
	OldValue   *string           `gorm:"type:text" json:"old_value,omitempty"`
	NewValue   *string           `gorm:"type:text" json:"new_value,omitempty"`
	Metadata   *string           `gorm:"type:text" json:"metadata,omitempty"`
}

type AsyncTask struct {
	BaseModel
	Type        types.TaskType   `gorm:"size:50;not null;index" json:"type"`
	Status      types.TaskStatus `gorm:"size:30;not null;index;default:pending" json:"status"`
	Payload     string           `gorm:"type:text" json:"payload"`
	Result      *string          `gorm:"type:text" json:"result,omitempty"`
	Error       *string          `gorm:"type:text" json:"error,omitempty"`
	RetryCount  int              `gorm:"default:0" json:"retry_count"`
	MaxRetries  int              `gorm:"default:3" json:"max_retries"`
	ExecutedAt  *time.Time       `json:"executed_at,omitempty"`
	CompletedAt *time.Time       `json:"completed_at,omitempty"`
}
