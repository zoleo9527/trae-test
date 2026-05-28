package model

type Role string


const (
	RoleDirector    Role = "director"
	RoleTeacher     Role = "teacher"
	RoleLogistics   Role = "logistics"
	RoleMedical     Role = "medical"
	RoleAdmin       Role = "admin"
)

type User struct {
	BaseModel
	Username     string   `gorm:"size:50;uniqueIndex;not null" json:"username"`
	PasswordHash string   `gorm:"size:255;not null" json:"-"`
	Name         string   `gorm:"size:50;not null" json:"name"`
	Role         Role     `gorm:"size:20;not null" json:"role"`
	Phone        string   `gorm:"size:20" json:"phone"`
	Email        string   `gorm:"size:100" json:"email"`
	Avatar       string   `gorm:"size:255" json:"avatar"`
	Status       string   `gorm:"size:20;default:active" json:"status"`
	Remark       string   `gorm:"type:text" json:"remark"`
	CampIDs      []string `gorm:"serializer:json" json:"camp_ids"`
}

func (u *User) IsDirector() bool    { return u.Role == RoleDirector }
func (u *User) IsTeacher() bool     { return u.Role == RoleTeacher }
func (u *User) IsLogistics() bool   { return u.Role == RoleLogistics }
func (u *User) IsMedical() bool     { return u.Role == RoleMedical }
func (u *User) IsAdmin() bool       { return u.Role == RoleAdmin }

type UserLoginLog struct {
	BaseModel
	UserID    string `gorm:"index;not null" json:"user_id"`
	IPAddress string `gorm:"size:50" json:"ip_address"`
	UserAgent string `gorm:"size:500" json:"user_agent"`
	Success   bool   `gorm:"default:true" json:"success"`
	FailReason string `gorm:"size:100" json:"fail_reason"`
}
