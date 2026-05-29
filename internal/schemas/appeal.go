package schemas

import "runner-platform/internal/models"

type CreateAppealRequest struct {
	OrderID  string   `json:"order_id" validate:"required,uuid"`
	RefundID *string  `json:"refund_id" validate:"omitempty,uuid"`
	Title    string   `json:"title" validate:"required,max=200"`
	Content  string   `json:"content" validate:"required,max=2000"`
	Evidence []string `json:"evidence"`
}

type HandleAppealRequest struct {
	Status       models.AppealStatus `json:"status" validate:"required,oneof=upheld rejected closed"`
	Result       string              `json:"result" validate:"required_if=Status upheld,omitempty,max=1000"`
	RejectReason string              `json:"reject_reason" validate:"required_if=Status rejected,omitempty,max=500"`
	Remark       string              `json:"remark" validate:"max=500"`
}

type AppealQuery struct {
	OrderNo   string               `query:"order_no"`
	Status    models.AppealStatus  `query:"status"`
	AppealerID string              `query:"appealer_id"`
	HandlerID string              `query:"handler_id"`
	StartDate string              `query:"start_date"`
	EndDate   string              `query:"end_date"`
	Page      int                 `query:"page,default=1"`
	PageSize  int                 `query:"page_size,default=20"`
}

type AddRemarkRequest struct {
	Content    string `json:"content" validate:"required,max=2000"`
	IsInternal bool   `json:"is_internal"`
}
