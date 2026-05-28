package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CampStatus string

const (
	CampStatusDraft     CampStatus = "draft"
	CampStatusOpen      CampStatus = "open"
	CampStatusInProgress CampStatus = "in_progress"
	CampStatusCompleted CampStatus = "completed"
	CampStatusCancelled CampStatus = "cancelled"
)

type Camp struct {
	ID              uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	Name            string         `gorm:"type:varchar(200);not null" json:"name"`
	Theme           string         `gorm:"type:varchar(100)" json:"theme"`
	Description     string         `gorm:"type:text" json:"description"`
	Location        string         `gorm:"type:varchar(200);not null" json:"location"`
	StartDate       time.Time      `gorm:"not null" json:"start_date"`
	EndDate         time.Time      `gorm:"not null" json:"end_date"`
	MaxCampers      int            `gorm:"not null" json:"max_campers"`
	CurrentCampers  int            `gorm:"default:0" json:"current_campers"`
	Fee             float64        `gorm:"default:0" json:"fee"`
	Status          CampStatus     `gorm:"type:varchar(20);default:draft;not null" json:"status"`
	CreatedBy       uuid.UUID      `gorm:"type:uuid;not null" json:"created_by"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`

	Rooms    []Room    `gorm:"foreignKey:CampID" json:"rooms,omitempty"`
	Activities []Activity `gorm:"foreignKey:CampID" json:"activities,omitempty"`
}

func (c *Camp) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

func (c *Camp) IsFull() bool {
	return c.CurrentCampers >= c.MaxCampers
}

func (c *Camp) CanRegister() bool {
	return c.Status == CampStatusOpen && !c.IsFull()
}
