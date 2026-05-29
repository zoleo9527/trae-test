package models

import (
	"golang.org/x/crypto/bcrypt"
)

type Role string

const (
	RoleAdmin      Role = "admin"
	RoleManager    Role = "manager"
	RoleSupervisor Role = "supervisor"
	RoleWorker     Role = "worker"
	RoleSupplier   Role = "supplier"
)

type User struct {
	BaseModel
	Username string `gorm:"uniqueIndex;size:50;not null" json:"username"`
	Password string `gorm:"size:255;not null" json:"-"`
	Name     string `gorm:"size:100;not null" json:"name"`
	Email    string `gorm:"size:100" json:"email"`
	Phone    string `gorm:"size:20" json:"phone"`
	Role     Role   `gorm:"size:20;not null;default:worker" json:"role"`
	Active   bool   `gorm:"default:true" json:"active"`

	CreatedProjects    []Project    `gorm:"foreignKey:CreatorID" json:"-"`
	AssignedProjects   []Project    `gorm:"many2many:project_users;" json:"-"`
	CreatedAuditLogs   []AuditLog   `gorm:"foreignKey:OperatorID" json:"-"`
	OwnedCertificates  []Certificate `gorm:"foreignKey:OwnerID" json:"-"`
}

func (u *User) HashPassword() error {
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hashedBytes)
	return nil
}

func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
	return err == nil
}

func (u *User) HasPermission(requiredRole Role) bool {
	roleHierarchy := map[Role]int{
		RoleAdmin:      5,
		RoleManager:    4,
		RoleSupervisor: 3,
		RoleWorker:     2,
		RoleSupplier:   1,
	}
	return roleHierarchy[u.Role] >= roleHierarchy[requiredRole]
}
