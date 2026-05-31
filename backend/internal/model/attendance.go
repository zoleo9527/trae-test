package model

import (
	"time"

	"github.com/google/uuid"
)

type AttendanceRecord struct {
	ID              uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	TeamID          uuid.UUID `gorm:"type:uuid;not null;index:idx_attendance_team_date" json:"team_id"`
	ProjectID       uuid.UUID `gorm:"type:uuid;not null;index:idx_attendance_project_date" json:"project_id"`
	RecordDate      time.Time `gorm:"type:date;not null;index:idx_attendance_team_date" json:"record_date"`
	WorkerName      string    `gorm:"size:64;not null" json:"worker_name"`
	WorkerIDCard    string    `gorm:"size:18" json:"worker_id_card"`
	Status          string    `gorm:"size:16;not null;default:'present'" json:"status"`
	HoursWorked     float64   `gorm:"type:numeric(4,1);not null;default:0" json:"hours_worked"`
	WorkArea        string    `gorm:"size:128" json:"work_area"`
	TaskDescription string    `gorm:"type:text" json:"task_description"`
	Remark          string    `gorm:"type:text" json:"remark"`
	CreatedBy       uuid.UUID `gorm:"type:uuid;not null" json:"created_by"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

func (AttendanceRecord) TableName() string { return "attendance_records" }
