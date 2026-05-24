package services

import (
	"jewelry-store-system/models"
	"log"
	"sync"
	"time"

	"gorm.io/gorm"
)

type AsyncTaskType string

const (
	TaskTypeAuditLog      AsyncTaskType = "audit_log"
	TaskTypeStatusHistory AsyncTaskType = "status_history"
)

type AsyncTask struct {
	Type        AsyncTaskType
	Payload     interface{}
	RetryCount  int
	MaxRetries  int
	CreatedAt   time.Time
}

type AsyncTaskService struct {
	db           *gorm.DB
	taskQueue    chan *AsyncTask
	workerCount  int
	wg           sync.WaitGroup
	stopChan     chan struct{}
	isRunning    bool
	mu           sync.Mutex
}

var (
	asyncServiceInstance *AsyncTaskService
	once                 sync.Once
)

func GetAsyncTaskService(db *gorm.DB) *AsyncTaskService {
	once.Do(func() {
		asyncServiceInstance = &AsyncTaskService{
			db:          db,
			taskQueue:   make(chan *AsyncTask, 1000),
			workerCount: 3,
			stopChan:    make(chan struct{}),
		}
	})
	return asyncServiceInstance
}

func (s *AsyncTaskService) Start() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.isRunning {
		return
	}

	s.isRunning = true
	for i := 0; i < s.workerCount; i++ {
		s.wg.Add(1)
		go s.worker(i)
	}

	log.Println("Async task service started")
}

func (s *AsyncTaskService) Stop() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if !s.isRunning {
		return
	}

	close(s.stopChan)
	s.wg.Wait()
	s.isRunning = false
	log.Println("Async task service stopped")
}

func (s *AsyncTaskService) worker(id int) {
	defer s.wg.Done()

	log.Printf("Async worker %d started", id)

	for {
		select {
		case task := <-s.taskQueue:
			s.processTask(task)
		case <-s.stopChan:
			log.Printf("Async worker %d stopping", id)
			return
		}
	}
}

func (s *AsyncTaskService) processTask(task *AsyncTask) {
	var err error

	switch task.Type {
	case TaskTypeAuditLog:
		if payload, ok := task.Payload.(*models.AuditLog); ok {
			err = s.db.Create(payload).Error
		}
	case TaskTypeStatusHistory:
		if payload, ok := task.Payload.(*models.StatusHistory); ok {
			err = s.db.Create(payload).Error
		}
	}

	if err != nil {
		log.Printf("Async task failed (type: %s, retry: %d): %v", task.Type, task.RetryCount, err)

		if task.RetryCount < task.MaxRetries {
			task.RetryCount++
			delay := time.Duration(task.RetryCount) * time.Second
			time.AfterFunc(delay, func() {
				s.taskQueue <- task
			})
		} else {
			log.Printf("Async task max retries exceeded (type: %s), falling back to sync", task.Type)
			s.fallbackTask(task)
		}
	}
}

func (s *AsyncTaskService) fallbackTask(task *AsyncTask) {
	var err error
	switch task.Type {
	case TaskTypeAuditLog:
		if payload, ok := task.Payload.(*models.AuditLog); ok {
			err = s.db.Create(payload).Error
		}
	case TaskTypeStatusHistory:
		if payload, ok := task.Payload.(*models.StatusHistory); ok {
			err = s.db.Create(payload).Error
		}
	}

	if err != nil {
		log.Printf("Fallback task also failed (type: %s): %v", task.Type, err)
	} else {
		log.Printf("Fallback task succeeded (type: %s)", task.Type)
	}
}

func (s *AsyncTaskService) SubmitAuditLog(logEntry *models.AuditLog) {
	task := &AsyncTask{
		Type:       TaskTypeAuditLog,
		Payload:    logEntry,
		RetryCount: 0,
		MaxRetries: 3,
		CreatedAt:  time.Now(),
	}

	select {
	case s.taskQueue <- task:
	default:
		log.Println("Task queue full, executing synchronously")
		_ = s.db.Create(logEntry).Error
	}
}

func (s *AsyncTaskService) SubmitStatusHistory(history *models.StatusHistory) {
	task := &AsyncTask{
		Type:       TaskTypeStatusHistory,
		Payload:    history,
		RetryCount: 0,
		MaxRetries: 3,
		CreatedAt:  time.Now(),
	}

	select {
	case s.taskQueue <- task:
	default:
		log.Println("Task queue full, executing synchronously")
		_ = s.db.Create(history).Error
	}
}
