package models

type MaterialStatus string

const (
	MaterialStatusDraft     MaterialStatus = "draft"
	MaterialStatusPending   MaterialStatus = "pending"
	MaterialStatusApproved  MaterialStatus = "approved"
	MaterialStatusShipped   MaterialStatus = "shipped"
	MaterialStatusReceived  MaterialStatus = "received"
	MaterialStatusRejected  MaterialStatus = "rejected"
)

type Material struct {
	BaseModel
	ProjectID    uint           `gorm:"index;not null" json:"project_id"`
	Project      Project        `gorm:"foreignKey:ProjectID" json:"project,omitempty"`
	SupplierID   *uint          `gorm:"index" json:"supplier_id"`
	Supplier     *Supplier      `gorm:"foreignKey:SupplierID" json:"supplier,omitempty"`
	Name         string         `gorm:"size:200;not null" json:"name"`
	SKU          string         `gorm:"size:100" json:"sku"`
	Version      int            `gorm:"default:1" json:"version"`
	Description  string         `gorm:"type:text" json:"description"`
	Category     string         `gorm:"size:100" json:"category"`
	Quantity     int            `gorm:"default:1" json:"quantity"`
	Unit         string         `gorm:"size:30" json:"unit"`
	UnitPrice    float64        `gorm:"type:decimal(12,2)" json:"unit_price"`
	TotalPrice   float64        `gorm:"type:decimal(14,2)" json:"total_price"`
	Status       MaterialStatus `gorm:"size:20;default:draft" json:"status"`
	Specifications map[string]string `gorm:"type:json" json:"specifications"`
	Attachments  []string       `gorm:"type:json" json:"attachments"`
	Remarks      string         `gorm:"type:text" json:"remarks"`
	RejectReason string         `gorm:"type:text" json:"reject_reason"`

	ParentID    *uint       `gorm:"index" json:"parent_id"`
	Previous    *Material   `gorm:"foreignKey:ParentID" json:"previous,omitempty"`
	VersionLogs []VersionLog `gorm:"foreignKey:MaterialID" json:"version_logs,omitempty"`
}

type VersionLog struct {
	BaseModel
	MaterialID uint   `gorm:"index;not null" json:"material_id"`
	Version    int    `gorm:"not null" json:"version"`
	ChangeType string `gorm:"size:50" json:"change_type"`
	ChangeLog  string `gorm:"type:text" json:"change_log"`
	OperatorID uint   `gorm:"index" json:"operator_id"`
	Operator   User   `gorm:"foreignKey:OperatorID" json:"operator,omitempty"`
}
