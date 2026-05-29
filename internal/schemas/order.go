package schemas

import (
	"runner-platform/internal/models"
	"time"
)

type CreateOrderRequest struct {
	UserID           string    `json:"user_id" validate:"required,uuid"`
	MerchantID       string    `json:"merchant_id" validate:"required,uuid"`
	OrderType        string    `json:"order_type" validate:"required"`
	GoodsDescription string    `json:"goods_description" validate:"max=500"`
	GoodsValue       float64   `json:"goods_value" validate:"required,min=0"`
	DeliveryFee      float64   `json:"delivery_fee" validate:"required,min=0"`
	PickupAddress    string    `json:"pickup_address" validate:"required,max=500"`
	DeliveryAddress  string    `json:"delivery_address" validate:"required,max=500"`
	ExpectedTime     time.Time `json:"expected_time"`
	Remark           string    `json:"remark" validate:"max=1000"`
}

type AssignOrderRequest struct {
	RunnerID string `json:"runner_id" validate:"required,uuid"`
	Reason   string `json:"reason" validate:"max=500"`
}

type UpdateOrderStatusRequest struct {
	Status        models.OrderStatus `json:"status" validate:"required"`
	TimeoutReason string             `json:"timeout_reason" validate:"max=500"`
	Remark        string             `json:"remark" validate:"max=500"`
}

type OrderQuery struct {
	OrderNo    string              `query:"order_no"`
	Status     models.OrderStatus  `query:"status"`
	UserID     string              `query:"user_id"`
	RunnerID   string              `query:"runner_id"`
	MerchantID string              `query:"merchant_id"`
	StartDate  string              `query:"start_date"`
	EndDate    string              `query:"end_date"`
	Page       int                 `query:"page,default=1"`
	PageSize   int                 `query:"page_size,default=20"`
}

type OperationLogQuery struct {
	TargetID    string                   `query:"target_id"`
	TargetType  string                   `query:"target_type"`
	Action      models.OperationAction   `query:"action"`
	OperatorID  string                   `query:"operator_id"`
	StartDate   string                   `query:"start_date"`
	EndDate     string                   `query:"end_date"`
	Page        int                      `query:"page,default=1"`
	PageSize    int                      `query:"page_size,default=20"`
}
