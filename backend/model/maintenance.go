package model

import (
	"time"

	"gorm.io/gorm"
)

type MaintenanceType string

const (
	MaintenanceRoutine  MaintenanceType = "routine"
	MaintenanceRepair   MaintenanceType = "repair"
	MaintenanceOverhaul MaintenanceType = "overhaul"
)

type MaintenanceStatus string

const (
	MaintenancePending    MaintenanceStatus = "pending"
	MaintenanceInProgress MaintenanceStatus = "in_progress"
	MaintenanceCompleted  MaintenanceStatus = "completed"
)

type Maintenance struct {
	ID           uint              `gorm:"primaryKey" json:"id"`
	InstrumentID uint              `gorm:"not null;index" json:"instrument_id"`
	RentalID     *uint             `gorm:"index" json:"rental_id,omitempty"`
	Type         MaintenanceType   `gorm:"size:20;not null" json:"type"`
	Description  string            `gorm:"type:text;not null" json:"description"`
	Cost         float64           `gorm:"not null;default:0" json:"cost"`
	TechnicianID uint              `gorm:"not null;index" json:"technician_id"`
	Status       MaintenanceStatus `gorm:"size:20;not null;default:'pending'" json:"status"`
	StartDate    time.Time         `gorm:"not null" json:"start_date"`
	EndDate      *time.Time        `json:"end_date,omitempty"`
	Notes        string            `gorm:"type:text" json:"notes,omitempty"`
	CreatedAt    time.Time         `json:"created_at"`
	UpdatedAt    time.Time         `json:"updated_at"`
	DeletedAt    gorm.DeletedAt    `gorm:"index" json:"-"`

	Instrument Instrument `gorm:"foreignKey:InstrumentID" json:"instrument,omitempty"`
	Technician User       `gorm:"foreignKey:TechnicianID" json:"technician,omitempty"`
}

func (Maintenance) TableName() string { return "maintenances" }
