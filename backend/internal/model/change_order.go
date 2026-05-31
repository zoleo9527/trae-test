package model

import (
	"time"

	"github.com/google/uuid"
)

type ChangeOrder struct {
	ID           uuid.UUID  `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	ProjectID    uuid.UUID  `gorm:"type:uuid;not null;index:idx_change_order_project" json:"project_id"`
	TeamID       uuid.UUID  `gorm:"type:uuid;not null" json:"team_id"`
	ChangeType   string     `gorm:"size:64;not null" json:"change_type"`
	Description  string     `gorm:"type:text;not null" json:"description"`
	BeforeValue  MapJSON    `gorm:"type:jsonb" json:"before_value"`
	AfterValue   MapJSON    `gorm:"type:jsonb" json:"after_value"`
	ImpactAmount float64    `gorm:"type:numeric(12,2);not null;default:0" json:"impact_amount"`
	RequestedBy  uuid.UUID  `gorm:"type:uuid;not null" json:"requested_by"`
	ConfirmedBy  *uuid.UUID `gorm:"type:uuid" json:"confirmed_by"`
	ConfirmedAt  *time.Time `json:"confirmed_at"`
	Status       string     `gorm:"size:32;not null;default:'pending';index:idx_change_order_status" json:"status"`
	Remark       string     `gorm:"type:text" json:"remark"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

func (ChangeOrder) TableName() string { return "change_orders" }
