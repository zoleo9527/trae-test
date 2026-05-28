package model

import "time"

type ActivityStatus string

const (
	ActivityStatusScheduled ActivityStatus = "scheduled"
	ActivityStatusOngoing   ActivityStatus = "ongoing"
	ActivityStatusCompleted ActivityStatus = "completed"
	ActivityStatusCancelled ActivityStatus = "cancelled"
)

type Activity struct {
	BaseModel
	CampID        string         `gorm:"index;not null" json:"camp_id"`
	Name          string         `gorm:"size:100;not null" json:"name"`
	Description   string         `gorm:"type:text" json:"description"`
	Location      string         `gorm:"size:200" json:"location"`
	StartTime     time.Time      `gorm:"not null" json:"start_time"`
	EndTime       time.Time      `gorm:"not null" json:"end_time"`
	Status        ActivityStatus `gorm:"size:20;default:scheduled" json:"status"`
	TeacherID     string         `gorm:"type:uuid;index" json:"teacher_id"`
	MaxParticipants int          `gorm:"default:0" json:"max_participants"`
	NeedEquipment bool           `gorm:"default:false" json:"need_equipment"`
	EquipmentList []string       `gorm:"serializer:json" json:"equipment_list"`
	Remark        string         `gorm:"type:text" json:"remark"`

	Teacher   *User     `gorm:"foreignKey:TeacherID" json:"teacher,omitempty"`
	CheckIns  []CheckIn `gorm:"foreignKey:ActivityID" json:"check_ins,omitempty"`
}

type CheckInStatus string

const (
	CheckInStatusPending  CheckInStatus = "pending"
	CheckInStatusPresent  CheckInStatus = "present"
	CheckInStatusAbsent   CheckInStatus = "absent"
	CheckInStatusLate     CheckInStatus = "late"
	CheckInStatusExcused  CheckInStatus = "excused"
)

type CheckIn struct {
	BaseModel
	ActivityID   string        `gorm:"index;not null" json:"activity_id"`
	CamperID     string        `gorm:"index;not null" json:"camper_id"`
	Status       CheckInStatus `gorm:"size:20;default:pending" json:"status"`
	CheckInTime  *time.Time    `json:"check_in_time"`
	CheckedBy    string        `gorm:"type:uuid" json:"checked_by"`
	Remark       string        `gorm:"type:text" json:"remark"`
	Temperature  float64       `json:"temperature"`
	HasSymptoms  bool          `gorm:"default:false" json:"has_symptoms"`
	Symptoms     string        `gorm:"type:text" json:"symptoms"`

	Activity *Activity `gorm:"foreignKey:ActivityID" json:"activity,omitempty"`
	Camper   *Camper   `gorm:"foreignKey:CamperID" json:"camper,omitempty"`
	Checker  *User     `gorm:"foreignKey:CheckedBy" json:"checker,omitempty"`
}
