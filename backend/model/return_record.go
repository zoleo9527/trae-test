package model

import (
	"time"

	"gorm.io/gorm"
)

type ReturnCondition string

const (
	ReturnGood        ReturnCondition = "good"
	ReturnMinorDamage ReturnCondition = "minor_damage"
	ReturnMajorDamage ReturnCondition = "major_damage"
)

type ReturnStatus string

const (
	ReturnPendingReview ReturnStatus = "pending_review"
	ReturnApproved      ReturnStatus = "approved"
	ReturnRejected      ReturnStatus = "rejected"
	ReturnNeedsReview   ReturnStatus = "needs_review"
	ReturnDisputed      ReturnStatus = "disputed"
)

type ReturnRecord struct {
	ID               uint            `gorm:"primaryKey" json:"id"`
	RentalID         uint            `gorm:"not null;index" json:"rental_id"`
	ReturnDate       time.Time       `gorm:"not null" json:"return_date"`
	Condition        ReturnCondition `gorm:"size:20;not null" json:"condition"`
	DamageDescription string         `gorm:"type:text" json:"damage_description,omitempty"`
	DamagePhotos     string          `gorm:"type:text" json:"damage_photos,omitempty"`
	DepositDeduction float64         `gorm:"not null;default:0" json:"deposit_deduction"`
	DepositRefund    float64         `gorm:"not null;default:0" json:"deposit_refund"`
	AssessorID       uint            `gorm:"not null;index" json:"assessor_id"`
	Status           ReturnStatus    `gorm:"size:20;not null;default:'pending_review'" json:"status"`
	ReviewNotes      string          `gorm:"type:text" json:"review_notes,omitempty"`
	CreatedAt        time.Time       `json:"created_at"`
	UpdatedAt        time.Time       `json:"updated_at"`
	DeletedAt        gorm.DeletedAt  `gorm:"index" json:"-"`

	Rental  Rental `gorm:"foreignKey:RentalID" json:"rental,omitempty"`
	Assessor User   `gorm:"foreignKey:AssessorID" json:"assessor,omitempty"`
}

func (ReturnRecord) TableName() string { return "return_records" }
