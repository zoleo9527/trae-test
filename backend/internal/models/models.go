package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID           string    `json:"id" gorm:"type:text;primaryKey"`
	Username     string    `json:"username" gorm:"type:text;uniqueIndex;not null"`
	PasswordHash string    `json:"-" gorm:"column:password_hash;type:text;not null"`
	DisplayName  string    `json:"display_name" gorm:"column:display_name;type:text"`
	Role         string    `json:"role" gorm:"type:text;not null"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == "" {
		u.ID = uuid.New().String()
	}
	return nil
}

type Room struct {
	ID        string    `json:"id" gorm:"type:text;primaryKey"`
	Name      string    `json:"name" gorm:"type:text;not null"`
	Building  string    `json:"building" gorm:"type:text;not null"`
	Capacity  int       `json:"capacity" gorm:"not null"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Campers   []Camper  `json:"campers,omitempty" gorm:"foreignKey:RoomID"`
}

func (r *Room) BeforeCreate(tx *gorm.DB) error {
	if r.ID == "" {
		r.ID = uuid.New().String()
	}
	return nil
}

type Camper struct {
	ID               string    `json:"id" gorm:"type:text;primaryKey"`
	Name             string    `json:"name" gorm:"type:text;not null"`
	Gender           string    `json:"gender" gorm:"type:text"`
	Age              int       `json:"age"`
	GroupName        string    `json:"group_name" gorm:"column:group_name;type:text;index"`
	EmergencyContact string    `json:"emergency_contact" gorm:"column:emergency_contact;type:text"`
	EmergencyPhone   string    `json:"emergency_phone" gorm:"column:emergency_phone;type:text"`
	HealthNotes      string    `json:"health_notes" gorm:"column:health_notes;type:text"`
	RoomID           *string   `json:"room_id" gorm:"column:room_id;type:text"`
	Status           string    `json:"status" gorm:"type:text"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
	Room             *Room     `json:"room,omitempty" gorm:"foreignKey:RoomID"`
}

func (c *Camper) BeforeCreate(tx *gorm.DB) error {
	if c.ID == "" {
		c.ID = uuid.New().String()
	}
	return nil
}

type Attendance struct {
	ID             string    `json:"id" gorm:"type:text;primaryKey"`
	CamperID       string    `json:"camper_id" gorm:"column:camper_id;type:text;index;not null"`
	Date           string    `json:"date" gorm:"type:text;index"`
	Session        string    `json:"session" gorm:"type:text"`
	Status         string    `json:"status" gorm:"type:text"`
	Remark         string    `json:"remark" gorm:"type:text"`
	ApprovalStatus string    `json:"approval_status" gorm:"column:approval_status;type:text;index"`
	SubmittedBy    string    `json:"submitted_by" gorm:"column:submitted_by;type:text;not null"`
	ReviewedBy     *string   `json:"reviewed_by" gorm:"column:reviewed_by;type:text"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
	Camper         Camper    `json:"camper,omitempty" gorm:"foreignKey:CamperID"`
	Submitter      User      `json:"submitter,omitempty" gorm:"foreignKey:SubmittedBy"`
	Reviewer       *User     `json:"reviewer,omitempty" gorm:"foreignKey:ReviewedBy"`
}

func (a *Attendance) BeforeCreate(tx *gorm.DB) error {
	if a.ID == "" {
		a.ID = uuid.New().String()
	}
	return nil
}

type MedicalRecord struct {
	ID          string            `json:"id" gorm:"type:text;primaryKey"`
	CamperID    string            `json:"camper_id" gorm:"column:camper_id;type:text;index;not null"`
	Type        string            `json:"type" gorm:"type:text"`
	Description string            `json:"description" gorm:"type:text"`
	Severity    string            `json:"severity" gorm:"type:text"`
	Treatment   string            `json:"treatment" gorm:"type:text"`
	Status      string            `json:"status" gorm:"type:text;index"`
	ReportedBy  string            `json:"reported_by" gorm:"column:reported_by;type:text;not null"`
	ResolvedBy  *string           `json:"resolved_by" gorm:"column:resolved_by;type:text"`
	CreatedAt   time.Time         `json:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at"`
	Camper      Camper            `json:"camper,omitempty" gorm:"foreignKey:CamperID"`
	Reporter    User              `json:"reporter,omitempty" gorm:"foreignKey:ReportedBy"`
	Resolver    *User             `json:"resolver,omitempty" gorm:"foreignKey:ResolvedBy"`
	FollowUps   []MedicalFollowUp `json:"follow_ups,omitempty" gorm:"foreignKey:MedicalID"`
}

func (m *MedicalRecord) BeforeCreate(tx *gorm.DB) error {
	if m.ID == "" {
		m.ID = uuid.New().String()
	}
	return nil
}

type MedicalFollowUp struct {
	ID        string    `json:"id" gorm:"type:text;primaryKey"`
	MedicalID string    `json:"medical_id" gorm:"column:medical_id;type:text;index;not null"`
	Content   string    `json:"content" gorm:"type:text"`
	AuthorID  string    `json:"author_id" gorm:"column:author_id;type:text;not null"`
	CreatedAt time.Time `json:"created_at"`
	Author    User      `json:"author,omitempty" gorm:"foreignKey:AuthorID"`
}

func (f *MedicalFollowUp) BeforeCreate(tx *gorm.DB) error {
	if f.ID == "" {
		f.ID = uuid.New().String()
	}
	return nil
}

type Supply struct {
	ID          string    `json:"id" gorm:"type:text;primaryKey"`
	CamperID    string    `json:"camper_id" gorm:"column:camper_id;type:text;index;not null"`
	ItemName    string    `json:"item_name" gorm:"column:item_name;type:text;not null"`
	Quantity    int       `json:"quantity"`
	Reason      string    `json:"reason" gorm:"type:text"`
	Status      string    `json:"status" gorm:"type:text;index"`
	RequestedBy string    `json:"requested_by" gorm:"column:requested_by;type:text;not null"`
	FulfilledBy *string   `json:"fulfilled_by" gorm:"column:fulfilled_by;type:text"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	Camper      Camper    `json:"camper,omitempty" gorm:"foreignKey:CamperID"`
	Requester   User      `json:"requester,omitempty" gorm:"foreignKey:RequestedBy"`
	Fulfiller   *User     `json:"fulfiller,omitempty" gorm:"foreignKey:FulfilledBy"`
}

func (s *Supply) BeforeCreate(tx *gorm.DB) error {
	if s.ID == "" {
		s.ID = uuid.New().String()
	}
	return nil
}

type Feedback struct {
	ID             string    `json:"id" gorm:"type:text;primaryKey"`
	CamperID       string    `json:"camper_id" gorm:"column:camper_id;type:text;index;not null"`
	Type           string    `json:"type" gorm:"type:text"`
	Content        string    `json:"content" gorm:"type:text"`
	ParentResponse string    `json:"parent_response" gorm:"column:parent_response;type:text"`
	Status         string    `json:"status" gorm:"type:text;index"`
	AssigneeID     *string   `json:"assignee_id" gorm:"column:assignee_id;type:text"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
	Camper         Camper    `json:"camper,omitempty" gorm:"foreignKey:CamperID"`
	Assignee       *User     `json:"assignee,omitempty" gorm:"foreignKey:AssigneeID"`
}

func (f *Feedback) BeforeCreate(tx *gorm.DB) error {
	if f.ID == "" {
		f.ID = uuid.New().String()
	}
	return nil
}

type TimelineEvent struct {
	ID               string    `json:"id" gorm:"type:text;primaryKey"`
	CamperID         string    `json:"camper_id" gorm:"column:camper_id;type:text;index;not null"`
	EventType        string    `json:"event_type" gorm:"column:event_type;type:text"`
	EventTitle       string    `json:"event_title" gorm:"column:event_title;type:text"`
	EventDescription string    `json:"event_description" gorm:"column:event_description;type:text"`
	OperatorID       string    `json:"operator_id" gorm:"column:operator_id;type:text;not null"`
	CreatedAt        time.Time `json:"created_at"`
	Camper           Camper    `json:"camper,omitempty" gorm:"foreignKey:CamperID"`
	Operator         User      `json:"operator,omitempty" gorm:"foreignKey:OperatorID"`
}

func (t *TimelineEvent) BeforeCreate(tx *gorm.DB) error {
	if t.ID == "" {
		t.ID = uuid.New().String()
	}
	return nil
}
