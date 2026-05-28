package model

import (
	"time"

	"gorm.io/gorm"
)

type RentalStatus string

const (
	RentalActive  RentalStatus = "active"
	RentalReturned RentalStatus = "returned"
	RentalOverdue RentalStatus = "overdue"
)

type DepositStatus string

const (
	DepositCollected       DepositStatus = "collected"
	DepositPartiallyRefunded DepositStatus = "partially_refunded"
	DepositFullyRefunded   DepositStatus = "fully_refunded"
	DepositForfeited       DepositStatus = "forfeited"
)

type Rental struct {
	ID               uint           `gorm:"primaryKey" json:"id"`
	InstrumentID     uint           `gorm:"not null;index" json:"instrument_id"`
	SchoolID         uint           `gorm:"not null;index" json:"school_id"`
	UserID           uint           `gorm:"not null;index" json:"user_id"`
	RentalDate       time.Time      `gorm:"not null" json:"rental_date"`
	ExpectedReturnDate time.Time    `gorm:"not null" json:"expected_return_date"`
	ActualReturnDate *time.Time     `json:"actual_return_date,omitempty"`
	Status           RentalStatus   `gorm:"size:20;not null;default:'active'" json:"status"`
	DepositAmount    float64        `gorm:"not null;default:0" json:"deposit_amount"`
	DepositStatus    DepositStatus  `gorm:"size:30;not null;default:'collected'" json:"deposit_status"`
	DailyRate        float64        `gorm:"not null;default:0" json:"daily_rate"`
	Notes            string         `gorm:"type:text" json:"notes,omitempty"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`

	Instrument Instrument `gorm:"foreignKey:InstrumentID" json:"instrument,omitempty"`
	School     School     `gorm:"foreignKey:SchoolID" json:"school,omitempty"`
	User       User       `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (Rental) TableName() string { return "rentals" }
