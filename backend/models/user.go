package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserRole string

const (
	RoleManager    UserRole = "manager"
	RoleTicketing  UserRole = "ticketing"
	RoleActivities UserRole = "activities"
)

type MemberLevel string

const (
	MemberLevelNone   MemberLevel = ""
	MemberLevelNormal MemberLevel = "normal"
	MemberLevelSilver MemberLevel = "silver"
	MemberLevelGold   MemberLevel = "gold"
	MemberLevelPlatinum MemberLevel = "platinum"
)

type User struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Username    string         `gorm:"size:50;uniqueIndex;not null" json:"username"`
	Password    string         `gorm:"size:255;not null" json:"-"`
	Name        string         `gorm:"size:100;not null" json:"name"`
	Email       string         `gorm:"size:100;uniqueIndex" json:"email"`
	Phone       string         `gorm:"size:20" json:"phone"`
	Role        UserRole       `gorm:"size:20;not null;index" json:"role"`
	Status      string         `gorm:"size:20;default:active" json:"status"`
	IsMember    bool           `gorm:"default:false;index" json:"is_member"`
	MemberNo    string         `gorm:"size:50;uniqueIndex" json:"member_no"`
	MemberLevel MemberLevel    `gorm:"size:20;index" json:"member_level"`
	MemberSince *time.Time     `json:"member_since"`
	MemberExpire *time.Time    `json:"member_expire"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

func (u *User) HashPassword(password string) error {
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hashed)
	return nil
}

func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
	return err == nil
}
