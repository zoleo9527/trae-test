package repository

import (
	"camp-management/internal/model"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ActivityRepository struct {
	baseRepository
}

func NewActivityRepository(db *gorm.DB) *ActivityRepository {
	return &ActivityRepository{baseRepository{db: db}}
}

func (r *ActivityRepository) Create(activity *model.Activity) error {
	return r.db.Create(activity).Error
}

func (r *ActivityRepository) GetByID(id uuid.UUID) (*model.Activity, error) {
	var activity model.Activity
	if err := r.db.Preload("Teacher").Preload("Attendances").First(&activity, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &activity, nil
}

func (r *ActivityRepository) GetByCampID(campID uuid.UUID) ([]model.Activity, error) {
	var activities []model.Activity
	err := r.db.Preload("Teacher").Where("camp_id = ?", campID).Order("start_time").Find(&activities).Error
	return activities, err
}

func (r *ActivityRepository) Update(activity *model.Activity) error {
	return r.db.Save(activity).Error
}

func (r *ActivityRepository) BatchCreate(activities []model.Activity) error {
	return r.db.Create(&activities).Error
}

type AttendanceRepository struct {
	baseRepository
}

func NewAttendanceRepository(db *gorm.DB) *AttendanceRepository {
	return &AttendanceRepository{baseRepository{db: db}}
}

func (r *AttendanceRepository) Create(attendance *model.Attendance) error {
	return r.db.Create(attendance).Error
}

func (r *AttendanceRepository) GetByActivityID(activityID uuid.UUID) ([]model.Attendance, error) {
	var attendances []model.Attendance
	err := r.db.Preload("Camper").Where("activity_id = ?", activityID).Find(&attendances).Error
	return attendances, err
}

func (r *AttendanceRepository) GetByCamperID(camperID uuid.UUID) ([]model.Attendance, error) {
	var attendances []model.Attendance
	err := r.db.Preload("Activity").Where("camper_id = ?", camperID).Order("created_at DESC").Find(&attendances).Error
	return attendances, err
}

func (r *AttendanceRepository) BatchCreate(attendances []model.Attendance) error {
	return r.db.Create(&attendances).Error
}

func (r *AttendanceRepository) UpdateStatus(activityID uuid.UUID, camperID uuid.UUID, status model.AttendanceStatus, notes string) error {
	return r.db.Model(&model.Attendance{}).
		Where("activity_id = ? AND camper_id = ?", activityID, camperID).
		Updates(map[string]interface{}{
			"status": status,
			"notes":  notes,
		}).Error
}
