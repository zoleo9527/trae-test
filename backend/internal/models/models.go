package models

import (
	"time"

	"gorm.io/gorm"
)

type UserRole string

const (
	RoleStoreManager UserRole = "store_manager"
	RolePhotographer UserRole = "photographer"
	RoleSelector     UserRole = "selector"
	RoleButler       UserRole = "butler"
)

type CostumeStatus string

const (
	CostumeStatusAvailable CostumeStatus = "available"
	CostumeStatusReserved  CostumeStatus = "reserved"
	CostumeStatusLent      CostumeStatus = "lent"
	CostumeStatusCleaning  CostumeStatus = "cleaning"
	CostumeStatusRepairing CostumeStatus = "repairing"
	CostumeStatusRetired   CostumeStatus = "retired"
)

type DispatchStatus string

const (
	DispatchStatusPending    DispatchStatus = "pending"
	DispatchStatusConfirmed  DispatchStatus = "confirmed"
	DispatchStatusPickedUp   DispatchStatus = "picked_up"
	DispatchStatusReturned   DispatchStatus = "returned"
	DispatchStatusCancelled  DispatchStatus = "cancelled"
	DispatchStatusRescheduled DispatchStatus = "rescheduled"
)

type MaintenanceType string

const (
	MaintenanceCleaning MaintenanceType = "cleaning"
	MaintenanceRepair   MaintenanceType = "repair"
	MaintenanceInspect  MaintenanceType = "inspect"
)

type MaintenanceStatus string

const (
	MaintenanceStatusPending MaintenanceStatus = "pending"
	MaintenanceStatusDoing   MaintenanceStatus = "doing"
	MaintenanceStatusDone    MaintenanceStatus = "done"
)

type ScheduleStatus string

const (
	ScheduleStatusPending    ScheduleStatus = "pending"
	ScheduleStatusConfirmed  ScheduleStatus = "confirmed"
	ScheduleStatusCompleted  ScheduleStatus = "completed"
	ScheduleStatusCancelled  ScheduleStatus = "cancelled"
	ScheduleStatusRescheduled ScheduleStatus = "rescheduled"
)

type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"not null" json:"name"`
	Phone     string         `gorm:"unique;not null" json:"phone"`
	Password  string         `gorm:"not null" json:"-"`
	Role      UserRole       `gorm:"not null" json:"role"`
	StoreID   *uint          `json:"store_id,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type Customer struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Name        string         `gorm:"not null" json:"name"`
	Phone       string         `gorm:"unique;not null" json:"phone"`
	WeddingDate *time.Time     `json:"wedding_date"`
	StoreID     *uint          `json:"store_id,omitempty"`
	Remark      string         `gorm:"type:text" json:"remark"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

type Costume struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	Name           string         `gorm:"not null" json:"name"`
	Category       string         `gorm:"not null" json:"category"`
	Style          string         `json:"style"`
	Size           string         `gorm:"not null" json:"size"`
	Color          string         `json:"color"`
	Brand          string         `json:"brand"`
	PurchasePrice  float64        `json:"purchase_price"`
	RentalPrice    float64        `json:"rental_price"`
	Status         CostumeStatus  `gorm:"not null;default:'available'" json:"status"`
	TotalUseCount  int            `gorm:"default:0" json:"total_use_count"`
	LastUsedAt     *time.Time     `json:"last_used_at"`
	StoreID        *uint          `json:"store_id,omitempty"`
	Remark         string         `gorm:"type:text" json:"remark"`
	ImageURL       string         `json:"image_url"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}

type Schedule struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	CustomerID     uint           `gorm:"not null" json:"customer_id"`
	Customer       Customer       `json:"customer"`
	ScheduleDate   time.Time      `gorm:"not null" json:"schedule_date"`
	TimeSlot       string         `gorm:"not null" json:"time_slot"`
	Type           string         `gorm:"not null" json:"type"`
	Status         ScheduleStatus `gorm:"not null;default:'pending'" json:"status"`
	StoreID        *uint          `json:"store_id,omitempty"`
	AssignedToID   *uint          `json:"assigned_to_id"`
	AssignedTo     *User          `json:"assigned_to"`
	ButlerID       *uint          `json:"butler_id"`
	Butler         *User          `json:"butler"`
	SelectorID     *uint          `json:"selector_id"`
	Selector       *User          `json:"selector"`
	Remark         string         `gorm:"type:text" json:"remark"`
	DepositAmount  float64        `json:"deposit_amount"`
	TotalAmount    float64        `json:"total_amount"`
	IsPaid         bool           `gorm:"default:false" json:"is_paid"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}

type CostumeDispatch struct {
	ID               uint           `gorm:"primaryKey" json:"id"`
	ScheduleID       uint           `gorm:"not null" json:"schedule_id"`
	Schedule         Schedule       `json:"schedule"`
	CostumeID        uint           `gorm:"not null" json:"costume_id"`
	Costume          Costume        `json:"costume"`
	CustomerID       uint           `gorm:"not null" json:"customer_id"`
	Customer         Customer       `json:"customer"`
	Status           DispatchStatus `gorm:"not null;default:'pending'" json:"status"`
	ExpectedPickupAt *time.Time     `json:"expected_pickup_at"`
	ActualPickupAt   *time.Time     `json:"actual_pickup_at"`
	ExpectedReturnAt *time.Time     `json:"expected_return_at"`
	ActualReturnAt   *time.Time     `json:"actual_return_at"`
	PickedUpByID     *uint          `json:"picked_up_by_id"`
	PickedUpBy       *User          `json:"picked_up_by"`
	ReturnedByID     *uint          `json:"returned_by_id"`
	ReturnedBy       *User          `json:"returned_by"`
	StoreID          *uint          `json:"store_id,omitempty"`
	DamageRemark     string         `gorm:"type:text" json:"damage_remark"`
	Accessories      string         `gorm:"type:text" json:"accessories"`
	Remark           string         `gorm:"type:text" json:"remark"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`
}

type MaintenanceRecord struct {
	ID                uint              `gorm:"primaryKey" json:"id"`
	CostumeID         uint              `gorm:"not null" json:"costume_id"`
	Costume           Costume           `json:"costume"`
	CostumeDispatchID *uint             `json:"costume_dispatch_id"`
	CostumeDispatch   *CostumeDispatch  `json:"costume_dispatch"`
	Type              MaintenanceType   `gorm:"not null" json:"type"`
	Status            MaintenanceStatus `gorm:"not null;default:'pending'" json:"status"`
	Description       string            `gorm:"type:text;not null" json:"description"`
	Cost              float64           `json:"cost"`
	StartedAt         *time.Time        `json:"started_at"`
	CompletedAt       *time.Time        `json:"completed_at"`
	HandledByID       *uint             `json:"handled_by_id"`
	HandledBy         *User             `json:"handled_by"`
	StoreID           *uint             `json:"store_id,omitempty"`
	BeforeImageURL    string            `json:"before_image_url"`
	AfterImageURL     string            `json:"after_image_url"`
	Remark            string            `gorm:"type:text" json:"remark"`
	CreatedAt         time.Time         `json:"created_at"`
	UpdatedAt         time.Time         `json:"updated_at"`
	DeletedAt         gorm.DeletedAt    `gorm:"index" json:"-"`
}

type OperationLog struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	UserID        *uint     `json:"user_id"`
	User          *User     `json:"user"`
	Action        string    `gorm:"not null" json:"action"`
	ResourceType  string    `gorm:"not null" json:"resource_type"`
	ResourceID    *uint     `json:"resource_id"`
	OldValue      string    `gorm:"type:text" json:"old_value"`
	NewValue      string    `gorm:"type:text" json:"new_value"`
	Remark        string    `gorm:"type:text" json:"remark"`
	IPAddress     string    `json:"ip_address"`
	StoreID       *uint     `json:"store_id,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
}
