package service

import (
	"fmt"
	"instrument-rental/database"
	"instrument-rental/model"
	"time"

	"gorm.io/gorm"
)

type BusinessError struct {
	Code    int
	Message string
}

func (e *BusinessError) Error() string {
	return e.Message
}

func newBusinessError(code int, msg string) *BusinessError {
	return &BusinessError{Code: code, Message: msg}
}

var validTransitions = map[model.ReturnStatus][]model.ReturnStatus{
	model.ReturnPendingReview: {
		model.ReturnApproved,
		model.ReturnRejected,
		model.ReturnNeedsReview,
		model.ReturnDisputed,
	},
	model.ReturnNeedsReview: {
		model.ReturnApproved,
		model.ReturnRejected,
		model.ReturnDisputed,
	},
	model.ReturnRejected: {
		model.ReturnApproved,
		model.ReturnNeedsReview,
		model.ReturnDisputed,
	},
	model.ReturnApproved: {
		model.ReturnRejected,
		model.ReturnNeedsReview,
		model.ReturnDisputed,
	},
	model.ReturnDisputed: {
		model.ReturnApproved,
		model.ReturnRejected,
		model.ReturnNeedsReview,
	},
}

var knownStatuses = map[model.ReturnStatus]bool{
	model.ReturnPendingReview: true,
	model.ReturnApproved:      true,
	model.ReturnRejected:      true,
	model.ReturnNeedsReview:   true,
	model.ReturnDisputed:      true,
}

func isValidTransition(from, to model.ReturnStatus) bool {
	validTos, ok := validTransitions[from]
	if !ok {
		return false
	}
	for _, validTo := range validTos {
		if validTo == to {
			return true
		}
	}
	return false
}

type ReturnService struct{}

func NewReturnService() *ReturnService { return &ReturnService{} }

type CreateReturnInput struct {
	RentalID          uint    `json:"rental_id"`
	ReturnDate        string  `json:"return_date"`
	Condition         string  `json:"condition"`
	DamageDescription string  `json:"damage_description"`
	DamagePhotos      string  `json:"damage_photos"`
	DepositDeduction  float64 `json:"deposit_deduction"`
	DepositRefund     float64 `json:"deposit_refund"`
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

	var rental model.Rental
	if err := database.DB.First(&rental, input.RentalID).Error; err != nil {
		return nil, newBusinessError(404, "rental not found")
	}

	var instrument model.Instrument
	if err := database.DB.First(&instrument, rental.InstrumentID).Error; err != nil {
		return nil, newBusinessError(404, "instrument not found")
	}

	record := &model.ReturnRecord{
		RentalID:                input.RentalID,
		ReturnDate:              rd,
		Condition:               model.ReturnCondition(input.Condition),
		DamageDescription:       input.DamageDescription,
		DamagePhotos:            input.DamagePhotos,
		DepositDeduction:        input.DepositDeduction,
		DepositRefund:           input.DepositRefund,
		AssessorID:              assessorID,
		Status:                  model.ReturnPendingReview,
		SnapshotRentalStatus:    string(rental.Status),
		SnapshotDepositStatus:   string(rental.DepositStatus),
		SnapshotInstrumentStatus: string(instrument.Status),
		SnapshotActualReturnDate: rental.ActualReturnDate,
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

func (s *ReturnService) Review(id uint, newStatus model.ReturnStatus, reviewNotes string, reviewerID uint, ip string) error {
	if !knownStatuses[newStatus] {
		return newBusinessError(400, fmt.Sprintf("unknown return status: %s", newStatus))
	}

	oldReturn := fetchOldReturn(id)
	if oldReturn == nil {
		return newBusinessError(404, "return record not found")
	}

	oldStatus := model.ReturnStatus(oldReturn["status"].(string))
	if oldStatus == newStatus {
		return newBusinessError(409, fmt.Sprintf("return record is already %s, no change applied", oldStatus))
	}

	if !isValidTransition(oldStatus, newStatus) {
		return newBusinessError(400, fmt.Sprintf("invalid status transition from %s to %s", oldStatus, newStatus))
	}

	tx := database.DB.Begin()
	if tx.Error != nil {
		return tx.Error
	}
	defer tx.Rollback()

	var record model.ReturnRecord
	if err := tx.First(&record, id).Error; err != nil {
		return err
	}

	var rental model.Rental
	if err := tx.First(&rental, record.RentalID).Error; err != nil {
		return err
	}

	var instrument model.Instrument
	if err := tx.First(&instrument, rental.InstrumentID).Error; err != nil {
		return err
	}

	origRentalStatus := fallbackRentalStatus(record.SnapshotRentalStatus, &rental)
	origDepositStatus := fallbackDepositStatus(record.SnapshotDepositStatus, &rental)
	origInstrumentStatus := fallbackInstrumentStatus(record.SnapshotInstrumentStatus, &instrument)
	origActualReturnDate := fallbackActualReturnDate(record.SnapshotActualReturnDate, &rental)

	if err := s.applyStateTransition(tx, oldStatus, newStatus, &record, &rental,
		origRentalStatus, origDepositStatus, origInstrumentStatus, origActualReturnDate, reviewNotes); err != nil {
		return err
	}

	if err := tx.Commit().Error; err != nil {
		return err
	}

	newReturn := fetchOldReturn(id)
	logEntry := model.AuditLog{
		UserID:     reviewerID,
		Action:     "review_return",
		EntityType: "return",
		EntityID:   id,
		OldValue:   oldReturn,
		NewValue:   newReturn,
		IPAddress:  ip,
	}
	database.DB.Create(&logEntry)

	return nil
}

func (s *ReturnService) applyStateTransition(tx *gorm.DB, oldStatus, newStatus model.ReturnStatus,
	record *model.ReturnRecord, rental *model.Rental,
	origRentalStatus model.RentalStatus, origDepositStatus model.DepositStatus, origInstrumentStatus model.InstrumentStatus,
	origActualReturnDate *time.Time, reviewNotes string) error {

	if err := tx.Model(&model.ReturnRecord{}).Where("id = ?", record.ID).
		Updates(map[string]any{
			"status":       newStatus,
			"review_notes": reviewNotes,
		}).Error; err != nil {
		return err
	}

	switch newStatus {
	case model.ReturnApproved:
		return applyApproved(tx, record, rental)
	case model.ReturnRejected:
		return applyRejected(tx, record, rental, origRentalStatus, origDepositStatus, origInstrumentStatus, origActualReturnDate)
	case model.ReturnNeedsReview:
		return applyNeedsReview(tx, oldStatus, rental, origRentalStatus, origDepositStatus, origInstrumentStatus, origActualReturnDate)
	case model.ReturnDisputed:
		return applyDisputed(tx, oldStatus, rental, origDepositStatus)
	default:
		return newBusinessError(400, fmt.Sprintf("unsupported target status: %s", newStatus))
	}
}

func applyApproved(tx *gorm.DB, record *model.ReturnRecord, rental *model.Rental) error {
	now := time.Now()
	if err := tx.Model(&model.Rental{}).Where("id = ?", record.RentalID).
		Updates(map[string]any{
			"actual_return_date": now,
			"status":             model.RentalReturned,
		}).Error; err != nil {
		return err
	}

	if err := tx.Model(&model.Instrument{}).Where("id = ?", rental.InstrumentID).
		Update("status", model.InstrumentAvailable).Error; err != nil {
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
		return err
	}

	return nil
}

func applyRejected(tx *gorm.DB, record *model.ReturnRecord, rental *model.Rental,
	origRentalStatus model.RentalStatus, origDepositStatus model.DepositStatus, origInstrumentStatus model.InstrumentStatus,
	origActualReturnDate *time.Time) error {

	if err := tx.Model(&model.Rental{}).Where("id = ?", record.RentalID).
		Updates(map[string]any{
			"actual_return_date": origActualReturnDate,
			"status":             origRentalStatus,
			"deposit_status":     origDepositStatus,
		}).Error; err != nil {
		return err
	}

	if err := tx.Model(&model.Instrument{}).Where("id = ?", rental.InstrumentID).
		Update("status", origInstrumentStatus).Error; err != nil {
		return err
	}

	return nil
}

func applyNeedsReview(tx *gorm.DB, oldStatus model.ReturnStatus, rental *model.Rental,
	origRentalStatus model.RentalStatus, origDepositStatus model.DepositStatus, origInstrumentStatus model.InstrumentStatus,
	origActualReturnDate *time.Time) error {

	if oldStatus == model.ReturnApproved {
		if err := tx.Model(&model.Rental{}).Where("id = ?", rental.ID).
			Updates(map[string]any{
				"actual_return_date": origActualReturnDate,
				"status":             origRentalStatus,
				"deposit_status":     origDepositStatus,
			}).Error; err != nil {
			return err
		}

		if err := tx.Model(&model.Instrument{}).Where("id = ?", rental.InstrumentID).
			Update("status", origInstrumentStatus).Error; err != nil {
			return err
		}
	} else if oldStatus == model.ReturnDisputed {
		if err := tx.Model(&model.Rental{}).Where("id = ?", rental.ID).
			Updates(map[string]any{
				"actual_return_date": origActualReturnDate,
				"status":             origRentalStatus,
				"deposit_status":     origDepositStatus,
			}).Error; err != nil {
			return err
		}

		if err := tx.Model(&model.Instrument{}).Where("id = ?", rental.InstrumentID).
			Update("status", origInstrumentStatus).Error; err != nil {
			return err
		}
	}

	return nil
}

func applyDisputed(tx *gorm.DB, oldStatus model.ReturnStatus, rental *model.Rental,
	origDepositStatus model.DepositStatus) error {

	if oldStatus == model.ReturnApproved {
		if err := tx.Model(&model.Rental{}).Where("id = ?", rental.ID).
			Update("deposit_status", model.DepositForfeited).Error; err != nil {
			return err
		}
	} else {
		if err := tx.Model(&model.Rental{}).Where("id = ?", rental.ID).
			Update("deposit_status", model.DepositForfeited).Error; err != nil {
			return err
		}
	}

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
		"id":                         r.ID,
		"rental_id":                  r.RentalID,
		"condition":                  string(r.Condition),
		"deposit_deduction":          r.DepositDeduction,
		"deposit_refund":             r.DepositRefund,
		"status":                     string(r.Status),
		"snapshot_rental_status":     r.SnapshotRentalStatus,
		"snapshot_deposit_status":    r.SnapshotDepositStatus,
		"snapshot_instrument_status": r.SnapshotInstrumentStatus,
	}
}

func fallbackRentalStatus(snapshot string, rental *model.Rental) model.RentalStatus {
	if snapshot != "" {
		return model.RentalStatus(snapshot)
	}
	if rental.Status == model.RentalReturned {
		if rental.ExpectedReturnDate.Before(time.Now()) {
			return model.RentalOverdue
		}
		return model.RentalActive
	}
	return rental.Status
}

func fallbackDepositStatus(snapshot string, rental *model.Rental) model.DepositStatus {
	if snapshot != "" {
		return model.DepositStatus(snapshot)
	}
	if rental.DepositStatus == model.DepositFullyRefunded ||
		rental.DepositStatus == model.DepositPartiallyRefunded ||
		rental.DepositStatus == model.DepositForfeited {
		return model.DepositCollected
	}
	return rental.DepositStatus
}

func fallbackInstrumentStatus(snapshot string, instrument *model.Instrument) model.InstrumentStatus {
	if snapshot != "" {
		return model.InstrumentStatus(snapshot)
	}
	if instrument.Status == model.InstrumentAvailable {
		return model.InstrumentRented
	}
	return instrument.Status
}

func fallbackActualReturnDate(snapshot *time.Time, rental *model.Rental) *time.Time {
	if snapshot != nil {
		return snapshot
	}
	return nil
}

var _ = gorm.Model{}
