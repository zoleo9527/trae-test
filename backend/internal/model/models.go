package model

import "time"

type Store struct {
	ID        string    `db:"id" json:"id"`
	Name      string    `db:"name" json:"name"`
	Address   string    `db:"address" json:"address"`
	Region    string    `db:"region" json:"region"`
	Status    string    `db:"status" json:"status"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

type User struct {
	ID           string    `db:"id" json:"id"`
	Username     string    `db:"username" json:"username"`
	PasswordHash string    `db:"password_hash" json:"-"`
	DisplayName  string    `db:"display_name" json:"display_name"`
	Role         string    `db:"role" json:"role"`
	StoreID      *string   `db:"store_id" json:"store_id,omitempty"`
	IsActive     bool      `db:"is_active" json:"is_active"`
	CreatedAt    time.Time `db:"created_at" json:"created_at"`
	UpdatedAt    time.Time `db:"updated_at" json:"updated_at"`
}

type Product struct {
	ID             string    `db:"id" json:"id"`
	Name           string    `db:"name" json:"name"`
	SKU            string    `db:"sku" json:"sku"`
	Category       string    `db:"category" json:"category"`
	IsCobranded    bool      `db:"is_cobranded" json:"is_cobranded"`
	CobrandPartner string    `db:"cobrand_partner" json:"cobrand_partner"`
	Status         string    `db:"status" json:"status"`
	StoreID        *string   `db:"store_id" json:"store_id,omitempty"`
	CreatedAt      time.Time `db:"created_at" json:"created_at"`
	UpdatedAt      time.Time `db:"updated_at" json:"updated_at"`
}

type InventoryRecord struct {
	ID            string    `db:"id" json:"id"`
	StoreID       string    `db:"store_id" json:"store_id"`
	ProductID     string    `db:"product_id" json:"product_id"`
	Quantity      int       `db:"quantity" json:"quantity"`
	SystemQty     int       `db:"system_quantity" json:"system_quantity"`
	LastCheckedAt *time.Time `db:"last_checked_at" json:"last_checked_at,omitempty"`
	CreatedAt     time.Time `db:"created_at" json:"created_at"`
	UpdatedAt     time.Time `db:"updated_at" json:"updated_at"`
}

type Inspection struct {
	ID             string    `db:"id" json:"id"`
	StoreID        string    `db:"store_id" json:"store_id"`
	InspectorID    string    `db:"inspector_id" json:"inspector_id"`
	Title          string    `db:"title" json:"title"`
	InspectionType string    `db:"inspection_type" json:"inspection_type"`
	Status         string    `db:"status" json:"status"`
	Notes          string    `db:"notes" json:"notes"`
	InspectedAt    time.Time `db:"inspected_at" json:"inspected_at"`
	CreatedAt      time.Time `db:"created_at" json:"created_at"`
	UpdatedAt      time.Time `db:"updated_at" json:"updated_at"`

	StoreName     string  `db:"store_name" json:"store_name,omitempty"`
	InspectorName string  `db:"inspector_name" json:"inspector_name,omitempty"`
	ItemCount     int     `db:"item_count" json:"item_count,omitempty"`
	OpenItemCount int     `db:"open_item_count" json:"open_item_count,omitempty"`
}

type InspectionItem struct {
	ID            string    `db:"id" json:"id"`
	InspectionID  string    `db:"inspection_id" json:"inspection_id"`
	Category      string    `db:"category" json:"category"`
	Description   string    `db:"description" json:"description"`
	Severity      string    `db:"severity" json:"severity"`
	Status        string    `db:"status" json:"status"`
	AssigneeID    *string   `db:"assignee_id" json:"assignee_id,omitempty"`
	CreatedAt     time.Time `db:"created_at" json:"created_at"`
	UpdatedAt     time.Time `db:"updated_at" json:"updated_at"`

	AssigneeName string `db:"assignee_name" json:"assignee_name,omitempty"`
}

type InspectionPhoto struct {
	ID                string    `db:"id" json:"id"`
	InspectionItemID  string    `db:"inspection_item_id" json:"inspection_item_id"`
	URL               string    `db:"url" json:"url"`
	Caption           string    `db:"caption" json:"caption"`
	TakenAt           time.Time `db:"taken_at" json:"taken_at"`
	CreatedAt         time.Time `db:"created_at" json:"created_at"`
}

type Rectification struct {
	ID               string    `db:"id" json:"id"`
	InspectionItemID string    `db:"inspection_item_id" json:"inspection_item_id"`
	StoreID          string    `db:"store_id" json:"store_id"`
	Title            string    `db:"title" json:"title"`
	Description      string    `db:"description" json:"description"`
	Severity         string    `db:"severity" json:"severity"`
	Status           string    `db:"status" json:"status"`
	AssigneeID       *string   `db:"assignee_id" json:"assignee_id,omitempty"`
	VerifierID       *string   `db:"verifier_id" json:"verifier_id,omitempty"`
	DueDate          *time.Time `db:"due_date" json:"due_date,omitempty"`
	ResolvedAt       *time.Time `db:"resolved_at" json:"resolved_at,omitempty"`
	CreatedAt        time.Time `db:"created_at" json:"created_at"`
	UpdatedAt        time.Time `db:"updated_at" json:"updated_at"`

	AssigneeName string `db:"assignee_name" json:"assignee_name,omitempty"`
	VerifierName string `db:"verifier_name" json:"verifier_name,omitempty"`
	StoreName    string `db:"store_name" json:"store_name,omitempty"`
}

type RectificationPhoto struct {
	ID              string    `db:"id" json:"id"`
	RectificationID string    `db:"rectification_id" json:"rectification_id"`
	PhotoType       string    `db:"photo_type" json:"photo_type"`
	URL             string    `db:"url" json:"url"`
	Caption         string    `db:"caption" json:"caption"`
	TakenByID       *string   `db:"taken_by_id" json:"taken_by_id,omitempty"`
	TakenAt         time.Time `db:"taken_at" json:"taken_at"`
	CreatedAt       time.Time `db:"created_at" json:"created_at"`

	TakenByName string `db:"taken_by_name" json:"taken_by_name,omitempty"`
}

type RectificationComment struct {
	ID              string    `db:"id" json:"id"`
	RectificationID string    `db:"rectification_id" json:"rectification_id"`
	AuthorID        string    `db:"author_id" json:"author_id"`
	Content         string    `db:"content" json:"content"`
	CreatedAt       time.Time `db:"created_at" json:"created_at"`

	AuthorName string `db:"author_name" json:"author_name,omitempty"`
}

type ReplenishmentOrder struct {
	ID          string    `db:"id" json:"id"`
	StoreID     string    `db:"store_id" json:"store_id"`
	CreatedByID string    `db:"created_by_id" json:"created_by_id"`
	Status      string    `db:"status" json:"status"`
	Notes       string    `db:"notes" json:"notes"`
	CreatedAt   time.Time `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time `db:"updated_at" json:"updated_at"`

	StoreName     string `db:"store_name" json:"store_name,omitempty"`
	CreatorName   string `db:"creator_name" json:"creator_name,omitempty"`
}

type ReplenishmentItem struct {
	ID            string    `db:"id" json:"id"`
	OrderID       string    `db:"order_id" json:"order_id"`
	ProductID     string    `db:"product_id" json:"product_id"`
	RequestedQty  int       `db:"requested_qty" json:"requested_qty"`
	ApprovedQty   int       `db:"approved_qty" json:"approved_qty"`
	ReceivedQty   int       `db:"received_qty" json:"received_qty"`
	CreatedAt     time.Time `db:"created_at" json:"created_at"`

	ProductName string `db:"product_name" json:"product_name,omitempty"`
	ProductSKU  string `db:"product_sku" json:"product_sku,omitempty"`
}

type TransferOrder struct {
	ID            string    `db:"id" json:"id"`
	FromStoreID   string    `db:"from_store_id" json:"from_store_id"`
	ToStoreID     string    `db:"to_store_id" json:"to_store_id"`
	CreatedByID   string    `db:"created_by_id" json:"created_by_id"`
	Status        string    `db:"status" json:"status"`
	Notes         string    `db:"notes" json:"notes"`
	CreatedAt     time.Time `db:"created_at" json:"created_at"`
	UpdatedAt     time.Time `db:"updated_at" json:"updated_at"`

	FromStoreName string `db:"from_store_name" json:"from_store_name,omitempty"`
	ToStoreName   string `db:"to_store_name" json:"to_store_name,omitempty"`
	CreatorName   string `db:"creator_name" json:"creator_name,omitempty"`
}

type TransferItem struct {
	ID        string    `db:"id" json:"id"`
	OrderID   string    `db:"order_id" json:"order_id"`
	ProductID string    `db:"product_id" json:"product_id"`
	Quantity  int       `db:"quantity" json:"quantity"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`

	ProductName string `db:"product_name" json:"product_name,omitempty"`
	ProductSKU  string `db:"product_sku" json:"product_sku,omitempty"`
}

type MemberRedemption struct {
	ID            string    `db:"id" json:"id"`
	MemberPhone   string    `db:"member_phone" json:"member_phone"`
	ProductID     string    `db:"product_id" json:"product_id"`
	StoreID       string    `db:"store_id" json:"store_id"`
	Quantity      int       `db:"quantity" json:"quantity"`
	Status        string    `db:"status" json:"status"`
	FulfilledByID *string   `db:"fulfilled_by_id" json:"fulfilled_by_id,omitempty"`
	FulfilledAt   *time.Time `db:"fulfilled_at" json:"fulfilled_at,omitempty"`
	CreatedAt     time.Time `db:"created_at" json:"created_at"`
	UpdatedAt     time.Time `db:"updated_at" json:"updated_at"`

	ProductName  string `db:"product_name" json:"product_name,omitempty"`
	StoreName    string `db:"store_name" json:"store_name,omitempty"`
	FulfilledBy  string `db:"fulfilled_by_name" json:"fulfilled_by_name,omitempty"`
}

type AuditLog struct {
	ID           string    `db:"id" json:"id"`
	EntityType   string    `db:"entity_type" json:"entity_type"`
	EntityID     string    `db:"entity_id" json:"entity_id"`
	Action       string    `db:"action" json:"action"`
	OldValue     *string   `db:"old_value" json:"old_value,omitempty"`
	NewValue     *string   `db:"new_value" json:"new_value,omitempty"`
	OperatorID   string    `db:"operator_id" json:"operator_id"`
	OperatorName string    `db:"operator_name" json:"operator_name"`
	Note         string    `db:"note" json:"note"`
	CreatedAt    time.Time `db:"created_at" json:"created_at"`
}

type PaginatedResult struct {
	Data       interface{} `json:"data"`
	Total      int         `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"page_size"`
	TotalPages int         `json:"total_pages"`
}

type ListFilter struct {
	Page     int    `query:"page"`
	PageSize int    `query:"page_size"`
	StoreID  string `query:"store_id"`
	Status   string `query:"status"`
	Search   string `query:"search"`
	SortBy   string `query:"sort_by"`
	SortDir  string `query:"sort_dir"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type CreateInspectionRequest struct {
	StoreID        string `json:"store_id"`
	Title          string `json:"title"`
	InspectionType string `json:"inspection_type"`
	Notes          string `json:"notes"`
	InspectedAt    string `json:"inspected_at"`
}

type UpdateInspectionRequest struct {
	Title          string `json:"title"`
	InspectionType string `json:"inspection_type"`
	Status         string `json:"status"`
	Notes          string `json:"notes"`
}

type CreateInspectionItemRequest struct {
	Category    string `json:"category"`
	Description string `json:"description"`
	Severity    string `json:"severity"`
	AssigneeID  string `json:"assignee_id"`
}

type UpdateInspectionItemRequest struct {
	Category    string `json:"category"`
	Description string `json:"description"`
	Severity    string `json:"severity"`
	Status      string `json:"status"`
	AssigneeID  string `json:"assignee_id"`
}

type CreateRectificationRequest struct {
	InspectionItemID string `json:"inspection_item_id"`
	Title            string `json:"title"`
	Description      string `json:"description"`
	Severity         string `json:"severity"`
	AssigneeID       string `json:"assignee_id"`
	DueDate          string `json:"due_date"`
}

type UpdateRectificationRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Severity    string `json:"severity"`
	Status      string `json:"status"`
	AssigneeID  string `json:"assignee_id"`
	VerifierID  string `json:"verifier_id"`
	DueDate     string `json:"due_date"`
}

type CreateCommentRequest struct {
	Content string `json:"content"`
}

type CreateProductRequest struct {
	Name           string `json:"name"`
	SKU            string `json:"sku"`
	Category       string `json:"category"`
	IsCobranded    bool   `json:"is_cobranded"`
	CobrandPartner string `json:"cobrand_partner"`
	Status         string `json:"status"`
	StoreID        string `json:"store_id"`
}

type UpdateProductRequest struct {
	Name           string `json:"name"`
	Category       string `json:"category"`
	IsCobranded    bool   `json:"is_cobranded"`
	CobrandPartner string `json:"cobrand_partner"`
	Status         string `json:"status"`
	StoreID        string `json:"store_id"`
}

type AdjustInventoryRequest struct {
	StoreID   string `json:"store_id"`
	ProductID string `json:"product_id"`
	Quantity  int    `json:"quantity"`
}

type CreateReplenishmentRequest struct {
	StoreID string                     `json:"store_id"`
	Notes   string                     `json:"notes"`
	Items   []ReplenishmentItemInput   `json:"items"`
}

type ReplenishmentItemInput struct {
	ProductID    string `json:"product_id"`
	RequestedQty int    `json:"requested_qty"`
}

type UpdateReplenishmentStatusRequest struct {
	Status string `json:"status"`
}

type CreateTransferRequest struct {
	FromStoreID string             `json:"from_store_id"`
	ToStoreID   string             `json:"to_store_id"`
	Notes       string             `json:"notes"`
	Items       []TransferItemInput `json:"items"`
}

type TransferItemInput struct {
	ProductID string `json:"product_id"`
	Quantity  int    `json:"quantity"`
}

type CreateRedemptionRequest struct {
	MemberPhone string `json:"member_phone"`
	ProductID   string `json:"product_id"`
	StoreID     string `json:"store_id"`
	Quantity    int    `json:"quantity"`
}

type FulfillRedemptionRequest struct {
	Status string `json:"status"`
}
