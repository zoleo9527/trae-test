package model

import (
	"time"
)

type LockStatus string

const (
	LockStatusLocked    LockStatus = "locked"
	LockStatusReleased  LockStatus = "released"
	LockStatusPicked    LockStatus = "picked"
	LockStatusReturned  LockStatus = "returned"
	LockStatusCancelled LockStatus = "cancelled"
	LockStatusExpired   LockStatus = "expired"
)

type ReturnStatus string

const (
	ReturnStatusNone     ReturnStatus = "none"
	ReturnStatusPending  ReturnStatus = "pending"
	ReturnStatusApproved ReturnStatus = "approved"
	ReturnStatusRejected ReturnStatus = "rejected"
	ReturnStatusDone     ReturnStatus = "done"
)

type LockOrder struct {
	BaseModel
	LockNo       string      `gorm:"size:30;uniqueIndex;not null" json:"lock_no"`
	EnquiryID    uint        `gorm:"index;not null" json:"enquiry_id"`
	Enquiry      *Enquiry    `gorm:"foreignKey:EnquiryID" json:"enquiry,omitempty"`
	QuoteID      *uint       `gorm:"index" json:"quote_id"`
	Quote        *Quote      `gorm:"foreignKey:QuoteID" json:"quote,omitempty"`
	CustomerID   uint        `gorm:"index;not null" json:"customer_id"`
	Customer     *Customer   `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
	CustomerName string      `gorm:"size:100" json:"customer_name"`
	Status       LockStatus  `gorm:"size:20;index;not null" json:"status"`
	Items        []LockItem  `gorm:"foreignKey:LockOrderID" json:"items,omitempty"`
	TotalAmount  float64     `gorm:"type:decimal(12,2);not null" json:"total_amount"`
	ExpireAt     time.Time   `gorm:"not null" json:"expire_at"`
	CreatedByID  uint        `gorm:"not null" json:"created_by_id"`
	CreatedBy    *User       `gorm:"foreignKey:CreatedByID" json:"created_by,omitempty"`
	PickedByID   *uint       `gorm:"index" json:"picked_by_id"`
	PickedBy     *User       `gorm:"foreignKey:PickedByID" json:"picked_by,omitempty"`
	PickedAt     *time.Time  `json:"picked_at"`
	ReturnStatus ReturnStatus `gorm:"size:20;default:'none'" json:"return_status"`
	Remark       string      `gorm:"type:text" json:"remark"`
}

type LockItem struct {
	BaseModel
	LockOrderID  uint         `gorm:"index;not null" json:"lock_order_id"`
	QuoteItemID  uint         `gorm:"index" json:"quote_item_id"`
	PartID       uint         `gorm:"index;not null" json:"part_id"`
	Part         *Part        `gorm:"foreignKey:PartID" json:"part,omitempty"`
	PartNumber   string       `gorm:"size:50" json:"part_number"`
	PartName     string       `gorm:"size:100;not null" json:"part_name"`
	Brand        string       `gorm:"size:50" json:"brand"`
	Quantity     int          `gorm:"not null" json:"quantity"`
	LockedQty    int          `gorm:"not null" json:"locked_qty"`
	PickedQty    int          `gorm:"default:0" json:"picked_qty"`
	ReturnQty    int          `gorm:"default:0" json:"return_qty"`
	ReturnedQty  int          `gorm:"default:0" json:"returned_qty"`
	UnitPrice    float64      `gorm:"type:decimal(10,2);not null" json:"unit_price"`
	Amount       float64      `gorm:"type:decimal(10,2);not null" json:"amount"`
	Location     string       `gorm:"size:50" json:"location"`
	ReturnStatus ReturnStatus `gorm:"size:20;default:'none'" json:"return_status"`
	ReturnReason string       `gorm:"size:500" json:"return_reason"`
	Remark       string       `gorm:"size:200" json:"remark"`
}
