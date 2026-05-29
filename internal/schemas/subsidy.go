package schemas

import "runner-platform/internal/models"

type CreateSubsidyRequest struct {
	OrderID     string  `json:"order_id" validate:"required,uuid"`
	RefundID    *string `json:"refund_id" validate:"omitempty,uuid"`
	AppealID    *string `json:"appeal_id" validate:"omitempty,uuid"`
	PayeeID     string  `json:"payee_id" validate:"required,uuid"`
	PayeeType   string  `json:"payee_type" validate:"required,oneof=user runner merchant"`
	Amount      float64 `json:"amount" validate:"required,min=0"`
	Reason      string  `json:"reason" validate:"required,max=200"`
	Description string  `json:"description" validate:"max=1000"`
}

type ReviewSubsidyRequest struct {
	Status models.SubsidyStatus `json:"status" validate:"required,oneof=approved rejected"`
	Remark string               `json:"remark" validate:"max=500"`
}

type MarkPaidRequest struct {
	PaymentMethod string `json:"payment_method" validate:"required,max=30"`
	TransactionNo string `json:"transaction_no" validate:"max=100"`
}

type SubsidyQuery struct {
	OrderNo   string               `query:"order_no"`
	Status    models.SubsidyStatus `query:"status"`
	PayeeID   string               `query:"payee_id"`
	PayeeType string               `query:"payee_type"`
	StartDate string               `query:"start_date"`
	EndDate   string               `query:"end_date"`
	Page      int                  `query:"page,default=1"`
	PageSize  int                  `query:"page_size,default=20"`
}
