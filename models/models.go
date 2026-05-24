package models

import (
	"time"
)

type Role string

const (
	RoleManager     Role = "manager"
	RoleSalesperson Role = "salesperson"
	RoleAfterSales  Role = "after_sales"
)

type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Username  string    `gorm:"uniqueIndex;size:50;not null" json:"username"`
	Password  string    `gorm:"size:255;not null" json:"-"`
	Name      string    `gorm:"size:50;not null" json:"name"`
	Phone     string    `gorm:"size:20" json:"phone"`
	Role      Role      `gorm:"size:20;not null" json:"role"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Customer struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"size:50;not null" json:"name"`
	Phone       string    `gorm:"size:20;uniqueIndex;not null" json:"phone"`
	WechatID    string    `gorm:"size:50" json:"wechat_id"`
	Level       string    `gorm:"size:20;default:'normal'" json:"level"`
	TotalSpent  float64   `gorm:"default:0" json:"total_spent"`
	Remark      string    `gorm:"type:text" json:"remark"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Product struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	SKU             string    `gorm:"uniqueIndex;size:50;not null" json:"sku"`
	Name            string    `gorm:"size:100;not null" json:"name"`
	Category        string    `gorm:"size:30;not null" json:"category"`
	Material        string    `gorm:"size:30" json:"material"`
	Weight          float64   `json:"weight"`
	Price           float64   `gorm:"not null" json:"price"`
	Cost            float64   `json:"cost"`
	Status          string    `gorm:"size:20;default:'available'" json:"status"`
	Stock           int       `gorm:"default:0" json:"stock"`
	Description     string    `gorm:"type:text" json:"description"`
	ImageURL        string    `gorm:"size:500" json:"image_url"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type QuotationType string

const (
	QuotationTypeCustom  QuotationType = "custom"
	QuotationTypeTransfer QuotationType = "transfer"
	QuotationTypeRepair  QuotationType = "repair"
)

type QuotationStatus string

const (
	QuotationStatusDraft     QuotationStatus = "draft"
	QuotationStatusPending   QuotationStatus = "pending"
	QuotationStatusApproved  QuotationStatus = "approved"
	QuotationStatusRejected  QuotationStatus = "rejected"
	QuotationStatusRevising  QuotationStatus = "revising"
	QuotationStatusCompleted QuotationStatus = "completed"
)

type Quotation struct {
	ID              uint            `gorm:"primaryKey" json:"id"`
	QuotationNo     string          `gorm:"uniqueIndex;size:30;not null" json:"quotation_no"`
	Type            QuotationType   `gorm:"size:20;not null" json:"type"`
	Status          QuotationStatus `gorm:"size:20;not null;default:'draft'" json:"status"`
	CustomerID      uint            `json:"customer_id"`
	Customer        Customer        `json:"customer,omitempty"`
	ProductID       *uint           `json:"product_id"`
	Product         *Product        `json:"product,omitempty"`
	ProductName     string          `gorm:"size:100;not null" json:"product_name"`
	Description     string          `gorm:"type:text" json:"description"`
	Material        string          `gorm:"size:30" json:"material"`
	Weight          float64         `json:"weight"`
	EstimatedPrice  float64         `json:"estimated_price"`
	Cost            float64         `json:"cost"`
	Discount        float64         `gorm:"default:0" json:"discount"`
	FinalPrice      float64         `json:"final_price"`
	Deposit         float64         `gorm:"default:0" json:"deposit"`
	DeliveryDays    int             `json:"delivery_days"`
	EstimatedDate   *time.Time      `json:"estimated_date"`
	SalespersonID   uint            `json:"salesperson_id"`
	Salesperson     User            `gorm:"foreignKey:SalespersonID" json:"salesperson,omitempty"`
	CurrentApprover *uint           `json:"current_approver"`
	Approver        *User           `gorm:"foreignKey:CurrentApprover" json:"approver,omitempty"`
	Remark          string          `gorm:"type:text" json:"remark"`
	CreatedAt       time.Time       `json:"created_at"`
	UpdatedAt       time.Time       `json:"updated_at"`
}

type ApprovalRecord struct {
	ID          uint            `gorm:"primaryKey" json:"id"`
	QuotationID uint            `json:"quotation_id"`
	Quotation   Quotation       `json:"-"`
	ApproverID  uint            `json:"approver_id"`
	Approver    User            `gorm:"foreignKey:ApproverID" json:"approver,omitempty"`
	Action      string          `gorm:"size:20;not null" json:"action"`
	OldStatus   QuotationStatus `gorm:"size:20" json:"old_status"`
	NewStatus   QuotationStatus `gorm:"size:20" json:"new_status"`
	OldPrice    *float64        `json:"old_price"`
	NewPrice    *float64        `json:"new_price"`
	Comment     string          `gorm:"type:text" json:"comment"`
	CreatedAt   time.Time       `json:"created_at"`
}

type MaintenanceStatus string

const (
	MaintenanceStatusPending    MaintenanceStatus = "pending"
	MaintenanceStatusConfirmed  MaintenanceStatus = "confirmed"
	MaintenanceStatusInProgress MaintenanceStatus = "in_progress"
	MaintenanceStatusCompleted  MaintenanceStatus = "completed"
	MaintenanceStatusPickedUp   MaintenanceStatus = "picked_up"
	MaintenanceStatusCancelled  MaintenanceStatus = "cancelled"
)

type MaintenanceType string

const (
	MaintenanceTypeCleaning   MaintenanceType = "cleaning"
	MaintenanceTypePolishing  MaintenanceType = "polishing"
	MaintenanceTypeRepair     MaintenanceType = "repair"
	MaintenanceTypeResize     MaintenanceType = "resize"
	MaintenanceTypeStoneReset MaintenanceType = "stone_reset"
)

type Maintenance struct {
	ID              uint              `gorm:"primaryKey" json:"id"`
	MaintenanceNo   string            `gorm:"uniqueIndex;size:30;not null" json:"maintenance_no"`
	Type            MaintenanceType   `gorm:"size:20;not null" json:"type"`
	Status          MaintenanceStatus `gorm:"size:20;not null;default:'pending'" json:"status"`
	CustomerID      uint              `json:"customer_id"`
	Customer        Customer          `json:"customer,omitempty"`
	ProductID       *uint             `json:"product_id"`
	Product         *Product          `json:"product,omitempty"`
	ProductName     string            `gorm:"size:100;not null" json:"product_name"`
	Description     string            `gorm:"type:text" json:"description"`
	Issues          string            `gorm:"type:text" json:"issues"`
	EstimatedPrice  float64           `json:"estimated_price"`
	ActualPrice     float64           `json:"actual_price"`
	AppointmentDate *time.Time        `json:"appointment_date"`
	CompletedDate   *time.Time        `json:"completed_date"`
	PickupDate      *time.Time        `json:"pickup_date"`
	SalespersonID   uint              `json:"salesperson_id"`
	Salesperson     User              `gorm:"foreignKey:SalespersonID" json:"salesperson,omitempty"`
	HandlerID       *uint             `json:"handler_id"`
	Handler         *User             `gorm:"foreignKey:HandlerID" json:"handler,omitempty"`
	QuotationID     *uint             `json:"quotation_id"`
	Quotation       *Quotation        `json:"quotation,omitempty"`
	Remark          string            `gorm:"type:text" json:"remark"`
	CreatedAt       time.Time         `json:"created_at"`
	UpdatedAt       time.Time         `json:"updated_at"`
}

type AuditLog struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	Action        string    `gorm:"size:50;not null" json:"action"`
	Module        string    `gorm:"size:30;not null" json:"module"`
	RecordID      uint      `json:"record_id"`
	OperatorID    uint      `json:"operator_id"`
	OperatorName  string    `gorm:"size:50" json:"operator_name"`
	OldValues     string    `gorm:"type:text" json:"old_values"`
	NewValues     string    `gorm:"type:text" json:"new_values"`
	ChangedFields string    `gorm:"type:text" json:"changed_fields"`
	IPAddress     string    `gorm:"size:50" json:"ip_address"`
	UserAgent     string    `gorm:"size:500" json:"user_agent"`
	CreatedAt     time.Time `json:"created_at"`
}

type StatusHistory struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Module      string    `gorm:"size:30;not null" json:"module"`
	RecordID    uint      `json:"record_id"`
	OldStatus   string    `gorm:"size:20" json:"old_status"`
	NewStatus   string    `gorm:"size:20;not null" json:"new_status"`
	OperatorID  uint      `json:"operator_id"`
	OperatorName string   `gorm:"size:50" json:"operator_name"`
	Comment     string    `gorm:"type:text" json:"comment"`
	CreatedAt   time.Time `json:"created_at"`
}
