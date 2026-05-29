package dto

import (
	"autoparts/internal/model"
	"time"
)

type CreateEnquiryRequest struct {
	CustomerID   uint                `json:"customer_id" validate:"required"`
	IsUrgent   bool                `json:"is_urgent"`
	Priority    int                 `json:"priority" validate:"min=1,max=5"`
	Items       []EnquiryItemRequest `json:"items" validate:"required,min=1,dive"`
	Remark      string              `json:"remark"`
}

type EnquiryItemRequest struct {
	PartID     *uint  `json:"part_id"`
	PartNumber string `json:"part_number"`
	PartName   string `json:"part_name" validate:"required"`
	Brand      string `json:"brand"`
	Quantity   int    `json:"quantity" validate:"required,min=1"`
	Remark     string `json:"remark"`
}

type UpdateEnquiryRequest struct {
	IsUrgent *bool               `json:"is_urgent"`
	Priority *int                `json:"priority" validate:"omitempty,min=1,max=5"`
	Items    []EnquiryItemRequest `json:"items" validate:"omitempty,min=1,dive"`
	Remark   *string             `json:"remark"`
	Status   *string             `json:"status"`
}

type EnquiryFilter struct {
	CustomerID   *uint      `json:"customer_id"`
	CustomerName   *string     `json:"customer_name"`
	LicensePlate   *string     `json:"license_plate"`
	Status         *model.EnquiryStatus `json:"status"`
	IsUrgent       *bool       `json:"is_urgent"`
	CreatedByID     *uint       `json:"created_by_id"`
	CreatedStart   *time.Time  `json:"created_start"`
	CreatedEnd     *time.Time  `json:"created_end"`
	Page           int         `json:"page" validate:"min=1"`
	PageSize       int         `json:"page_size" validate:"min=1,max=100"`
}

type EnquiryResponse struct {
	ID            uint                `json:"id"`
	EnquiryNo     string              `json:"enquiry_no"`
	CustomerID    uint                `json:"customer_id"`
	CustomerName  string              `json:"customer_name"`
	LicensePlate  string              `json:"license_plate"`
	CarModel      string              `json:"car_model"`
	Status        model.EnquiryStatus `json:"status"`
	IsUrgent      bool                `json:"is_urgent"`
	Priority      int                 `json:"priority"`
	Items         []EnquiryItemResponse `json:"items"`
	QuoteCount    int                 `json:"quote_count"`
	LockCount     int                 `json:"lock_count"`
	CreatedByID   uint                `json:"created_by_id"`
	CreatedByName string            `json:"created_by_name"`
	Remark        string              `json:"remark"`
	CreatedAt     time.Time           `json:"created_at"`
	UpdatedAt     time.Time           `json:"updated_at"`
}

type EnquiryItemResponse struct {
	ID         uint    `json:"id"`
	PartID     *uint   `json:"part_id"`
	PartNumber string  `json:"part_number"`
	PartName   string  `json:"part_name"`
	Brand      string  `json:"brand"`
	Quantity   int     `json:"quantity"`
	UnitPrice  float64 `json:"unit_price"`
	Amount     float64 `json:"amount"`
	Remark     string  `json:"remark"`
}

type EnquiryDetailResponse struct {
	EnquiryResponse
	Quotes     []QuoteSummaryResponse `json:"quotes"`
	LockOrders []LockOrderSummaryResponse `json:"lock_orders"`
}
