package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TicketType string
type TicketStatus string
type VerifyStatus string

const (
	TicketTypeAdult    TicketType = "adult"
	TicketTypeStudent  TicketType = "student"
	TicketTypeSenior   TicketType = "senior"
	TicketTypeChild    TicketType = "child"
	TicketTypeMember   TicketType = "member"
	TicketTypeGroup    TicketType = "group"

	TicketStatusIssued   TicketStatus = "issued"
	TicketStatusVerified TicketStatus = "verified"
	TicketStatusExpired  TicketStatus = "expired"
	TicketStatusRefunded TicketStatus = "refunded"
	TicketStatusVoid     TicketStatus = "void"

	VerifyStatusNormal  VerifyStatus = "normal"
	VerifyStatusWarning VerifyStatus = "warning"
	VerifyStatusError   VerifyStatus = "error"
)

type Ticket struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	TicketNo       string         `gorm:"size:50;uniqueIndex;not null" json:"ticket_no"`
	QrCode         string         `gorm:"size:200;uniqueIndex" json:"qr_code"`
	Type           TicketType     `gorm:"size:30;not null;index" json:"type"`
	Price          float64        `gorm:"type:decimal(10,2);not null" json:"price"`
	OriginalPrice  float64        `gorm:"type:decimal(10,2)" json:"original_price"`
	VisitorName    string         `gorm:"size:100" json:"visitor_name"`
	VisitorPhone   string         `gorm:"size:20;index" json:"visitor_phone"`
	VisitorIDCard  string         `gorm:"size:30" json:"visitor_id_card"`
	VisitDate      time.Time      `gorm:"index" json:"visit_date"`
	ValidFrom      time.Time      `json:"valid_from"`
	ValidTo        time.Time      `json:"valid_to"`
	Status         TicketStatus   `gorm:"size:30;index;default:issued" json:"status"`
	Channel        string         `gorm:"size:50;default:onsite" json:"channel"`
	OrderNo        string         `gorm:"size:50;index" json:"order_no"`
	MemberID       *uint          `json:"member_id,omitempty"`
	ActivityID     *uint          `json:"activity_id,omitempty"`
	IssuedBy       uint           `json:"issued_by"`
	IssuedAt       time.Time      `json:"issued_at"`
	VerifiedBy     *uint          `json:"verified_by,omitempty"`
	VerifiedAt     *time.Time     `json:"verified_at,omitempty"`
	VerifyStation  string         `gorm:"size:50" json:"verify_station"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`

	Issuer   *User `gorm:"foreignKey:IssuedBy" json:"issuer,omitempty"`
	Verifier *User `gorm:"foreignKey:VerifiedBy" json:"verifier,omitempty"`
	Member   *User `gorm:"foreignKey:MemberID" json:"member,omitempty"`
	Activity *Activity `gorm:"foreignKey:ActivityID" json:"activity,omitempty"`
}

type TicketVerifyLog struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	TicketID     uint           `gorm:"not null;index" json:"ticket_id"`
	TicketNo     string         `gorm:"size:50;index" json:"ticket_no"`
	OperatorID   uint           `gorm:"not null" json:"operator_id"`
	OperatorName string         `gorm:"size:100" json:"operator_name"`
	Station      string         `gorm:"size:50" json:"station"`
	VerifyStatus VerifyStatus   `gorm:"size:30;default:normal" json:"verify_status"`
	Message      string         `gorm:"type:text" json:"message"`
	BeforeStatus TicketStatus   `gorm:"size:30" json:"before_status"`
	AfterStatus  TicketStatus   `gorm:"size:30" json:"after_status"`
	ClientIP     string         `gorm:"size:50" json:"client_ip"`
	UserAgent    string         `gorm:"size:500" json:"user_agent"`
	CreatedAt    time.Time      `json:"created_at"`

	Ticket   *Ticket `gorm:"foreignKey:TicketID" json:"ticket,omitempty"`
	Operator *User   `gorm:"foreignKey:OperatorID" json:"operator,omitempty"`
}

func (t *Ticket) BeforeCreate(tx *gorm.DB) error {
	if t.TicketNo == "" {
		t.TicketNo = "TK" + time.Now().Format("20060102") + uuid.New().String()[:6]
	}
	if t.QrCode == "" {
		t.QrCode = uuid.New().String()
	}
	return nil
}
