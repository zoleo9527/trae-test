package models

import (
	"time"
)

type CertificateType string

const (
	CertEntry       CertificateType = "entry"
	CertElectricity CertificateType = "electricity"
	CertFire        CertificateType = "fire"
	CertStructure   CertificateType = "structure"
	CertOther       CertificateType = "other"
)

type Certificate struct {
	BaseModel
	ProjectID   uint            `gorm:"index;not null" json:"project_id"`
	Project     Project         `gorm:"foreignKey:ProjectID" json:"project,omitempty"`
	Name        string          `gorm:"size:200;not null" json:"name"`
	Type        CertificateType `gorm:"size:30;not null" json:"type"`
	Code        string          `gorm:"size:100" json:"code"`
	Status      Status          `gorm:"size:20;default:pending" json:"status"`
	OwnerID     uint            `gorm:"index" json:"owner_id"`
	Owner       User            `gorm:"foreignKey:OwnerID" json:"owner,omitempty"`
	Issuer      string          `gorm:"size:200" json:"issuer"`
	IssueDate   *time.Time      `json:"issue_date"`
	ExpireDate  *time.Time      `json:"expire_date"`
	Remarks     string          `gorm:"type:text" json:"remarks"`
	Attachments []string        `gorm:"type:json" json:"attachments"`
	RejectReason string         `gorm:"type:text" json:"reject_reason"`

	ApprovedByID *uint         `gorm:"index" json:"approved_by_id"`
	ApprovedBy   *User         `gorm:"foreignKey:ApprovedByID" json:"approved_by,omitempty"`
	ApprovedAt   *time.Time    `json:"approved_at"`
}
