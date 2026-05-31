package model

import (
	"time"

	"github.com/google/uuid"
)

type QualityInspection struct {
	ID              uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	ProjectID       uuid.UUID `gorm:"type:uuid;not null;index:idx_quality_project" json:"project_id"`
	TeamID          uuid.UUID `gorm:"type:uuid;not null;index:idx_quality_team" json:"team_id"`
	Area            string    `gorm:"size:128;not null" json:"area"`
	InspectionDate  time.Time `gorm:"type:date;not null" json:"inspection_date"`
	InspectorID     uuid.UUID `gorm:"type:uuid;not null" json:"inspector_id"`
	Result          string    `gorm:"size:16;not null;default:'pass'" json:"result"`
	IssuesFound     string    `gorm:"type:text" json:"issues_found"`
	ReworkRequired  bool      `gorm:"not null;default:false" json:"rework_required"`
	Remark          string    `gorm:"type:text" json:"remark"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

func (QualityInspection) TableName() string { return "quality_inspections" }
