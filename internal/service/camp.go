package service

import (
	"camp-management/internal/model"
	"camp-management/internal/repository"
	"errors"
	"time"

	"github.com/google/uuid"
)

type CampService struct {
	repo         *repository.CampRepository
	auditService *AuditService
}

func NewCampService(repo *repository.CampRepository, auditService *AuditService) *CampService {
	return &CampService{repo: repo, auditService: auditService}
}

type CreateCampRequest struct {
	Name        string             `json:"name" validate:"required"`
	Theme       string             `json:"theme"`
	Description string             `json:"description"`
	Location    string             `json:"location" validate:"required"`
	StartDate   string             `json:"start_date" validate:"required"`
	EndDate     string             `json:"end_date" validate:"required"`
	MaxCampers  int                `json:"max_campers" validate:"required,min=1"`
	Fee         float64            `json:"fee"`
}

func (s *CampService) Create(req CreateCampRequest, userID uuid.UUID) (*model.Camp, error) {
	if req.MaxCampers <= 0 {
		return nil, NewServiceError("INVALID_MAX_CAMPERS", "最大营员数必须大于0", ErrValidation)
	}

	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		return nil, NewServiceError("INVALID_START_TIME", "开始日期格式错误，请使用YYYY-MM-DD格式", ErrValidation)
	}

	endDate, err := time.Parse("2006-01-02", req.EndDate)
	if err != nil {
		return nil, NewServiceError("INVALID_END_TIME", "结束日期格式错误，请使用YYYY-MM-DD格式", ErrValidation)
	}

	if endDate.Before(startDate) {
		return nil, NewServiceError("INVALID_END_TIME", "结束日期不能早于开始日期", ErrValidation)
	}

	camp := &model.Camp{
		Name:           req.Name,
		Theme:          req.Theme,
		Description:    req.Description,
		Location:       req.Location,
		StartDate:      startDate,
		EndDate:        endDate,
		MaxCampers:     req.MaxCampers,
		Fee:            req.Fee,
		Status:         model.CampStatusDraft,
		CreatedBy:      userID,
	}

	if err := s.repo.Create(camp); err != nil {
		return nil, err
	}

	s.auditService.Log(userID, model.AuditActionCreate, "camp", &camp.ID, nil, camp, nil, "", "", "创建营地")
	return camp, nil
}

func (s *CampService) GetByID(id uuid.UUID) (*model.Camp, error) {
	camp, err := s.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, repository.ErrRecordNotFound) {
			return nil, NewServiceError("CAMP_NOT_FOUND", "营地不存在", ErrNotFound)
		}
		return nil, err
	}
	return camp, nil
}

func (s *CampService) List(status *model.CampStatus) ([]model.Camp, error) {
	return s.repo.List(status)
}

func (s *CampService) UpdateStatus(id uuid.UUID, status model.CampStatus, userID uuid.UUID) (*model.Camp, error) {
	camp, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	validTransitions := map[model.CampStatus][]model.CampStatus{
		model.CampStatusDraft:     {model.CampStatusOpen, model.CampStatusCancelled},
		model.CampStatusOpen:      {model.CampStatusInProgress, model.CampStatusCancelled},
		model.CampStatusInProgress: {model.CampStatusCompleted, model.CampStatusCancelled},
		model.CampStatusCompleted: {},
		model.CampStatusCancelled: {},
	}

	valid := false
	for _, allowed := range validTransitions[camp.Status] {
		if allowed == status {
			valid = true
			break
		}
	}
	if !valid {
		return nil, NewServiceError("INVALID_STATUS", "无法从 "+string(camp.Status)+" 状态变更为 "+string(status), ErrConflict)
	}

	if status == model.CampStatusInProgress && camp.CurrentCampers == 0 {
		return nil, NewServiceError("INVALID_STATUS", "开营前必须有营员报名", ErrConflict)
	}

	oldStatus := camp.Status
	camp.Status = status

	if err := s.repo.Update(camp); err != nil {
		return nil, err
	}

	s.auditService.Log(userID, model.AuditActionStatusChange, "camp", &camp.ID,
		map[string]interface{}{"status": oldStatus},
		map[string]interface{}{"status": status},
		map[string]interface{}{"status": string(oldStatus) + " -> " + string(status)},
		"", "", "更新营地状态")

	return camp, nil
}
