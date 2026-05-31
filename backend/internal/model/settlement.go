package model

import (
	"time"

	"github.com/google/uuid"
)

type SettlementBatch struct {
	ID          uuid.UUID  `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	TeamID      uuid.UUID  `gorm:"type:uuid;not null;index:idx_settlement_batch_team" json:"team_id"`
	ProjectID   uuid.UUID  `gorm:"type:uuid;not null;index:idx_settlement_batch_project" json:"project_id"`
	PeriodStart time.Time  `gorm:"type:date;not null" json:"period_start"`
	PeriodEnd   time.Time  `gorm:"type:date;not null" json:"period_end"`
	TotalAmount float64    `gorm:"type:numeric(12,2);not null;default:0" json:"total_amount"`
	Status      string     `gorm:"size:32;not null;default:'draft';index:idx_settlement_batch_status" json:"status"`
	SubmittedBy *uuid.UUID `gorm:"type:uuid" json:"submitted_by"`
	VerifiedBy  *uuid.UUID `gorm:"type:uuid" json:"verified_by"`
	ApprovedBy  *uuid.UUID `gorm:"type:uuid" json:"approved_by"`
	SubmittedAt *time.Time `json:"submitted_at"`
	VerifiedAt  *time.Time `json:"verified_at"`
	ApprovedAt  *time.Time `json:"approved_at"`
	PaidAt      *time.Time `json:"paid_at"`
	Remark      string     `gorm:"type:text" json:"remark"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	Items       []SettlementItem `gorm:"foreignKey:SettlementBatchID" json:"items,omitempty"`
}

func (SettlementBatch) TableName() string { return "settlement_batches" }

type SettlementItem struct {
	ID                 uuid.UUID  `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	SettlementBatchID  uuid.UUID  `gorm:"type:uuid;not null;index:idx_settlement_item_batch" json:"settlement_batch_id"`
	AttendanceRecordID *uuid.UUID `gorm:"type:uuid" json:"attendance_record_id"`
	WorkerName         string     `gorm:"size:64;not null" json:"worker_name"`
	RecordDate         time.Time  `gorm:"type:date;not null" json:"record_date"`
	WorkArea           string     `gorm:"size:128" json:"work_area"`
	WorkContent        string     `gorm:"type:text" json:"work_content"`
	Quantity           float64    `gorm:"type:numeric(10,2);not null;default:0" json:"quantity"`
	Unit               string     `gorm:"size:16;not null;default:'工日'" json:"unit"`
	UnitPrice          float64    `gorm:"type:numeric(10,2);not null;default:0" json:"unit_price"`
	DailyAmount        float64    `gorm:"type:numeric(12,2);not null;default:0" json:"daily_amount"`
	Remark             string     `gorm:"type:text" json:"remark"`
	CreatedAt          time.Time  `json:"created_at"`
}

func (SettlementItem) TableName() string { return "settlement_items" }
