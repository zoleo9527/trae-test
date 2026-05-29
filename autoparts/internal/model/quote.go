package model

import (
	"time"
)

type QuoteStatus string

const (
	QuoteStatusDraft     QuoteStatus = "draft"
	QuoteStatusPending   QuoteStatus = "pending"
	QuoteStatusAccepted  QuoteStatus = "accepted"
	QuoteStatusRejected  QuoteStatus = "rejected"
	QuoteStatusExpired   QuoteStatus = "expired"
	QuoteStatusCancelled QuoteStatus = "cancelled"
)

type Quote struct {
	BaseModel
	QuoteNo      string      `gorm:"size:30;uniqueIndex;not null" json:"quote_no"`
	EnquiryID    uint        `gorm:"index;not null" json:"enquiry_id"`
	Enquiry      *Enquiry    `gorm:"foreignKey:EnquiryID" json:"enquiry,omitempty"`
	CustomerID   uint        `gorm:"index;not null" json:"customer_id"`
	Customer     *Customer   `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
	CustomerName string      `gorm:"size:100" json:"customer_name"`
	Status       QuoteStatus `gorm:"size:20;index;not null" json:"status"`
	Items        []QuoteItem `gorm:"foreignKey:QuoteID" json:"items,omitempty"`
	TotalAmount  float64     `gorm:"type:decimal(12,2);not null" json:"total_amount"`
	Discount     float64     `gorm:"type:decimal(10,2);default:0" json:"discount"`
	FinalAmount  float64     `gorm:"type:decimal(12,2);not null" json:"final_amount"`
	ValidDays    int         `gorm:"default:7" json:"valid_days"`
	ExpireAt     time.Time   `gorm:"not null" json:"expire_at"`
	CreatedByID  uint        `gorm:"not null" json:"created_by_id"`
	CreatedBy    *User       `gorm:"foreignKey:CreatedByID" json:"created_by,omitempty"`
	ReviewedByID *uint       `gorm:"index" json:"reviewed_by_id"`
	ReviewedBy   *User       `gorm:"foreignKey:ReviewedByID" json:"reviewed_by,omitempty"`
	ReviewedAt   *time.Time  `json:"reviewed_at"`
	Remark       string      `gorm:"type:text" json:"remark"`
	RejectReason string      `gorm:"size:500" json:"reject_reason"`
}

type QuoteItem struct {
	BaseModel
	QuoteID    uint    `gorm:"index;not null" json:"quote_id"`
	EnquiryItemID uint `gorm:"index" json:"enquiry_item_id"`
	PartID     *uint   `gorm:"index" json:"part_id"`
	Part       *Part   `gorm:"foreignKey:PartID" json:"part,omitempty"`
	PartNumber string  `gorm:"size:50" json:"part_number"`
	PartName   string  `gorm:"size:100;not null" json:"part_name"`
	Brand      string  `gorm:"size:50" json:"brand"`
	Quantity   int     `gorm:"not null" json:"quantity"`
	CostPrice  float64 `gorm:"type:decimal(10,2);not null" json:"cost_price"`
	QuotePrice float64 `gorm:"type:decimal(10,2);not null" json:"quote_price"`
	Amount     float64 `gorm:"type:decimal(10,2);not null" json:"amount"`
	IsStock    bool    `gorm:"default:true" json:"is_stock"`
	StockQty   int     `gorm:"default:0" json:"stock_qty"`
	Remark     string  `gorm:"size:200" json:"remark"`
}
