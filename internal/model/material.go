package model

import "time"

type MaterialStatus string

const (
	MaterialStatusPending   MaterialStatus = "pending"
	MaterialStatusApproved  MaterialStatus = "approved"
	MaterialStatusIssued    MaterialStatus = "issued"
	MaterialStatusRejected  MaterialStatus = "rejected"
	MaterialStatusReturned  MaterialStatus = "returned"
)

type MaterialCategory string

const (
	MaterialCategoryClothing   MaterialCategory = "clothing"
	MaterialCategoryMedicine   MaterialCategory = "medicine"
	MaterialCategoryDailyUse   MaterialCategory = "daily_use"
	MaterialCategoryEquipment  MaterialCategory = "equipment"
	MaterialCategoryOther      MaterialCategory = "other"
)

type MaterialItem struct {
	BaseModel
	Name        string           `gorm:"size:100;not null" json:"name"`
	Category    MaterialCategory `gorm:"size:20;not null" json:"category"`
	Spec        string           `gorm:"size:100" json:"spec"`
	Unit        string           `gorm:"size:20" json:"unit"`
	TotalStock  int              `gorm:"default:0" json:"total_stock"`
	UsedStock   int              `gorm:"default:0" json:"used_stock"`
	WarningLine int              `gorm:"default:10" json:"warning_line"`
	Remark      string           `gorm:"type:text" json:"remark"`
}

type MaterialIssue struct {
	BaseModel
	CamperID    string         `gorm:"index;not null" json:"camper_id"`
	ItemID      string         `gorm:"index;not null" json:"item_id"`
	RequesterID string        `gorm:"type:uuid;not null" json:"requester_id"`
	Quantity    int            `gorm:"default:1" json:"quantity"`
	Status      MaterialStatus `gorm:"size:20;default:pending" json:"status"`
	RequestTime time.Time      `json:"request_time"`
	Reason      string         `gorm:"type:text;not null" json:"reason"`
	ApproverID  string         `gorm:"type:uuid" json:"approver_id"`
	ApproveTime *time.Time     `json:"approve_time"`
	ApprovalRemark string       `gorm:"type:text" json:"approval_remark"`
	IssuerID    string         `gorm:"type:uuid" json:"issuer_id"`
	IssueTime   *time.Time     `json:"issue_time"`
	ReturnTime  *time.Time     `json:"return_time"`
	ReturnerID  string         `gorm:"type:uuid" json:"returner_id"`
	Remark      string         `gorm:"type:text" json:"remark"`

	Camper    *Camper       `gorm:"foreignKey:CamperID" json:"camper,omitempty"`
	Item      *MaterialItem `gorm:"foreignKey:ItemID" json:"item,omitempty"`
	Requester *User         `gorm:"foreignKey:RequesterID" json:"requester,omitempty"`
	Approver  *User         `gorm:"foreignKey:ApproverID" json:"approver,omitempty"`
	Issuer    *User         `gorm:"foreignKey:IssuerID" json:"issuer,omitempty"`
}
