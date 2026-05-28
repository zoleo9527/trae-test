package model

import (
	"time"

	"gorm.io/gorm"
)

type PaymentStatus string

const (
	PaymentPending PaymentStatus = "pending"
	PaymentPaid    PaymentStatus = "paid"
	PaymentOverdue PaymentStatus = "overdue"
	PaymentPartial PaymentStatus = "partial"
)

type Payment struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	SchoolID      uint           `gorm:"not null;index" json:"school_id"`
	RentalID      uint           `gorm:"not null;index" json:"rental_id"`
	Amount        float64        `gorm:"not null;default:0" json:"amount"`
	PaidAmount    float64        `gorm:"not null;default:0" json:"paid_amount"`
	DueDate       time.Time      `gorm:"not null" json:"due_date"`
	PaidDate      *time.Time     `json:"paid_date,omitempty"`
	Status        PaymentStatus  `gorm:"size:20;not null;default:'pending'" json:"status"`
	PaymentMethod string         `gorm:"size:50" json:"payment_method,omitempty"`
	InvoiceNumber string         `gorm:"size:100" json:"invoice_number,omitempty"`
	Notes         string         `gorm:"type:text" json:"notes,omitempty"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`

	School  School  `gorm:"foreignKey:SchoolID" json:"school,omitempty"`
	Rental  Rental  `gorm:"foreignKey:RentalID" json:"rental,omitempty"`
}

func (Payment) TableName() string { return "payments" }
