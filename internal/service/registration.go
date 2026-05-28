package service

import (
	"camp-management/internal/model"
	"camp-management/internal/repository"
	"errors"
	"time"

	"github.com/google/uuid"
)

type RegistrationService struct {
	repo         *repository.RegistrationRepository
	camperRepo   *repository.CamperRepository
	campRepo     *repository.CampRepository
	auditService *AuditService
}

func NewRegistrationService(repo *repository.RegistrationRepository, camperRepo *repository.CamperRepository, campRepo *repository.CampRepository, auditService *AuditService) *RegistrationService {
	return &RegistrationService{
		repo:         repo,
		camperRepo:   camperRepo,
		campRepo:     campRepo,
		auditService: auditService,
	}
}

type CreateRegistrationRequest struct {
	CamperID  uuid.UUID `json:"camper_id" validate:"required"`
	CampID    uuid.UUID `json:"camp_id" validate:"required"`
	Amount    float64   `json:"amount"`
	Notes     string    `json:"notes"`
	Source    string    `json:"source"`
}

func (s *RegistrationService) Create(req CreateRegistrationRequest, userID uuid.UUID) (*model.Registration, error) {
	_, err := s.camperRepo.GetByID(req.CamperID)
	if err != nil {
		return nil, NewServiceError("CAMPER_NOT_FOUND", "营员不存在", ErrNotFound)
	}

	camp, err := s.campRepo.GetByID(req.CampID)
	if err != nil {
		return nil, NewServiceError("CAMP_NOT_FOUND", "营地不存在", ErrNotFound)
	}

	reg := &model.Registration{
		CamperID: req.CamperID,
		CampID:   req.CampID,
		Status:   model.RegistrationStatusPending,
		Amount:   req.Amount,
		Notes:    req.Notes,
		Source:   req.Source,
		CreatedBy: userID,
	}

	if req.Amount == 0 {
		reg.Amount = camp.Fee
	}

	if err := s.repo.Create(reg); err != nil {
		return nil, err
	}

	s.auditService.Log(userID, model.AuditActionCreate, "registration", &reg.ID, nil, reg, nil, "", "", "创建报名")
	return reg, nil
}

func (s *RegistrationService) GetByID(id uuid.UUID) (*model.Registration, error) {
	reg, err := s.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, repository.ErrRecordNotFound) {
			return nil, NewServiceError("REGISTRATION_NOT_FOUND", "报名不存在", ErrNotFound)
		}
		return nil, err
	}
	return reg, nil
}

func (s *RegistrationService) GetByCampID(campID uuid.UUID, opts repository.QueryOptions) ([]model.Registration, int64, error) {
	return s.repo.GetByCampID(campID, opts)
}

func (s *RegistrationService) Confirm(id uuid.UUID, userID uuid.UUID) (*model.Registration, error) {
	reg, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	if !reg.CanConfirm() {
		return nil, NewServiceError("INVALID_STATUS", "报名状态不允许确认", ErrConflict)
	}

	reg.Status = model.RegistrationStatusConfirmed

	camper, _ := s.camperRepo.GetByID(reg.CamperID)
	if camper != nil && camper.Status == model.CamperStatusPending {
		camper.Status = model.CamperStatusRegistered
		s.camperRepo.Update(camper)
	}

	if err := s.repo.Update(reg); err != nil {
		return nil, err
	}

	s.auditService.Log(userID, model.AuditActionStatusChange, "registration", &reg.ID,
		map[string]interface{}{"status": model.RegistrationStatusPending},
		map[string]interface{}{"status": model.RegistrationStatusConfirmed},
		nil, "", "", "确认报名")

	return reg, nil
}

func (s *RegistrationService) MarkPaid(id uuid.UUID, amount float64, method string, userID uuid.UUID) (*model.Registration, error) {
	reg, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	if reg.Status != model.RegistrationStatusConfirmed {
		return nil, NewServiceError("INVALID_STATUS", "只有已确认的报名才能标记已支付", ErrConflict)
	}

	oldStatus := reg.Status
	reg.Status = model.RegistrationStatusPaid
	reg.PaidAmount += amount
	reg.PaymentMethod = method
	now := time.Now()
	reg.PaymentTime = &now

	if err := s.repo.Update(reg); err != nil {
		return nil, err
	}

	s.auditService.Log(userID, model.AuditActionStatusChange, "registration", &reg.ID,
		map[string]interface{}{"status": oldStatus, "paid_amount": reg.PaidAmount - amount},
		map[string]interface{}{"status": model.RegistrationStatusPaid, "paid_amount": reg.PaidAmount},
		nil, "", "", "标记支付")

	return reg, nil
}

func (s *RegistrationService) Cancel(id uuid.UUID, userID uuid.UUID) (*model.Registration, error) {
	reg, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	if !reg.CanCancel() {
		return nil, NewServiceError("INVALID_STATUS", "报名状态不允许取消", ErrConflict)
	}

	oldStatus := reg.Status
	reg.Status = model.RegistrationStatusRefunded

	if err := s.repo.Update(reg); err != nil {
		return nil, err
	}

	s.auditService.Log(userID, model.AuditActionStatusChange, "registration", &reg.ID,
		map[string]interface{}{"status": oldStatus},
		map[string]interface{}{"status": model.RegistrationStatusRefunded},
		nil, "", "", "取消报名")

	return reg, nil
}
