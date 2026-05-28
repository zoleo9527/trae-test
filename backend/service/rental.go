package service

import (
	"instrument-rental/database"
	"instrument-rental/model"
	"time"

	"gorm.io/gorm"
)

type RentalService struct{}

func NewRentalService() *RentalService { return &RentalService{} }

type CreateRentalInput struct {
	InstrumentID       uint    `json:"instrument_id"`
	SchoolID           uint    `json:"school_id"`
	RentalDate         string  `json:"rental_date"`
	ExpectedReturnDate string  `json:"expected_return_date"`
	DepositAmount      float64 `json:"deposit_amount"`
	DailyRate          float64 `json:"daily_rate"`
	Notes              string  `json:"notes"`
}

type BatchCreateRentalInput struct {
	Rentals []CreateRentalInput `json:"rentals"`
}

func (s *RentalService) List(schoolID, instrumentID uint, status string, startDate, endDate string, page, pageSize int) ([]model.Rental, int64, error) {
	var rentals []model.Rental
	var total int64
	q := database.DB.Model(&model.Rental{})
	if schoolID > 0 {
		q = q.Where("school_id = ?", schoolID)
	}
	if instrumentID > 0 {
		q = q.Where("instrument_id = ?", instrumentID)
	}
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if startDate != "" {
		q = q.Where("rental_date >= ?", startDate)
	}
	if endDate != "" {
		q = q.Where("rental_date <= ?", endDate)
	}
	q.Count(&total)
	offset := (page - 1) * pageSize
	err := q.Preload("Instrument").Preload("School").Preload("User").
		Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&rentals).Error
	return rentals, total, err
}

func (s *RentalService) GetByID(id uint) (*model.Rental, error) {
	var rental model.Rental
	err := database.DB.Preload("Instrument").Preload("School").Preload("User").First(&rental, id).Error
	return &rental, err
}

func (s *RentalService) Create(input *CreateRentalInput, userID uint, ip string) (*model.Rental, error) {
	rd, err := time.Parse("2006-01-02", input.RentalDate)
	if err != nil {
		return nil, err
	}
	erd, err := time.Parse("2006-01-02", input.ExpectedReturnDate)
	if err != nil {
		return nil, err
	}
	tx := database.DB.Begin()
	if tx.Error != nil {
		return nil, tx.Error
	}
	rental := &model.Rental{
		InstrumentID:       input.InstrumentID,
		SchoolID:           input.SchoolID,
		UserID:             userID,
		RentalDate:         rd,
		ExpectedReturnDate: erd,
		Status:             model.RentalActive,
		DepositAmount:      input.DepositAmount,
		DepositStatus:      model.DepositCollected,
		DailyRate:          input.DailyRate,
		Notes:              input.Notes,
	}
	if err := tx.Create(rental).Error; err != nil {
		tx.Rollback()
		return nil, err
	}
	if err := tx.Model(&model.Instrument{}).Where("id = ?", input.InstrumentID).
		Update("status", model.InstrumentRented).Error; err != nil {
		tx.Rollback()
		return nil, err
	}
	if err := tx.Commit().Error; err != nil {
		return nil, err
	}
	newVal := rentalToMap(rental)
	logRentalChange(userID, "create_rental", rental.ID, nil, newVal, ip)
	return rental, nil
}

func (s *RentalService) BatchCreate(inputs []CreateRentalInput, userID uint, ip string) ([]model.Rental, error) {
	var rentals []model.Rental
	for _, input := range inputs {
		r, err := s.Create(&input, userID, ip)
		if err != nil {
			return rentals, err
		}
		rentals = append(rentals, *r)
	}
	return rentals, nil
}

func (s *RentalService) Update(id uint, updates map[string]any, userID uint, ip string) error {
	oldVal := fetchOldRental(id)
	err := database.DB.Model(&model.Rental{}).Where("id = ?", id).Updates(updates).Error
	if err == nil {
		newVal := fetchOldRental(id)
		logRentalChange(userID, "update_rental", id, oldVal, newVal, ip)
	}
	return err
}

func (s *RentalService) MarkOverdue() (int64, error) {
	now := time.Now()
	result := database.DB.Model(&model.Rental{}).
		Where("status = ? AND expected_return_date < ?", model.RentalActive, now).
		Update("status", model.RentalOverdue)
	return result.RowsAffected, result.Error
}

func fetchOldRental(id uint) model.JSONMap {
	var r model.Rental
	if database.DB.First(&r, id).Error == nil {
		return rentalToMap(&r)
	}
	return nil
}

func rentalToMap(r *model.Rental) model.JSONMap {
	return model.JSONMap{
		"id":                  r.ID,
		"instrument_id":       r.InstrumentID,
		"school_id":           r.SchoolID,
		"user_id":             r.UserID,
		"status":              string(r.Status),
		"deposit_amount":      r.DepositAmount,
		"deposit_status":      string(r.DepositStatus),
		"daily_rate":          r.DailyRate,
	}
}

func logRentalChange(userID uint, action string, entityID uint, oldVal, newVal model.JSONMap, ip string) {
	logEntry := model.AuditLog{
		UserID:     userID,
		Action:     action,
		EntityType: "rental",
		EntityID:   entityID,
		OldValue:   oldVal,
		NewValue:   newVal,
		IPAddress:  ip,
	}
	database.DB.Create(&logEntry)
}

var _ = gorm.Model{}
