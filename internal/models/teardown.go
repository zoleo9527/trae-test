package models

import (
	"time"
)

type IssueSeverity string

const (
	SeverityCritical IssueSeverity = "critical"
	SeverityMajor    IssueSeverity = "major"
	SeverityMinor    IssueSeverity = "minor"
	SeverityInfo     IssueSeverity = "info"
)

type TeardownIssue struct {
	BaseModel
	TeardownReviewID uint           `gorm:"index;not null" json:"teardown_review_id"`
	Title            string         `gorm:"size:200;not null" json:"title"`
	Description      string         `gorm:"type:text" json:"description"`
	Severity         IssueSeverity  `gorm:"size:20;not null" json:"severity"`
	Category         string         `gorm:"size:100" json:"category"`
	ResponsibleID    *uint          `gorm:"index" json:"responsible_id"`
	Responsible      *User          `gorm:"foreignKey:ResponsibleID" json:"responsible,omitempty"`
	Status           TaskStatus     `gorm:"size:20;default:todo" json:"status"`
	Resolution       string         `gorm:"type:text" json:"resolution"`
	Photos           []string       `gorm:"type:json" json:"photos"`
	Deadline         *time.Time     `json:"deadline"`
	ResolvedAt       *time.Time     `json:"resolved_at"`
}

type TeardownReview struct {
	BaseModel
	ProjectID      uint           `gorm:"index;not null" json:"project_id"`
	Project        Project        `gorm:"foreignKey:ProjectID" json:"project,omitempty"`
	Title          string         `gorm:"size:200;not null" json:"title"`
	Status         Status         `gorm:"size:20;default:pending" json:"status"`
	Resubmitted    bool           `gorm:"default:false" json:"resubmitted"`
	StartTime      *time.Time     `json:"start_time"`
	EndTime        *time.Time     `json:"end_time"`
	ActualEndTime  *time.Time     `json:"actual_end_time"`

	OperatorID     *uint          `gorm:"index" json:"operator_id"`
	Operator       *User          `gorm:"foreignKey:OperatorID" json:"operator,omitempty"`
	SupervisorID   *uint          `gorm:"index" json:"supervisor_id"`
	Supervisor     *User          `gorm:"foreignKey:SupervisorID" json:"supervisor,omitempty"`

	Issues         []TeardownIssue `gorm:"foreignKey:TeardownReviewID" json:"issues,omitempty"`

	MaterialReturned *bool          `json:"material_returned"`
	SiteCleared      *bool          `json:"site_cleared"`
	EquipmentChecked *bool          `json:"equipment_checked"`

	Summary          string         `gorm:"type:text" json:"summary"`
	LessonsLearned   string         `gorm:"type:text" json:"lessons_learned"`
	Improvements     string         `gorm:"type:text" json:"improvements"`
	Attachments      []string       `gorm:"type:json" json:"attachments"`
	RejectReason     string         `gorm:"type:text" json:"reject_reason"`

	ApprovedByID     *uint          `gorm:"index" json:"approved_by_id"`
	ApprovedBy       *User          `gorm:"foreignKey:ApprovedByID" json:"approved_by,omitempty"`
	ApprovedAt       *time.Time     `json:"approved_at"`
}
