package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ActivityStatus string
type RegistrationStatus string
type CheckinStatus string

const (
	ActivityDraft     ActivityStatus = "draft"
	ActivityPublished ActivityStatus = "published"
	ActivityOngoing   ActivityStatus = "ongoing"
	ActivityEnded     ActivityStatus = "ended"
	ActivityCancelled ActivityStatus = "cancelled"

	RegistrationPending  RegistrationStatus = "pending"
	RegistrationConfirmed RegistrationStatus = "confirmed"
	RegistrationCancelled RegistrationStatus = "cancelled"
	RegistrationWaitlist  RegistrationStatus = "waitlist"

	CheckinNotStarted CheckinStatus = "not_started"
	CheckinInProgress CheckinStatus = "in_progress"
	CheckinCompleted  CheckinStatus = "completed"
)

type Activity struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	ActivityNo     string         `gorm:"size:50;uniqueIndex;not null" json:"activity_no"`
	Title          string         `gorm:"size:200;not null" json:"title"`
	Type           string         `gorm:"size:50;index" json:"type"`
	Description    string         `gorm:"type:text" json:"description"`
	Location       string         `gorm:"size:200" json:"location"`
	StartDate      time.Time      `gorm:"index" json:"start_date"`
	EndDate        time.Time      `json:"end_date"`
	RegistrationStart time.Time   `json:"registration_start"`
	RegistrationEnd   time.Time   `json:"registration_end"`
	MaxParticipants int           `json:"max_participants"`
	MinParticipants int           `json:"min_participants"`
	IsMemberOnly    bool          `gorm:"default:false" json:"is_member_only"`
	RequiresTicket  bool          `gorm:"default:false" json:"requires_ticket"`
	TicketPrice     float64       `gorm:"type:decimal(10,2)" json:"ticket_price"`
	Status          ActivityStatus `gorm:"size:30;index;default:draft" json:"status"`
	CheckinStatus   CheckinStatus `gorm:"size:30;default:not_started" json:"checkin_status"`
	CreatedBy       uint          `json:"created_by"`
	ManagedBy       *uint         `json:"managed_by"`
	ApprovedBy      *uint         `json:"approved_by"`
	ApprovedAt      *time.Time    `json:"approved_at"`
	CreatedAt       time.Time     `json:"created_at"`
	UpdatedAt       time.Time     `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`

	Creator  *User `gorm:"foreignKey:CreatedBy" json:"creator,omitempty"`
	Manager  *User `gorm:"foreignKey:ManagedBy" json:"manager,omitempty"`
	Approver *User `gorm:"foreignKey:ApprovedBy" json:"approver,omitempty"`
}

type ActivityRegistration struct {
	ID               uint               `gorm:"primaryKey" json:"id"`
	RegistrationNo   string             `gorm:"size:50;uniqueIndex;not null" json:"registration_no"`
	ActivityID       uint               `gorm:"not null;index" json:"activity_id"`
	MemberID         *uint              `json:"member_id"`
	MemberName       string             `gorm:"size:100;not null" json:"member_name"`
	MemberPhone      string             `gorm:"size:20;index" json:"member_phone"`
	MemberEmail      string             `gorm:"size:100" json:"member_email"`
	Participants     int                `gorm:"default:1" json:"participants"`
	Status           RegistrationStatus `gorm:"size:30;index;default:pending" json:"status"`
	TicketID         *uint              `json:"ticket_id"`
	CheckinTime      *time.Time         `json:"checkin_time"`
	CheckinBy        *uint              `json:"checkin_by"`
	RegisteredBy     uint               `json:"registered_by"`
	RegisteredAt     time.Time          `json:"registered_at"`
	ConfirmedBy      *uint              `json:"confirmed_by"`
	ConfirmedAt      *time.Time         `json:"confirmed_at"`
	CreatedAt        time.Time          `json:"created_at"`
	UpdatedAt        time.Time          `json:"updated_at"`
	DeletedAt        gorm.DeletedAt     `gorm:"index" json:"-"`

	Activity *Activity `gorm:"foreignKey:ActivityID" json:"activity,omitempty"`
	Member   *User     `gorm:"foreignKey:MemberID" json:"member,omitempty"`
	Register *User     `gorm:"foreignKey:RegisteredBy" json:"register,omitempty"`
	Checker  *User     `gorm:"foreignKey:CheckinBy" json:"checker,omitempty"`
	Ticket   *Ticket   `gorm:"foreignKey:TicketID" json:"ticket,omitempty"`
}

type ActivityAuditLog struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	ActivityID    uint           `gorm:"index" json:"activity_id"`
	RegistrationID *uint          `json:"registration_id"`
	Action        string         `gorm:"size:100;not null" json:"action"`
	OperatorID    uint           `gorm:"not null" json:"operator_id"`
	OperatorName  string         `gorm:"size:100" json:"operator_name"`
	BeforeData    string         `gorm:"type:json" json:"before_data"`
	AfterData     string         `gorm:"type:json" json:"after_data"`
	Remark        string         `gorm:"type:text" json:"remark"`
	CreatedAt     time.Time      `json:"created_at"`

	Activity     *Activity `gorm:"foreignKey:ActivityID" json:"activity,omitempty"`
	Registration *ActivityRegistration `gorm:"foreignKey:RegistrationID" json:"registration,omitempty"`
	Operator     *User     `gorm:"foreignKey:OperatorID" json:"operator,omitempty"`
}

func (a *Activity) BeforeCreate(tx *gorm.DB) error {
	if a.ActivityNo == "" {
		a.ActivityNo = "ACT" + time.Now().Format("2006") + uuid.New().String()[:6]
	}
	return nil
}

func (ar *ActivityRegistration) BeforeCreate(tx *gorm.DB) error {
	if ar.RegistrationNo == "" {
		ar.RegistrationNo = "REG" + time.Now().Format("20060102") + uuid.New().String()[:6]
	}
	return nil
}
