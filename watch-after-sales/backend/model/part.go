package model

import (
	"time"

	"gorm.io/gorm"
)

type Part struct {
	ID             uint           `gorm:"primarykey" json:"id"`
	Name           string         `gorm:"size:100;not null" json:"name"`
	Sku            string         `gorm:"uniqueIndex;size:50;not null" json:"sku"`
	Quantity       int            `gorm:"not null;default:0" json:"quantity"`
	LockedQuantity int            `gorm:"not null;default:0" json:"locked_quantity"`
	MinQuantity    int            `gorm:"not null;default:0" json:"min_quantity"`
	UnitPrice      float64        `gorm:"type:decimal(10,2);not null;default:0" json:"unit_price"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}

func (p *Part) AvailableQuantity() int {
	return p.Quantity - p.LockedQuantity
}
