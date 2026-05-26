package models

import (
	"time"

	"github.com/google/uuid"
)

type Batch struct {
	BaseModel
	ProductID   uuid.UUID   `gorm:"type:uuid;not null;index" json:"product_id"`
	Product     Product     `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	BatchNo     string      `gorm:"type:varchar(50);uniqueIndex;not null" json:"batch_no"`
	ProductionDate time.Time `json:"production_date"`
	ExpiryDate  time.Time   `json:"expiry_date"`
	Supplier    string      `gorm:"type:varchar(200)" json:"supplier"`
	TotalQty    float64     `gorm:"type:decimal(10,2);not null" json:"total_qty"`
	RemainingQty float64    `gorm:"type:decimal(10,2);not null" json:"remaining_qty"`
	CostPrice   float64     `gorm:"type:decimal(10,2);not null" json:"cost_price"`
	Status      string      `gorm:"type:varchar(20);default:active" json:"status"`
}
