package worker

import (
	"encoding/json"
	"log"
	"runner-platform/internal/database"
	"runner-platform/internal/models"
	"runner-platform/internal/utils"
	"sync"
	"time"

	"github.com/google/uuid"
)

type TaskWorker struct {
	stopChan chan struct{}
	wg       sync.WaitGroup
	running  bool
}

func NewTaskWorker() *TaskWorker {
	return &TaskWorker{
		stopChan: make(chan struct{}),
	}
}

func (w *TaskWorker) Start() {
	if w.running {
		return
	}
	w.running = true
	log.Println("Task worker started")

	go w.processLoop()
}

func (w *TaskWorker) Stop() {
	if !w.running {
		return
	}
	log.Println("Stopping task worker...")
	close(w.stopChan)
	w.wg.Wait()
	w.running = false
	log.Println("Task worker stopped")
}

func (w *TaskWorker) processLoop() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-w.stopChan:
			return
		case <-ticker.C:
			w.processPendingTasks()
		}
	}
}

func (w *TaskWorker) processPendingTasks() {
	var tasks []models.TaskQueue
	now := time.Now()

	err := database.DB.Where("status = ? AND execute_at <= ? AND retry_count < max_retries", "pending", now).
		Order("priority DESC, created_at ASC").
		Limit(10).
		Find(&tasks).Error

	if err != nil {
		log.Printf("Error fetching pending tasks: %v", err)
		return
	}

	for _, task := range tasks {
		w.wg.Add(1)
		go w.processTask(task)
	}
}

func (w *TaskWorker) processTask(task models.TaskQueue) {
	defer w.wg.Done()

	database.DB.Model(&task).Update("status", "processing")

	var err error
	switch task.TaskType {
	case "refund_notification":
		err = w.handleRefundNotification(&task)
	case "refund_payment":
		err = w.handleRefundPayment(&task)
	case "appeal_notification":
		err = w.handleAppealNotification(&task)
	case "appeal_result_notification":
		err = w.handleAppealResultNotification(&task)
	case "subsidy_notification":
		err = w.handleSubsidyNotification(&task)
	case "subsidy_result_notification":
		err = w.handleSubsidyResultNotification(&task)
	case "subsidy_payment_notification":
		err = w.handleSubsidyPaymentNotification(&task)
	default:
		err = w.handleGenericTask(&task)
	}

	now := time.Now()
	if err != nil {
		log.Printf("Task %s (%s) failed: %v", task.ID, task.TaskType, err)
		task.RetryCount++
		task.ErrorMsg = err.Error()

		if task.RetryCount >= task.MaxRetries {
			task.Status = "failed"
		} else {
			task.Status = "pending"
			task.ExecuteAt = time.Now().Add(time.Duration(task.RetryCount*30) * time.Second)
		}
	} else {
		task.Status = "completed"
		task.CompletedAt = &now
		log.Printf("Task %s (%s) completed successfully", task.ID, task.TaskType)
	}

	database.DB.Save(&task)
}

func (w *TaskWorker) handleRefundNotification(task *models.TaskQueue) error {
	var payload map[string]interface{}
	if err := json.Unmarshal([]byte(task.Payload), &payload); err != nil {
		return err
	}
	log.Printf("[NOTIFICATION] New refund application: refund_no=%v, amount=%.2f", payload["refund_no"], payload["amount"])
	return nil
}

func (w *TaskWorker) handleRefundPayment(task *models.TaskQueue) error {
	var payload map[string]interface{}
	if err := json.Unmarshal([]byte(task.Payload), &payload); err != nil {
		return err
	}
	log.Printf("[PAYMENT] Processing refund payment: refund_no=%v, amount=%.2f", payload["refund_no"], payload["amount"])

	refundID, _ := payload["refund_id"].(string)
	var refund models.Refund
	if err := database.DB.Where("id = ?", refundID).First(&refund).Error; err != nil {
		return err
	}

	if refund.Status == models.RefundStatusApproved {
		oldRefund := refund
		refund.Status = models.RefundStatusCompleted
		now := time.Now()
		refund.ProcessedAt = &now
		if refund.ReviewedBy != nil {
			refund.ProcessedBy = refund.ReviewedBy
		}

		if err := database.DB.Save(&refund).Error; err != nil {
			return err
		}

		var processorName string
		var processorRole models.Role
		if refund.ProcessedBy != nil {
			var processor models.User
			if err := database.DB.Where("id = ?", *refund.ProcessedBy).First(&processor).Error; err == nil {
				processorName = processor.RealName
				processorRole = processor.Role
			}
		}
		if processorName == "" {
			processorName = "System"
		}
		if processorRole == "" {
			processorRole = models.RoleCustomerService
		}

		var operatorID uuid.UUID
		if refund.ProcessedBy != nil {
			operatorID = *refund.ProcessedBy
		} else {
			operatorID = uuid.New()
		}

		utils.LogOperationBackground(
			models.ActionCompleteRefund,
			refund.ID,
			"refund",
			operatorID,
			processorName,
			processorRole,
			&oldRefund,
			&refund,
			"退款自动完成",
		)

		log.Printf("[PAYMENT] Refund %s marked as completed", refund.RefundNo)
	}

	return nil
}

func (w *TaskWorker) handleAppealNotification(task *models.TaskQueue) error {
	var payload map[string]interface{}
	if err := json.Unmarshal([]byte(task.Payload), &payload); err != nil {
		return err
	}
	log.Printf("[NOTIFICATION] New appeal received: appeal_no=%v, title=%v", payload["appeal_no"], payload["title"])
	return nil
}

func (w *TaskWorker) handleAppealResultNotification(task *models.TaskQueue) error {
	var payload map[string]interface{}
	if err := json.Unmarshal([]byte(task.Payload), &payload); err != nil {
		return err
	}
	log.Printf("[NOTIFICATION] Appeal result: appeal_no=%v, status=%v", payload["appeal_no"], payload["status"])
	return nil
}

func (w *TaskWorker) handleSubsidyNotification(task *models.TaskQueue) error {
	var payload map[string]interface{}
	if err := json.Unmarshal([]byte(task.Payload), &payload); err != nil {
		return err
	}
	log.Printf("[NOTIFICATION] New subsidy application: subsidy_no=%v, amount=%.2f", payload["subsidy_no"], payload["amount"])
	return nil
}

func (w *TaskWorker) handleSubsidyResultNotification(task *models.TaskQueue) error {
	var payload map[string]interface{}
	if err := json.Unmarshal([]byte(task.Payload), &payload); err != nil {
		return err
	}
	log.Printf("[NOTIFICATION] Subsidy review result: subsidy_no=%v, status=%v", payload["subsidy_no"], payload["status"])
	return nil
}

func (w *TaskWorker) handleSubsidyPaymentNotification(task *models.TaskQueue) error {
	var payload map[string]interface{}
	if err := json.Unmarshal([]byte(task.Payload), &payload); err != nil {
		return err
	}
	log.Printf("[PAYMENT] Subsidy paid: subsidy_no=%v, amount=%.2f, transaction_no=%v",
		payload["subsidy_no"], payload["amount"], payload["transaction_no"])
	return nil
}

func (w *TaskWorker) handleGenericTask(task *models.TaskQueue) error {
	log.Printf("[TASK] Processing generic task: type=%s", task.TaskType)
	return nil
}
