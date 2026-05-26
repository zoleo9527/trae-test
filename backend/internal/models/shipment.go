package models

import (
	"time"

	"github.com/google/uuid"
)

type Shipment struct {
	BaseModel
	ShipmentNo   string       `gorm:"type:varchar(50);uniqueIndex;not null" json:"shipment_no"`
	AllocationID uuid.UUID    `gorm:"type:uuid;not null;uniqueIndex" json:"allocation_id"`
	Allocation   Allocation   `gorm:"foreignKey:AllocationID" json:"allocation,omitempty"`
	Status       string       `gorm:"type:varchar(20);not null;index;default:pending" json:"status"`
	TotalQty     float64      `gorm:"type:decimal(10,2);not null;default:0" json:"total_qty"`
	Shipper      string       `gorm:"type:varchar(200)" json:"shipper"`
	TrackingNo   string       `gorm:"type:varchar(100)" json:"tracking_no"`
	ShippedAt    *time.Time   `json:"shipped_at"`
	EstimatedArrival *time.Time `json:"estimated_arrival"`
	ReceivedAt   *time.Time   `json:"received_at"`
	ReceiverName string       `gorm:"type:varchar(100)" json:"receiver_name"`
	ReceiverPhone string      `gorm:"type:varchar(20)" json:"receiver_phone"`
	Remark       string       `gorm:"type:text" json:"remark"`
	ShipmentItems []ShipmentItem `json:"shipment_items,omitempty"`
	Reviews      []ShipmentReview `json:"reviews,omitempty"`
}

type ShipmentItem struct {
	BaseModel
	ShipmentID  uuid.UUID `gorm:"type:uuid;not null;index" json:"shipment_id"`
	ProductID   uuid.UUID `gorm:"type:uuid;not null;index" json:"product_id"`
	Product     Product   `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	BatchID     uuid.UUID `gorm:"type:uuid;not null;index" json:"batch_id"`
	Batch       Batch     `gorm:"foreignKey:BatchID" json:"batch,omitempty"`
	ExpectedQty float64   `gorm:"type:decimal(10,2);not null" json:"expected_qty"`
	ActualQty   float64   `gorm:"type:decimal(10,2);default:0" json:"actual_qty"`
	LossQty     float64   `gorm:"type:decimal(10,2);default:0" json:"loss_qty"`
	LossReason  string    `gorm:"type:varchar(500)" json:"loss_reason"`
	IsAbnormal  bool      `gorm:"default:false" json:"is_abnormal"`
	AbnormalRemark string `gorm:"type:varchar(500)" json:"abnormal_remark"`
}

type ShipmentReview struct {
	BaseModel
	ShipmentID  uuid.UUID `gorm:"type:uuid;not null;index" json:"shipment_id"`
	ReviewerID  uuid.UUID `gorm:"type:uuid;not null;index" json:"reviewer_id"`
	Reviewer    User      `gorm:"foreignKey:ReviewerID" json:"reviewer,omitempty"`
	Result      string    `gorm:"type:varchar(20);not null" json:"result"`
	TotalLossQty float64  `gorm:"type:decimal(10,2);default:0" json:"total_loss_qty"`
	TotalLossAmount float64 `gorm:"type:decimal(12,2);default:0" json:"total_loss_amount"`
	HasPriceIssue bool    `gorm:"default:false" json:"has_price_issue"`
	PriceIssueRemark string `gorm:"type:text" json:"price_issue_remark"`
	HasBatchIssue bool    `gorm:"default:false" json:"has_batch_issue"`
	BatchIssueRemark string `gorm:"type:text" json:"batch_issue_remark"`
	Remark      string    `gorm:"type:text" json:"remark"`
	ReviewedAt  time.Time `json:"reviewed_at"`
}
