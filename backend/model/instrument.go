package model

import (
	"time"

	"gorm.io/gorm"
)

type InstrumentStatus string

const (
	InstrumentAvailable   InstrumentStatus = "available"
	InstrumentRented      InstrumentStatus = "rented"
	InstrumentMaintenance InstrumentStatus = "maintenance"
	InstrumentRetired     InstrumentStatus = "retired"
)

type Instrument struct {
	ID              uint             `gorm:"primaryKey" json:"id"`
	Name            string           `gorm:"size:200;not null" json:"name"`
	Type            string           `gorm:"size:100;not null" json:"type"`
	Brand           string           `gorm:"size:100" json:"brand"`
	Model           string           `gorm:"size:100" json:"model"`
	SerialNumber    string           `gorm:"uniqueIndex;size:100;not null" json:"serial_number"`
	Status          InstrumentStatus `gorm:"size:20;not null;default:'available'" json:"status"`
	PurchaseDate    *time.Time       `json:"purchase_date,omitempty"`
	PurchasePrice   float64          `json:"purchase_price"`
	DailyRentalRate float64          `gorm:"not null;default:0" json:"daily_rental_rate"`
	DepositAmount   float64          `gorm:"not null;default:0" json:"deposit_amount"`
	ImageURL        string           `gorm:"size:500" json:"image_url,omitempty"`
	Notes           string           `gorm:"type:text" json:"notes,omitempty"`
	CreatedAt       time.Time        `json:"created_at"`
	UpdatedAt       time.Time        `json:"updated_at"`
	DeletedAt       gorm.DeletedAt   `gorm:"index" json:"-"`
}

func (Instrument) TableName() string { return "instruments" }
