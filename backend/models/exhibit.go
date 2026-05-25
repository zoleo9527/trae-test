package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ExhibitStatus string

const (
	ExhibitInStorage  ExhibitStatus = "in_storage"
	ExhibitOnDisplay  ExhibitStatus = "on_display"
	ExhibitOnLoan     ExhibitStatus = "on_loan"
	ExhibitRestoring  ExhibitStatus = "restoring"
	ExhibitTransiting ExhibitStatus = "transiting"
)

type Exhibit struct {
	ID              uint           `gorm:"primaryKey" json:"id"`
	ExhibitNo       string         `gorm:"size:50;uniqueIndex;not null" json:"exhibit_no"`
	Name            string         `gorm:"size:200;not null" json:"name"`
	Category        string         `gorm:"size:100;index" json:"category"`
	Artist          string         `gorm:"size:100" json:"artist"`
	Year            string         `gorm:"size:50" json:"year"`
	Material        string         `gorm:"size:200" json:"material"`
	Dimensions      string         `gorm:"size:100" json:"dimensions"`
	Location        string         `gorm:"size:100" json:"location"`
	Status          ExhibitStatus  `gorm:"size:30;index;default:in_storage" json:"status"`
	Description     string         `gorm:"type:text" json:"description"`
	ImageURL        string         `gorm:"size:500" json:"image_url"`
	LastCheckedBy   *uint          `json:"last_checked_by"`
	LastCheckedAt   *time.Time     `json:"last_checked_at"`
	CreatedBy       uint           `json:"created_by"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`

	LastChecker *User `gorm:"foreignKey:LastCheckedBy" json:"last_checker,omitempty"`
	Creator     *User `gorm:"foreignKey:CreatedBy" json:"creator,omitempty"`
}

type ExhibitTransfer struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	TransferNo  string         `gorm:"size:50;uniqueIndex;not null" json:"transfer_no"`
	ExhibitID   uint           `gorm:"not null;index" json:"exhibit_id"`
	FromStatus  ExhibitStatus  `gorm:"size:30" json:"from_status"`
	ToStatus    ExhibitStatus  `gorm:"size:30;not null" json:"to_status"`
	FromLocation string        `gorm:"size:100" json:"from_location"`
	ToLocation  string         `gorm:"size:100" json:"to_location"`
	Reason      string         `gorm:"type:text" json:"reason"`
	ManagerID   uint           `gorm:"not null" json:"manager_id"`
	ConfirmedBy *uint          `json:"confirmed_by"`
	ConfirmedAt *time.Time     `json:"confirmed_at"`
	Status      string         `gorm:"size:20;default:pending" json:"status"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	Exhibit   *Exhibit `gorm:"foreignKey:ExhibitID" json:"exhibit,omitempty"`
	Manager   *User    `gorm:"foreignKey:ManagerID" json:"manager,omitempty"`
	Confirmer *User    `gorm:"foreignKey:ConfirmedBy" json:"confirmer,omitempty"`
}

func (e *ExhibitTransfer) BeforeCreate(tx *gorm.DB) error {
	if e.TransferNo == "" {
		e.TransferNo = "ET" + uuid.New().String()[:8]
	}
	return nil
}
