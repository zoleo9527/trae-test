package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RegistrationStatus string

const (
	RegistrationStatusDraft     RegistrationStatus = "draft"
	RegistrationStatusPending   RegistrationStatus = "pending"
	RegistrationStatusConfirmed RegistrationStatus = "confirmed"
	RegistrationStatusPaid    RegistrationStatus = "paid"
	RegistrationStatusRefunded RegistrationStatus = "refunded"
)

type Registration struct {
	ID              uuid.UUID            `gorm:"type:uuid;primaryKey" json:"id"`
	CamperID        uuid.UUID            `gorm:"type:uuid;index;not null" json:"camper_id"`
	CampID          uuid.UUID            `gorm:"type:uuid;index;not null" json:"camp_id"`
	RegistrationNo    string               `gorm:"type:varchar(50);uniqueIndex;not null" json:"registration_no"`
	Status          RegistrationStatus   `gorm:"type:varchar(20);default:draft;not null" json:"status"`
	PaymentStatus     string               `gorm:"type:varchar(20)" json:"payment_status"`
	Amount          float64              `gorm:"default:0" json:"amount"`
	PaidAmount      float64            `gorm:"default:0" json:"paid_amount"`
	PaymentMethod    string             `gorm:"type:varchar(50)" json:"payment_method"`
	PaymentTime    *time.Time          `json:"payment_time,omitempty"`
	Notes           string             `gorm:"type:text" json:"notes"`
	Source          string             `gorm:"type:varchar(50)" json:"source"`
	CreatedBy       uuid.UUID          `gorm:"type:uuid;not null" json:"created_by"`
	CreatedAt       time.Time          `json:"created_at"`
	UpdatedAt       time.Time          `json:"updated_at"`
	DeletedAt       gorm.DeletedAt     `gorm:"index" json:"-"`

	Camper Camper `gorm:"foreignKey:CamperID" json:"camper,omitempty"`
	Camp   Camp   `gorm:"foreignKey:CampID" json:"camp,omitempty"`
}

func (r *Registration) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}

func (r *Registration) CanConfirm() bool {
	return r.Status == RegistrationStatusPending
}

func (r *Registration) CanCancel() bool {
	return r.Status == RegistrationStatusPending || r.Status == RegistrationStatusConfirmed
}
