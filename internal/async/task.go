package async

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
)

type TaskType string

const (
	TaskTypeExportCampers     TaskType = "export_campers"
	TaskTypeExportRegistrations TaskType = "export_registrations"
	TaskTypeBatchAssignRooms   TaskType = "batch_assign_rooms"
	TaskTypeSendNotification   TaskType = "send_notification"
	TaskTypeMedicalReminder    TaskType = "medical_reminder"
	TaskTypeParentNotification TaskType = "parent_notification"
)

type TaskStatus string

const (
	TaskStatusPending   TaskStatus = "pending"
	TaskStatusRunning   TaskStatus = "running"
	TaskStatusCompleted TaskStatus = "completed"
	TaskStatusFailed    TaskStatus = "failed"
)

type Task struct {
	ID         uuid.UUID       `json:"id"`
	Type       TaskType        `json:"type"`
	Status     TaskStatus      `json:"status"`
	Payload    json.RawMessage `json:"payload"`
	Result     string          `json:"result,omitempty"`
	Error      string          `json:"error,omitempty"`
	CreatedAt  time.Time       `json:"created_at"`
	StartedAt  *time.Time      `json:"started_at,omitempty"`
	FinishedAt *time.Time      `json:"finished_at,omitempty"`
	CreatedBy  uuid.UUID       `json:"created_by"`
}

type TaskHandler func(task *Task) error

type TaskQueue struct {
	tasks    chan *Task
	handlers map[TaskType]TaskHandler
	wg       sync.WaitGroup
	stopChan chan struct{}
	workers  int
	taskList []*Task
	mu       sync.Mutex
}

func NewTaskQueue(workerCount int) *TaskQueue {
	return &TaskQueue{
		tasks:    make(chan *Task, 100),
		handlers: make(map[TaskType]TaskHandler),
		stopChan: make(chan struct{}),
		workers:  workerCount,
		taskList: make([]*Task, 0),
	}
}

func (q *TaskQueue) RegisterHandler(taskType TaskType, handler TaskHandler) {
	q.handlers[taskType] = handler
}

func (q *TaskQueue) Submit(taskType TaskType, payload interface{}, createdBy uuid.UUID) (*Task, error) {
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	task := &Task{
		ID:        uuid.New(),
		Type:      taskType,
		Status:    TaskStatusPending,
		Payload:   payloadBytes,
		CreatedAt: time.Now(),
		CreatedBy: createdBy,
	}

	q.mu.Lock()
	q.taskList = append(q.taskList, task)
	q.mu.Unlock()

	q.tasks <- task
	log.Printf("Task submitted: %s (%s)", task.ID, taskType)
	return task, nil
}

func (q *TaskQueue) Start() {
	for i := 0; i < q.workers; i++ {
		q.wg.Add(1)
		go q.worker(i)
	}
	log.Printf("Task queue started with %d workers", q.workers)
}

func (q *TaskQueue) Stop() {
	close(q.stopChan)
	close(q.tasks)
	q.wg.Wait()
	log.Println("Task queue stopped")
}

func (q *TaskQueue) worker(id int) {
	defer q.wg.Done()
	log.Printf("Worker %d started", id)

	for {
		select {
		case task, ok := <-q.tasks:
			if !ok {
				log.Printf("Worker %d stopping", id)
				return
			}
			q.processTask(task)
		case <-q.stopChan:
			log.Printf("Worker %d stopping", id)
			return
		}
	}
}

func (q *TaskQueue) processTask(task *Task) {
	q.mu.Lock()
	now := time.Now()
	task.Status = TaskStatusRunning
	task.StartedAt = &now
	q.mu.Unlock()

	log.Printf("Processing task: %s (%s)", task.ID, task.Type)

	handler, ok := q.handlers[task.Type]
	if !ok {
		q.mu.Lock()
		task.Status = TaskStatusFailed
		task.Error = fmt.Sprintf("no handler registered for task type: %s", task.Type)
		finished := time.Now()
		task.FinishedAt = &finished
		q.mu.Unlock()
		log.Printf("Task failed: %s - %s", task.ID, task.Error)
		return
	}

	if err := handler(task); err != nil {
		q.mu.Lock()
		task.Status = TaskStatusFailed
		task.Error = err.Error()
		finished := time.Now()
		task.FinishedAt = &finished
		q.mu.Unlock()
		log.Printf("Task failed: %s - %v", task.ID, err)
		return
	}

	q.mu.Lock()
	task.Status = TaskStatusCompleted
	finished := time.Now()
	task.FinishedAt = &finished
	q.mu.Unlock()
	log.Printf("Task completed: %s", task.ID)
}

func (q *TaskQueue) GetTask(id uuid.UUID) *Task {
	q.mu.Lock()
	defer q.mu.Unlock()

	for _, task := range q.taskList {
		if task.ID == id {
			return task
		}
	}
	return nil
}

func (q *TaskQueue) GetTasksByUser(userID uuid.UUID) []*Task {
	q.mu.Lock()
	defer q.mu.Unlock()

	result := make([]*Task, 0)
	for _, task := range q.taskList {
		if task.CreatedBy == userID {
			result = append(result, task)
		}
	}
	return result
}
