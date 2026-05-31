package model

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID           uuid.UUID  `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	Username     string     `gorm:"uniqueIndex;size:64;not null" json:"username"`
	PasswordHash string     `gorm:"size:256;not null" json:"-"`
	RealName     string     `gorm:"size:64;not null" json:"real_name"`
	Role         string     `gorm:"size:32;not null" json:"role"`
	Phone        string     `gorm:"size:20" json:"phone"`
	ProjectID    *uuid.UUID `gorm:"type:uuid" json:"project_id"`
	TeamID       *uuid.UUID `gorm:"type:uuid" json:"team_id"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

func (User) TableName() string { return "users" }
