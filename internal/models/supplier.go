package models

type Supplier struct {
	BaseModel
	Name        string   `gorm:"size:200;not null" json:"name"`
	Code        string   `gorm:"uniqueIndex;size:50" json:"code"`
	Contact     string   `gorm:"size:100" json:"contact"`
	Phone       string   `gorm:"size:20" json:"phone"`
	Email       string   `gorm:"size:100" json:"email"`
	Address     string   `gorm:"size:500" json:"address"`
	Category    string   `gorm:"size:100" json:"category"`
	Status      Status   `gorm:"size:20;default:pending" json:"status"`
	Remarks     string   `gorm:"type:text" json:"remarks"`
	Attachments []string `gorm:"type:json" json:"attachments"`

	Projects   []Project   `gorm:"many2many:project_suppliers;" json:"-"`
	Materials  []Material  `gorm:"foreignKey:SupplierID" json:"materials,omitempty"`
}
