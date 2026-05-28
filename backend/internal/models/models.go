package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Role string

const (
	RoleManager    Role = "manager"
	RolePlanner    Role = "planner"
	RoleWarehouse  Role = "warehouse"
)

type User struct {
	ID        uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	Username  string    `gorm:"uniqueIndex;size:50;not null" json:"username"`
	Name      string    `gorm:"size:50;not null" json:"name"`
	Role      Role      `gorm:"size:20;not null" json:"role"`
	Avatar    string    `gorm:"size:255" json:"avatar"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

type ProductStatus string

const (
	ProductStatusDraft      ProductStatus = "draft"
	ProductStatusPending    ProductStatus = "pending"
	ProductStatusApproved   ProductStatus = "approved"
	ProductStatusOnShelf    ProductStatus = "on_shelf"
	ProductStatusOffShelf   ProductStatus = "off_shelf"
	ProductStatusRejected   ProductStatus = "rejected"
	ProductStatusReviewing  ProductStatus = "reviewing"
	ProductStatusReviewed   ProductStatus = "reviewed"
)

type CollabProduct struct {
	ID              uuid.UUID     `gorm:"type:char(36);primaryKey" json:"id"`
	SKU             string        `gorm:"uniqueIndex;size:50;not null" json:"sku"`
	Name            string        `gorm:"size:100;not null" json:"name"`
	BrandPartner    string        `gorm:"size:100;not null" json:"brandPartner"`
	Category        string        `gorm:"size:50;not null" json:"category"`
	RetailPrice     float64       `gorm:"not null" json:"retailPrice"`
	CostPrice       float64       `gorm:"not null" json:"costPrice"`
	Description     string        `gorm:"type:text" json:"description"`
	ImageURL        string        `gorm:"size:255" json:"imageUrl"`
	Status          ProductStatus `gorm:"size:20;not null;index" json:"status"`
	PlanOnShelfDate time.Time     `json:"planOnShelfDate"`
	PlanOffShelfDate time.Time    `json:"planOffShelfDate"`
	ActualOnShelfDate *time.Time  `json:"actualOnShelfDate"`
	ActualOffShelfDate *time.Time `json:"actualOffShelfDate"`
	TargetStores    []string      `gorm:"serializer:json" json:"targetStores"`
	CreatedBy       uuid.UUID     `gorm:"type:char(36);not null" json:"createdBy"`
	CreatedByName   string        `gorm:"size:50;not null" json:"createdByName"`
	ApprovedBy      *uuid.UUID    `gorm:"type:char(36)" json:"approvedBy"`
	ApprovedByName  string        `gorm:"size:50" json:"approvedByName"`
	RejectReason    string        `gorm:"type:text" json:"rejectReason"`
	ReviewNote      string        `gorm:"type:text" json:"reviewNote"`
	TotalSales      int           `gorm:"default:0" json:"totalSales"`
	TotalRevenue    float64       `gorm:"default:0" json:"totalRevenue"`
	CreatedAt       time.Time     `json:"createdAt"`
	UpdatedAt       time.Time     `json:"updatedAt"`
}

func (p *CollabProduct) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

type Store struct {
	ID        uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	Code      string    `gorm:"uniqueIndex;size:20;not null" json:"code"`
	Name      string    `gorm:"size:100;not null" json:"name"`
	Region    string    `gorm:"size:50;not null" json:"region"`
	Manager   string    `gorm:"size:50;not null" json:"manager"`
	Phone     string    `gorm:"size:20" json:"phone"`
	Address   string    `gorm:"size:255" json:"address"`
	IsActive  bool      `gorm:"default:true" json:"isActive"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (s *Store) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

type Inventory struct {
	ID            uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	ProductID     uuid.UUID `gorm:"type:char(36);not null;index:idx_store_product,unique" json:"productId"`
	StoreID       uuid.UUID `gorm:"type:char(36);not null;index:idx_store_product,unique" json:"storeId"`
	StoreCode     string    `gorm:"size:20;not null" json:"storeCode"`
	Quantity      int       `gorm:"not null;default:0" json:"quantity"`
	ReservedQty   int       `gorm:"not null;default:0" json:"reservedQty"`
	AvailableQty  int       `gorm:"not null;default:0" json:"availableQty"`
	LastCountDate *time.Time `json:"lastCountDate"`
	LastCountQty  int       `json:"lastCountQty"`
	DeviationQty  int       `json:"deviationQty"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

func (i *Inventory) BeforeCreate(tx *gorm.DB) error {
	if i.ID == uuid.Nil {
		i.ID = uuid.New()
	}
	return nil
}

type OrderType string

const (
	OrderTypeRestock   OrderType = "restock"
	OrderTypeTransfer  OrderType = "transfer"
	OrderTypeExchange  OrderType = "exchange"
)

type OrderStatus string

const (
	OrderStatusDraft     OrderStatus = "draft"
	OrderStatusPending   OrderStatus = "pending"
	OrderStatusApproved  OrderStatus = "approved"
	OrderStatusShipped   OrderStatus = "shipped"
	OrderStatusReceived  OrderStatus = "received"
	OrderStatusRejected  OrderStatus = "rejected"
	OrderStatusCompleted OrderStatus = "completed"
)

type Order struct {
	ID              uuid.UUID   `gorm:"type:char(36);primaryKey" json:"id"`
	OrderNo         string      `gorm:"uniqueIndex;size:50;not null" json:"orderNo"`
	Type            OrderType   `gorm:"size:20;not null;index" json:"type"`
	Status          OrderStatus `gorm:"size:20;not null;index" json:"status"`
	ProductID       uuid.UUID   `gorm:"type:char(36);not null" json:"productId"`
	ProductSKU      string      `gorm:"size:50;not null" json:"productSku"`
	ProductName     string      `gorm:"size:100;not null" json:"productName"`
	FromStoreID     *uuid.UUID  `gorm:"type:char(36)" json:"fromStoreId"`
	FromStoreCode   string      `gorm:"size:20" json:"fromStoreCode"`
	ToStoreID       uuid.UUID   `gorm:"type:char(36);not null" json:"toStoreId"`
	ToStoreCode     string      `gorm:"size:20;not null" json:"toStoreCode"`
	Quantity        int         `gorm:"not null" json:"quantity"`
	MemberPhone     string      `gorm:"size:20" json:"memberPhone"`
	MemberName      string      `gorm:"size:50" json:"memberName"`
	ExchangePoints  int         `json:"exchangePoints"`
	Remark          string      `gorm:"type:text" json:"remark"`
	CreatedBy       uuid.UUID   `gorm:"type:char(36);not null" json:"createdBy"`
	CreatedByName   string      `gorm:"size:50;not null" json:"createdByName"`
	ApprovedBy      *uuid.UUID  `gorm:"type:char(36)" json:"approvedBy"`
	ApprovedByName  string      `gorm:"size:50" json:"approvedByName"`
	RejectReason    string      `gorm:"type:text" json:"rejectReason"`
	ShippedAt       *time.Time  `json:"shippedAt"`
	ReceivedAt      *time.Time  `json:"receivedAt"`
	CreatedAt       time.Time   `json:"createdAt"`
	UpdatedAt       time.Time   `json:"updatedAt"`
}

func (o *Order) BeforeCreate(tx *gorm.DB) error {
	if o.ID == uuid.Nil {
		o.ID = uuid.New()
	}
	return nil
}

type InspectionStatus string

const (
	InspectionStatusPending   InspectionStatus = "pending"
	InspectionStatusPassed    InspectionStatus = "passed"
	InspectionStatusException InspectionStatus = "exception"
	InspectionStatusClosed    InspectionStatus = "closed"
)

type Inspection struct {
	ID             uuid.UUID        `gorm:"type:char(36);primaryKey" json:"id"`
	ProductID      uuid.UUID        `gorm:"type:char(36);not null" json:"productId"`
	ProductSKU     string           `gorm:"size:50;not null" json:"productSku"`
	ProductName    string           `gorm:"size:100;not null" json:"productName"`
	StoreID        uuid.UUID        `gorm:"type:char(36);not null" json:"storeId"`
	StoreCode      string           `gorm:"size:20;not null" json:"storeCode"`
	StoreName      string           `gorm:"size:100;not null" json:"storeName"`
	Status         InspectionStatus `gorm:"size:20;not null;index" json:"status"`
	DisplayCorrect bool             `json:"displayCorrect"`
	DisplayPosition string          `gorm:"size:100" json:"displayPosition"`
	PhotoURLs      []string         `gorm:"serializer:json" json:"photoUrls"`
	InventoryCheck bool             `json:"inventoryCheck"`
	ExpectedQty    int              `json:"expectedQty"`
	ActualQty      int              `json:"actualQty"`
	DeviationQty   int              `json:"deviationQty"`
	Issues         []string         `gorm:"serializer:json" json:"issues"`
	InspectorID    uuid.UUID        `gorm:"type:char(36);not null" json:"inspectorId"`
	InspectorName  string           `gorm:"size:50;not null" json:"inspectorName"`
	Remark         string           `gorm:"type:text" json:"remark"`
	FollowUpBy     *uuid.UUID       `gorm:"type:char(36)" json:"followUpBy"`
	FollowUpByName string           `gorm:"size:50" json:"followUpByName"`
	FollowUpNote   string           `gorm:"type:text" json:"followUpNote"`
	ClosedAt       *time.Time       `json:"closedAt"`
	CreatedAt      time.Time        `json:"createdAt"`
	UpdatedAt      time.Time        `json:"updatedAt"`
}

func (i *Inspection) BeforeCreate(tx *gorm.DB) error {
	if i.ID == uuid.Nil {
		i.ID = uuid.New()
	}
	return nil
}

type ExceptionType string

const (
	ExceptionTypeInventory  ExceptionType = "inventory"
	ExceptionTypeDisplay    ExceptionType = "display"
	ExceptionTypeTiming     ExceptionType = "timing"
	ExceptionTypeOrder      ExceptionType = "order"
	ExceptionTypeOther      ExceptionType = "other"
)

type ExceptionStatus string

const (
	ExceptionStatusOpen     ExceptionStatus = "open"
	ExceptionStatusHandling ExceptionStatus = "handling"
	ExceptionStatusResolved ExceptionStatus = "resolved"
	ExceptionStatusReview   ExceptionStatus = "review"
)

type ExceptionRecord struct {
	ID              uuid.UUID       `gorm:"type:char(36);primaryKey" json:"id"`
	Type            ExceptionType   `gorm:"size:20;not null;index" json:"type"`
	Title           string          `gorm:"size:200;not null" json:"title"`
	Description     string          `gorm:"type:text;not null" json:"description"`
	Status          ExceptionStatus `gorm:"size:20;not null;index" json:"status"`
	Severity        string          `gorm:"size:20;not null" json:"severity"`
	ProductID       *uuid.UUID      `gorm:"type:char(36);index" json:"productId"`
	ProductSKU      string          `gorm:"size:50" json:"productSku"`
	ProductName     string          `gorm:"size:100" json:"productName"`
	StoreID         *uuid.UUID      `gorm:"type:char(36);index" json:"storeId"`
	StoreCode       string          `gorm:"size:20" json:"storeCode"`
	StoreName       string          `gorm:"size:100" json:"storeName"`
	OrderID         *uuid.UUID      `gorm:"type:char(36);index" json:"orderId"`
	OrderNo         string          `gorm:"size:50" json:"orderNo"`
	InspectionID    *uuid.UUID      `gorm:"type:char(36);index" json:"inspectionId"`
	ReportedBy      uuid.UUID       `gorm:"type:char(36);not null" json:"reportedBy"`
	ReportedByName  string          `gorm:"size:50;not null" json:"reportedByName"`
	AssignedTo      *uuid.UUID      `gorm:"type:char(36);index" json:"assignedTo"`
	AssignedToName  string          `gorm:"size:50" json:"assignedToName"`
	ResolutionNote  string          `gorm:"type:text" json:"resolutionNote"`
	NeedReview      bool            `gorm:"default:false" json:"needReview"`
	ResolvedAt      *time.Time      `json:"resolvedAt"`
	ReviewNote      string          `gorm:"type:text" json:"reviewNote"`
	ReviewedBy      *uuid.UUID      `gorm:"type:char(36)" json:"reviewedBy"`
	ReviewedByName  string          `gorm:"size:50" json:"reviewedByName"`
	ReviewedAt      *time.Time      `json:"reviewedAt"`
	CreatedAt       time.Time       `json:"createdAt"`
	UpdatedAt       time.Time       `json:"updatedAt"`
}

func (e *ExceptionRecord) BeforeCreate(tx *gorm.DB) error {
	if e.ID == uuid.Nil {
		e.ID = uuid.New()
	}
	return nil
}

type OperationLog struct {
	ID            uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	EntityType    string    `gorm:"size:50;not null;index" json:"entityType"`
	EntityID      uuid.UUID `gorm:"type:char(36);not null;index" json:"entityId"`
	Action        string    `gorm:"size:50;not null" json:"action"`
	OldValue      string    `gorm:"type:text" json:"oldValue"`
	NewValue      string    `gorm:"type:text" json:"newValue"`
	Remark        string    `gorm:"type:text" json:"remark"`
	OperatorID    uuid.UUID `gorm:"type:char(36);not null" json:"operatorId"`
	OperatorName  string    `gorm:"size:50;not null" json:"operatorName"`
	OperatorRole  Role      `gorm:"size:20;not null" json:"operatorRole"`
	CreatedAt     time.Time `json:"createdAt"`
}

func (l *OperationLog) BeforeCreate(tx *gorm.DB) error {
	if l.ID == uuid.Nil {
		l.ID = uuid.New()
	}
	return nil
}

type ReviewRecord struct {
	ID            uuid.UUID  `gorm:"type:char(36);primaryKey" json:"id"`
	ProductID     uuid.UUID  `gorm:"type:char(36);not null;index" json:"productId"`
	ProductSKU    string     `gorm:"size:50;not null" json:"productSku"`
	ProductName   string     `gorm:"size:100;not null" json:"productName"`
	ReviewType    string     `gorm:"size:50;not null" json:"reviewType"`
	TotalQuantity int        `gorm:"not null" json:"totalQuantity"`
	TotalSales    int        `gorm:"not null" json:"totalSales"`
	TotalRevenue  float64    `gorm:"not null" json:"totalRevenue"`
	InventoryLeft int        `gorm:"not null" json:"inventoryLeft"`
	DisplayScore  int        `json:"displayScore"`
	TimingScore   int        `json:"timingScore"`
	SalesScore    int        `json:"salesScore"`
	OverallScore  int        `json:"overallScore"`
	Problems      []string   `gorm:"serializer:json" json:"problems"`
	Lessons       []string   `gorm:"serializer:json" json:"lessons"`
	Improvements  []string   `gorm:"serializer:json" json:"improvements"`
	ReviewedBy    uuid.UUID  `gorm:"type:char(36);not null" json:"reviewedBy"`
	ReviewedByName string    `gorm:"size:50;not null" json:"reviewedByName"`
	ReviewedAt    time.Time  `json:"reviewedAt"`
	CreatedAt     time.Time  `json:"createdAt"`
}

func (r *ReviewRecord) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}
