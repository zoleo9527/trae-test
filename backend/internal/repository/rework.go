package repository

import (
	"time"

	"floor-settlement/internal/model"

	"github.com/google/uuid"
)

type ReworkRepository struct{}

func (r *ReworkRepository) Create(record *model.ReworkRecord) error {
	return db.Create(record).Error
}

func (r *ReworkRepository) FindByID(id uuid.UUID) (*model.ReworkRecord, error) {
	var record model.ReworkRecord
	if err := db.First(&record, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &record, nil
}

func (r *ReworkRepository) Update(record *model.ReworkRecord) error {
	return db.Save(record).Error
}

func (r *ReworkRepository) Filter(projectID, teamID uuid.UUID, status string, page, pageSize int) ([]model.ReworkRecord, int64, error) {
	query := db.Model(&model.ReworkRecord{})

	if projectID != uuid.Nil {
		query = query.Where("project_id = ?", projectID)
	}
	if teamID != uuid.Nil {
		query = query.Where("team_id = ?", teamID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset, limit := Paginate(page, pageSize)
	var records []model.ReworkRecord
	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&records).Error; err != nil {
		return nil, 0, err
	}

	return records, total, nil
}

func (r *ReworkRepository) CountByStatus(projectID uuid.UUID, status string) (int64, error) {
	var count int64
	err := db.Model(&model.ReworkRecord{}).Where("project_id = ? AND status = ?", projectID, status).Count(&count).Error
	return count, err
}

func (r *ReworkRepository) FindByQualityInspectionID(inspectionID uuid.UUID) ([]model.ReworkRecord, error) {
	var records []model.ReworkRecord
	err := db.Where("quality_inspection_id = ?", inspectionID).Find(&records).Error
	return records, err
}

func (r *ReworkRepository) FindUnsettledCompletedByTeamAndDateRange(teamID uuid.UUID, startDate, endDate time.Time) ([]model.ReworkRecord, error) {
	var records []model.ReworkRecord
	query := db.Where("team_id = ? AND settlement_batch_id IS NULL AND status = ?", teamID, "completed")
	if !startDate.IsZero() {
		query = query.Where("created_at >= ?", startDate)
	}
	if !endDate.IsZero() {
		query = query.Where("created_at <= ?", endDate)
	}
	err := query.Find(&records).Error
	return records, err
}
