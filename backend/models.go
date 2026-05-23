package main

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRole string

const (
	RoleStationMaster   UserRole = "station_master"
	RoleInspector       UserRole = "inspector"
	RoleAdmin           UserRole = "admin"
)

type DefectStatus string

const (
	StatusPending      DefectStatus = "pending"
	StatusAssigned     DefectStatus = "assigned"
	StatusInProgress   DefectStatus = "in_progress"
	StatusPendingReview DefectStatus = "pending_review"
	StatusRejected     DefectStatus = "rejected"
	StatusClosed       DefectStatus = "closed"
	StatusNeedReview   DefectStatus = "need_review"
)

type User struct {
	ID       string   `gorm:"primaryKey" json:"id"`
	Name     string   `json:"name"`
	Role     UserRole `json:"role"`
	Username string   `json:"username"`
}

type Defect struct {
	ID              string       `gorm:"primaryKey" json:"id"`
	Title           string       `json:"title"`
	Description     string       `json:"description"`
	Device          string       `json:"device"`
	Location        string       `json:"location"`
	Priority        string       `json:"priority"`
	Status          DefectStatus `json:"status"`
	ReporterID      string       `json:"reporter_id"`
	ReporterName    string       `json:"reporter_name"`
	AssigneeID      string       `json:"assignee_id"`
	AssigneeName    string       `json:"assignee_name"`
	SpareParts      string       `json:"spare_parts"`
	DowntimeStart   *time.Time   `json:"downtime_start"`
	DowntimeEnd     *time.Time   `json:"downtime_end"`
	DowntimeMinutes int          `json:"downtime_minutes"`
	Remark          string       `json:"remark"`
	CreatedAt       time.Time    `json:"created_at"`
	UpdatedAt       time.Time    `json:"updated_at"`
	Histories       []DefectHistory `gorm:"foreignKey:DefectID" json:"histories,omitempty"`
}

type DefectHistory struct {
	ID         string       `gorm:"primaryKey" json:"id"`
	DefectID   string       `json:"defect_id"`
	OldStatus  DefectStatus `json:"old_status"`
	NewStatus  DefectStatus `json:"new_status"`
	Action     string       `json:"action"`
	OperatorID string       `json:"operator_id"`
	OperatorName string     `json:"operator_name"`
	Remark     string       `json:"remark"`
	CreatedAt  time.Time    `json:"created_at"`
}

type SparePart struct {
	ID     string `gorm:"primaryKey" json:"id"`
	Name   string `json:"name"`
	Model  string `json:"model"`
	Stock  int    `json:"stock"`
	Unit   string `json:"unit"`
}

func (d *Defect) BeforeCreate(tx *gorm.DB) error {
	if d.ID == "" {
		d.ID = uuid.New().String()
	}
	return nil
}

func (dh *DefectHistory) BeforeCreate(tx *gorm.DB) error {
	if dh.ID == "" {
		dh.ID = uuid.New().String()
	}
	return nil
}
