package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SupplyStatus string

const (
	SupplyStatusPending   SupplyStatus = "pending"
	SupplyStatusApproved SupplyStatus = "approved"
	SupplyStatusIssued  SupplyStatus = "issued"
	SupplyStatusRejected SupplyStatus = "rejected"
)

type SupplyRequest struct {
	ID            uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	CamperID      uuid.UUID      `gorm:"type:uuid;index;not null" json:"camper_id"`
	RequestedBy   uuid.UUID      `gorm:"type:uuid;not null" json:"requested_by"`
	ItemName      string         `gorm:"type:varchar(200);not null" json:"item_name"`
	Quantity      int            `gorm:"not null" json:"quantity"`
	Unit          string         `gorm:"type:varchar(20)" json:"unit"`
	Reason        string         `gorm:"type:text;not null" json:"reason"`
	Status        SupplyStatus   `gorm:"type:varchar(20);default:pending;not null" json:"status"`
	ApprovedBy    *uuid.UUID     `gorm:"type:uuid" json:"approved_by,omitempty"`
	ApprovedAt    *time.Time    `json:"approved_at,omitempty"`
	IssuedAt      *time.Time    `json:"issued_at,omitempty"`
	Remark        string         `gorm:"type:text" json:"remark"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`

	Camper    Camper `gorm:"foreignKey:CamperID" json:"camper,omitempty"`
	Requester User   `gorm:"foreignKey:RequestedBy" json:"requester,omitempty"`
	Approver  *User  `gorm:"foreignKey:ApprovedBy" json:"approver,omitempty"`
}

func (s *SupplyRequest) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}
