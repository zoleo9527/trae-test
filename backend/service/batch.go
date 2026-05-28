package service

import (
	"encoding/json"
	"fmt"
	"instrument-rental/database"
	"instrument-rental/model"
	"time"
)

type BatchService struct{}

func NewBatchService() *BatchService { return &BatchService{} }

type BatchOperationResult struct {
	Total   int      `json:"total"`
	Success int      `json:"success"`
	Failed  int      `json:"failed"`
	Errors  []string `json:"errors,omitempty"`
}

func (s *BatchService) BatchUpdateRentals(ids []uint, updates map[string]any, userID uint, ip string) *BatchOperationResult {
	result := &BatchOperationResult{Total: len(ids)}
	for _, id := range ids {
		oldVal := fetchOldRental(id)
		err := database.DB.Model(&model.Rental{}).Where("id = ?", id).Updates(updates).Error
		if err != nil {
			result.Failed++
			result.Errors = append(result.Errors, fmt.Sprintf("rental %d: %v", id, err))
			continue
		}
		result.Success++
		newVal := fetchOldRental(id)
		logRentalChange(userID, "batch_update_rental", id, oldVal, newVal, ip)
	}
	return result
}

func (s *BatchService) BatchUpdatePayments(ids []uint, updates map[string]any, userID uint, ip string) *BatchOperationResult {
	result := &BatchOperationResult{Total: len(ids)}
	for _, id := range ids {
		oldVal := fetchOldPayment(id)
		err := database.DB.Model(&model.Payment{}).Where("id = ?", id).Updates(updates).Error
		if err != nil {
			result.Failed++
			result.Errors = append(result.Errors, fmt.Sprintf("payment %d: %v", id, err))
			continue
		}
		result.Success++
		newVal := fetchOldPayment(id)
		logPaymentChange(userID, "batch_update_payment", id, oldVal, newVal, ip)
	}
	return result
}

func (s *BatchService) BatchUpdateSchools(ids []uint, updates map[string]any, userID uint, ip string) *BatchOperationResult {
	result := &BatchOperationResult{Total: len(ids)}
	for _, id := range ids {
		oldVal := fetchOldSchool(id)
		err := database.DB.Model(&model.School{}).Where("id = ?", id).Updates(updates).Error
		if err != nil {
			result.Failed++
			result.Errors = append(result.Errors, fmt.Sprintf("school %d: %v", id, err))
			continue
		}
		result.Success++
		newVal := fetchOldSchool(id)
		logSchoolChange(userID, "batch_update_school", id, oldVal, newVal, ip)
	}
	return result
}

func (s *BatchService) BatchCreatePayments(inputs []CreatePaymentInput, userID uint, ip string) *BatchOperationResult {
	result := &BatchOperationResult{Total: len(inputs)}
	for _, input := range inputs {
		payment := &model.Payment{
			SchoolID:      input.SchoolID,
			RentalID:      input.RentalID,
			Amount:        input.Amount,
			Status:        model.PaymentPending,
			PaymentMethod: input.PaymentMethod,
			InvoiceNumber: input.InvoiceNumber,
			Notes:         input.Notes,
		}
		if dd, err := time.Parse("2006-01-02", input.DueDate); err == nil {
			payment.DueDate = dd
		}
		if err := database.DB.Create(payment).Error; err != nil {
			result.Failed++
			result.Errors = append(result.Errors, fmt.Sprintf("payment create: %v", err))
			continue
		}
		result.Success++
		newVal := paymentToMap(payment)
		bytes, _ := json.Marshal(newVal)
		var nv model.JSONMap
		json.Unmarshal(bytes, &nv)
		logPaymentChange(userID, "batch_create_payment", payment.ID, nil, nv, ip)
	}
	return result
}
