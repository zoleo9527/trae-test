package models

import (
	"time"
)

type InspectionType string

const (
	InspectionSafety    InspectionType = "safety"
	InspectionStructure InspectionType = "structure"
	InspectionElectric  InspectionType = "electric"
	InspectionFire      InspectionType = "fire"
	InspectionFinal     InspectionType = "final"
)

type InspectionItem struct {
	ID          uint   `gorm:"primarykey" json:"id"`
	InspectionID uint  `gorm:"index" json:"inspection_id"`
	Name        string `gorm:"size:200;not null" json:"name"`
	Description string `gorm:"type:text" json:"description"`
	Standard    string `gorm:"type:text" json:"standard"`
	Passed      *bool  `json:"passed"`
	Remarks     string `gorm:"type:text" json:"remarks"`
	Photos      []string `gorm:"type:json" json:"photos"`
}

type Inspection struct {
	BaseModel
	ProjectID    uint           `gorm:"index;not null" json:"project_id"`
	Project      Project        `gorm:"foreignKey:ProjectID" json:"project,omitempty"`
	Type         InspectionType `gorm:"size:30;not null" json:"type"`
	Title        string         `gorm:"size:200;not null" json:"title"`
	Status       Status         `gorm:"size:20;default:pending" json:"status"`
	InspectorID  *uint          `gorm:"index" json:"inspector_id"`
	Inspector    *User          `gorm:"foreignKey:InspectorID" json:"inspector,omitempty"`
	SupervisorID *uint          `gorm:"index" json:"supervisor_id"`
	Supervisor   *User          `gorm:"foreignKey:SupervisorID" json:"supervisor,omitempty"`

	ScheduleTime *time.Time `json:"schedule_time"`
	StartTime    *time.Time `json:"start_time"`
	EndTime      *time.Time `json:"end_time"`

	Items        []InspectionItem `gorm:"foreignKey:InspectionID" json:"items,omitempty"`
	OverallPassed *bool           `json:"overall_passed"`
	Remarks      string          `gorm:"type:text" json:"remarks"`
	Attachments  []string        `gorm:"type:json" json:"attachments"`
	RejectReason string          `gorm:"type:text" json:"reject_reason"`

	ApprovedByID *uint      `gorm:"index" json:"approved_by_id"`
	ApprovedBy   *User      `gorm:"foreignKey:ApprovedByID" json:"approved_by,omitempty"`
	ApprovedAt   *time.Time `json:"approved_at"`
}
