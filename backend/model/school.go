package model

import (
	"time"

	"gorm.io/gorm"
)

type SchoolStatus string

const (
	SchoolActive    SchoolStatus = "active"
	SchoolSuspended SchoolStatus = "suspended"
	SchoolTerminated SchoolStatus = "terminated"
)

type School struct {
	ID                 uint           `gorm:"primaryKey" json:"id"`
	Name               string         `gorm:"size:200;not null;index" json:"name"`
	ContactPerson      string         `gorm:"size:100;not null" json:"contact_person"`
	ContactPhone       string         `gorm:"size:20;not null" json:"contact_phone"`
	Address            string         `gorm:"size:500" json:"address"`
	CooperationStatus  SchoolStatus   `gorm:"size:20;not null;default:'active'" json:"cooperation_status"`
	ContractStart      *time.Time     `json:"contract_start,omitempty"`
	ContractEnd        *time.Time     `json:"contract_end,omitempty"`
	Notes              string         `gorm:"type:text" json:"notes,omitempty"`
	CreatedAt          time.Time      `json:"created_at"`
	UpdatedAt          time.Time      `json:"updated_at"`
	DeletedAt          gorm.DeletedAt `gorm:"index" json:"-"`
}

func (School) TableName() string { return "schools" }
