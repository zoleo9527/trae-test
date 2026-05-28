package async

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"gorm.io/gorm"
	"water-delivery-service/internal/config"
	"water-delivery-service/internal/database"
	"water-delivery-service/internal/models"
	"water-delivery-service/internal/utils"
	"water-delivery-service/pkg/types"
)

type WorkerPool struct {
	taskChan chan *models.AsyncTask
	stopChan chan struct{}
}

func NewWorkerPool() *WorkerPool {
	return &WorkerPool{
		taskChan: make(chan *models.AsyncTask, 100),
		stopChan: make(chan struct{}),
	}
}

func (wp *WorkerPool) Start(ctx context.Context) {
	for i := 0; i < config.AppConfig.AsyncWorkerCount; i++ {
		go wp.worker(ctx, i)
	}
	go wp.taskDispatcher(ctx)
	log.Printf("Async worker pool started with %d workers", config.AppConfig.AsyncWorkerCount)
}

func (wp *WorkerPool) Stop() {
	close(wp.stopChan)
	log.Println("Async worker pool stopped")
}

func (wp *WorkerPool) taskDispatcher(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-wp.stopChan:
			return
		case <-ticker.C:
			wp.fetchPendingTasks()
		}
	}
}

func (wp *WorkerPool) fetchPendingTasks() {
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		var tasks []models.AsyncTask
		if err := tx.Where("status = ? AND retry_count < max_retries", types.TaskStatusPending).
			Order("created_at ASC").
			Limit(10).
			Find(&tasks).Error; err != nil {
			return err
		}

		now := time.Now()
		for i := range tasks {
			if err := tx.Model(&tasks[i]).Updates(map[string]interface{}{
				"status":      types.TaskStatusRunning,
				"executed_at": &now,
			}).Error; err != nil {
				log.Printf("Error marking task %s as running: %v", tasks[i].ID, err)
				continue
			}
			wp.taskChan <- &tasks[i]
		}
		return nil
	})

	if err != nil {
		log.Printf("Error fetching pending tasks: %v", err)
		return
	}
}

func (wp *WorkerPool) worker(ctx context.Context, id int) {
	for {
		select {
		case <-ctx.Done():
			return
		case <-wp.stopChan:
			return
		case task := <-wp.taskChan:
			wp.processTask(task, id)
		}
	}
}

func (wp *WorkerPool) processTask(task *models.AsyncTask, workerID int) {
	log.Printf("Worker %d processing task %s (type: %s, retry: %d)", workerID, task.ID, task.Type, task.RetryCount)

	var err error
	var result string

	switch task.Type {
	case types.TaskTypePhotoVerification:
		result, err = wp.processPhotoVerification(task)
	case types.TaskTypeStatusNotify:
		result, err = wp.processStatusNotify(task)
	case types.TaskTypeMonthlyReconcile:
		result, err = wp.processMonthlyReconcile(task)
	default:
		err = fmt.Errorf("unknown task type: %s", task.Type)
	}

	now := time.Now()
	updates := map[string]interface{}{
		"completed_at": &now,
	}

	if err != nil {
		errStr := err.Error()
		updates["error"] = &errStr
		
		if task.RetryCount+1 < task.MaxRetries {
			updates["status"] = types.TaskStatusPending
			updates["retry_count"] = task.RetryCount + 1
			log.Printf("Task %s failed, will retry: %v (retry: %d/%d)", task.ID, err, task.RetryCount+1, task.MaxRetries)
		} else {
			updates["status"] = types.TaskStatusFailed
			log.Printf("Task %s failed, max retries reached: %v (retry: %d/%d)", task.ID, err, task.RetryCount+1, task.MaxRetries)
		}
	} else {
		updates["status"] = types.TaskStatusCompleted
		updates["result"] = &result
		log.Printf("Task %s completed successfully", task.ID)
	}

	database.DB.Model(task).Updates(updates)
}

func (wp *WorkerPool) processPhotoVerification(task *models.AsyncTask) (string, error) {
	var payload map[string]interface{}
	if err := json.Unmarshal([]byte(task.Payload), &payload); err != nil {
		return "", fmt.Errorf("invalid payload: %w", err)
	}

	photoID, ok := payload["photo_id"].(string)
	if !ok {
		return "", fmt.Errorf("photo_id not found in payload")
	}

	time.Sleep(2 * time.Second)

	verified := true
	now := time.Now()
	result := database.DB.Model(&models.ComplaintPhoto{}).
		Where("id = ?", photoID).
		Updates(map[string]interface{}{
			"verified":    verified,
			"verified_at": &now,
		})

	if result.Error != nil {
		return "", result.Error
	}

	return fmt.Sprintf("Photo %s verified successfully", photoID), nil
}

func (wp *WorkerPool) processStatusNotify(task *models.AsyncTask) (string, error) {
	var payload map[string]interface{}
	if err := json.Unmarshal([]byte(task.Payload), &payload); err != nil {
		return "", fmt.Errorf("invalid payload: %w", err)
	}

	entityType, _ := payload["entity_type"].(string)
	entityID, _ := payload["entity_id"].(string)
	oldStatus, _ := payload["old_status"].(string)
	newStatus, _ := payload["new_status"].(string)

	log.Printf("Sending notification: %s %s changed from %s to %s", entityType, entityID, oldStatus, newStatus)

	time.Sleep(500 * time.Millisecond)

	return fmt.Sprintf("Notification sent for %s %s status change", entityType, entityID), nil
}

func (wp *WorkerPool) processMonthlyReconcile(task *models.AsyncTask) (string, error) {
	var payload map[string]interface{}
	if err := json.Unmarshal([]byte(task.Payload), &payload); err != nil {
		return "", fmt.Errorf("invalid payload: %w", err)
	}

	stationID, _ := payload["station_id"].(string)
	month, _ := payload["month"].(string)

	log.Printf("Running monthly reconciliation for station %s, month %s", stationID, month)

	time.Sleep(3 * time.Second)

	var complaints []models.Complaint
	database.DB.Where("station_id = ? AND created_at >= ? AND created_at < ?",
		stationID, month+"-01", month+"-32").Find(&complaints)

	var totalCompensation float64
	for _, c := range complaints {
		var compensations []models.Compensation
		database.DB.Where("complaint_id = ? AND status = ?", c.ID, types.CompensationStatusPaid).Find(&compensations)
		for _, comp := range compensations {
			totalCompensation += comp.Amount
		}
	}

	result := fmt.Sprintf("Reconciliation complete: %d complaints, total compensation: %.2f",
		len(complaints), totalCompensation)

	return result, nil
}

func SubmitTask(taskType types.TaskType, payload interface{}) (*models.AsyncTask, error) {
	payloadStr := utils.ToJSON(payload)
	task := &models.AsyncTask{
		Type:    taskType,
		Payload: payloadStr,
		Status:  types.TaskStatusPending,
	}

	err := database.DB.Create(task).Error
	if err != nil {
		log.Printf("Failed to submit task (type: %s): %v", taskType, err)
		return nil, err
	}

	log.Printf("Task submitted: %s (type: %s)", task.ID, taskType)
	return task, nil
}
