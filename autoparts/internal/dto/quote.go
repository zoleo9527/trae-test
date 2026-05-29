package dto

import (
	"autoparts/internal/model"
	"time"
)

type CreateQuoteRequest struct {
	EnquiryID uint             `json:"enquiry_id" validate:"required"`
	Discount  float64          `json:"discount" validate:"min=0"`
	ValidDays int            `json:"valid_days" validate:"min=1,max=30"`
	Items     []QuoteItemRequest `json:"items" validate:"required,min=1,dive"`
	Remark    string         `json:"remark"`
}

type QuoteItemRequest struct {
	EnquiryItemID uint    `json:"enquiry_item_id" validate:"required"`
	PartID        *uint   `json:"part_id"`
	PartNumber    string  `json:"part_number"`
	PartName      string  `json:"part_name" validate:"required"`
	Brand         string  `json:"brand"`
	Quantity      int     `json:"quantity" validate:"required,min=1"`
	QuotePrice    float64 `json:"quote_price" validate:"required,min=0"`
	Remark        string  `json:"remark"`
}

type ReviewQuoteRequest struct {
	Status       model.QuoteStatus `json:"status" validate:"required"`
	RejectReason string            `json:"reject_reason"`
}

type QuoteFilter struct {
	EnquiryID   *uint              `json:"enquiry_id"`
	CustomerID *uint              `json:"customer_id"`
	Status     *model.QuoteStatus `json:"status"`
	CreatedByID *uint              `json:"created_by_id"`
	CreatedStart *time.Time      `json:"created_start"`
	CreatedEnd   *time.Time      `json:"created_end"`
	Page         int               `json:"page" validate:"min=1"`
	PageSize     int               `json:"page_size" validate:"min=1,max=100"`
}

type QuoteResponse struct {
	ID           uint              `json:"id"`
	QuoteNo      string            `json:"quote_no"`
	EnquiryID    uint              `json:"enquiry_id"`
	EnquiryNo    string            `json:"enquiry_no"`
	CustomerID   uint              `json:"customer_id"`
	CustomerName string            `json:"customer_name"`
	Status       model.QuoteStatus `json:"status"`
	TotalAmount  float64           `json:"total_amount"`
	Discount     float64           `json:"discount"`
	FinalAmount  float64           `json:"final_amount"`
	ValidDays    int               `json:"valid_days"`
	ExpireAt     time.Time         `json:"expire_at"`
	CreatedByID uint              `json:"created_by_id"`
	CreatedByName string          `json:"created_by_name"`
	RejectReason string          `json:"reject_reason"`
	Remark       string            `json:"remark"`
	CreatedAt    time.Time         `json:"created_at"`
}

type QuoteDetailResponse struct {
	QuoteResponse
	Items []QuoteItemResponse `json:"items"`
}

type QuoteItemResponse struct {
	ID         uint    `json:"id"`
	PartID     *uint   `json:"part_id"`
	PartNumber string  `json:"part_number"`
	PartName   string  `json:"part_name"`
	Brand      string  `json:"brand"`
	Quantity   int     `json:"quantity"`
	CostPrice  float64 `json:"cost_price"`
	QuotePrice float64 `json:"quote_price"`
	Amount     float64 `json:"amount"`
	IsStock    bool    `json:"is_stock"`
	StockQty   int     `json:"stock_qty"`
	Remark     string  `json:"remark"`
}

type QuoteSummaryResponse struct {
	ID          uint              `json:"id"`
	QuoteNo     string            `json:"quote_no"`
	Status      model.QuoteStatus `json:"status"`
	FinalAmount float64           `json:"final_amount"`
	CreatedAt   time.Time         `json:"created_at"`
}
