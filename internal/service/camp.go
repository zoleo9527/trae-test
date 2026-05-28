package service

import (
	"camp-management/internal/model"
	"camp-management/internal/repository"
	"errors"

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

	camp := &model.Camp{
		Name:           req.Name,
		Theme:          req.Theme,
		Description:    req.Description,
		Location:       req.Location,
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
