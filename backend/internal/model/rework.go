package model

import (
	"time"

	"github.com/google/uuid"
)

type ReworkRecord struct {
	ID                   uuid.UUID  `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	ProjectID            uuid.UUID  `gorm:"type:uuid;not null;index:idx_rework_project" json:"project_id"`
	TeamID               uuid.UUID  `gorm:"type:uuid;not null" json:"team_id"`
	QualityInspectionID  uuid.UUID  `gorm:"type:uuid;not null;index:idx_rework_inspection" json:"quality_inspection_id"`
	Reason               string     `gorm:"type:text;not null" json:"reason"`
	Description          string     `gorm:"type:text" json:"description"`
	Cost                 float64    `gorm:"type:numeric(12,2);not null;default:0" json:"cost"`
	ResponsiblePerson    string     `gorm:"size:64;not null" json:"responsible_person"`
	SettlementBatchID    *uuid.UUID `gorm:"type:uuid" json:"settlement_batch_id"`
	CompletedAt          *time.Time `json:"completed_at"`
	Status               string     `gorm:"size:32;not null;default:'pending'" json:"status"`
	Remark               string     `gorm:"type:text" json:"remark"`
	CreatedBy            uuid.UUID  `gorm:"type:uuid;not null" json:"created_by"`
	CreatedAt            time.Time  `json:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at"`
}

func (ReworkRecord) TableName() string { return "rework_records" }
