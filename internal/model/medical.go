package model

import "time"

type MedicalSeverity string

const (
	MedicalSeverityMild     MedicalSeverity = "mild"
	MedicalSeverityModerate MedicalSeverity = "moderate"
	MedicalSeveritySevere   MedicalSeverity = "severe"
	MedicalSeverityCritical MedicalSeverity = "critical"
)

type MedicalStatus string

const (
	MedicalStatusReported    MedicalStatus = "reported"
	MedicalStatusProcessing  MedicalStatus = "processing"
	MedicalStatusResolved    MedicalStatus = "resolved"
	MedicalStatusTransferred MedicalStatus = "transferred"
	MedicalStatusFollowUp    MedicalStatus = "follow_up"
)

type MedicalReport struct {
	BaseModel
	CamperID         string          `gorm:"index;not null" json:"camper_id"`
	ReporterID       string          `gorm:"type:uuid;not null" json:"reporter_id"`
	ReportTime       time.Time       `gorm:"not null" json:"report_time"`
	Severity         MedicalSeverity `gorm:"size:20;not null" json:"severity"`
	Status           MedicalStatus   `gorm:"size:20;default:reported" json:"status"`
	Symptoms         string          `gorm:"type:text;not null" json:"symptoms"`
	Description      string          `gorm:"type:text" json:"description"`
	Temperature      float64         `json:"temperature"`
	BloodPressure    string          `gorm:"size:20" json:"blood_pressure"`
	Pulse            int             `json:"pulse"`
	InitialTreatment string          `gorm:"type:text" json:"initial_treatment"`
	TreatmentBy      string          `gorm:"type:uuid" json:"treatment_by"`
	Medications      []string        `gorm:"serializer:json" json:"medications"`
	NeedFollowUp     bool            `gorm:"default:false" json:"need_follow_up"`
	FollowUpTime     *time.Time      `json:"follow_up_time"`
	IsolationNeeded  bool            `gorm:"default:false" json:"isolation_needed"`
	ParentNotified   bool            `gorm:"default:false" json:"parent_notified"`
	ParentNotifyTime *time.Time      `json:"parent_notify_time"`
	ParentNotifyBy   string          `gorm:"type:uuid" json:"parent_notify_by"`
	Remark           string          `gorm:"type:text" json:"remark"`
	Resolution       string          `gorm:"type:text" json:"resolution"`
	ResolvedAt       *time.Time      `json:"resolved_at"`
	ResolvedBy       string          `gorm:"type:uuid" json:"resolved_by"`

	Camper         *Camper `gorm:"foreignKey:CamperID" json:"camper,omitempty"`
	Reporter       *User   `gorm:"foreignKey:ReporterID" json:"reporter,omitempty"`
	TreatmentStaff *User   `gorm:"foreignKey:TreatmentBy" json:"treatment_staff,omitempty"`
	ResolvedStaff  *User   `gorm:"foreignKey:ResolvedBy" json:"resolved_staff,omitempty"`

	RelatedCheckIns []CheckInMedicalLink `gorm:"foreignKey:MedicalReportID" json:"related_check_ins,omitempty"`
}
