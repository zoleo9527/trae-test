package model

import "time"


type CamperStatus string

const (
	CamperStatusRegistered CamperStatus = "registered"
	CamperStatusCheckedIn  CamperStatus = "checked_in"
	CamperStatusCheckedOut CamperStatus = "checked_out"
	CamperStatusCancelled  CamperStatus = "cancelled"
)

type Gender string

const (
	GenderMale   Gender = "male"
	GenderFemale Gender = "female"
	GenderOther  Gender = "other"
)

type Camper struct {
	BaseModel
	CampID         string       `gorm:"index;not null" json:"camp_id"`
	Status         CamperStatus `gorm:"size:20;default:registered" json:"status"`
	Name           string       `gorm:"size:50;not null" json:"name"`
	EnglishName    string       `gorm:"size:50" json:"english_name"`
	Gender         Gender       `gorm:"size:10;not null" json:"gender"`
	BirthDate      time.Time    `json:"birth_date"`
	Age            int          `gorm:"-" json:"age"`
	IdCard         string       `gorm:"size:30" json:"id_card"`
	Passport       string       `gorm:"size:30" json:"passport"`
	Nationality    string       `gorm:"size:50" json:"nationality"`
	Phone          string       `gorm:"size:20" json:"phone"`
	Email          string       `gorm:"size:100" json:"email"`
	School         string       `gorm:"size:100" json:"school"`
	Grade          string       `gorm:"size:20" json:"grade"`
	RoomID         string       `gorm:"type:uuid;index" json:"room_id"`
	BedNumber      int          `json:"bed_number"`
	CheckInTime    *time.Time   `json:"check_in_time"`
	CheckOutTime   *time.Time   `json:"check_out_time"`
	Remark         string       `gorm:"type:text" json:"remark"`
	Tags           []string     `gorm:"serializer:json" json:"tags"`
	GroupID        string       `gorm:"type:uuid;index" json:"group_id"`
	TeacherID      string       `gorm:"type:uuid;index" json:"teacher_id"`
	ParentName     string       `gorm:"size:50" json:"parent_name"`
	ParentPhone    string       `gorm:"size:20;not null" json:"parent_phone"`
	ParentEmail    string       `gorm:"size:100" json:"parent_email"`
	ParentRelation string       `gorm:"size:20" json:"parent_relation"`
	EmergencyName  string       `gorm:"size:50" json:"emergency_name"`
	EmergencyPhone string       `gorm:"size:20" json:"emergency_phone"`
	EmergencyRelation string    `gorm:"size:20" json:"emergency_relation"`
	Allergies      string       `gorm:"type:text" json:"allergies"`
	Medications    string       `gorm:"type:text" json:"medications"`
	MedicalHistory string       `gorm:"type:text" json:"medical_history"`
	Dietary        string       `gorm:"type:text" json:"dietary"`
	SpecialNeeds   string       `gorm:"type:text" json:"special_needs"`
	InsuranceCompany string     `gorm:"size:100" json:"insurance_company"`
	InsuranceNumber string      `gorm:"size:50" json:"insurance_number"`
	RegFormFilled  bool         `gorm:"default:false" json:"reg_form_filled"`
	Paid           bool         `gorm:"default:false" json:"paid"`
	Amount         float64      `json:"amount"`
	PaidAt         *time.Time   `json:"paid_at"`

	Camp    *Camp          `gorm:"foreignKey:CampID" json:"camp,omitempty"`
	Room    *Room          `gorm:"foreignKey:RoomID" json:"room,omitempty"`
	Teacher *User          `gorm:"foreignKey:TeacherID" json:"teacher,omitempty"`
	MedicalReports []MedicalReport `gorm:"foreignKey:CamperID" json:"medical_reports,omitempty"`
	CheckIns []CheckIn    `gorm:"foreignKey:CamperID" json:"check_ins,omitempty"`
	MaterialIssues []MaterialIssue `gorm:"foreignKey:CamperID" json:"material_issues,omitempty"`
	RoomChangeLogs []RoomChangeLog `gorm:"foreignKey:CamperID" json:"room_change_logs,omitempty"`
	FollowUps []FollowUp `gorm:"foreignKey:CamperID" json:"follow_ups,omitempty"`
}

func (c *Camper) CalculateAge() int {
	if c.BirthDate.IsZero() {
		return 0
	}
	now := time.Now()
	age := now.Year() - c.BirthDate.Year()
	if now.YearDay() < c.BirthDate.YearDay() {
		age--
	}
	return age
}
