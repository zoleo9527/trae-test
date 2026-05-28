package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRole string

const (
	RoleDirector   UserRole = "director"
	RoleTeacher    UserRole = "teacher"
	RoleLogistics  UserRole = "logistics"
)

type User struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	Username  string         `gorm:"type:varchar(50);uniqueIndex;not null" json:"username"`
	Password  string         `gorm:"type:varchar(255);not null" json:"-"`
	Name      string         `gorm:"type:varchar(100);not null" json:"name"`
	Role      UserRole       `gorm:"type:varchar(20);not null" json:"role"`
	Phone     string         `gorm:"type:varchar(20)" json:"phone"`
	Email     string         `gorm:"type:varchar(100)" json:"email"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

func (u *User) HasPermission(requiredRoles ...UserRole) bool {
	for _, role := range requiredRoles {
		if u.Role == role {
			return true
		}
	}
	return false
}
