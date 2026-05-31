package repository

import (
	"time"

	"floor-settlement/internal/model"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AsyncTaskRepository struct{}

func (r *AsyncTaskRepository) Create(task *model.AsyncTask) error {
	return db.Create(task).Error
}

func (r *AsyncTaskRepository) FindByID(id uuid.UUID) (*model.AsyncTask, error) {
	var task model.AsyncTask
	if err := db.First(&task, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &task, nil
}

func (r *AsyncTaskRepository) Update(task *model.AsyncTask) error {
	return db.Save(task).Error
}

func (r *AsyncTaskRepository) UpdateStatus(id uuid.UUID, status string, result map[string]interface{}, errMsg string) error {
	updates := map[string]interface{}{"status": status, "updated_at": time.Now()}
	if result != nil {
		updates["result"] = model.MapJSON(result)
	}
	if errMsg != "" {
		updates["error"] = errMsg
	}
	if status == "completed" || status == "failed" {
		updates["completed_at"] = time.Now()
	}
	return db.Model(&model.AsyncTask{}).Where("id = ? AND status = ?", id, "running").Updates(updates).Error
}

func (r *AsyncTaskRepository) ClaimPending() (*model.AsyncTask, error) {
	var task model.AsyncTask
	if err := db.Where("status = ?", "pending").Order("created_at ASC").First(&task).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}

	now := time.Now()
	result := db.Model(&model.AsyncTask{}).
		Where("id = ? AND status = ?", task.ID, "pending").
		Updates(map[string]interface{}{
			"status":     "running",
			"started_at": now,
			"updated_at": now,
		})
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, nil
	}

	task.Status = "running"
	task.StartedAt = &now
	return &task, nil
}

func (r *AsyncTaskRepository) ListPending(limit int) ([]model.AsyncTask, error) {
	var tasks []model.AsyncTask
	if err := db.Where("status = ?", "pending").Order("created_at ASC").Limit(limit).Find(&tasks).Error; err != nil {
		return nil, err
	}
	return tasks, nil
}
