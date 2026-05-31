package model

import (
	"time"

	"github.com/google/uuid"
)

type DeliveryReceipt struct {
	ID            uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	ProjectID     uuid.UUID `gorm:"type:uuid;not null;index:idx_delivery_project" json:"project_id"`
	TeamID        uuid.UUID `gorm:"type:uuid;not null;index:idx_delivery_team" json:"team_id"`
	MaterialName  string    `gorm:"size:128;not null" json:"material_name"`
	Specification string    `gorm:"size:128" json:"specification"`
	Quantity      float64   `gorm:"type:numeric(10,2);not null;default:0" json:"quantity"`
	Unit          string    `gorm:"size:16;not null;default:'吨'" json:"unit"`
	DeliveryDate  time.Time `gorm:"type:date;not null" json:"delivery_date"`
	ReceivedBy    string    `gorm:"size:64" json:"received_by"`
	ReceiptStatus string    `gorm:"size:32;not null;default:'pending'" json:"receipt_status"`
	Remark        string    `gorm:"type:text" json:"remark"`
	CreatedBy     uuid.UUID `gorm:"type:uuid;not null" json:"created_by"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

func (DeliveryReceipt) TableName() string { return "delivery_receipts" }
