package service

import (
	"instrument-rental/database"
	"instrument-rental/model"
	"time"

	"gorm.io/gorm"
)

type MaintenanceService struct{}

func NewMaintenanceService() *MaintenanceService { return &MaintenanceService{} }

type CreateMaintenanceInput struct {
	InstrumentID uint    `json:"instrument_id"`
	RentalID     *uint   `json:"rental_id,omitempty"`
	Type         string  `json:"type"`
	Description  string  `json:"description"`
	Cost         float64 `json:"cost"`
	TechnicianID uint    `json:"technician_id"`
	StartDate    string  `json:"start_date"`
	Notes        string  `json:"notes"`
}

func (s *MaintenanceService) List(instrumentID uint, mType, status string, page, pageSize int) ([]model.Maintenance, int64, error) {
	var records []model.Maintenance
	var total int64
	q := database.DB.Model(&model.Maintenance{})
	if instrumentID > 0 {
		q = q.Where("instrument_id = ?", instrumentID)
	}
	if mType != "" {
		q = q.Where("type = ?", mType)
	}
	if status != "" {
		q = q.Where("status = ?", status)
	}
	q.Count(&total)
	offset := (page - 1) * pageSize
	err := q.Preload("Instrument").Preload("Technician").
		Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&records).Error
	return records, total, err
}

func (s *MaintenanceService) GetByID(id uint) (*model.Maintenance, error) {
	var record model.Maintenance
	err := database.DB.Preload("Instrument").Preload("Technician").First(&record, id).Error
	return &record, err
}

func (s *MaintenanceService) Create(input *CreateMaintenanceInput, userID uint, ip string) (*model.Maintenance, error) {
	sd, err := time.Parse("2006-01-02", input.StartDate)
	if err != nil {
		return nil, err
	}
	tx := database.DB.Begin()
	if tx.Error != nil {
		return nil, tx.Error
	}
	record := &model.Maintenance{
		InstrumentID: input.InstrumentID,
		RentalID:     input.RentalID,
		Type:         model.MaintenanceType(input.Type),
		Description:  input.Description,
		Cost:         input.Cost,
		TechnicianID: input.TechnicianID,
		Status:       model.MaintenancePending,
		StartDate:    sd,
		Notes:        input.Notes,
	}
	if err := tx.Create(record).Error; err != nil {
		tx.Rollback()
		return nil, err
	}
	if err := tx.Model(&model.Instrument{}).Where("id = ?", input.InstrumentID).
		Update("status", model.InstrumentMaintenance).Error; err != nil {
		tx.Rollback()
		return nil, err
	}
	if err := tx.Commit().Error; err != nil {
		return nil, err
	}
	newVal := maintenanceToMap(record)
	logMaintenanceChange(userID, "create_maintenance", record.ID, nil, newVal, ip)
	return record, nil
}

func (s *MaintenanceService) Update(id uint, updates map[string]any, userID uint, ip string) error {
	oldVal := fetchOldMaintenance(id)
	err := database.DB.Model(&model.Maintenance{}).Where("id = ?", id).Updates(updates).Error
	if err == nil {
		if endDate, ok := updates["end_date"]; ok && endDate != nil {
			var record model.Maintenance
			if database.DB.First(&record, id).Error == nil {
				database.DB.Model(&model.Instrument{}).Where("id = ?", record.InstrumentID).
					Update("status", model.InstrumentAvailable)
			}
		}
		newVal := fetchOldMaintenance(id)
		logMaintenanceChange(userID, "update_maintenance", id, oldVal, newVal, ip)
	}
	return err
}

func fetchOldMaintenance(id uint) model.JSONMap {
	var m model.Maintenance
	if database.DB.First(&m, id).Error == nil {
		return maintenanceToMap(&m)
	}
	return nil
}

func maintenanceToMap(m *model.Maintenance) model.JSONMap {
	return model.JSONMap{
		"id":            m.ID,
		"instrument_id": m.InstrumentID,
		"type":          string(m.Type),
		"cost":          m.Cost,
		"status":        string(m.Status),
	}
}

func logMaintenanceChange(userID uint, action string, entityID uint, oldVal, newVal model.JSONMap, ip string) {
	logEntry := model.AuditLog{
		UserID:     userID,
		Action:     action,
		EntityType: "maintenance",
		EntityID:   entityID,
		OldValue:   oldVal,
		NewValue:   newVal,
		IPAddress:  ip,
	}
	database.DB.Create(&logEntry)
}

var _ = gorm.Model{}
