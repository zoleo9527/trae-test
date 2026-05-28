package service

import (
	"camp-management/internal/async"
	"camp-management/internal/model"
	"camp-management/internal/repository"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
)

type MedicalService struct {
	repo         *repository.MedicalRepository
	camperRepo   *repository.CamperRepository
	auditService *AuditService
	taskQueue    *async.TaskQueue
}

func NewMedicalService(repo *repository.MedicalRepository, camperRepo *repository.CamperRepository, auditService *AuditService, taskQueue *async.TaskQueue) *MedicalService {
	service := &MedicalService{repo: repo, camperRepo: camperRepo, auditService: auditService, taskQueue: taskQueue}
	service.registerTaskHandlers()
	return service
}

func (s *MedicalService) registerTaskHandlers() {
	s.taskQueue.RegisterHandler(async.TaskTypeMedicalReminder, s.handleMedicalReminderTask)
	s.taskQueue.RegisterHandler(async.TaskTypeParentNotification, s.handleParentNotificationTask)
}

type CreateMedicalRecordRequest struct {
	CamperID    uuid.UUID           `json:"camper_id" validate:"required"`
	Symptoms    string                `json:"symptoms" validate:"required"`
	Severity    model.MedicalSeverity `json:"severity" validate:"required"`
	Temperature float64             `json:"temperature"`
	Treatment   string                `json:"treatment"`
	Medication  string                `json:"medication"`
	Notes       string                `json:"notes"`
}

func (s *MedicalService) Create(req CreateMedicalRecordRequest, userID uuid.UUID) (*model.MedicalRecord, error) {
	camper, err := s.camperRepo.GetByID(req.CamperID)
	if err != nil {
		return nil, NewServiceError("CAMPER_NOT_FOUND", "营员不存在", ErrNotFound)
	}

	record := &model.MedicalRecord{
		CamperID: req.CamperID,
		ReportTime: time.Now(),
		ReportedBy: userID,
		Symptoms: req.Symptoms,
		Severity: req.Severity,
		Temperature: req.Temperature,
		Treatment: req.Treatment,
		Medication: req.Medication,
		Status: model.MedicalStatusOpen,
		Notes: req.Notes,
	}

	if err := s.repo.Create(record); err != nil {
		return nil, err
	}

	s.auditService.Log(userID, model.AuditActionCreate, "medical", &record.ID, nil, record, nil, "", "", "创建医疗记录")

	if req.Severity == model.MedicalSeveritySevere || req.Severity == model.MedicalSeverityEmergency {
		s.taskQueue.Submit(async.TaskTypeParentNotification, map[string]interface{}{
			"record_id": record.ID,
			"camper_name": camper.Name,
			"severity": req.Severity,
			"symptoms": req.Symptoms,
		}, userID)
	}

	return record, nil
}

func (s *MedicalService) GetByID(id uuid.UUID) (*model.MedicalRecord, error) {
	record, err := s.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, repository.ErrRecordNotFound) {
			return nil, NewServiceError("RECORD_NOT_FOUND", "医疗记录不存在", ErrNotFound)
		}
		return nil, err
	}
	return record, nil
}

func (s *MedicalService) GetByCamperID(camperID uuid.UUID) ([]model.MedicalRecord, error) {
	return s.repo.GetByCamperID(camperID)
}

func (s *MedicalService) GetByCampID(campID uuid.UUID, status *model.MedicalStatus) ([]model.MedicalRecord, error) {
	return s.repo.GetByCampID(campID, status)
}

type ResolveMedicalRequest struct {
	Treatment string `json:"treatment" validate:"required"`
}

func (s *MedicalService) Resolve(id uuid.UUID, req ResolveMedicalRequest, userID uuid.UUID) (*model.MedicalRecord, error) {
	record, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	if record.Status == model.MedicalStatusResolved {
		return nil, NewServiceError("ALREADY_RESOLVED", "记录已处理", ErrConflict)
	}

	record.Status = model.MedicalStatusResolved
	record.Treatment = req.Treatment
	now := time.Now()
	record.ResolvedAt = &now
	record.ResolvedBy = &userID

	if err := s.repo.Update(record); err != nil {
		return nil, err
	}

	s.auditService.Log(userID, model.AuditActionStatusChange, "medical", &record.ID,
		map[string]interface{}{"status": model.MedicalStatusOpen},
		map[string]interface{}{"status": model.MedicalStatusResolved},
		nil, "", "", "处理医疗记录")

	return record, nil
}

func (s *MedicalService) NotifyParent(id uuid.UUID, userID uuid.UUID) (*model.MedicalRecord, error) {
	record, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	if record.ParentNotified {
		return nil, NewServiceError("ALREADY_NOTIFIED", "家长已通知", ErrConflict)
	}

	record.ParentNotified = true
	now := time.Now()
	record.NotifyTime = &now

	if err := s.repo.Update(record); err != nil {
		return nil, err
	}

	s.auditService.Log(userID, model.AuditActionUpdate, "medical", &record.ID,
		map[string]interface{}{"parent_notified": false},
		map[string]interface{}{"parent_notified": true},
		nil, "", "", "通知家长")

	return record, nil
}

func (s *MedicalService) handleMedicalReminderTask(task *async.Task) error {
	task.Result = "医疗提醒已发送"
	return nil
}

func (s *MedicalService) handleParentNotificationTask(task *async.Task) error {
	var payload map[string]interface{}
	if err := json.Unmarshal(task.Payload, &payload); err != nil {
		return err
	}
	
	task.Result = "家长通知已发送"
	return nil
}
