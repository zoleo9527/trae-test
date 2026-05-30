package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Role string

const (
	RoleReception    Role = "reception"
	RoleCoachManager Role = "coach_manager"
	RoleVenueManager Role = "venue_manager"
	RoleCoach        Role = "coach"
)

type User struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Username  string    `gorm:"unique;not null" json:"username"`
	Password  string    `json:"-"`
	Name      string    `json:"name"`
	Role      Role      `json:"role"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	u.ID = uuid.New()
	return nil
}

type Member struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Name        string    `json:"name"`
	Phone       string    `gorm:"unique" json:"phone"`
	Level       string    `json:"level"`
	JoinDate    time.Time `json:"joinDate"`
	TotalSpent  float64   `json:"totalSpent"`
	TotalVisits int       `json:"totalVisits"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
	Wallet      Wallet    `gorm:"foreignKey:MemberID" json:"wallet,omitempty"`
}

func (m *Member) BeforeCreate(tx *gorm.DB) error {
	m.ID = uuid.New()
	return nil
}

type Wallet struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	MemberID   uuid.UUID `gorm:"type:uuid;not null" json:"memberId"`
	Balance    float64   `json:"balance"`
	TotalRecharged float64 `json:"totalRecharged"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

func (w *Wallet) BeforeCreate(tx *gorm.DB) error {
	w.ID = uuid.New()
	return nil
}

type WalletRecord struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	WalletID    uuid.UUID `gorm:"type:uuid;not null" json:"walletId"`
	MemberID    uuid.UUID `gorm:"type:uuid;not null" json:"memberId"`
	BookingID   *uuid.UUID `gorm:"type:uuid" json:"bookingId,omitempty"`
	Type        string    `json:"type"`
	Amount      float64   `json:"amount"`
	BalanceBefore float64 `json:"balanceBefore"`
	BalanceAfter  float64 `json:"balanceAfter"`
	OperatorID  uuid.UUID `gorm:"type:uuid;not null" json:"operatorId"`
	Remark      string    `json:"remark"`
	CreatedAt   time.Time `json:"createdAt"`
}

func (w *WalletRecord) BeforeCreate(tx *gorm.DB) error {
	w.ID = uuid.New()
	return nil
}

type Bay struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	BayNumber  string    `json:"bayNumber"`
	Type       string    `json:"type"`
	Floor      int       `json:"floor"`
	Status     string    `json:"status"`
	HourlyRate float64   `json:"hourlyRate"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

func (b *Bay) BeforeCreate(tx *gorm.DB) error {
	b.ID = uuid.New()
	return nil
}

type BookingStatus string

const (
	BookingStatusPending   BookingStatus = "pending"
	BookingStatusConfirmed BookingStatus = "confirmed"
	BookingStatusCheckedIn BookingStatus = "checked_in"
	BookingStatusCompleted BookingStatus = "completed"
	BookingStatusNoShow    BookingStatus = "no_show"
	BookingStatusCancelled BookingStatus = "cancelled"
	BookingStatusException BookingStatus = "exception"
)

type Booking struct {
	ID              uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	MemberID        uuid.UUID      `gorm:"type:uuid;not null" json:"memberId"`
	BayID           uuid.UUID      `gorm:"type:uuid;not null" json:"bayId"`
	CoachID         *uuid.UUID     `gorm:"type:uuid" json:"coachId,omitempty"`
	ScheduleID      *uuid.UUID     `gorm:"type:uuid" json:"scheduleId,omitempty"`
	MemberName      string         `json:"memberName"`
	MemberPhone     string         `json:"memberPhone"`
	BayNumber       string         `json:"bayNumber"`
	CoachName       string         `json:"coachName,omitempty"`
	StartAt         time.Time      `json:"startAt"`
	EndAt           time.Time      `json:"endAt"`
	DurationHours   float64        `json:"durationHours"`
	Status          BookingStatus  `json:"status"`
	TotalAmount     float64        `json:"totalAmount"`
	PaidAmount      float64        `json:"paidAmount"`
	PaymentMethod   string         `json:"paymentMethod,omitempty"`
	GuestCount      int            `json:"guestCount"`
	IncludeCoaching bool           `json:"includeCoaching"`
	CheckInTime     *time.Time     `json:"checkInTime,omitempty"`
	CheckOutTime    *time.Time     `json:"checkOutTime,omitempty"`
	Remark          string         `json:"remark,omitempty"`
	OperatorID      uuid.UUID      `gorm:"type:uuid;not null" json:"operatorId"`
	OperatorName    string         `json:"operatorName"`
	CreatedAt       time.Time      `json:"createdAt"`
	UpdatedAt       time.Time      `json:"updatedAt"`
	Member          Member         `gorm:"foreignKey:MemberID" json:"member,omitempty"`
	Bay             Bay            `gorm:"foreignKey:BayID" json:"bay,omitempty"`
	Coach           *User          `gorm:"foreignKey:CoachID" json:"coach,omitempty"`
	Exceptions      []Exception    `gorm:"foreignKey:BookingID" json:"exceptions,omitempty"`
	EquipmentRentals []EquipmentRental `gorm:"foreignKey:BookingID" json:"equipmentRentals,omitempty"`
	WalletRecords   []WalletRecord `gorm:"foreignKey:BookingID" json:"walletRecords,omitempty"`
	AuditLogs       []AuditLog     `gorm:"foreignKey:BookingID" json:"auditLogs,omitempty"`
}

func (b *Booking) BeforeCreate(tx *gorm.DB) error {
	b.ID = uuid.New()
	return nil
}

type CoachSchedule struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	CoachID   uuid.UUID `gorm:"type:uuid;not null" json:"coachId"`
	CoachName string    `json:"coachName"`
	Date      time.Time `json:"date"`
	StartAt   time.Time `json:"startAt"`
	EndAt     time.Time `json:"endAt"`
	Type      string    `json:"type"`
	Status    string    `json:"status"`
	Capacity  int       `json:"capacity"`
	BookedCount int     `json:"bookedCount"`
	Remark    string    `json:"remark,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	Bookings  []Booking `gorm:"foreignKey:ScheduleID" json:"bookings,omitempty"`
}

func (c *CoachSchedule) BeforeCreate(tx *gorm.DB) error {
	c.ID = uuid.New()
	return nil
}

type Equipment struct {
	ID            uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Name          string    `json:"name"`
	Category      string    `json:"category"`
	Brand         string    `json:"brand"`
	SerialNumber  string    `json:"serialNumber"`
	Status        string    `json:"status"`
	Condition     string    `json:"condition"`
	DailyRate     float64   `json:"dailyRate"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

func (e *Equipment) BeforeCreate(tx *gorm.DB) error {
	e.ID = uuid.New()
	return nil
}

type EquipmentRental struct {
	ID          uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	BookingID   uuid.UUID  `gorm:"type:uuid;not null" json:"bookingId"`
	EquipmentID uuid.UUID  `gorm:"type:uuid;not null" json:"equipmentId"`
	MemberID    uuid.UUID  `gorm:"type:uuid;not null" json:"memberId"`
	EquipmentName string   `json:"equipmentName"`
	RentedAt    time.Time  `json:"rentedAt"`
	ReturnedAt  *time.Time `json:"returnedAt,omitempty"`
	ConditionOut string    `json:"conditionOut"`
	ConditionIn  string    `json:"conditionIn,omitempty"`
	DamageReported bool    `json:"damageReported"`
	DamageNote   string    `json:"damageNote,omitempty"`
	Fee          float64   `json:"fee"`
	OperatorID   uuid.UUID `gorm:"type:uuid;not null" json:"operatorId"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

func (e *EquipmentRental) BeforeCreate(tx *gorm.DB) error {
	e.ID = uuid.New()
	return nil
}

type ExceptionSeverity string

const (
	SeverityLow    ExceptionSeverity = "low"
	SeverityMedium ExceptionSeverity = "medium"
	SeverityHigh   ExceptionSeverity = "high"
	SeverityCritical ExceptionSeverity = "critical"
)

type ExceptionStatus string

const (
	ExceptionStatusOpen     ExceptionStatus = "open"
	ExceptionStatusInvestigating ExceptionStatus = "investigating"
	ExceptionStatusResolved ExceptionStatus = "resolved"
	ExceptionStatusClosed   ExceptionStatus = "closed"
)

type ExceptionType string

const (
	ExceptionTypeNoShow        ExceptionType = "no_show"
	ExceptionTypeLate          ExceptionType = "late"
	ExceptionTypeOverstay      ExceptionType = "overstay"
	ExceptionTypePaymentIssue  ExceptionType = "payment_issue"
	ExceptionTypeEquipmentDamage ExceptionType = "equipment_damage"
	ExceptionTypeComplaint     ExceptionType = "complaint"
	ExceptionTypeScheduleConflict ExceptionType = "schedule_conflict"
	ExceptionTypeBayIssue      ExceptionType = "bay_issue"
	ExceptionTypeOther         ExceptionType = "other"
)

type Exception struct {
	ID              uuid.UUID         `gorm:"type:uuid;primaryKey" json:"id"`
	BookingID       uuid.UUID         `gorm:"type:uuid;not null" json:"bookingId"`
	ReportedByID    uuid.UUID         `gorm:"type:uuid;not null" json:"reportedById"`
	ReportedByName  string            `json:"reportedByName"`
	Type            ExceptionType     `json:"type"`
	Severity        ExceptionSeverity `json:"severity"`
	Status          ExceptionStatus   `json:"status"`
	Title           string            `json:"title"`
	Description     string            `json:"description"`
	Resolution      string            `json:"resolution,omitempty"`
	RefundAmount    float64           `json:"refundAmount,omitempty"`
	PenaltyAmount   float64           `json:"penaltyAmount,omitempty"`
	ResolvedByID    *uuid.UUID        `gorm:"type:uuid" json:"resolvedById,omitempty"`
	ResolvedByName  string            `json:"resolvedByName,omitempty"`
	ResolvedAt      *time.Time        `json:"resolvedAt,omitempty"`
	CreatedAt       time.Time         `json:"createdAt"`
	UpdatedAt       time.Time         `json:"updatedAt"`
	FollowUps       []ExceptionFollowUp `gorm:"foreignKey:ExceptionID" json:"followUps,omitempty"`
}

func (e *Exception) BeforeCreate(tx *gorm.DB) error {
	e.ID = uuid.New()
	return nil
}

type ExceptionFollowUp struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	ExceptionID uuid.UUID `gorm:"type:uuid;not null" json:"exceptionId"`
	OperatorID  uuid.UUID `gorm:"type:uuid;not null" json:"operatorId"`
	OperatorName string   `json:"operatorName"`
	Note        string    `json:"note"`
	CreatedAt   time.Time `json:"createdAt"`
}

func (e *ExceptionFollowUp) BeforeCreate(tx *gorm.DB) error {
	e.ID = uuid.New()
	return nil
}

type AuditLog struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	BookingID   *uuid.UUID `gorm:"type:uuid" json:"bookingId,omitempty"`
	MemberID    *uuid.UUID `gorm:"type:uuid" json:"memberId,omitempty"`
	UserID      uuid.UUID  `gorm:"type:uuid;not null" json:"userId"`
	UserName    string     `json:"userName"`
	Action      string     `json:"action"`
	EntityType  string     `json:"entityType"`
	EntityID    uuid.UUID  `gorm:"type:uuid" json:"entityId"`
	OldValue    string     `json:"oldValue,omitempty"`
	NewValue    string     `json:"newValue,omitempty"`
	IpAddress   string     `json:"ipAddress,omitempty"`
	CreatedAt   time.Time  `json:"createdAt"`
}

func (a *AuditLog) BeforeCreate(tx *gorm.DB) error {
	a.ID = uuid.New()
	return nil
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type CreateBookingRequest struct {
	MemberID        string    `json:"memberId"`
	BayID           string    `json:"bayId"`
	CoachID         string    `json:"coachId,omitempty"`
	ScheduleID      string    `json:"scheduleId,omitempty"`
	StartAt         time.Time `json:"startAt"`
	EndAt           time.Time `json:"endAt"`
	GuestCount      int       `json:"guestCount"`
	IncludeCoaching bool      `json:"includeCoaching"`
	PaymentMethod   string    `json:"paymentMethod"`
	Remark          string    `json:"remark,omitempty"`
}

type ExceptionRequest struct {
	Type        string `json:"type"`
	Severity    string `json:"severity"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

type ResolveExceptionRequest struct {
	Resolution    string  `json:"resolution"`
	RefundAmount  float64 `json:"refundAmount"`
	PenaltyAmount float64 `json:"penaltyAmount"`
	Status        string  `json:"status"`
}

type FollowUpRequest struct {
	Note string `json:"note"`
}
