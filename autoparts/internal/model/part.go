package model

type PartCategory string

const (
	CategoryEngine   PartCategory = "engine"
	CategoryChassis  PartCategory = "chassis"
	CategoryElectrics PartCategory = "electrics"
	CategoryBody     PartCategory = "body"
	CategoryOther    PartCategory = "other"
)

type Part struct {
	BaseModel
	PartNumber  string       `gorm:"size:50;uniqueIndex;not null" json:"part_number"`
	Name        string       `gorm:"size:100;not null" json:"name"`
	Category    PartCategory `gorm:"size:20;index" json:"category"`
	Brand       string       `gorm:"size:50" json:"brand"`
	Model       string       `gorm:"size:50" json:"model"`
	UnitPrice   float64      `gorm:"type:decimal(10,2);not null" json:"unit_price"`
	CostPrice   float64      `gorm:"type:decimal(10,2);not null" json:"cost_price"`
	StockQty    int          `gorm:"default:0" json:"stock_qty"`
	LockedQty   int          `gorm:"default:0" json:"locked_qty"`
	MinStockQty int          `gorm:"default:0" json:"min_stock_qty"`
	Location    string       `gorm:"size:50" json:"location"`
	IsActive    bool         `gorm:"default:true" json:"is_active"`
}

func (p *Part) AvailableQty() int {
	return p.StockQty - p.LockedQty
}
