package repository

import (
	"floor-settlement/internal/model"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type QualityRepository struct{}

func (r *QualityRepository) Create(inspection *model.QualityInspection) error {
	return db.Create(inspection).Error
}

func (r *QualityRepository) FindByID(id uuid.UUID) (*model.QualityInspection, error) {
	var inspection model.QualityInspection
	if err := db.First(&inspection, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &inspection, nil
}

func (r *QualityRepository) Update(inspection *model.QualityInspection) error {
	return db.Save(inspection).Error
}

func (r *QualityRepository) Filter(projectID, teamID uuid.UUID, result, startDate, endDate string, page, pageSize int) ([]model.QualityInspection, int64, error) {
	query := db.Model(&model.QualityInspection{})

	if projectID != uuid.Nil {
		query = query.Where("project_id = ?", projectID)
	}
	if teamID != uuid.Nil {
		query = query.Where("team_id = ?", teamID)
	}
	if result != "" {
		query = query.Where("result = ?", result)
	}
	if startDate != "" {
		query = query.Where("inspection_date >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("inspection_date <= ?", endDate)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset, limit := Paginate(page, pageSize)
	var inspections []model.QualityInspection
	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&inspections).Error; err != nil {
		return nil, 0, err
	}

	return inspections, total, nil
}

func (r *QualityRepository) CountByResult(projectID uuid.UUID, result string) (int64, error) {
	var count int64
	err := db.Model(&model.QualityInspection{}).Where("project_id = ? AND result = ?", projectID, result).Count(&count).Error
	return count, err
}

func (r *QualityRepository) CountByProject(projectID uuid.UUID) (int64, error) {
	var count int64
	err := db.Model(&model.QualityInspection{}).Where("project_id = ?", projectID).Count(&count).Error
	return count, err
}
