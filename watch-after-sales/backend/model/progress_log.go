package model

import "time"

type ProgressLog struct {
	ID           uint        `gorm:"primarykey" json:"id"`
	RepairOrderID uint       `gorm:"not null;index" json:"repair_order_id"`
	RepairOrder  RepairOrder `gorm:"foreignKey:RepairOrderID" json:"-"`
	StatusFrom   string      `gorm:"size:20" json:"status_from"`
	StatusTo     string      `gorm:"size:20;not null" json:"status_to"`
	Note         string      `gorm:"type:text" json:"note"`
	OperatorID   uint        `gorm:"not null;index" json:"operator_id"`
	Operator     User        `gorm:"foreignKey:OperatorID" json:"operator,omitempty"`
	CreatedAt    time.Time   `json:"created_at"`
}
