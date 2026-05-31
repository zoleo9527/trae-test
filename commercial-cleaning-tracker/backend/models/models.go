package models

import (
	"time"

	"gorm.io/gorm"
)

type UserRole string

const (
	RoleScheduler UserRole = "scheduler"
	RoleWorker    UserRole = "worker"
	RoleInspector UserRole = "inspector"
	RoleManager   UserRole = "manager"
)

type User struct {
	gorm.Model
	Username string   `gorm:"uniqueIndex;size:50;not null"`
	Password string   `gorm:"size:255;not null"`
	Name     string   `gorm:"size:50;not null"`
	Role     UserRole `gorm:"size:20;not null"`
	Phone    string   `gorm:"size:20"`
	Avatar   string   `gorm:"size:255"`
}

type Project struct {
	gorm.Model
	Name          string    `gorm:"size:100;not null"`
	Address       string    `gorm:"size:255"`
	CustomerName  string    `gorm:"size:50"`
	CustomerPhone string    `gorm:"size:20"`
	ContractStart time.Time
	ContractEnd   time.Time
	Status        string `gorm:"size:20;default:active"`
	ManagerID     uint
	Manager       User `gorm:"foreignKey:ManagerID"`
}

type ScheduleStatus string

const (
	ScheduleDraft     ScheduleStatus = "draft"
	SchedulePublished ScheduleStatus = "published"
	ScheduleCompleted ScheduleStatus = "completed"
)

type Schedule struct {
	gorm.Model
	ProjectID uint           `gorm:"not null;index"`
	Project   Project        `gorm:"foreignKey:ProjectID"`
	WeekStart time.Time      `gorm:"not null;index"`
	WeekEnd   time.Time      `gorm:"not null"`
	Status    ScheduleStatus `gorm:"size:20;default:draft"`
	CreatedBy uint           `gorm:"not null"`
	Creator   User           `gorm:"foreignKey:CreatedBy"`
	Shifts    []Shift        `gorm:"foreignKey:ScheduleID"`
}

type ShiftType string

const (
	ShiftMorning  ShiftType = "morning"
	ShiftAfternoon ShiftType = "afternoon"
	ShiftNight    ShiftType = "night"
	ShiftFull     ShiftType = "full"
)

type Shift struct {
	gorm.Model
	ScheduleID    uint      `gorm:"not null;index"`
	Schedule      Schedule  `gorm:"foreignKey:ScheduleID"`
	WorkerID      uint      `gorm:"not null;index"`
	Worker        User      `gorm:"foreignKey:WorkerID"`
	Date          time.Time `gorm:"not null;index"`
	ShiftType     ShiftType `gorm:"size:20;not null"`
	StartTime     string    `gorm:"size:10"`
	EndTime       string    `gorm:"size:10"`
	Area          string    `gorm:"size:100"`
	Tasks         string    `gorm:"type:text"`
	CheckIns      []CheckIn `gorm:"foreignKey:ShiftID"`
	Inspections   []Inspection `gorm:"foreignKey:ShiftID"`
	MaterialReqs  []MaterialRequisition `gorm:"foreignKey:ShiftID"`
}

type CheckInStatus string

const (
	CheckInNormal   CheckInStatus = "normal"
	CheckInLate     CheckInStatus = "late"
	CheckInEarly    CheckInStatus = "early"
	CheckInMissing  CheckInStatus = "missing"
	CheckInException CheckInStatus = "exception"
)

type CheckIn struct {
	gorm.Model
	ShiftID     uint          `gorm:"not null;index"`
	WorkerID    uint          `gorm:"not null;index"`
	Worker      User          `gorm:"foreignKey:WorkerID"`
	CheckInTime *time.Time    `gorm:"index"`
	CheckOutTime *time.Time
	Status      CheckInStatus `gorm:"size:20;default:missing"`
	PhotoURL    string        `gorm:"size:255"`
	Location    string        `gorm:"size:255"`
	Remark      string        `gorm:"type:text"`
	IsCorrected bool          `gorm:"default:false"`
	CorrectedBy *uint
	Corrector   *User         `gorm:"foreignKey:CorrectedBy"`
	CorrectTime *time.Time
	CorrectNote string        `gorm:"type:text"`
}

type InspectionResult string

const (
	InspectionPass    InspectionResult = "pass"
	InspectionFail    InspectionResult = "fail"
	InspectionPending InspectionResult = "pending"
)

type Inspection struct {
	gorm.Model
	ShiftID       uint             `gorm:"not null;index"`
	InspectorID   uint             `gorm:"not null;index"`
	Inspector     User             `gorm:"foreignKey:InspectorID"`
	InspectTime   time.Time        `gorm:"not null;index"`
	Result        InspectionResult `gorm:"size:20;not null"`
	Score         int              `gorm:"default:100"`
	Items         string           `gorm:"type:text"`
	Problems      string           `gorm:"type:text"`
	PhotoURLs     string           `gorm:"size:500"`
	Remark        string           `gorm:"type:text"`
	Rectification *Rectification   `gorm:"foreignKey:InspectionID"`
}

type RectificationStatus string

const (
	RectOpen     RectificationStatus = "open"
	RectAssigned RectificationStatus = "assigned"
	RectInProgress RectificationStatus = "in_progress"
	RectDone     RectificationStatus = "done"
	RectVerified RectificationStatus = "verified"
)

type Rectification struct {
	gorm.Model
	InspectionID  uint                `gorm:"not null;uniqueIndex"`
	AssigneeID    uint                `gorm:"not null;index"`
	Assignee      User                `gorm:"foreignKey:AssigneeID"`
	Deadline      time.Time           `gorm:"not null"`
	Status        RectificationStatus `gorm:"size:20;default:open"`
	Description   string              `gorm:"type:text"`
	Actions       string              `gorm:"type:text"`
	CompletedTime *time.Time
	CompletedNote string              `gorm:"type:text"`
	VerifiedBy    *uint
	Verifier      *User               `gorm:"foreignKey:VerifiedBy"`
	VerifiedTime  *time.Time
	VerifyNote    string              `gorm:"type:text"`
	FollowUps     []FollowUp          `gorm:"foreignKey:RectificationID"`
}

type MaterialStatus string

const (
	MaterialPending  MaterialStatus = "pending"
	MaterialApproved MaterialStatus = "approved"
	MaterialRejected MaterialStatus = "rejected"
	MaterialIssued   MaterialStatus = "issued"
)

type MaterialRequisition struct {
	gorm.Model
	ShiftID    uint           `gorm:"not null;index"`
	RequesterID uint          `gorm:"not null;index"`
	Requester  User           `gorm:"foreignKey:RequesterID"`
	Items      string         `gorm:"type:text;not null"`
	TotalQty   int            `gorm:"default:0"`
	Status     MaterialStatus `gorm:"size:20;default:pending"`
	RequestTime time.Time     `gorm:"not null"`
	ApprovedBy *uint
	Approver   *User          `gorm:"foreignKey:ApprovedBy"`
	ApproveTime *time.Time
	IssueTime  *time.Time
	Remark     string         `gorm:"type:text"`
}

type FollowUpType string

const (
	FollowUpRect    FollowUpType = "rectification"
	FollowUpRenewal FollowUpType = "renewal"
	FollowUpComplaint FollowUpType = "complaint"
)

type FollowUpStatus string

const (
	FollowUpPending FollowUpStatus = "pending"
	FollowUpDone    FollowUpStatus = "done"
)

type FollowUp struct {
	gorm.Model
	ProjectID       *uint          `gorm:"index"`
	Project         *Project       `gorm:"foreignKey:ProjectID"`
	RectificationID *uint          `gorm:"index"`
	Rectification   *Rectification `gorm:"foreignKey:RectificationID"`
	Type            FollowUpType   `gorm:"size:20;not null"`
	Title           string         `gorm:"size:200;not null"`
	Content         string         `gorm:"type:text"`
	AssigneeID      uint           `gorm:"not null;index"`
	Assignee        User           `gorm:"foreignKey:AssigneeID"`
	DueDate         time.Time      `gorm:"not null;index"`
	Status          FollowUpStatus `gorm:"size:20;default:pending"`
	Result          string         `gorm:"type:text"`
	CompletedTime   *time.Time
	CreatedBy       uint
	Creator         User `gorm:"foreignKey:CreatedBy"`
}

type TraceChain struct {
	ID             uint      `json:"id"`
	ShiftID        uint      `json:"shiftId"`
	ShiftDate      time.Time `json:"shiftDate"`
	WorkerName     string    `json:"workerName"`
	ProjectName    string    `json:"projectName"`
	ProjectID      uint      `json:"projectId"`
	CheckInStatus  string    `json:"checkInStatus"`
	InspectionResult string   `json:"inspectionResult"`
	HasRect        bool      `json:"hasRectification"`
	RectStatus     string    `json:"rectificationStatus"`
	RectID         *uint     `json:"rectificationId"`
	MaterialStatus string    `json:"materialStatus"`
	HasFollowUp    bool      `json:"hasFollowUp"`
	FollowUpCount  int       `json:"followUpCount"`
	FollowUpTypes  []string  `json:"followUpTypes"`
}
