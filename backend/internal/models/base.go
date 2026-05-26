package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BaseModel struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

func (m *BaseModel) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

const (
	RoleManager  = "manager"
	RoleSales    = "sales"
	RoleWarehouse = "warehouse"

	OrderStatusDraft     = "draft"
	OrderStatusPending   = "pending"
	OrderStatusApproved  = "approved"
	OrderStatusAllocated = "allocated"
	OrderStatusShipped   = "shipped"
	OrderStatusCompleted = "completed"
	OrderStatusCancelled = "cancelled"
	OrderStatusRejected  = "rejected"

	AllocationStatusPending   = "pending"
	AllocationStatusPicking   = "picking"
	AllocationStatusPacked    = "packed"
	AllocationStatusShipped   = "shipped"
	AllocationStatusException = "exception"

	ShipmentStatusPending  = "pending"
	ShipmentStatusReviewing = "reviewing"
	ShipmentStatusAccepted = "accepted"
	ShipmentStatusDisputed = "disputed"
	ShipmentStatusResolved = "resolved"

	ReviewResultAccepted = "accepted"
	ReviewResultPartial  = "partial"
	ReviewResultRejected = "rejected"

	TaskStatusPending  = "pending"
	TaskStatusRunning  = "running"
	TaskStatusDone     = "done"
	TaskStatusFailed   = "failed"
	TaskStatusCanceled = "canceled"

	TaskTypeExportOrders    = "export_orders"
	TaskTypeExportShipments = "export_shipments"
	TaskTypeSyncInventory   = "sync_inventory"

	ApprovalStatusPending  = "pending"
	ApprovalStatusApproved = "approved"
	ApprovalStatusRejected = "rejected"
)
