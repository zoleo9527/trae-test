package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RoomType string

const (
	RoomTypeStandard RoomType = "standard"
	RoomTypePremium  RoomType = "premium"
	RoomTypeSuite    RoomType = "suite"
)

type RoomGender string

const (
	RoomGenderMale    RoomGender = "male"
	RoomGenderFemale  RoomGender = "female"
	RoomGenderMixed   RoomGender = "mixed"
)

type Room struct {
	ID            uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	CampID        uuid.UUID      `gorm:"type:uuid;index;not null" json:"camp_id"`
	RoomNumber    string         `gorm:"type:varchar(20);not null" json:"room_number"`
	Floor         int            `gorm:"default:1" json:"floor"`
	Type          RoomType       `gorm:"type:varchar(20);default:standard;not null" json:"type"`
	Gender        RoomGender     `gorm:"type:varchar(10);default:mixed;not null" json:"gender"`
	BedCount      int            `gorm:"not null" json:"bed_count"`
	OccupiedBeds  int            `gorm:"default:0" json:"occupied_beds"`
	Notes         string         `gorm:"type:text" json:"notes"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`

	Camp    Camp     `gorm:"foreignKey:CampID" json:"camp,omitempty"`
	Campers []Camper `gorm:"foreignKey:RoomID" json:"campers,omitempty"`
}

func (r *Room) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}

func (r *Room) IsFull() bool {
	return r.OccupiedBeds >= r.BedCount
}

func (r *Room) HasCapacity() bool {
	return r.OccupiedBeds < r.BedCount
}

func (r *Room) AvailableBeds() int {
	return r.BedCount - r.OccupiedBeds
}
