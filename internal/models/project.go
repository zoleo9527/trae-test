package models

import (
	"time"
)

type ProjectPhase string

const (
	PhasePlanning   ProjectPhase = "planning"
	PhaseSetup      ProjectPhase = "setup"
	PhaseInspection ProjectPhase = "inspection"
	PhaseExhibition ProjectPhase = "exhibition"
	PhaseTeardown   ProjectPhase = "teardown"
	PhaseReview     ProjectPhase = "review"
	PhaseCompleted  ProjectPhase = "completed"
)

type Project struct {
	BaseModel
	Name          string       `gorm:"size:200;not null" json:"name"`
	Code          string       `gorm:"uniqueIndex;size:50;not null" json:"code"`
	Description   string       `gorm:"type:text" json:"description"`
	Location      string       `gorm:"size:200" json:"location"`
	BoothNumber   string       `gorm:"size:50" json:"booth_number"`
	Phase         ProjectPhase `gorm:"size:20;default:planning" json:"phase"`
	Status        Status       `gorm:"size:20;default:pending" json:"status"`
	Priority      int          `gorm:"default:1" json:"priority"`

	SetupStartDate *time.Time `json:"setup_start_date"`
	SetupEndDate   *time.Time `json:"setup_end_date"`
	OpenDate       *time.Time `json:"open_date"`
	CloseDate      *time.Time `json:"close_date"`
	TeardownStart  *time.Time `json:"teardown_start"`
	TeardownEnd    *time.Time `json:"teardown_end"`

	CreatorID uint `json:"creator_id"`
	Creator   User `gorm:"foreignKey:CreatorID" json:"creator,omitempty"`

	AssignedUsers []User          `gorm:"many2many:project_users;" json:"assigned_users,omitempty"`
	Certificates  []Certificate   `gorm:"foreignKey:ProjectID" json:"certificates,omitempty"`
	Materials     []Material      `gorm:"foreignKey:ProjectID" json:"materials,omitempty"`
	Inspections   []Inspection    `gorm:"foreignKey:ProjectID" json:"inspections,omitempty"`
	TeardownReviews []TeardownReview `gorm:"foreignKey:ProjectID" json:"teardown_reviews,omitempty"`
	Suppliers     []Supplier      `gorm:"many2many:project_suppliers;" json:"suppliers,omitempty"`
	Tasks         []Task          `gorm:"foreignKey:ProjectID" json:"tasks,omitempty"`
}

type ProjectUser struct {
	ProjectID uint `gorm:"primaryKey"`
	UserID    uint `gorm:"primaryKey"`
	Role      string `gorm:"size:50"`
	CreatedAt time.Time
}

type ProjectSupplier struct {
	ProjectID  uint `gorm:"primaryKey"`
	SupplierID uint `gorm:"primaryKey"`
	CreatedAt  time.Time
}
