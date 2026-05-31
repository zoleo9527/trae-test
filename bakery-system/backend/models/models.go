package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BaseModel struct {
	ID        string    `gorm:"type:varchar(36);primaryKey" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (base *BaseModel) BeforeCreate(tx *gorm.DB) error {
	if base.ID == "" {
		base.ID = uuid.New().String()
	}
	return nil
}

type Member struct {
	BaseModel
	Name          string    `gorm:"type:varchar(100);not null" json:"name"`
	Phone         string    `gorm:"type:varchar(20);uniqueIndex" json:"phone"`
	Balance       float64   `gorm:"type:decimal(10,2);default:0" json:"balance"`
	TotalRecharge float64   `gorm:"type:decimal(10,2);default:0" json:"totalRecharge"`
	Status        string    `gorm:"type:varchar(20);default:'active'" json:"status"`
	Remark        string    `gorm:"type:text" json:"remark"`
	Recharges     []Recharge `json:"recharges,omitempty"`
	Orders        []Order    `json:"orders,omitempty"`
}

type Recharge struct {
	BaseModel
	MemberID    string    `gorm:"type:varchar(36);index" json:"memberId"`
	Amount      float64   `gorm:"type:decimal(10,2);not null" json:"amount"`
	Bonus       float64   `gorm:"type:decimal(10,2);default:0" json:"bonus"`
	PaymentType string    `gorm:"type:varchar(50)" json:"paymentType"`
	Operator    string    `gorm:"type:varchar(50)" json:"operator"`
	Status      string    `gorm:"type:varchar(20);default:'completed'" json:"status"`
	Remark      string    `gorm:"type:text" json:"remark"`
	Member      Member    `gorm:"foreignKey:MemberID" json:"member,omitempty"`
}

type Order struct {
	BaseModel
	OrderNo       string       `gorm:"type:varchar(50);uniqueIndex" json:"orderNo"`
	MemberID      string       `gorm:"type:varchar(36);index" json:"memberId"`
	MemberName    string       `gorm:"type:varchar(100)" json:"memberName"`
	MemberPhone   string       `gorm:"type:varchar(20)" json:"memberPhone"`
	TotalAmount   float64      `gorm:"type:decimal(10,2);not null" json:"totalAmount"`
	PayAmount     float64      `gorm:"type:decimal(10,2);not null" json:"payAmount"`
	UseBalance    float64      `gorm:"type:decimal(10,2);default:0" json:"useBalance"`
	Status        string       `gorm:"type:varchar(30);default:'pending'" json:"status"`
	PickupTime    time.Time    `json:"pickupTime"`
	Operator      string       `gorm:"type:varchar(50)" json:"operator"`
	KitchenStaff  string       `gorm:"type:varchar(50)" json:"kitchenStaff"`
	Remark        string       `gorm:"type:text" json:"remark"`
	MaterialLoss  float64      `gorm:"type:decimal(10,2);default:0" json:"materialLoss"`
	Member        Member       `gorm:"foreignKey:MemberID" json:"member,omitempty"`
	Items         []OrderItem  `json:"items,omitempty"`
	Refunds       []Refund     `json:"refunds,omitempty"`
	StatusHistory []StatusLog  `json:"statusHistory,omitempty"`
}

type OrderItem struct {
	BaseModel
	OrderID   string  `gorm:"type:varchar(36);index" json:"orderId"`
	ProductID string  `gorm:"type:varchar(36)" json:"productId"`
	ProductName string `gorm:"type:varchar(100)" json:"productName"`
	Quantity  int     `gorm:"not null" json:"quantity"`
	UnitPrice float64 `gorm:"type:decimal(10,2);not null" json:"unitPrice"`
	Subtotal  float64 `gorm:"type:decimal(10,2);not null" json:"subtotal"`
	Remark    string  `gorm:"type:text" json:"remark"`
}

type Refund struct {
	BaseModel
	RefundNo     string      `gorm:"type:varchar(50);uniqueIndex" json:"refundNo"`
	OrderID      string      `gorm:"type:varchar(36);index" json:"orderId"`
	MemberID     string      `gorm:"type:varchar(36);index" json:"memberId"`
	MemberName   string      `gorm:"type:varchar(100)" json:"memberName"`
	RefundAmount float64     `gorm:"type:decimal(10,2);not null" json:"refundAmount"`
	RefundType   string      `gorm:"type:varchar(20)" json:"refundType"`
	Reason       string      `gorm:"type:text" json:"reason"`
	Status       string      `gorm:"type:varchar(30);default:'pending'" json:"status"`
	RejectReason string      `gorm:"type:text" json:"rejectReason"`
	Applicant    string      `gorm:"type:varchar(50)" json:"applicant"`
	Reviewer     string      `gorm:"type:varchar(50)" json:"reviewer"`
	ReviewTime   *time.Time  `json:"reviewTime"`
	Order        Order       `gorm:"foreignKey:OrderID" json:"order,omitempty"`
	StatusHistory []StatusLog `json:"statusHistory,omitempty"`
}

type StatusLog struct {
	BaseModel
	RelatedID   string    `gorm:"type:varchar(36);index" json:"relatedId"`
	RelatedType string    `gorm:"type:varchar(30);index" json:"relatedType"`
	FromStatus  string    `gorm:"type:varchar(30)" json:"fromStatus"`
	ToStatus    string    `gorm:"type:varchar(30)" json:"toStatus"`
	Operator    string    `gorm:"type:varchar(50)" json:"operator"`
	Remark      string    `gorm:"type:text" json:"remark"`
}

type Product struct {
	BaseModel
	Name     string  `gorm:"type:varchar(100);not null" json:"name"`
	Category string  `gorm:"type:varchar(50)" json:"category"`
	Price    float64 `gorm:"type:decimal(10,2);not null" json:"price"`
	Cost     float64 `gorm:"type:decimal(10,2);default:0" json:"cost"`
	Status   string  `gorm:"type:varchar(20);default:'active'" json:"status"`
	Image    string  `gorm:"type:varchar(255)" json:"image"`
}

type OperationLog struct {
	BaseModel
	UserID     string `gorm:"type:varchar(36)" json:"userId"`
	UserName   string `gorm:"type:varchar(50)" json:"userName"`
	UserRole   string `gorm:"type:varchar(30)" json:"userRole"`
	Action     string `gorm:"type:varchar(50)" json:"action"`
	Module     string `gorm:"type:varchar(50)" json:"module"`
	RelatedID  string `gorm:"type:varchar(36)" json:"relatedId"`
	BeforeData string `gorm:"type:text" json:"beforeData"`
	AfterData  string `gorm:"type:text" json:"afterData"`
	IP         string `gorm:"type:varchar(50)" json:"ip"`
}
