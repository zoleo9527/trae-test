package models

import (
	"time"

	"github.com/google/uuid"
)

type AuditLog struct {
	BaseModel
	EntityType string    `gorm:"type:varchar(50);not null;index" json:"entity_type"`
	EntityID   uuid.UUID `gorm:"type:uuid;not null;index" json:"entity_id"`
	Action     string    `gorm:"type:varchar(50);not null;index" json:"action"`
	OldStatus  string    `gorm:"type:varchar(50)" json:"old_status"`
	NewStatus  string    `gorm:"type:varchar(50)" json:"new_status"`
	OperatorID uuid.UUID `gorm:"type:uuid;not null;index" json:"operator_id"`
	Operator   User      `gorm:"foreignKey:OperatorID" json:"operator,omitempty"`
	OperatorName string  `gorm:"type:varchar(100);not null" json:"operator_name"`
	Changes    string    `gorm:"type:text" json:"changes"`
	Remark     string    `gorm:"type:text" json:"remark"`
	IPAddress  string    `gorm:"type:varchar(50)" json:"ip_address"`
	UserAgent  string    `gorm:"type:varchar(500)" json:"user_agent"`
}

type AsyncTask struct {
	BaseModel
	TaskType   string    `gorm:"type:varchar(50);not null;index" json:"task_type"`
	Status     string    `gorm:"type:varchar(20);not null;index;default:pending" json:"status"`
	Payload    string    `gorm:"type:text" json:"payload"`
	Result     string    `gorm:"type:text" json:"result"`
	ErrorMsg   string    `gorm:"type:text" json:"error_msg"`
	FilePath   string    `gorm:"type:varchar(500)" json:"file_path"`
	CreatedBy  uuid.UUID `gorm:"type:uuid;not null;index" json:"created_by"`
	StartedAt  *time.Time `json:"started_at"`
	FinishedAt *time.Time `json:"finished_at"`
	Progress   int       `gorm:"default:0" json:"progress"`
}

type PriceApproval struct {
	BaseModel
	OrderID    uuid.UUID `gorm:"type:uuid;not null;uniqueIndex" json:"order_id"`
	Order      Order     `gorm:"foreignKey:OrderID" json:"order,omitempty"`
	Status     string    `gorm:"type:varchar(20);not null;index;default:pending" json:"status"`
	ApplicantID uuid.UUID `gorm:"type:uuid;not null" json:"applicant_id"`
	Applicant  User      `gorm:"foreignKey:ApplicantID" json:"applicant,omitempty"`
	ApproverID *uuid.UUID `gorm:"type:uuid;index" json:"approver_id"`
	Approver   *User     `gorm:"foreignKey:ApproverID" json:"approver,omitempty"`
	Reason     string    `gorm:"type:text;not null" json:"reason"`
	ApprovalOpinion string `gorm:"type:text" json:"approval_opinion"`
	SubmittedAt time.Time `json:"submitted_at"`
	ApprovedAt  *time.Time `json:"approved_at"`
}
