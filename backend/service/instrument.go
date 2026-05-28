package service

import (
	"instrument-rental/database"
	"instrument-rental/model"
	"strconv"

	"gorm.io/gorm"
)

type InstrumentService struct{}

func NewInstrumentService() *InstrumentService { return &InstrumentService{} }

func (s *InstrumentService) List(status, instrumentType, keyword string, page, pageSize int) ([]model.Instrument, int64, error) {
	var instruments []model.Instrument
	var total int64
	q := database.DB.Model(&model.Instrument{})
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if instrumentType != "" {
		q = q.Where("type = ?", instrumentType)
	}
	if keyword != "" {
		like := "%" + keyword + "%"
		q = q.Where("name LIKE ? OR serial_number LIKE ? OR brand LIKE ?", like, like, like)
	}
	q.Count(&total)
	offset := (page - 1) * pageSize
	err := q.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&instruments).Error
	return instruments, total, err
}

func (s *InstrumentService) GetByID(id uint) (*model.Instrument, error) {
	var inst model.Instrument
	err := database.DB.First(&inst, id).Error
	return &inst, err
}

func (s *InstrumentService) Create(inst *model.Instrument, userID uint, ip string) error {
	if err := database.DB.Create(inst).Error; err != nil {
		return err
	}
	newVal := instrumentToMap(inst)
	logInstrumentChange(userID, "create_instrument", inst.ID, nil, newVal, ip)
	return nil
}

func (s *InstrumentService) Update(id uint, updates map[string]any, userID uint, ip string) error {
	oldVal := fetchOldInstrument(id)
	err := database.DB.Model(&model.Instrument{}).Where("id = ?", id).Updates(updates).Error
	if err == nil {
		newVal := fetchOldInstrument(id)
		logInstrumentChange(userID, "update_instrument", id, oldVal, newVal, ip)
	}
	return err
}

func (s *InstrumentService) Delete(id uint, userID uint, ip string) error {
	oldVal := fetchOldInstrument(id)
	err := database.DB.Delete(&model.Instrument{}, id).Error
	if err == nil {
		logInstrumentChange(userID, "delete_instrument", id, oldVal, nil, ip)
	}
	return err
}

func (s *InstrumentService) BatchUpdateStatus(ids []uint, status model.InstrumentStatus, userID uint, ip string) (int64, error) {
	result := database.DB.Model(&model.Instrument{}).Where("id IN ?", ids).Update("status", status)
	return result.RowsAffected, result.Error
}

func (s *InstrumentService) GetAvailable() ([]model.Instrument, error) {
	var instruments []model.Instrument
	err := database.DB.Where("status = ?", model.InstrumentAvailable).Find(&instruments).Error
	return instruments, err
}

func fetchOldInstrument(id uint) model.JSONMap {
	var inst model.Instrument
	if database.DB.First(&inst, id).Error == nil {
		return instrumentToMap(&inst)
	}
	return nil
}

func instrumentToMap(inst *model.Instrument) model.JSONMap {
	return model.JSONMap{
		"id":                inst.ID,
		"name":              inst.Name,
		"type":              inst.Type,
		"brand":             inst.Brand,
		"serial_number":     inst.SerialNumber,
		"status":            string(inst.Status),
		"daily_rental_rate": inst.DailyRentalRate,
		"deposit_amount":    inst.DepositAmount,
	}
}

func logInstrumentChange(userID uint, action string, entityID uint, oldVal, newVal model.JSONMap, ip string) {
	logEntry := model.AuditLog{
		UserID:     userID,
		Action:     action,
		EntityType: "instrument",
		EntityID:   entityID,
		OldValue:   oldVal,
		NewValue:   newVal,
		IPAddress:  ip,
	}
	database.DB.Create(&logEntry)
}

func ParseUintOrDefault(s string, def uint) uint {
	v, err := strconv.ParseUint(s, 10, 32)
	if err != nil {
		return def
	}
	return uint(v)
}

var _ = gorm.Model{}
