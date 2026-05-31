package model

import "time"

type PartLock struct {
	ID            uint       `gorm:"primarykey" json:"id"`
	RepairOrderID uint       `gorm:"not null;index" json:"repair_order_id"`
	RepairOrder   RepairOrder `gorm:"foreignKey:RepairOrderID" json:"repair_order,omitempty"`
	PartID        uint       `gorm:"not null;index" json:"part_id"`
	Part          Part       `gorm:"foreignKey:PartID" json:"part,omitempty"`
	Quantity      int        `gorm:"not null" json:"quantity"`
	LockedBy      uint       `gorm:"not null;index" json:"locked_by"`
	LockedByUser  User       `gorm:"foreignKey:LockedBy" json:"locked_by_user,omitempty"`
	LockedAt      time.Time  `json:"locked_at"`
	ReleasedAt    *time.Time `json:"released_at"`
}
