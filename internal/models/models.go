package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Role string

const (
	RoleAdmin        Role = "admin"
	RoleOpsManager   Role = "ops_manager"
	RoleDispatcher   Role = "dispatcher"
	RoleCustomerService Role = "customer_service"
	RoleUser         Role = "user"
	RoleRunner       Role = "runner"
	RoleMerchant     Role = "merchant"
)

type OrderStatus string

const (
	OrderStatusPending    OrderStatus = "pending"
	OrderStatusAssigned   OrderStatus = "assigned"
	OrderStatusPickedUp   OrderStatus = "picked_up"
	OrderStatusDelivering OrderStatus = "delivering"
	OrderStatusCompleted  OrderStatus = "completed"
	OrderStatusCancelled  OrderStatus = "cancelled"
	OrderStatusRefunded   OrderStatus = "refunded"
)

type RefundStatus string

const (
	RefundStatusPending   RefundStatus = "pending"
	RefundStatusReviewing RefundStatus = "reviewing"
	RefundStatusApproved  RefundStatus = "approved"
	RefundStatusRejected  RefundStatus = "rejected"
	RefundStatusProcessing RefundStatus = "processing"
	RefundStatusCompleted RefundStatus = "completed"
	RefundStatusCancelled RefundStatus = "cancelled"
)

type RefundReason string

const (
	RefundReasonTimeout      RefundReason = "timeout"
	RefundReasonDamaged      RefundReason = "damaged"
	RefundReasonWrongItem    RefundReason = "wrong_item"
	RefundReasonQualityIssue RefundReason = "quality_issue"
	RefundReasonUserCancel   RefundReason = "user_cancel"
	RefundReasonOther        RefundReason = "other"
)

type AppealStatus string

const (
	AppealStatusPending   AppealStatus = "pending"
	AppealStatusReviewing AppealStatus = "reviewing"
	AppealStatusUpheld    AppealStatus = "upheld"
	AppealStatusRejected  AppealStatus = "rejected"
	AppealStatusClosed    AppealStatus = "closed"
)

type SubsidyStatus string

const (
	SubsidyStatusPending   SubsidyStatus = "pending"
	SubsidyStatusApproved  SubsidyStatus = "approved"
	SubsidyStatusRejected  SubsidyStatus = "rejected"
	SubsidyStatusPaid      SubsidyStatus = "paid"
)

type OperationAction string

const (
	ActionCreateRefund    OperationAction = "create_refund"
	ActionUpdateRefund    OperationAction = "update_refund"
	ActionApproveRefund   OperationAction = "approve_refund"
	ActionRejectRefund    OperationAction = "reject_refund"
	ActionCreateAppeal    OperationAction = "create_appeal"
	ActionUpdateAppeal    OperationAction = "update_appeal"
	ActionUpheldAppeal    OperationAction = "upheld_appeal"
	ActionRejectAppeal    OperationAction = "reject_appeal"
	ActionCreateSubsidy   OperationAction = "create_subsidy"
	ActionApproveSubsidy  OperationAction = "approve_subsidy"
	ActionAddRemark       OperationAction = "add_remark"
	ActionAssignOrder     OperationAction = "assign_order"
	ActionUpdateOrder     OperationAction = "update_order"
)

type BaseModel struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (m *BaseModel) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

type User struct {
	BaseModel
	Username     string    `gorm:"size:50;not null;uniqueIndex" json:"username"`
	Email        string    `gorm:"size:100;not null;uniqueIndex" json:"email"`
	Phone        string    `gorm:"size:20;uniqueIndex" json:"phone"`
	PasswordHash string    `gorm:"size:255;not null" json:"-"`
	RealName     string    `gorm:"size:50" json:"real_name"`
	Role         Role      `gorm:"size:30;not null;index" json:"role"`
	Department   string    `gorm:"size:100" json:"department"`
	Status       int       `gorm:"default:1" json:"status"`
	Avatar       string    `gorm:"size:255" json:"avatar"`
}

type Order struct {
	BaseModel
	OrderNo          string      `gorm:"size:32;not null;uniqueIndex" json:"order_no"`
	UserID           uuid.UUID   `gorm:"type:uuid;not null;index" json:"user_id"`
	RunnerID         *uuid.UUID  `gorm:"type:uuid;index" json:"runner_id"`
	MerchantID       uuid.UUID   `gorm:"type:uuid;not null;index" json:"merchant_id"`
	Status           OrderStatus `gorm:"size:30;not null;index" json:"status"`
	OrderType        string      `gorm:"size:30;not null" json:"order_type"`
	GoodsDescription string      `gorm:"size:500" json:"goods_description"`
	GoodsValue       float64     `gorm:"type:decimal(10,2);not null" json:"goods_value"`
	DeliveryFee      float64     `gorm:"type:decimal(10,2);not null" json:"delivery_fee"`
	TotalAmount      float64     `gorm:"type:decimal(10,2);not null" json:"total_amount"`
	PickupAddress    string      `gorm:"size:500;not null" json:"pickup_address"`
	DeliveryAddress  string      `gorm:"size:500;not null" json:"delivery_address"`
	ExpectedTime     *time.Time  `json:"expected_time"`
	ActualPickupTime *time.Time  `json:"actual_pickup_time"`
	ActualDeliveryTime *time.Time `json:"actual_delivery_time"`
	TimeoutReason    string      `gorm:"size:500" json:"timeout_reason"`
	Remark           string      `gorm:"size:1000" json:"remark"`
	User             *User       `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Runner           *User       `gorm:"foreignKey:RunnerID" json:"runner,omitempty"`
	Merchant         *User       `gorm:"foreignKey:MerchantID" json:"merchant,omitempty"`
	Refunds          []Refund    `gorm:"foreignKey:OrderID" json:"refunds,omitempty"`
	Appeals          []Appeal    `gorm:"foreignKey:OrderID" json:"appeals,omitempty"`
	Subsidies        []Subsidy   `gorm:"foreignKey:OrderID" json:"subsidies,omitempty"`
}

type Refund struct {
	BaseModel
	RefundNo       string        `gorm:"size:32;not null;uniqueIndex" json:"refund_no"`
	OrderID        uuid.UUID     `gorm:"type:uuid;not null;index" json:"order_id"`
	UserID         uuid.UUID     `gorm:"type:uuid;not null;index" json:"user_id"`
	Status         RefundStatus  `gorm:"size:30;not null;index" json:"status"`
	Reason         RefundReason  `gorm:"size:30;not null" json:"reason"`
	Amount         float64       `gorm:"type:decimal(10,2);not null" json:"amount"`
	DeliveryFeeRefund float64    `gorm:"type:decimal(10,2);default:0" json:"delivery_fee_refund"`
	GoodsValueRefund float64     `gorm:"type:decimal(10,2);default:0" json:"goods_value_refund"`
	Description    string        `gorm:"size:1000;not null" json:"description"`
	EvidenceImages []string      `gorm:"type:text[]" json:"evidence_images"`
	RejectReason   string        `gorm:"size:500" json:"reject_reason"`
	ReviewedBy     *uuid.UUID    `gorm:"type:uuid;index" json:"reviewed_by"`
	ReviewedAt     *time.Time    `json:"reviewed_at"`
	ProcessedBy    *uuid.UUID    `gorm:"type:uuid;index" json:"processed_by"`
	ProcessedAt    *time.Time    `json:"processed_at"`
	Remarks        []Remark      `gorm:"polymorphic:Target;polymorphicValue:refund" json:"remarks,omitempty"`
	Order          *Order        `gorm:"foreignKey:OrderID" json:"order,omitempty"`
	User           *User         `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Reviewer       *User         `gorm:"foreignKey:ReviewedBy" json:"reviewer,omitempty"`
	Processor      *User         `gorm:"foreignKey:ProcessedBy" json:"processor,omitempty"`
	Appeals        []Appeal      `gorm:"foreignKey:RefundID" json:"appeals,omitempty"`
}

type Appeal struct {
	BaseModel
	AppealNo     string       `gorm:"size:32;not null;uniqueIndex" json:"appeal_no"`
	OrderID      uuid.UUID    `gorm:"type:uuid;not null;index" json:"order_id"`
	RefundID     *uuid.UUID   `gorm:"type:uuid;index" json:"refund_id"`
	AppealerID   uuid.UUID    `gorm:"type:uuid;not null;index" json:"appealer_id"`
	AppealerType string       `gorm:"size:30;not null" json:"appealer_type"`
	Status       AppealStatus `gorm:"size:30;not null;index" json:"status"`
	Title        string       `gorm:"size:200;not null" json:"title"`
	Content      string       `gorm:"size:2000;not null" json:"content"`
	Evidence     []string     `gorm:"type:text[]" json:"evidence"`
	HandlerID    *uuid.UUID   `gorm:"type:uuid;index" json:"handler_id"`
	HandledAt    *time.Time   `json:"handled_at"`
	Result       string       `gorm:"size:1000" json:"result"`
	RejectReason string       `gorm:"size:500" json:"reject_reason"`
	Remarks      []Remark     `gorm:"polymorphic:Target;polymorphicValue:appeal" json:"remarks,omitempty"`
	Order        *Order       `gorm:"foreignKey:OrderID" json:"order,omitempty"`
	Refund       *Refund      `gorm:"foreignKey:RefundID" json:"refund,omitempty"`
	Appealer     *User        `gorm:"foreignKey:AppealerID" json:"appealer,omitempty"`
	Handler      *User        `gorm:"foreignKey:HandlerID" json:"handler,omitempty"`
}

type Subsidy struct {
	BaseModel
	SubsidyNo     string        `gorm:"size:32;not null;uniqueIndex" json:"subsidy_no"`
	OrderID       uuid.UUID     `gorm:"type:uuid;not null;index" json:"order_id"`
	RefundID      *uuid.UUID    `gorm:"type:uuid;index" json:"refund_id"`
	AppealID      *uuid.UUID    `gorm:"type:uuid;index" json:"appeal_id"`
	PayeeID       uuid.UUID     `gorm:"type:uuid;not null;index" json:"payee_id"`
	PayeeType     string        `gorm:"size:30;not null" json:"payee_type"`
	Status        SubsidyStatus `gorm:"size:30;not null;index" json:"status"`
	Amount        float64       `gorm:"type:decimal(10,2);not null" json:"amount"`
	Reason        string        `gorm:"size:200;not null" json:"reason"`
	Description   string        `gorm:"size:1000" json:"description"`
	ApprovedBy    *uuid.UUID    `gorm:"type:uuid;index" json:"approved_by"`
	ApprovedAt    *time.Time    `json:"approved_at"`
	PaidAt        *time.Time    `json:"paid_at"`
	PaymentMethod string        `gorm:"size:30" json:"payment_method"`
	TransactionNo string        `gorm:"size:100" json:"transaction_no"`
	Remarks       []Remark      `gorm:"polymorphic:Target;polymorphicValue:subsidy" json:"remarks,omitempty"`
	Order         *Order        `gorm:"foreignKey:OrderID" json:"order,omitempty"`
	Refund        *Refund       `gorm:"foreignKey:RefundID" json:"refund,omitempty"`
	Appeal        *Appeal       `gorm:"foreignKey:AppealID" json:"appeal_id,omitempty"`
	Payee         *User         `gorm:"foreignKey:PayeeID" json:"payee,omitempty"`
	Approver      *User         `gorm:"foreignKey:ApprovedBy" json:"approver,omitempty"`
}

type Remark struct {
	BaseModel
	TargetID   uuid.UUID `gorm:"type:uuid;not null;index" json:"target_id"`
	TargetType string    `gorm:"size:30;not null;index" json:"target_type"`
	AuthorID   uuid.UUID `gorm:"type:uuid;not null;index" json:"author_id"`
	Content    string    `gorm:"size:2000;not null" json:"content"`
	IsInternal bool      `gorm:"default:false" json:"is_internal"`
	Author     *User     `gorm:"foreignKey:AuthorID" json:"author,omitempty"`
}

type OperationLog struct {
	BaseModel
	Action        OperationAction `gorm:"size:50;not null;index" json:"action"`
	TargetID      uuid.UUID       `gorm:"type:uuid;not null;index" json:"target_id"`
	TargetType    string          `gorm:"size:30;not null;index" json:"target_type"`
	OperatorID    uuid.UUID       `gorm:"type:uuid;not null;index" json:"operator_id"`
	OperatorName  string          `gorm:"size:100;not null" json:"operator_name"`
	OperatorRole  Role            `gorm:"size:30;not null" json:"operator_role"`
	OldValue      string          `gorm:"type:text" json:"old_value"`
	NewValue      string          `gorm:"type:text" json:"new_value"`
	ChangedFields []string        `gorm:"type:text[]" json:"changed_fields"`
	IPAddress     string          `gorm:"size:50" json:"ip_address"`
	UserAgent     string          `gorm:"size:500" json:"user_agent"`
	Remark        string          `gorm:"size:500" json:"remark"`
	Operator      *User           `gorm:"foreignKey:OperatorID" json:"operator,omitempty"`
}

type Assignment struct {
	BaseModel
	OrderID    uuid.UUID  `gorm:"type:uuid;not null;uniqueIndex" json:"order_id"`
	RunnerID   uuid.UUID  `gorm:"type:uuid;not null;index" json:"runner_id"`
	AssignedBy uuid.UUID  `gorm:"type:uuid;not null;index" json:"assigned_by"`
	AssignedAt time.Time  `json:"assigned_at"`
	IsActive   bool       `gorm:"default:true" json:"is_active"`
	Reason     string     `gorm:"size:500" json:"reason"`
	Order      *Order     `gorm:"foreignKey:OrderID" json:"order,omitempty"`
	Runner     *User      `gorm:"foreignKey:RunnerID" json:"runner,omitempty"`
	Assigner   *User      `gorm:"foreignKey:AssignedBy" json:"assigned_by_user,omitempty"`
}

type TaskQueue struct {
	BaseModel
	TaskType    string    `gorm:"size:50;not null;index" json:"task_type"`
	Payload     string    `gorm:"type:text;not null" json:"payload"`
	Priority    int       `gorm:"default:0;index" json:"priority"`
	Status      string    `gorm:"size:30;not null;default:pending;index" json:"status"`
	MaxRetries  int       `gorm:"default:3" json:"max_retries"`
	RetryCount  int       `gorm:"default:0" json:"retry_count"`
	ExecuteAt   time.Time `gorm:"index" json:"execute_at"`
	CompletedAt *time.Time `json:"completed_at"`
	ErrorMsg    string    `gorm:"type:text" json:"error_msg"`
}
