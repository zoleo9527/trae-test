package model

import (
	"time"

	"gorm.io/gorm"
)

type Role string

const (
	RoleManager    Role = "manager"
	RoleConsultant Role = "consultant"
	RoleTechnician Role = "technician"
)

type User struct {
	ID           uint           `gorm:"primarykey" json:"id"`
	Username     string         `gorm:"uniqueIndex;size:50;not null" json:"username"`
	PasswordHash string         `gorm:"size:255;not null" json:"-"`
	Role         Role           `gorm:"size:20;not null;index" json:"role"`
	DisplayName  string         `gorm:"size:100;not null" json:"display_name"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}
