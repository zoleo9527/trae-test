package repository

import (
	"camp-management/internal/model"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MedicalRepository struct {
	baseRepository
}

func NewMedicalRepository(db *gorm.DB) *MedicalRepository {
	return &MedicalRepository{baseRepository{db: db}}
}

func (r *MedicalRepository) Create(record *model.MedicalRecord) error {
	return r.db.Create(record).Error
}

func (r *MedicalRepository) GetByID(id uuid.UUID) (*model.MedicalRecord, error) {
	var record model.MedicalRecord
	if err := r.db.Preload("Camper").Preload("Reporter").Preload("Resolver").First(&record, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &record, nil
}

func (r *MedicalRepository) GetByCamperID(camperID uuid.UUID) ([]model.MedicalRecord, error) {
	var records []model.MedicalRecord
	err := r.db.Preload("Reporter").Where("camper_id = ?", camperID).Order("report_time DESC").Find(&records).Error
	return records, err
}

func (r *MedicalRepository) GetByCampID(campID uuid.UUID, status *model.MedicalStatus) ([]model.MedicalRecord, error) {
	var records []model.MedicalRecord
	query := r.db.Joins("JOIN campers ON campers.id = medical_records.camper_id").
		Where("campers.camp_id = ?", campID).
		Preload("Camper").Preload("Reporter")
	
	if status != nil {
		query = query.Where("medical_records.status = ?", *status)
	}
	
	err := query.Order("medical_records.report_time DESC").Find(&records).Error
	return records, err
}

func (r *MedicalRepository) Update(record *model.MedicalRecord) error {
	return r.db.Save(record).Error
}

func (r *MedicalRepository) Resolve(id uuid.UUID, resolvedBy uuid.UUID, treatment string) error {
	now := time.Now()
	return r.db.Model(&model.MedicalRecord{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":      model.MedicalStatusResolved,
			"treatment":   treatment,
			"resolved_at": &now,
			"resolved_by": resolvedBy,
		}).Error
}
