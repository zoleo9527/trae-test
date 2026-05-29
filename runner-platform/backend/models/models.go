package models

import (
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Username string `gorm:"uniqueIndex;size:50" json:"username"`
	Password string `gorm:"size:255" json:"-"`
	Name     string `gorm:"size:50" json:"name"`
	Role     string `gorm:"size:20" json:"role"`
	Phone    string `gorm:"size:20" json:"phone"`
}

type Order struct {
	gorm.Model
	OrderNo         string    `gorm:"uniqueIndex;size:30" json:"order_no"`
	CustomerName    string    `gorm:"size:50" json:"customer_name"`
	CustomerPhone   string    `gorm:"size:20" json:"customer_phone"`
	MerchantName    string    `gorm:"size:100" json:"merchant_name"`
	PickupAddress   string    `gorm:"size:255" json:"pickup_address"`
	DeliveryAddress string    `gorm:"size:255" json:"delivery_address"`
	GoodsAmount     float64   `json:"goods_amount"`
	DeliveryFee     float64   `json:"delivery_fee"`
	Distance        float64   `json:"distance"`
	Status          string    `gorm:"size:20" json:"status"`
	RunnerID        *uint     `json:"runner_id,omitempty"`
	Runner          *User     `gorm:"foreignKey:RunnerID" json:"runner,omitempty"`
	Appeal          *Appeal   `json:"appeal,omitempty"`
	Subsidy         *Subsidy  `json:"subsidy,omitempty"`
}

type Appeal struct {
	gorm.Model
	OrderID     uint    `json:"order_id"`
	RunnerID    uint    `json:"runner_id"`
	Type        string  `gorm:"size:50" json:"type"`
	Reason      string  `gorm:"type:text" json:"reason"`
	EvidenceURL string  `gorm:"size:255" json:"evidence_url,omitempty"`
	Status      string  `gorm:"size:20" json:"status"`
	ReviewerID  *uint   `json:"reviewer_id,omitempty"`
	ReviewNote  string  `gorm:"type:text" json:"review_note,omitempty"`
	Order       Order   `gorm:"foreignKey:OrderID" json:"order"`
	Runner      User    `gorm:"foreignKey:RunnerID" json:"runner"`
	Reviewer    *User   `gorm:"foreignKey:ReviewerID" json:"reviewer,omitempty"`
	Subsidy     *Subsidy `json:"subsidy,omitempty"`
}

type Subsidy struct {
	gorm.Model
	AppealID *uint   `json:"appeal_id,omitempty"`
	OrderID  uint    `json:"order_id"`
	RunnerID uint    `json:"runner_id"`
	Amount   float64 `json:"amount"`
	Reason   string  `gorm:"type:text" json:"reason"`
	Status   string  `gorm:"size:20" json:"status"`
	Order    Order   `gorm:"foreignKey:OrderID" json:"order"`
	Runner   User    `gorm:"foreignKey:RunnerID" json:"runner"`
	Appeal   *Appeal `gorm:"foreignKey:AppealID" json:"appeal,omitempty"`
}

type TimelineEvent struct {
	gorm.Model
	OrderID uint   `json:"order_id"`
	Type    string `gorm:"size:50" json:"type"`
	Content string `gorm:"type:text" json:"content"`
}
