package repository

import (
	"time"

	"floor-settlement/internal/model"

	"github.com/google/uuid"
)

type AttendanceRepository struct{}

func (r *AttendanceRepository) Create(record *model.AttendanceRecord) error {
	return db.Create(record).Error
}

func (r *AttendanceRepository) FindByID(id uuid.UUID) (*model.AttendanceRecord, error) {
	var record model.AttendanceRecord
	if err := db.First(&record, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &record, nil
}

func (r *AttendanceRepository) Update(record *model.AttendanceRecord) error {
	return db.Save(record).Error
}

func (r *AttendanceRepository) Delete(id uuid.UUID) error {
	return db.Delete(&model.AttendanceRecord{}, "id = ?", id).Error
}

func (r *AttendanceRepository) Filter(projectID, teamID uuid.UUID, startDate, endDate time.Time, status, workerName, workArea string, page, pageSize int) ([]model.AttendanceRecord, int64, error) {
	query := db.Model(&model.AttendanceRecord{})

	if projectID != uuid.Nil {
		query = query.Where("project_id = ?", projectID)
	}
	if teamID != uuid.Nil {
		query = query.Where("team_id = ?", teamID)
	}
	if !startDate.IsZero() {
		query = query.Where("record_date >= ?", startDate)
	}
	if !endDate.IsZero() {
		query = query.Where("record_date <= ?", endDate)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if workerName != "" {
		query = query.Where("worker_name LIKE ?", "%"+workerName+"%")
	}
	if workArea != "" {
		query = query.Where("work_area LIKE ?", "%"+workArea+"%")
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset, limit := Paginate(page, pageSize)
	var records []model.AttendanceRecord
	if err := query.Order("record_date DESC, created_at DESC").Offset(offset).Limit(limit).Find(&records).Error; err != nil {
		return nil, 0, err
	}

	return records, total, nil
}

func (r *AttendanceRepository) FindByTeamAndDateRange(teamID uuid.UUID, start, end time.Time) ([]model.AttendanceRecord, error) {
	var records []model.AttendanceRecord
	if err := db.Where("team_id = ? AND record_date >= ? AND record_date <= ?", teamID, start, end).Find(&records).Error; err != nil {
		return nil, err
	}
	return records, nil
}

func (r *AttendanceRepository) CountByProjectAndDateRange(projectID uuid.UUID, start, end time.Time) (int64, error) {
	var count int64
	if err := db.Model(&model.AttendanceRecord{}).Where("project_id = ? AND record_date >= ? AND record_date <= ?", projectID, start, end).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *AttendanceRepository) CountByProject(projectID uuid.UUID) (int64, error) {
	var count int64
	if err := db.Model(&model.AttendanceRecord{}).Where("project_id = ?", projectID).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}
