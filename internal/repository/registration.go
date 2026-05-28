package repository

import (
	"camp-management/internal/model"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RegistrationRepository struct {
	baseRepository
}

func NewRegistrationRepository(db *gorm.DB) *RegistrationRepository {
	return &RegistrationRepository{baseRepository{db: db}}
}

func (r *RegistrationRepository) Create(reg *model.Registration) error {
	reg.RegistrationNo = r.generateRegistrationNo()
	return r.db.Create(reg).Error
}

func (r *RegistrationRepository) generateRegistrationNo() string {
	now := time.Now()
	var count int64
	r.db.Model(&model.Registration{}).
		Where("created_at >= ?", time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())).
		Count(&count)
	return fmt.Sprintf("REG%s%04d", now.Format("20060102"), count+1)
}

func (r *RegistrationRepository) GetByID(id uuid.UUID) (*model.Registration, error) {
	var reg model.Registration
	if err := r.db.Preload("Camper").Preload("Camp").First(&reg, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &reg, nil
}

func (r *RegistrationRepository) GetByCampID(campID uuid.UUID, opts QueryOptions) ([]model.Registration, int64, error) {
	var regs []model.Registration
	opts.Filters = append(opts.Filters, QueryFilter{Field: "camp_id", Operator: "eq", Value: campID})
	total, err := r.Query(&regs, opts)
	return regs, total, err
}

func (r *RegistrationRepository) GetByCamperID(camperID uuid.UUID) ([]model.Registration, error) {
	var regs []model.Registration
	err := r.db.Where("camper_id = ?", camperID).Order("created_at DESC").Find(&regs).Error
	return regs, err
}

func (r *RegistrationRepository) Update(reg *model.Registration) error {
	return r.db.Save(reg).Error
}

func (r *RegistrationRepository) UpdateStatus(id uuid.UUID, status model.RegistrationStatus) error {
	return r.db.Model(&model.Registration{}).
		Where("id = ?", id).
		Update("status", status).Error
}
