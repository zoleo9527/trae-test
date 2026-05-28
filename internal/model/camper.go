package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CamperStatus string

const (
	CamperStatusPending   CamperStatus = "pending"
	CamperStatusRegistered CamperStatus = "registered"
	CamperStatusCheckedIn CamperStatus = "checked_in"
	CamperStatusCheckedOut CamperStatus = "checked_out"
	CamperStatusCancelled CamperStatus = "cancelled"
)

type Camper struct {
	ID            uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	CampID        uuid.UUID      `gorm:"type:uuid;index;not null" json:"camp_id"`
	Name          string         `gorm:"type:varchar(100);not null" json:"name"`
	Gender        string         `gorm:"type:varchar(10);not null" json:"gender"`
	BirthDate     time.Time      `json:"birth_date"`
	Age           int            `gorm:"not null" json:"age"`
	IDCard        string         `gorm:"type:varchar(50);index" json:"id_card"`
	HealthNotes   string         `gorm:"type:text" json:"health_notes"`
	DietaryNeeds  string         `gorm:"type:varchar(200)" json:"dietary_needs"`
	EmergencyName string         `gorm:"type:varchar(100);not null" json:"emergency_name"`
	EmergencyPhone string        `gorm:"type:varchar(20);not null" json:"emergency_phone"`
	Relationship  string         `gorm:"type:varchar(50);not null" json:"relationship"`
	Status        CamperStatus   `gorm:"type:varchar(20);default:pending;not null" json:"status"`
	RoomID        *uuid.UUID     `gorm:"type:uuid;index" json:"room_id,omitempty"`
	BedNumber     int            `json:"bed_number,omitempty"`
	CheckInTime   *time.Time     `json:"check_in_time,omitempty"`
	CheckOutTime  *time.Time     `json:"check_out_time,omitempty"`
	CreatedBy     uuid.UUID      `gorm:"type:uuid;not null" json:"created_by"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`

	Camp       Camp         `gorm:"foreignKey:CampID" json:"camp,omitempty"`
	Room       *Room        `gorm:"foreignKey:RoomID" json:"room,omitempty"`
	Registrations []Registration `gorm:"foreignKey:CamperID" json:"registrations,omitempty"`
}

func (c *Camper) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

func (c *Camper) CanAssignRoom() bool {
	return c.Status == CamperStatusRegistered || c.Status == CamperStatusCheckedIn
}

func (c *Camper) CanCheckIn() bool {
	return c.Status == CamperStatusRegistered && c.RoomID != nil
}
