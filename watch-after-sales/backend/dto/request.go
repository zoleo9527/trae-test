package dto

type LoginRequest struct {
	Username string `json:"username" validate:"required"`
	Password string `json:"password" validate:"required"`
}

type CreateRepairOrderRequest struct {
	CustomerID           uint   `json:"customer_id" validate:"required"`
	WatchBrand           string `json:"watch_brand" validate:"required"`
	WatchModel           string `json:"watch_model" validate:"required"`
	WatchSerial          string `json:"watch_serial"`
	IssueDescription     string `json:"issue_description" validate:"required"`
	AssignedTechnicianID *uint  `json:"assigned_technician_id"`
}

type UpdateRepairOrderRequest struct {
	WatchBrand           string `json:"watch_brand"`
	WatchModel           string `json:"watch_model"`
	WatchSerial          string `json:"watch_serial"`
	IssueDescription     string `json:"issue_description"`
	AssignedTechnicianID *uint  `json:"assigned_technician_id"`
	QuotationPrice       *float64 `json:"quotation_price"`
	QuotationNote        *string  `json:"quotation_note"`
	EstimatedCompletion  *string  `json:"estimated_completion"`
}

type StatusChangeRequest struct {
	Status string `json:"status" validate:"required"`
	Note   string `json:"note"`
}

type CreatePartRequest struct {
	Name        string  `json:"name" validate:"required"`
	Sku         string  `json:"sku" validate:"required"`
	Quantity    int     `json:"quantity" validate:"min=0"`
	MinQuantity int     `json:"min_quantity" validate:"min=0"`
	UnitPrice   float64 `json:"unit_price" validate:"min=0"`
}

type UpdatePartRequest struct {
	Name        string  `json:"name"`
	Quantity    *int    `json:"quantity"`
	MinQuantity *int    `json:"min_quantity"`
	UnitPrice   *float64 `json:"unit_price"`
}

type LockPartRequest struct {
	PartID   uint `json:"part_id" validate:"required"`
	Quantity int  `json:"quantity" validate:"required,min=1"`
}

type CreateCallbackRequest struct {
	RepairOrderID uint   `json:"repair_order_id" validate:"required"`
	CallbackType  string `json:"callback_type" validate:"required"`
	ScheduledAt   string `json:"scheduled_at" validate:"required"`
}

type CompleteCallbackRequest struct {
	Result string `json:"result" validate:"required"`
	Note   string `json:"note"`
}

type RepairFilterRequest struct {
	Status              string `json:"status" query:"status"`
	WatchBrand          string `json:"watch_brand" query:"watch_brand"`
	AssignedTechnicianID *uint `json:"assigned_technician_id" query:"assigned_technician_id"`
	CustomerID          *uint  `json:"customer_id" query:"customer_id"`
	DateFrom            string `json:"date_from" query:"date_from"`
	DateTo              string `json:"date_to" query:"date_to"`
	Keyword             string `json:"keyword" query:"keyword"`
	Page                int    `json:"page" query:"page"`
	PageSize            int    `json:"page_size" query:"page_size"`
}

type BatchStatusRequest struct {
	OrderIDs []uint `json:"order_ids" validate:"required"`
	Status   string `json:"status" validate:"required"`
	Note     string `json:"note"`
}

type AuditFilterRequest struct {
	EntityType string `json:"entity_type" query:"entity_type"`
	EntityID   *uint  `json:"entity_id" query:"entity_id"`
	OperatorID *uint  `json:"operator_id" query:"operator_id"`
	DateFrom   string `json:"date_from" query:"date_from"`
	DateTo     string `json:"date_to" query:"date_to"`
	Page       int    `json:"page" query:"page"`
	PageSize   int    `json:"page_size" query:"page_size"`
}
