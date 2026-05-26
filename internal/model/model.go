package model

import "time"

type Role string

const (
	RoleOwner     Role = "owner"
	RoleCoachHead Role = "coach_head"
	RoleFrontDesk Role = "front_desk"
	RoleMember    Role = "member"
)

type User struct {
	ID           int64     `json:"id"`
	Username     string    `json:"username"`
	PasswordHash string    `json:"-"`
	Role         Role      `json:"role"`
	DisplayName  string    `json:"display_name"`
	CreatedAt    time.Time `json:"created_at"`
}

type Member struct {
	ID            int64     `json:"id"`
	UserID        *int64    `json:"user_id"`
	Name          string    `json:"name"`
	Phone         string    `json:"phone"`
	MembershipEnd time.Time `json:"membership_end"`
	Balance       int64     `json:"balance"`
	CoursesTotal  int       `json:"courses_total"`
	CoursesUsed   int       `json:"courses_used"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
}

type LeaveStatus string

const (
	LeavePending   LeaveStatus = "pending"
	LeaveApproved  LeaveStatus = "approved"
	LeaveRejected  LeaveStatus = "rejected"
	LeaveCancelled LeaveStatus = "cancelled"
)

type LeaveRequest struct {
	ID           int64       `json:"id"`
	MemberID     int64       `json:"member_id"`
	StartDate    time.Time   `json:"start_date"`
	EndDate      time.Time   `json:"end_date"`
	Reason       string      `json:"reason"`
	Status       LeaveStatus `json:"status"`
	CourseDeduct int         `json:"course_deduct"`
	ApproverID   *int64      `json:"approver_id"`
	ApprovedAt   *time.Time  `json:"approved_at"`
	RejectReason *string     `json:"reject_reason"`
	CreatedBy    int64       `json:"created_by"`
	CreatedAt    time.Time   `json:"created_at"`
	UpdatedAt    time.Time   `json:"updated_at"`
}

type RenewalStatus string

const (
	RenewalOpen    RenewalStatus = "open"
	RenewalNoticed RenewalStatus = "noticed"
	RenewalPaid    RenewalStatus = "paid"
	RenewalClosed  RenewalStatus = "closed"
)

type RenewalReminder struct {
	ID           int64         `json:"id"`
	MemberID     int64         `json:"member_id"`
	ExpireAt     time.Time     `json:"expire_at"`
	Channel      string        `json:"channel"`
	Status       RenewalStatus `json:"status"`
	AssignedTo   *int64        `json:"assigned_to"`
	Note         *string       `json:"note"`
	NoticedBy    *int64        `json:"noticed_by"`
	NoticedAt    *time.Time    `json:"noticed_at"`
	ClosedReason *string       `json:"closed_reason"`
	CreatedAt    time.Time     `json:"created_at"`
	UpdatedAt    time.Time     `json:"updated_at"`
}

type Note struct {
	ID        int64     `json:"id"`
	Target    string    `json:"target"`
	TargetID  int64     `json:"target_id"`
	AuthorID  int64     `json:"author_id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

type AuditLog struct {
	ID         int64          `json:"id"`
	EntityType string         `json:"entity_type"`
	EntityID   int64          `json:"entity_id"`
	Action     string         `json:"action"`
	OldValue   map[string]any `json:"old_value"`
	NewValue   map[string]any `json:"new_value"`
	ActorID    int64          `json:"actor_id"`
	ActorName  string         `json:"actor_name"`
	At         time.Time      `json:"at"`
}

type NotificationJob struct {
	ID        int64     `json:"id"`
	Kind      string    `json:"kind"`
	TargetID  int64     `json:"target_id"`
	Payload   string    `json:"payload"`
	Status    string    `json:"status"`
	Attempts  int       `json:"attempts"`
	NextRunAt time.Time `json:"next_run_at"`
	LastError *string   `json:"last_error"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
