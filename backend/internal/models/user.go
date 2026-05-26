package models

type User struct {
	BaseModel
	Username string `gorm:"type:varchar(50);uniqueIndex;not null" json:"username"`
	Password string `gorm:"type:varchar(255);not null" json:"-"`
	Name     string `gorm:"type:varchar(100);not null" json:"name"`
	Role     string `gorm:"type:varchar(20);not null;index" json:"role"`
	Phone    string `gorm:"type:varchar(20)" json:"phone"`
	Email    string `gorm:"type:varchar(100)" json:"email"`
	Status   string `gorm:"type:varchar(20);default:active" json:"status"`
}
