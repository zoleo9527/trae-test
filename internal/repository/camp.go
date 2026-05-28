package repository

import (
	"camp-management/internal/model"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CampRepository struct {
	baseRepository
}

func NewCampRepository(db *gorm.DB) *CampRepository {
	return &CampRepository{baseRepository{db: db}}
}

func (r *CampRepository) Create(camp *model.Camp) error {
	return r.db.Create(camp).Error
}

func (r *CampRepository) GetByID(id uuid.UUID) (*model.Camp, error) {
	var camp model.Camp
	if err := r.db.Preload("Rooms").First(&camp, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &camp, nil
}

func (r *CampRepository) List(status *model.CampStatus) ([]model.Camp, error) {
	var camps []model.Camp
	query := r.db
	if status != nil {
		query = query.Where("status = ?", *status)
	}
	err := query.Order("start_date DESC").Find(&camps).Error
	return camps, err
}

func (r *CampRepository) Update(camp *model.Camp) error {
	return r.db.Save(camp).Error
}

func (r *CampRepository) UpdateCurrentCampers(campID uuid.UUID, delta int) error {
	return r.db.Model(&model.Camp{}).
		Where("id = ?", campID).
		UpdateColumn("current_campers", gorm.Expr("current_campers + ?", delta)).
		Error
}

func (r *CampRepository) IncrementCamperCount(campID uuid.UUID) error {
	return r.db.Model(&model.Camp{}).
		Where("id = ?", campID).
		UpdateColumn("current_campers", gorm.Expr("current_campers + 1")).
		Error
}
