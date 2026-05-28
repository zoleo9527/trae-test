package model

import "time"

type FollowUpType string

const (
	FollowUpTypeMedical  FollowUpType = "medical"
	FollowUpTypeParent   FollowUpType = "parent"
	FollowUpTypeBehavior FollowUpType = "behavior"
	FollowUpTypeOther    FollowUpType = "other"
)

type FollowUpStatus string

const (
	FollowUpStatusPending   FollowUpStatus = "pending"
	FollowUpStatusScheduled FollowUpStatus = "scheduled"
	FollowUpStatusCompleted FollowUpStatus = "completed"
	FollowUpStatusCancelled FollowUpStatus = "cancelled"
)

type FollowUpPriority string

const (
	FollowUpPriorityLow    FollowUpPriority = "low"
	FollowUpPriorityMedium FollowUpPriority = "medium"
	FollowUpPriorityHigh   FollowUpPriority = "high"
	FollowUpPriorityUrgent FollowUpPriority = "urgent"
)

type FollowUp struct {
	BaseModel
	CamperID        string           `gorm:"index;not null" json:"camper_id"`
	Type            FollowUpType     `gorm:"size:20;not null" json:"type"`
	Status          FollowUpStatus   `gorm:"size:20;default:pending" json:"status"`
	Priority        FollowUpPriority `gorm:"size:20;default:medium" json:"priority"`
	Title           string           `gorm:"size:200;not null" json:"title"`
	Description     string           `gorm:"type:text" json:"description"`
	RelatedMedicalID string          `gorm:"type:uuid;index" json:"related_medical_id"`
	RelatedCheckInID string          `gorm:"type:uuid;index" json:"related_check_in_id"`
	AssignedTo      string           `gorm:"type:uuid;index" json:"assigned_to"`
	ScheduledTime   *time.Time       `json:"scheduled_time"`
	DueTime         *time.Time       `json:"due_time"`
	CompletedTime   *time.Time       `json:"completed_time"`
	CompletedBy     string           `gorm:"type:uuid" json:"completed_by"`
	Result          string           `gorm:"type:text" json:"result"`
	NextStep        string           `gorm:"type:text" json:"next_step"`
	ParentNotified  bool             `gorm:"default:false" json:"parent_notified"`
	ParentNotifyTime *time.Time      `json:"parent_notify_time"`
	NotifyMethod    string           `gorm:"size:20" json:"notify_method"`
	NotifyContent   string           `gorm:"type:text" json:"notify_content"`
	NotifyBy        string           `gorm:"type:uuid" json:"notify_by"`
	Remark          string           `gorm:"type:text" json:"remark"`
	Tags            []string         `gorm:"serializer:json" json:"tags"`

	Camper          *Camper        `gorm:"foreignKey:CamperID" json:"camper,omitempty"`
	AssignedStaff   *User          `gorm:"foreignKey:AssignedTo" json:"assigned_staff,omitempty"`
	CompletedStaff  *User          `gorm:"foreignKey:CompletedBy" json:"completed_staff,omitempty"`
	NotifyStaff     *User          `gorm:"foreignKey:NotifyBy" json:"notify_staff,omitempty"`
	RelatedMedical  *MedicalReport `gorm:"foreignKey:RelatedMedicalID" json:"related_medical,omitempty"`
	RelatedCheckIn  *CheckIn       `gorm:"foreignKey:RelatedCheckInID" json:"related_check_in,omitempty"`
	History         []FollowUpHistory `gorm:"foreignKey:FollowUpID" json:"history,omitempty"`
}

type FollowUpHistory struct {
	BaseModel
	FollowUpID     string         `gorm:"index;not null" json:"follow_up_id"`
	OldStatus      FollowUpStatus `json:"old_status"`
	NewStatus      FollowUpStatus `gorm:"not null" json:"new_status"`
	OldAssignedTo  string         `json:"old_assigned_to"`
	NewAssignedTo  string         `json:"new_assigned_to"`
	ChangedBy      string         `gorm:"type:uuid;not null" json:"changed_by"`
	ChangeReason   string         `gorm:"type:text" json:"change_reason"`
	Remark         string         `gorm:"type:text" json:"remark"`

	Operator       *User `gorm:"foreignKey:ChangedBy" json:"operator,omitempty"`
}

type CheckInMedicalLink struct {
	BaseModel
	CheckInID      string `gorm:"index;not null" json:"check_in_id"`
	MedicalReportID string `gorm:"index;not null" json:"medical_report_id"`
	LinkedBy       string `gorm:"type:uuid;not null" json:"linked_by"`
	LinkReason     string `gorm:"type:text" json:"link_reason"`

	CheckIn        *CheckIn       `gorm:"foreignKey:CheckInID" json:"check_in,omitempty"`
	MedicalReport  *MedicalReport `gorm:"foreignKey:MedicalReportID" json:"medical_report,omitempty"`
	Operator       *User          `gorm:"foreignKey:LinkedBy" json:"operator,omitempty"`
}
