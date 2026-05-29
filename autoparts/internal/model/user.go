package model

type Role string

const (
	RoleOwner     Role = "owner"
	RoleSales     Role = "sales"
	RoleWarehouse Role = "warehouse"
	RoleAdmin     Role = "admin"
)

type User struct {
	BaseModel
	Username string `gorm:"size:50;uniqueIndex;not null" json:"username"`
	Password string `gorm:"size:255;not null" json:"-"`
	Name     string `gorm:"size:50;not null" json:"name"`
	Phone    string `gorm:"size:20" json:"phone"`
	Role     Role   `gorm:"size:20;not null;index" json:"role"`
	IsActive bool   `gorm:"default:true" json:"is_active"`
}

func (u *User) HasPermission(requiredRole Role) bool {
	if u.Role == RoleAdmin {
		return true
	}
	if u.Role == requiredRole {
		return true
	}
	if u.Role == RoleOwner {
		return requiredRole == RoleSales || requiredRole == RoleWarehouse
	}
	return false
}
