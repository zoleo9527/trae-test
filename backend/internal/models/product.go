package models

type Product struct {
	BaseModel
	Code        string  `gorm:"type:varchar(50);uniqueIndex;not null" json:"code"`
	Name        string  `gorm:"type:varchar(200);not null" json:"name"`
	Category    string  `gorm:"type:varchar(50);index" json:"category"`
	Spec        string  `gorm:"type:varchar(100)" json:"spec"`
	Unit        string  `gorm:"type:varchar(20);not null" json:"unit"`
	StandardPrice float64 `gorm:"type:decimal(10,2);not null" json:"standard_price"`
	Description string  `gorm:"type:text" json:"description"`
	Status      string  `gorm:"type:varchar(20);default:active" json:"status"`
}
