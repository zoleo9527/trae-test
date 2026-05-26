package dto

import (
	"time"

	"swimclub/internal/model"
)

type LoginReq struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResp struct {
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
	User      model.User `json:"user"`
}

type CreateUserReq struct {
	Username    string    `json:"username"`
	Password    string    `json:"password"`
	Role        model.Role `json:"role"`
	DisplayName string    `json:"display_name"`
}

type CreateMemberReq struct {
	Name          string    `json:"name"`
	Phone         string    `json:"phone"`
	MembershipEnd time.Time `json:"membership_end"`
	Balance       int64     `json:"balance"`
	CoursesTotal  int       `json:"courses_total"`
	CoursesUsed   int       `json:"courses_used"`
	UserID        *int64    `json:"user_id"`
}

type CreateLeaveReq struct {
	MemberID     int64     `json:"member_id"`
	StartDate    time.Time `json:"start_date"`
	EndDate      time.Time `json:"end_date"`
	Reason       string    `json:"reason"`
	CourseDeduct int       `json:"course_deduct"`
}

type ApproveLeaveReq struct {
	CourseDeduct int  `json:"course_deduct"`
	ApplyDeduct  bool `json:"apply_deduct"`
}

type RejectLeaveReq struct {
	Reason string `json:"reason"`
}

type CreateRenewalReq struct {
	MemberID   int64     `json:"member_id"`
	ExpireAt   time.Time `json:"expire_at"`
	Channel    string    `json:"channel"`
	AssignedTo *int64    `json:"assigned_to"`
}

type UpdateRenewalReq struct {
	Status       model.RenewalStatus `json:"status"`
	AssignedTo   *int64              `json:"assigned_to"`
	Note         *string             `json:"note"`
	ClosedReason *string             `json:"closed_reason"`
}

type CreateNoteReq struct {
	Target   string `json:"target"`
	TargetID int64  `json:"target_id"`
	Content  string `json:"content"`
}

type ListQuery struct {
	Status    string    `query:"status"`
	MemberID  int64     `query:"member_id"`
	Assigned  int64     `query:"assigned"`
	Channel   string    `query:"channel"`
	From      time.Time `query:"from"`
	To        time.Time `query:"to"`
	Q         string    `query:"q"`
	Limit     int       `query:"limit"`
	Offset    int       `query:"offset"`
}
