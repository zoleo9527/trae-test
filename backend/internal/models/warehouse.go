package models

import "github.com/google/uuid"

type Warehouse struct {
	BaseModel
	Code     string `gorm:"type:varchar(50);uniqueIndex;not null" json:"code"`
	Name     string `gorm:"type:varchar(200);not null" json:"name"`
	Address  string `gorm:"type:varchar(500)" json:"address"`
	Manager  string `gorm:"type:varchar(100)" json:"manager"`
	Phone    string `gorm:"type:varchar(20)" json:"phone"`
	Status   string `gorm:"type:varchar(20);default:active" json:"status"`
}

type Store struct {
	BaseModel
	Code        string `gorm:"type:varchar(50);uniqueIndex;not null" json:"code"`
	Name        string `gorm:"type:varchar(200);not null" json:"name"`
	Address     string `gorm:"type:varchar(500)" json:"address"`
	Contact     string `gorm:"type:varchar(100)" json:"contact"`
	Phone       string `gorm:"type:varchar(20)" json:"phone"`
	Region      string `gorm:"type:varchar(50);index" json:"region"`
	Status      string `gorm:"type:varchar(20);default:active" json:"status"`
	DefaultWarehouseID uuid.UUID `gorm:"type:uuid" json:"default_warehouse_id"`
}

type Inventory struct {
	BaseModel
	WarehouseID uuid.UUID `gorm:"type:uuid;not null;index:idx_warehouse_batch,unique" json:"warehouse_id"`
	Warehouse   Warehouse `gorm:"foreignKey:WarehouseID" json:"warehouse,omitempty"`
	BatchID     uuid.UUID `gorm:"type:uuid;not null;index:idx_warehouse_batch,unique" json:"batch_id"`
	Batch       Batch     `gorm:"foreignKey:BatchID" json:"batch,omitempty"`
	Quantity    float64   `gorm:"type:decimal(10,2);not null" json:"quantity"`
	LockedQty   float64   `gorm:"type:decimal(10,2);default:0" json:"locked_qty"`
	AvailableQty float64  `gorm:"type:decimal(10,2);not null" json:"available_qty"`
}
