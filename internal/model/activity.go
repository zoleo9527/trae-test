package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Activity struct {
	ID          uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	CampID      uuid.UUID      `gorm:"type:uuid;index;not null" json:"camp_id"`
	Name        string         `gorm:"type:varchar(200);not null" json:"name"`
	Description string         `gorm:"type:text" json:"description"`
	Location    string         `gorm:"type:varchar(200)" json:"location"`
	StartTime   time.Time      `gorm:"not null" json:"start_time"`
	EndTime     time.Time      `gorm:"not null" json:"end_time"`
	TeacherID   *uuid.UUID     `gorm:"type:uuid;index" json:"teacher_id,omitempty"`
	MaxParticipants int       `gorm:"default:0" json:"max_participants"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	Camp          Camp            `gorm:"foreignKey:CampID" json:"camp,omitempty"`
	Teacher       *User           `gorm:"foreignKey:TeacherID" json:"teacher,omitempty"`
	Attendances   []Attendance    `gorm:"foreignKey:ActivityID" json:"attendances,omitempty"`
}

func (a *Activity) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}

type AttendanceStatus string

const (
	AttendancePresent  AttendanceStatus = "present"
	AttendanceAbsent   AttendanceStatus = "absent"
	AttendanceLate     AttendanceStatus = "late"
	AttendanceLeave    AttendanceStatus = "leave"
)

type Attendance struct {
	ID         uuid.UUID       `gorm:"type:uuid;primaryKey" json:"id"`
	ActivityID uuid.UUID       `gorm:"type:uuid;index;not null" json:"activity_id"`
	CamperID   uuid.UUID       `gorm:"type:uuid;index;not null" json:"camper_id"`
	Status     AttendanceStatus `gorm:"type:varchar(20);not null" json:"status"`
	Notes      string          `gorm:"type:text" json:"notes"`
	CheckedInAt *time.Time     `json:"checked_in_at,omitempty"`
	CheckedBy  uuid.UUID       `gorm:"type:uuid;not null" json:"checked_by"`
	CreatedAt  time.Time       `json:"created_at"`
	UpdatedAt  time.Time       `json:"updated_at"`

	Activity Activity `gorm:"foreignKey:ActivityID" json:"activity,omitempty"`
	Camper   Camper   `gorm:"foreignKey:CamperID" json:"camper,omitempty"`
	Checker  User     `gorm:"foreignKey:CheckedBy" json:"checker,omitempty"`
}

func (a *Attendance) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}
