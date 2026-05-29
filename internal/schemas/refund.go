package schemas

import "runner-platform/internal/models"

type CreateRefundRequest struct {
	OrderID        string             `json:"order_id" validate:"required,uuid"`
	Reason         models.RefundReason `json:"reason" validate:"required"`
	Amount         float64            `json:"amount" validate:"required,min=0"`
	Description    string             `json:"description" validate:"required,max=1000"`
	EvidenceImages []string           `json:"evidence_images"`
}

type UpdateRefundRequest struct {
	Reason         *models.RefundReason `json:"reason"`
	Amount         *float64            `json:"amount" validate:"omitempty,min=0"`
	Description    *string             `json:"description" validate:"omitempty,max=1000"`
	EvidenceImages *[]string           `json:"evidence_images"`
}

type ReviewRefundRequest struct {
	Status      models.RefundStatus `json:"status" validate:"required,oneof=approved rejected processing"`
	RejectReason string             `json:"reject_reason" validate:"required_if=Status rejected,omitempty,max=500"`
	Remark      string             `json:"remark" validate:"max=500"`
}

type RefundQuery struct {
	OrderNo   string              `query:"order_no"`
	Status    models.RefundStatus `query:"status"`
	Reason    models.RefundReason `query:"reason"`
	UserID    string              `query:"user_id"`
	StartDate string              `query:"start_date"`
	EndDate   string              `query:"end_date"`
	Page      int                 `query:"page,default=1"`
	PageSize  int                 `query:"page_size,default=20"`
}

type RefundDetailResponse struct {
	Refund interface{} `json:"refund"`
	Logs   interface{} `json:"operation_logs"`
}
