package model

import "time"

type CallbackType string

const (
	CallbackSatisfaction CallbackType = "satisfaction"
	CallbackQualityCheck CallbackType = "quality_check"
)

type CallbackResult string

const (
	ResultSatisfied   CallbackResult = "satisfied"
	ResultNeutral     CallbackResult = "neutral"
	ResultUnsatisfied CallbackResult = "unsatisfied"
)

type SatisfactionCallback struct {
	ID            uint           `gorm:"primarykey" json:"id"`
	RepairOrderID uint           `gorm:"not null;index" json:"repair_order_id"`
	RepairOrder   RepairOrder    `gorm:"foreignKey:RepairOrderID" json:"repair_order,omitempty"`
	CallbackType  CallbackType   `gorm:"size:20;not null" json:"callback_type"`
	ScheduledAt   time.Time      `gorm:"not null" json:"scheduled_at"`
	CompletedAt   *time.Time     `json:"completed_at"`
	Result        *CallbackResult `gorm:"size:20" json:"result"`
	Note          *string        `gorm:"type:text" json:"note"`
	OperatorID    uint           `gorm:"not null;index" json:"operator_id"`
	Operator      User           `gorm:"foreignKey:OperatorID" json:"operator,omitempty"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
}
