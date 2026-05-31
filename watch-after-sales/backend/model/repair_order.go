package model

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

type OrderStatus string

const (
	StatusRegistered OrderStatus = "registered"
	StatusDiagnosing OrderStatus = "diagnosing"
	StatusQuoted     OrderStatus = "quoted"
	StatusConfirmed  OrderStatus = "confirmed"
	StatusRepairing  OrderStatus = "repairing"
	StatusCompleted  OrderStatus = "completed"
	StatusPickedUp   OrderStatus = "picked_up"
)

var AllowedTransitions = map[OrderStatus][]OrderStatus{
	StatusRegistered: {StatusDiagnosing},
	StatusDiagnosing: {StatusQuoted},
	StatusQuoted:     {StatusConfirmed, StatusRegistered},
	StatusConfirmed:  {StatusRepairing},
	StatusRepairing:  {StatusCompleted},
	StatusCompleted:  {StatusPickedUp},
	StatusPickedUp:   {},
}

var StatusTransitionRoles = map[OrderStatus][]Role{
	StatusDiagnosing: {RoleTechnician},
	StatusQuoted:     {RoleConsultant, RoleManager},
	StatusConfirmed:  {RoleConsultant, RoleManager},
	StatusRegistered: {RoleConsultant, RoleManager},
	StatusRepairing:  {RoleTechnician},
	StatusCompleted:  {RoleTechnician},
	StatusPickedUp:   {RoleConsultant, RoleManager},
}

type RepairOrder struct {
	ID                   uint           `gorm:"primarykey" json:"id"`
	OrderNo              string         `gorm:"uniqueIndex;size:20;not null" json:"order_no"`
	CustomerID           uint           `gorm:"not null;index" json:"customer_id"`
	Customer             Customer       `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
	WatchBrand           string         `gorm:"size:100;not null" json:"watch_brand"`
	WatchModel           string         `gorm:"size:100;not null" json:"watch_model"`
	WatchSerial          string         `gorm:"size:100" json:"watch_serial"`
	IssueDescription     string         `gorm:"type:text;not null" json:"issue_description"`
	Status               OrderStatus    `gorm:"size:20;not null;index;default:registered" json:"status"`
	AssignedTechnicianID *uint          `gorm:"index" json:"assigned_technician_id"`
	AssignedTechnician   *User          `gorm:"foreignKey:AssignedTechnicianID" json:"assigned_technician,omitempty"`
	QuotationPrice       *float64       `gorm:"type:decimal(10,2)" json:"quotation_price"`
	QuotationNote        *string        `gorm:"type:text" json:"quotation_note"`
	EstimatedCompletion  *time.Time     `json:"estimated_completion"`
	CompletedAt          *time.Time     `json:"completed_at"`
	PickedUpAt           *time.Time     `json:"picked_up_at"`
	CreatedBy            uint           `gorm:"not null;index" json:"created_by"`
	Creator              User           `gorm:"foreignKey:CreatedBy" json:"creator,omitempty"`
	ProgressLogs         []ProgressLog  `gorm:"foreignKey:RepairOrderID" json:"progress_logs,omitempty"`
	PartLocks            []PartLock     `gorm:"foreignKey:RepairOrderID" json:"part_locks,omitempty"`
	CreatedAt            time.Time      `json:"created_at"`
	UpdatedAt            time.Time      `json:"updated_at"`
	DeletedAt            gorm.DeletedAt `gorm:"index" json:"-"`
}

func (r *RepairOrder) BeforeCreate(tx *gorm.DB) error {
	if r.OrderNo != "" {
		return nil
	}

	var count int64
	tx.Model(&RepairOrder{}).Count(&count)

	r.OrderNo = fmt.Sprintf("WX%s%03d", time.Now().Format("20060102"), count+1)

	var existing RepairOrder
	for {
		if err := tx.Where("order_no = ?", r.OrderNo).First(&existing).Error; err != nil {
			break
		}
		count++
		r.OrderNo = fmt.Sprintf("WX%s%03d", time.Now().Format("20060102"), count+1)
	}

	return nil
}
