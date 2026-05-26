package models

import "github.com/google/uuid"

type Allocation struct {
	BaseModel
	AllocationNo string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"allocation_no"`
	OrderID      uuid.UUID `gorm:"type:uuid;not null;index" json:"order_id"`
	Order        Order     `gorm:"foreignKey:OrderID" json:"order,omitempty"`
	WarehouseID  uuid.UUID `gorm:"type:uuid;not null;index" json:"warehouse_id"`
	Warehouse    Warehouse `gorm:"foreignKey:WarehouseID" json:"warehouse,omitempty"`
	Status       string    `gorm:"type:varchar(20);not null;index;default:pending" json:"status"`
	OperatorID   uuid.UUID `gorm:"type:uuid;not null" json:"operator_id"`
	Operator     User      `gorm:"foreignKey:OperatorID" json:"operator,omitempty"`
	TotalQty     float64   `gorm:"type:decimal(10,2);not null;default:0" json:"total_qty"`
	Remark       string    `gorm:"type:text" json:"remark"`
	ExceptionMsg string    `gorm:"type:text" json:"exception_msg"`
	AllocationItems []AllocationItem `json:"allocation_items,omitempty"`
	Shipment     *Shipment `json:"shipment,omitempty"`
}

type AllocationItem struct {
	BaseModel
	AllocationID uuid.UUID `gorm:"type:uuid;not null;index" json:"allocation_id"`
	OrderItemID  uuid.UUID `gorm:"type:uuid;not null;index" json:"order_item_id"`
	ProductID    uuid.UUID `gorm:"type:uuid;not null;index" json:"product_id"`
	Product      Product   `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	BatchID      uuid.UUID `gorm:"type:uuid;not null;index" json:"batch_id"`
	Batch        Batch     `gorm:"foreignKey:BatchID" json:"batch,omitempty"`
	Quantity     float64   `gorm:"type:decimal(10,2);not null" json:"quantity"`
	PickedQty    float64   `gorm:"type:decimal(10,2);default:0" json:"picked_qty"`
	Remark       string    `gorm:"type:varchar(500)" json:"remark"`
	IsMixedBatch bool      `gorm:"default:false" json:"is_mixed_batch"`
}
