package model

import (
	"time"

	"github.com/google/uuid"
)

type Team struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	ProjectID   uuid.UUID `gorm:"type:uuid;not null" json:"project_id"`
	Name        string    `gorm:"size:128;not null" json:"name"`
	LeaderName  string    `gorm:"size:64;not null" json:"leader_name"`
	LeaderPhone string    `gorm:"size:20" json:"leader_phone"`
	TradeType   string    `gorm:"size:64;not null" json:"trade_type"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (Team) TableName() string { return "teams" }
