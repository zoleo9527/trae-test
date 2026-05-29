package model

import (
	"time"
)

type EnquiryStatus string

const (
	EnquiryStatusDraft     EnquiryStatus = "draft"
	EnquiryStatusPending   EnquiryStatus = "pending"
	EnquiryStatusQuoted    EnquiryStatus = "quoted"
	EnquiryStatusConfirmed EnquiryStatus = "confirmed"
	EnquiryStatusCancelled EnquiryStatus = "cancelled"
	EnquiryStatusLocked    EnquiryStatus = "locked"
	EnquiryStatusCompleted EnquiryStatus = "completed"
)

type Customer struct {
	BaseModel
	Name         string `gorm:"size:100;not null" json:"name"`
	Phone        string `gorm:"size:20;index" json:"phone"`
	LicensePlate string `gorm:"size:20;index" json:"license_plate"`
	CarModel     string `gorm:"size:50" json:"car_model"`
	IsCredit     bool   `gorm:"default:false" json:"is_credit"`
	CreditDays   int    `gorm:"default:0" json:"credit_days"`
	CreatedByID  uint   `gorm:"index;not null" json:"created_by_id"`
	CreatedBy    *User  `gorm:"foreignKey:CreatedByID" json:"created_by,omitempty"`
	Remark       string `gorm:"type:text" json:"remark"`
}

type Enquiry struct {
	BaseModel
	EnquiryNo    string        `gorm:"size:30;uniqueIndex;not null" json:"enquiry_no"`
	CustomerID   uint          `gorm:"index;not null" json:"customer_id"`
	Customer     *Customer     `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
	CustomerName string        `gorm:"size:100" json:"customer_name"`
	LicensePlate string        `gorm:"size:20" json:"license_plate"`
	CarModel     string        `gorm:"size:50" json:"car_model"`
	Status       EnquiryStatus `gorm:"size:20;index;not null" json:"status"`
	Priority     int           `gorm:"default:1" json:"priority"`
	IsUrgent     bool          `gorm:"default:false" json:"is_urgent"`
	Items        []EnquiryItem `gorm:"foreignKey:EnquiryID" json:"items,omitempty"`
	Quotes       []Quote       `gorm:"foreignKey:EnquiryID" json:"quotes,omitempty"`
	LockOrders   []LockOrder   `gorm:"foreignKey:EnquiryID" json:"lock_orders,omitempty"`
	CreatedByID  uint          `gorm:"not null" json:"created_by_id"`
	CreatedBy    *User         `gorm:"foreignKey:CreatedByID" json:"created_by,omitempty"`
	Remark       string        `gorm:"type:text" json:"remark"`
	ExpireAt     *time.Time    `json:"expire_at"`
}

type EnquiryItem struct {
	BaseModel
	EnquiryID  uint    `gorm:"index;not null" json:"enquiry_id"`
	PartID     *uint   `gorm:"index" json:"part_id"`
	Part       *Part   `gorm:"foreignKey:PartID" json:"part,omitempty"`
	PartNumber string  `gorm:"size:50" json:"part_number"`
	PartName   string  `gorm:"size:100;not null" json:"part_name"`
	Brand      string  `gorm:"size:50" json:"brand"`
	Quantity   int     `gorm:"not null" json:"quantity"`
	UnitPrice  float64 `gorm:"type:decimal(10,2)" json:"unit_price"`
	Amount     float64 `gorm:"type:decimal(10,2)" json:"amount"`
	Remark     string  `gorm:"size:200" json:"remark"`
}
