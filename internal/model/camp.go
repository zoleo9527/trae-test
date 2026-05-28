package model

import "time"

type CampStatus string

const (
	CampStatusDraft     CampStatus = "draft"
	CampStatusActive    CampStatus = "active"
	CampStatusCompleted CampStatus = "completed"
)

type Camp struct {
	BaseModel
	Name           string     `gorm:"size:100;not null" json:"name"`
	Theme          string     `gorm:"size:100" json:"theme"`
	Location       string     `gorm:"size:200" json:"location"`
	StartDate      time.Time  `gorm:"not null" json:"start_date"`
	EndDate        time.Time  `gorm:"not null" json:"end_date"`
	MaxCampers     int        `gorm:"default:0" json:"max_campers"`
	Status         CampStatus `gorm:"size:20;default:draft" json:"status"`
	Description    string     `gorm:"type:text" json:"description"`
	CoverImage     string     `gorm:"size:255" json:"cover_image"`
	DirectorID     string     `gorm:"type:uuid;not null" json:"director_id"`

	Director     *User    `gorm:"foreignKey:DirectorID" json:"director,omitempty"`
	Campers      []Camper `gorm:"foreignKey:CampID" json:"campers,omitempty"`
	Activities   []Activity `gorm:"foreignKey:CampID" json:"activities,omitempty"`
	Rooms        []Room   `gorm:"foreignKey:CampID" json:"rooms,omitempty"`
}
