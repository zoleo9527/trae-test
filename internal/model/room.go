package model

import "time"

type RoomStatus string

const (
	RoomStatusAvailable   RoomStatus = "available"
	RoomStatusPartial     RoomStatus = "partial"
	RoomStatusFull        RoomStatus = "full"
	RoomStatusMaintenance RoomStatus = "maintenance"
)

type GenderType string

const (
	GenderTypeMale    GenderType = "male"
	GenderTypeFemale  GenderType = "female"
	GenderTypeMixed   GenderType = "mixed"
)

type Room struct {
	BaseModel
	CampID      string     `gorm:"index;not null" json:"camp_id"`
	Floor       int        `json:"floor"`
	Building    string     `gorm:"size:50" json:"building"`
	RoomNumber  string     `gorm:"size:20;not null" json:"room_number"`
	BedCount    int        `gorm:"default:4" json:"bed_count"`
	UsedBeds    int        `gorm:"default:0" json:"used_beds"`
	GenderType  GenderType `gorm:"size:10;default:mixed" json:"gender_type"`
	Status      RoomStatus `gorm:"size:20;default:available" json:"status"`
	TeacherID   string     `gorm:"type:uuid;index" json:"teacher_id"`
	Remark      string     `gorm:"type:text" json:"remark"`
	Beds        []Bed      `gorm:"serializer:json" json:"beds"`

	Camp    *Camp    `gorm:"foreignKey:CampID" json:"camp,omitempty"`
	Teacher *User    `gorm:"foreignKey:TeacherID" json:"teacher,omitempty"`
	Campers []Camper `gorm:"foreignKey:RoomID" json:"campers,omitempty"`
}

type Bed struct {
	Number   int    `json:"number"`
	Occupied bool   `json:"occupied"`
	CamperID string `json:"camper_id"`
	Remark   string `json:"remark"`
}

func (r *Room) UpdateStatus() {
	if r.Status == RoomStatusMaintenance {
		return
	}
	if r.UsedBeds >= r.BedCount {
		r.Status = RoomStatusFull
	} else if r.UsedBeds > 0 {
		r.Status = RoomStatusPartial
	} else {
		r.Status = RoomStatusAvailable
	}
}

func (r *Room) GetAvailableBeds() int {
	return r.BedCount - r.UsedBeds
}

type RoomChangeLog struct {
	BaseModel
	CamperID     string    `gorm:"index;not null" json:"camper_id"`
	OldRoomID    string    `json:"old_room_id"`
	NewRoomID    string    `gorm:"not null" json:"new_room_id"`
	OldBedNumber int       `json:"old_bed_number"`
	NewBedNumber int       `json:"new_bed_number"`
	ChangedBy    string    `gorm:"type:uuid;not null" json:"changed_by"`
	ChangeTime   time.Time `json:"change_time"`
	Reason       string    `gorm:"type:text;not null" json:"reason"`
	Remark       string    `gorm:"type:text" json:"remark"`
	ApprovedBy   string    `gorm:"type:uuid" json:"approved_by"`
	ApprovedAt   *time.Time `json:"approved_at"`
	ApprovalRemark string   `gorm:"type:text" json:"approval_remark"`

	Camper   *Camper `gorm:"foreignKey:CamperID" json:"camper,omitempty"`
	OldRoom  *Room   `gorm:"foreignKey:OldRoomID" json:"old_room,omitempty"`
	NewRoom  *Room   `gorm:"foreignKey:NewRoomID" json:"new_room,omitempty"`
	Operator *User   `gorm:"foreignKey:ChangedBy" json:"operator,omitempty"`
	Approver *User   `gorm:"foreignKey:ApprovedBy" json:"approver,omitempty"`
}

type RoomAssignment struct {
	BaseModel
	CamperID string    `gorm:"index;not null;unique" json:"camper_id"`
	RoomID   string    `gorm:"index;not null" json:"room_id"`
	BedNumber int      `json:"bed_number"`
	AssignedBy string   `gorm:"type:uuid;not null" json:"assigned_by"`
	AssignedAt time.Time `json:"assigned_at"`
	Remark   string    `gorm:"type:text" json:"remark"`

	Camper   *Camper `gorm:"foreignKey:CamperID" json:"camper,omitempty"`
	Room     *Room   `gorm:"foreignKey:RoomID" json:"room,omitempty"`
	Operator *User   `gorm:"foreignKey:AssignedBy" json:"operator,omitempty"`
}
