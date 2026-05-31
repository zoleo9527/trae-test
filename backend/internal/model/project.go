package model

import (
	"time"

	"github.com/google/uuid"
)

type Project struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	Name      string    `gorm:"size:128;not null" json:"name"`
	Location  string    `gorm:"size:256" json:"location"`
	Status    string    `gorm:"size:32;not null;default:'active'" json:"status"`
	StartDate time.Time `gorm:"type:date;not null" json:"start_date"`
	EndDate   *time.Time `gorm:"type:date" json:"end_date"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (Project) TableName() string { return "projects" }
