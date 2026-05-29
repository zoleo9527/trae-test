package dto

import (
	"autoparts/internal/model"
	"time"
)

type CreateLockOrderRequest struct {
	QuoteID uint              `json:"quote_id" validate:"required"`
	Items   []LockItemRequest `json:"items" validate:"required,min=1,dive"`
	Remark  string            `json:"remark"`
}

type LockItemRequest struct {
	QuoteItemID uint `json:"quote_item_id" validate:"required"`
	PartID      uint `json:"part_id" validate:"required"`
	Quantity    int  `json:"quantity" validate:"required,min=1"`
}

type BatchLockRequest struct {
	EnquiryIDs []uint `json:"enquiry_ids" validate:"required,min=1"`
	QuoteIDs   []uint `json:"quote_ids" validate:"required,min=1"`
}

type PickLockRequest struct {
	Items  []PickItemRequest `json:"items" validate:"required,min=1,dive"`
	Remark string          `json:"remark"`
}

type PickItemRequest struct {
	LockItemID uint `json:"lock_item_id" validate:"required"`
	Quantity   int  `json:"quantity" validate:"required,min=1"`
}

type ReturnRequest struct {
	Items  []ReturnItemRequest `json:"items" validate:"required,min=1,dive"`
	Remark string            `json:"remark"`
}

type ReturnItemRequest struct {
	LockItemID uint   `json:"lock_item_id" validate:"required"`
	Quantity   int    `json:"quantity" validate:"required,min=1"`
	Reason     string `json:"reason" validate:"required"`
}

type ReviewReturnRequest struct {
	Status model.ReturnStatus `json:"status" validate:"required"`
	Reason string           `json:"reason"`
}

type LockOrderFilter struct {
	EnquiryID   *uint               `json:"enquiry_id"`
	QuoteID    *uint               `json:"quote_id"`
	CustomerID *uint               `json:"customer_id"`
	Status     *model.LockStatus   `json:"status"`
	ReturnStatus *model.ReturnStatus `json:"return_status"`
	CreatedByID *uint               `json:"created_by_id"`
	CreatedStart *time.Time       `json:"created_start"`
	CreatedEnd   *time.Time       `json:"created_end"`
	Page         int                `json:"page" validate:"min=1"`
	PageSize     int                `json:"page_size" validate:"min=1,max=100"`
}

type LockOrderResponse struct {
	ID           uint             `json:"id"`
	LockNo       string           `json:"lock_no"`
	EnquiryID    uint             `json:"enquiry_id"`
	EnquiryNo    string           `json:"enquiry_no"`
	QuoteID      *uint            `json:"quote_id"`
	QuoteNo      string           `json:"quote_no"`
	CustomerID   uint             `json:"customer_id"`
	CustomerName string           `json:"customer_name"`
	Status       model.LockStatus `json:"status"`
	TotalAmount  float64          `json:"total_amount"`
	ExpireAt     time.Time        `json:"expire_at"`
	ReturnStatus model.ReturnStatus `json:"return_status"`
	CreatedByID  uint             `json:"created_by_id"`
	CreatedByName string         `json:"created_by_name"`
	Remark       string           `json:"remark"`
	CreatedAt    time.Time        `json:"created_at"`
}

type LockOrderDetailResponse struct {
	LockOrderResponse
	Items []LockItemResponse `json:"items"`
}

type LockItemResponse struct {
	ID           uint               `json:"id"`
	PartID       uint               `json:"part_id"`
	PartNumber   string             `json:"part_number"`
	PartName     string             `json:"part_name"`
	Brand        string             `json:"brand"`
	Quantity     int                `json:"quantity"`
	LockedQty    int                `json:"locked_qty"`
	PickedQty    int                `json:"picked_qty"`
	ReturnedQty  int                `json:"returned_qty"`
	UnitPrice    float64            `json:"unit_price"`
	Amount       float64            `json:"amount"`
	Location     string             `json:"location"`
	ReturnStatus model.ReturnStatus `json:"return_status"`
	ReturnReason string             `json:"return_reason"`
	Remark       string             `json:"remark"`
}

type LockOrderSummaryResponse struct {
	ID        uint             `json:"id"`
	LockNo    string           `json:"lock_no"`
	Status    model.LockStatus `json:"status"`
	TotalAmount float64        `json:"total_amount"`
	CreatedAt time.Time        `json:"created_at"`
}

type BatchOperationResponse struct {
	SuccessCount int               `json:"success_count"`
	FailCount    int               `json:"fail_count"`
	FailedItems  []FailedBatchItem `json:"failed_items"`
}

type FailedBatchItem struct {
	ID    uint   `json:"id"`
	Error string `json:"error"`
}
