package service

import (
	"instrument-rental/database"
	"instrument-rental/model"
	"time"

	"gorm.io/gorm"
)

type ReturnService struct{}

func NewReturnService() *ReturnService { return &ReturnService{} }

type CreateReturnInput struct {
	RentalID           uint    `json:"rental_id"`
	ReturnDate         string  `json:"return_date"`
	Condition          string  `json:"condition"`
	DamageDescription  string  `json:"damage_description"`
	DamagePhotos       string  `json:"damage_photos"`
	DepositDeduction   float64 `json:"deposit_deduction"`
	DepositRefund      float64 `json:"deposit_refund"`
}

func (s *ReturnService) List(rentalID uint, status, condition string, page, pageSize int) ([]model.ReturnRecord, int64, error) {
	var records []model.ReturnRecord
	var total int64
	q := database.DB.Model(&model.ReturnRecord{})
	if rentalID > 0 {
		q = q.Where("rental_id = ?", rentalID)
	}
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if condition != "" {
		q = q.Where("condition = ?", condition)
	}
	q.Count(&total)
	offset := (page - 1) * pageSize
	err := q.Preload("Rental").Preload("Rental.Instrument").Preload("Rental.School").Preload("Assessor").
		Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&records).Error
	return records, total, err
}

func (s *ReturnService) GetByID(id uint) (*model.ReturnRecord, error) {
	var record model.ReturnRecord
	err := database.DB.Preload("Rental").Preload("Rental.Instrument").Preload("Rental.School").Preload("Assessor").
		First(&record, id).Error
	return &record, err
}

func (s *ReturnService) Create(input *CreateReturnInput, assessorID uint, ip string) (*model.ReturnRecord, error) {
	rd, err := time.Parse("2006-01-02", input.ReturnDate)
	if err != nil {
		return nil, err
	}
	record := &model.ReturnRecord{
		RentalID:          input.RentalID,
		ReturnDate:        rd,
		Condition:         model.ReturnCondition(input.Condition),
		DamageDescription: input.DamageDescription,
		DamagePhotos:      input.DamagePhotos,
		DepositDeduction:  input.DepositDeduction,
		DepositRefund:     input.DepositRefund,
		AssessorID:        assessorID,
		Status:            model.ReturnPendingReview,
	}
	if err := database.DB.Create(record).Error; err != nil {
		return nil, err
	}
	newVal := returnToMap(record)
	logEntry := model.AuditLog{
		UserID:     assessorID,
		Action:     "create_return",
		EntityType: "return",
		EntityID:   record.ID,
		NewValue:   newVal,
		IPAddress:  ip,
	}
	database.DB.Create(&logEntry)
	return record, nil
}

func (s *ReturnService) Review(id uint, status model.ReturnStatus, reviewNotes string, reviewerID uint, ip string) error {
	oldVal := fetchOldReturn(id)
	updates := map[string]any{
		"status":       status,
		"review_notes": reviewNotes,
	}
	tx := database.DB.Begin()
	if tx.Error != nil {
		return tx.Error
	}
	if err := tx.Model(&model.ReturnRecord{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		tx.Rollback()
		return err
	}
	var record model.ReturnRecord
	if err := tx.First(&record, id).Error; err != nil {
		tx.Rollback()
		return err
	}
	now := time.Now()
	var rental model.Rental
	if err := tx.First(&rental, record.RentalID).Error; err != nil {
		tx.Rollback()
		return err
	}
	switch status {
	case model.ReturnApproved:
		if err := tx.Model(&model.Rental{}).Where("id = ?", record.RentalID).
			Updates(map[string]any{
				"actual_return_date": now,
				"status":             model.RentalReturned,
			}).Error; err != nil {
			tx.Rollback()
			return err
		}
		if err := tx.Model(&model.Instrument{}).Where("id = ?", rental.InstrumentID).
			Update("status", model.InstrumentAvailable).Error; err != nil {
			tx.Rollback()
			return err
		}
		var depositStatus model.DepositStatus
		if record.DepositDeduction > 0 {
			depositStatus = model.DepositPartiallyRefunded
		} else {
			depositStatus = model.DepositFullyRefunded
		}
		if err := tx.Model(&model.Rental{}).Where("id = ?", record.RentalID).
			Update("deposit_status", depositStatus).Error; err != nil {
			tx.Rollback()
			return err
		}
	case model.ReturnRejected:
		if err := tx.Model(&model.Rental{}).Where("id = ?", record.RentalID).
			Updates(map[string]any{
				"actual_return_date": nil,
				"status":             model.RentalActive,
				"deposit_status":     model.DepositCollected,
			}).Error; err != nil {
			tx.Rollback()
			return err
		}
		if err := tx.Model(&model.Instrument{}).Where("id = ?", rental.InstrumentID).
			Update("status", model.InstrumentRented).Error; err != nil {
			tx.Rollback()
			return err
		}
	case model.ReturnDisputed:
		if err := tx.Model(&model.Rental{}).Where("id = ?", record.RentalID).
			Update("deposit_status", model.DepositForfeited).Error; err != nil {
			tx.Rollback()
			return err
		}
	case model.ReturnNeedsReview:
	}
	if err := tx.Commit().Error; err != nil {
		return err
	}
	newVal := fetchOldReturn(id)
	logEntry := model.AuditLog{
		UserID:     reviewerID,
		Action:     "review_return",
		EntityType: "return",
		EntityID:   id,
		OldValue:   oldVal,
		NewValue:   newVal,
		IPAddress:  ip,
	}
	database.DB.Create(&logEntry)
	return nil
}

func fetchOldReturn(id uint) model.JSONMap {
	var r model.ReturnRecord
	if database.DB.First(&r, id).Error == nil {
		return returnToMap(&r)
	}
	return nil
}

func returnToMap(r *model.ReturnRecord) model.JSONMap {
	return model.JSONMap{
		"id":                r.ID,
		"rental_id":         r.RentalID,
		"condition":         string(r.Condition),
		"deposit_deduction": r.DepositDeduction,
		"deposit_refund":    r.DepositRefund,
		"status":            string(r.Status),
	}
}

var _ = gorm.Model{}
