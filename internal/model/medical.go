package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MedicalSeverity string

const (
	MedicalSeverityMinor     MedicalSeverity = "minor"
	MedicalSeverityModerate  MedicalSeverity = "moderate"
	MedicalSeveritySevere    MedicalSeverity = "severe"
	MedicalSeverityEmergency MedicalSeverity = "emergency"
)

type MedicalStatus string

const (
	MedicalStatusOpen       MedicalStatus = "open"
	MedicalStatusInProgress MedicalStatus = "in_progress"
	MedicalStatusResolved   MedicalStatus = "resolved"
	MedicalStatusTransferred MedicalStatus = "transferred"
)

type MedicalRecord struct {
	ID          uuid.UUID       `gorm:"type:uuid;primaryKey" json:"id"`
	CamperID    uuid.UUID       `gorm:"type:uuid;index;not null" json:"camper_id"`
	ReportTime  time.Time       `gorm:"not null" json:"report_time"`
	ReportedBy  uuid.UUID       `gorm:"type:uuid;not null" json:"reported_by"`
	Symptoms    string          `gorm:"type:text;not null" json:"symptoms"`
	Severity    MedicalSeverity `gorm:"type:varchar(20);not null" json:"severity"`
	Temperature float64         `json:"temperature"`
	Treatment   string          `gorm:"type:text" json:"treatment"`
	Medication  string          `gorm:"type:varchar(500)" json:"medication"`
	Status      MedicalStatus   `gorm:"type:varchar(20);default:open;not null" json:"status"`
	Notes       string          `gorm:"type:text" json:"notes"`
	ParentNotified bool         `gorm:"default:false" json:"parent_notified"`
	NotifyTime  *time.Time      `json:"notify_time,omitempty"`
	ResolvedAt  *time.Time      `json:"resolved_at,omitempty"`
	ResolvedBy  *uuid.UUID      `gorm:"type:uuid" json:"resolved_by,omitempty"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
	DeletedAt   gorm.DeletedAt  `gorm:"index" json:"-"`

	Camper    Camper `gorm:"foreignKey:CamperID" json:"camper,omitempty"`
	Reporter  User   `gorm:"foreignKey:ReportedBy" json:"reporter,omitempty"`
	Resolver  *User  `gorm:"foreignKey:ResolvedBy" json:"resolver,omitempty"`
}

func (m *MedicalRecord) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}
