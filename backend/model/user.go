package model

import (
	"time"

	"gorm.io/gorm"
)

type Role string

const (
	RoleAdmin       Role = "admin"
	RoleConsultant  Role = "consultant"
	RoleMaintenance Role = "maintenance"
	RoleStoreOwner  Role = "store_owner"
)

type User struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Username     string         `gorm:"uniqueIndex;size:50;not null" json:"username"`
	PasswordHash string         `gorm:"not null" json:"-"`
	Name         string         `gorm:"size:100;not null" json:"name"`
	Phone        string         `gorm:"size:20" json:"phone"`
	Role         Role           `gorm:"size:20;not null;default:'consultant'" json:"role"`
	IsActive     bool           `gorm:"default:true" json:"is_active"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

func (User) TableName() string { return "users" }
