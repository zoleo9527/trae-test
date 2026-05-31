package service

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"floor-settlement/internal/dto"
	"floor-settlement/internal/model"
	"floor-settlement/internal/repository"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type AsyncTaskService struct {
	repo            *repository.AsyncTaskRepository
	settlementSvc   *SettlementService
	workers         int
	stopChan        chan struct{}
	wg              sync.WaitGroup
}

func NewAsyncTaskService(settlementSvc *SettlementService, workers int) *AsyncTaskService {
	if workers <= 0 {
		workers = 2
	}
	return &AsyncTaskService{
		repo:          &repository.AsyncTaskRepository{},
		settlementSvc: settlementSvc,
		workers:       workers,
		stopChan:      make(chan struct{}),
	}
}

func (s *AsyncTaskService) Start() {
	for i := 0; i < s.workers; i++ {
		s.wg.Add(1)
		go s.worker(i)
	}
	log.Printf("async task service started with %d workers", s.workers)
}

func (s *AsyncTaskService) Stop() {
	close(s.stopChan)
	s.wg.Wait()
	log.Println("async task service stopped")
}

func (s *AsyncTaskService) worker(id int) {
	defer s.wg.Done()
	ticker := time.NewTicker(500 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-s.stopChan:
			return
		case <-ticker.C:
			if err := s.processNextTask(); err != nil {
				log.Printf("worker %d error: %v", id, err)
			}
		}
	}
}

func (s *AsyncTaskService) processNextTask() error {
	tasks, err := s.repo.ListPending(1)
	if err != nil || len(tasks) == 0 {
		return err
	}

	task := tasks[0]
	if err := s.repo.MarkStarted(task.ID); err != nil {
		return err
	}

	result, err := s.executeTask(&task)
	if err != nil {
		return s.repo.UpdateStatus(task.ID, "failed", nil, err.Error())
	}

	return s.repo.UpdateStatus(task.ID, "completed", result, "")
}

func (s *AsyncTaskService) executeTask(task *model.AsyncTask) (map[string]interface{}, error) {
	switch task.TaskType {
	case "settlement_generate":
		return s.executeSettlementGenerate(task)
	default:
		return nil, fmt.Errorf("unknown task type: %s", task.TaskType)
	}
}

func (s *AsyncTaskService) executeSettlementGenerate(task *model.AsyncTask) (map[string]interface{}, error) {
	var req dto.GenerateSettlementRequest
	payloadBytes, _ := json.Marshal(task.Payload)
	if err := json.Unmarshal(payloadBytes, &req); err != nil {
		return nil, fmt.Errorf("parse payload: %w", err)
	}

	fakeCtx := &fiber.Ctx{}
	fakeCtx.Locals("user", &dto.UserSummary{ID: task.CreatedBy})

	batch, err := s.settlementSvc.GenerateFromAttendance(fakeCtx, &req)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"settlement_batch_id": batch.ID.String(),
		"total_amount":        batch.TotalAmount,
		"item_count":          len(batch.Items),
	}, nil
}

func (s *AsyncTaskService) CreateSettlementTask(c *fiber.Ctx, req *dto.GenerateSettlementRequest) (*model.AsyncTask, error) {
	claims := getUserClaims(c)
	payload := map[string]interface{}{
		"team_id":      req.TeamID,
		"project_id":   req.ProjectID,
		"period_start": req.PeriodStart,
		"period_end":   req.PeriodEnd,
		"remark":       req.Remark,
	}

	task := &model.AsyncTask{
		TaskType:  "settlement_generate",
		Status:    "pending",
		Payload:   model.MapJSON(payload),
		CreatedBy: claims.ID,
	}

	if err := s.repo.Create(task); err != nil {
		return nil, err
	}

	return task, nil
}

func (s *AsyncTaskService) GetTask(id uuid.UUID) (*model.AsyncTask, error) {
	return s.repo.FindByID(id)
}
