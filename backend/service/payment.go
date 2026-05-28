package service

import (
	"instrument-rental/database"
	"instrument-rental/model"
	"time"

	"gorm.io/gorm"
)

type PaymentService struct{}

func NewPaymentService() *PaymentService { return &PaymentService{} }

type CreatePaymentInput struct {
	SchoolID      uint    `json:"school_id"`
	RentalID      uint    `json:"rental_id"`
	Amount        float64 `json:"amount"`
	DueDate       string  `json:"due_date"`
	PaymentMethod string  `json:"payment_method"`
	InvoiceNumber string  `json:"invoice_number"`
	Notes         string  `json:"notes"`
}

type BatchUpdatePaymentInput struct {
	IDs     []uint                  `json:"ids"`
	Updates map[string]any          `json:"updates"`
}

func (s *PaymentService) List(schoolID uint, status string, startDate, endDate string, page, pageSize int) ([]model.Payment, int64, error) {
	var payments []model.Payment
	var total int64
	q := database.DB.Model(&model.Payment{})
	if schoolID > 0 {
		q = q.Where("school_id = ?", schoolID)
	}
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if startDate != "" {
		q = q.Where("due_date >= ?", startDate)
	}
	if endDate != "" {
		q = q.Where("due_date <= ?", endDate)
	}
	q.Count(&total)
	offset := (page - 1) * pageSize
	err := q.Preload("School").Preload("Rental").
		Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&payments).Error
	return payments, total, err
}

func (s *PaymentService) GetByID(id uint) (*model.Payment, error) {
	var payment model.Payment
	err := database.DB.Preload("School").Preload("Rental").First(&payment, id).Error
	return &payment, err
}

func (s *PaymentService) Create(input *CreatePaymentInput, userID uint, ip string) (*model.Payment, error) {
	dd, err := time.Parse("2006-01-02", input.DueDate)
	if err != nil {
		return nil, err
	}
	payment := &model.Payment{
		SchoolID:      input.SchoolID,
		RentalID:      input.RentalID,
		Amount:        input.Amount,
		DueDate:       dd,
		Status:        model.PaymentPending,
		PaymentMethod: input.PaymentMethod,
		InvoiceNumber: input.InvoiceNumber,
		Notes:         input.Notes,
	}
	if err := database.DB.Create(payment).Error; err != nil {
		return nil, err
	}
	newVal := paymentToMap(payment)
	logEntry := model.AuditLog{
		UserID:     userID,
		Action:     "create",
		EntityType: "payment",
		EntityID:   payment.ID,
		NewValue:   newVal,
		IPAddress:  ip,
	}
	database.DB.Create(&logEntry)
	return payment, nil
}

func (s *PaymentService) Update(id uint, updates map[string]any, userID uint, ip string) error {
	oldVal := fetchOldPayment(id)
	err := database.DB.Model(&model.Payment{}).Where("id = ?", id).Updates(updates).Error
	if err == nil {
		newVal := fetchOldPayment(id)
		logEntry := model.AuditLog{
			UserID:     userID,
			Action:     "update",
			EntityType: "payment",
			EntityID:   id,
			OldValue:   oldVal,
			NewValue:   newVal,
			IPAddress:  ip,
		}
		database.DB.Create(&logEntry)
	}
	return err
}

func (s *PaymentService) RecordPayment(id uint, paidAmount float64, paymentMethod string, userID uint, ip string) error {
	oldVal := fetchOldPayment(id)
	now := time.Now()
	updates := map[string]any{
		"paid_amount":    paidAmount,
		"payment_method": paymentMethod,
		"paid_date":      now,
	}
	var payment model.Payment
	if database.DB.First(&payment, id).Error != nil {
		return gorm.ErrRecordNotFound
	}
	if paidAmount >= payment.Amount {
		updates["status"] = model.PaymentPaid
	} else {
		updates["status"] = model.PaymentPartial
	}
	err := database.DB.Model(&model.Payment{}).Where("id = ?", id).Updates(updates).Error
	if err == nil {
		newVal := fetchOldPayment(id)
		logEntry := model.AuditLog{
			UserID:     userID,
			Action:     "record_payment",
			EntityType: "payment",
			EntityID:   id,
			OldValue:   oldVal,
			NewValue:   newVal,
			IPAddress:  ip,
		}
		database.DB.Create(&logEntry)
	}
	return err
}

func (s *PaymentService) BatchUpdate(input *BatchUpdatePaymentInput, userID uint, ip string) (int64, error) {
	var count int64
	for _, id := range input.IDs {
		err := s.Update(id, input.Updates, userID, ip)
		if err != nil {
			break
		}
		count++
	}
	return count, nil
}

func (s *PaymentService) MarkOverdue() (int64, error) {
	now := time.Now()
	result := database.DB.Model(&model.Payment{}).
		Where("status IN ? AND due_date < ?", []model.PaymentStatus{model.PaymentPending, model.PaymentPartial}, now).
		Update("status", model.PaymentOverdue)
	return result.RowsAffected, result.Error
}

func fetchOldPayment(id uint) map[string]any {
	var p model.Payment
	if database.DB.First(&p, id).Error == nil {
		return paymentToMap(&p)
	}
	return nil
}

func paymentToMap(p *model.Payment) map[string]any {
	return map[string]any{
		"id":            p.ID,
		"school_id":     p.SchoolID,
		"rental_id":     p.RentalID,
		"amount":        p.Amount,
		"paid_amount":   p.PaidAmount,
		"status":        string(p.Status),
		"due_date":      p.DueDate,
	}
}

var _ = gorm.Model{}
