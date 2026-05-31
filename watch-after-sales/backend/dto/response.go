package dto

import "time"

type LoginResponse struct {
	Token     string       `json:"token"`
	ExpiresAt time.Time    `json:"expires_at"`
	User      UserResponse `json:"user"`
}

type UserResponse struct {
	ID          uint   `json:"id"`
	Username    string `json:"username"`
	Role        string `json:"role"`
	DisplayName string `json:"display_name"`
}

type CustomerResponse struct {
	ID        uint      `json:"id"`
	Name      string    `json:"name"`
	Phone     string    `json:"phone"`
	Email     string    `json:"email"`
	Address   string    `json:"address"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type RepairOrderResponse struct {
	ID                   uint               `json:"id"`
	OrderNo              string             `json:"order_no"`
	CustomerID           uint               `json:"customer_id"`
	Customer             *CustomerResponse  `json:"customer,omitempty"`
	WatchBrand           string             `json:"watch_brand"`
	WatchModel           string             `json:"watch_model"`
	WatchSerial          string             `json:"watch_serial"`
	IssueDescription     string             `json:"issue_description"`
	Status               string             `json:"status"`
	AssignedTechnicianID *uint              `json:"assigned_technician_id"`
	AssignedTechnician   *UserResponse      `json:"assigned_technician,omitempty"`
	QuotationPrice       *float64           `json:"quotation_price"`
	QuotationNote        *string            `json:"quotation_note"`
	EstimatedCompletion  *time.Time         `json:"estimated_completion"`
	CompletedAt          *time.Time         `json:"completed_at"`
	PickedUpAt           *time.Time         `json:"picked_up_at"`
	CreatedBy            uint               `json:"created_by"`
	Creator              *UserResponse      `json:"creator,omitempty"`
	CreatedAt            time.Time          `json:"created_at"`
	UpdatedAt            time.Time          `json:"updated_at"`
	ProgressLogs         []ProgressLogResponse `json:"progress_logs,omitempty"`
	PartLocks            []PartLockResponse    `json:"part_locks,omitempty"`
}

type PartResponse struct {
	ID                uint      `json:"id"`
	Name              string    `json:"name"`
	Sku               string    `json:"sku"`
	Quantity          int       `json:"quantity"`
	LockedQuantity    int       `json:"locked_quantity"`
	AvailableQuantity int       `json:"available_quantity"`
	MinQuantity       int       `json:"min_quantity"`
	UnitPrice         float64   `json:"unit_price"`
	IsLowStock        bool      `json:"is_low_stock"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

type PartLockResponse struct {
	ID            uint           `json:"id"`
	RepairOrderID uint          `json:"repair_order_id"`
	PartID        uint          `json:"part_id"`
	PartName      string        `json:"part_name,omitempty"`
	Quantity      int           `json:"quantity"`
	LockedBy      uint          `json:"locked_by"`
	LockedByName  string        `json:"locked_by_name,omitempty"`
	LockedAt      time.Time     `json:"locked_at"`
	ReleasedAt    *time.Time    `json:"released_at"`
}

type ProgressLogResponse struct {
	ID            uint      `json:"id"`
	RepairOrderID uint     `json:"repair_order_id"`
	StatusFrom    string    `json:"status_from"`
	StatusTo      string    `json:"status_to"`
	Note          string    `json:"note"`
	OperatorID    uint      `json:"operator_id"`
	OperatorName  string    `json:"operator_name,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
}

type AuditLogResponse struct {
	ID           uint                  `json:"id"`
	EntityType   string                `json:"entity_type"`
	EntityID     uint                  `json:"entity_id"`
	Action       string                `json:"action"`
	OldValue     map[string]interface{} `json:"old_value"`
	NewValue     map[string]interface{} `json:"new_value"`
	OperatorID   uint                  `json:"operator_id"`
	OperatorName string                `json:"operator_name"`
	CreatedAt    time.Time             `json:"created_at"`
}

type CallbackResponse struct {
	ID            uint              `json:"id"`
	RepairOrderID uint              `json:"repair_order_id"`
	CallbackType  string            `json:"callback_type"`
	ScheduledAt   time.Time         `json:"scheduled_at"`
	CompletedAt   *time.Time        `json:"completed_at"`
	Result        *string           `json:"result"`
	Note          *string           `json:"note"`
	OperatorID    uint              `json:"operator_id"`
	IsOverdue     bool              `json:"is_overdue"`
	CreatedAt     time.Time         `json:"created_at"`
	UpdatedAt     time.Time         `json:"updated_at"`
}

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"page_size"`
	TotalPages int         `json:"total_pages"`
}
