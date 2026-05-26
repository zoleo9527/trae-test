package models

import (
	"time"

	"github.com/google/uuid"
)

type Order struct {
	BaseModel
	OrderNo      string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"order_no"`
	StoreID      uuid.UUID `gorm:"type:uuid;not null;index" json:"store_id"`
	Store        Store     `gorm:"foreignKey:StoreID" json:"store,omitempty"`
	SalesID      uuid.UUID `gorm:"type:uuid;not null;index" json:"sales_id"`
	Sales        User      `gorm:"foreignKey:SalesID" json:"sales,omitempty"`
	Status       string    `gorm:"type:varchar(20);not null;index;default:draft" json:"status"`
	TotalAmount  float64   `gorm:"type:decimal(12,2);not null;default:0" json:"total_amount"`
	DiscountAmount float64  `gorm:"type:decimal(12,2);default:0" json:"discount_amount"`
	FinalAmount  float64   `gorm:"type:decimal(12,2);not null;default:0" json:"final_amount"`
	Remark       string    `gorm:"type:text" json:"remark"`
	IsActivity   bool      `gorm:"default:false" json:"is_activity"`
	ActivityName string    `gorm:"type:varchar(200)" json:"activity_name"`
	PriceApprovalID *uuid.UUID `gorm:"type:uuid" json:"price_approval_id"`
	PriceApproval *PriceApproval `gorm:"foreignKey:PriceApprovalID" json:"price_approval,omitempty"`
	ExpectedDate time.Time `json:"expected_date"`
	ApprovedAt   *time.Time `json:"approved_at"`
	ApprovedBy   *uuid.UUID `json:"approved_by"`
	OrderItems   []OrderItem `json:"order_items,omitempty"`
	Allocations  []Allocation `json:"allocations,omitempty"`
}

type OrderItem struct {
	BaseModel
	OrderID      uuid.UUID `gorm:"type:uuid;not null;index" json:"order_id"`
	ProductID    uuid.UUID `gorm:"type:uuid;not null;index" json:"product_id"`
	Product      Product   `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	Quantity     float64   `gorm:"type:decimal(10,2);not null" json:"quantity"`
	UnitPrice    float64   `gorm:"type:decimal(10,2);not null" json:"unit_price"`
	OriginalPrice float64  `gorm:"type:decimal(10,2);not null" json:"original_price"`
	DiscountRate float64   `gorm:"type:decimal(5,2);default:0" json:"discount_rate"`
	Subtotal     float64   `gorm:"type:decimal(12,2);not null" json:"subtotal"`
	Remark       string    `gorm:"type:varchar(500)" json:"remark"`
}
