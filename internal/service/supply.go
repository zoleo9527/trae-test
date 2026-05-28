package service

import (
	"camp-management/internal/model"
	"camp-management/internal/repository"
	"errors"

	"github.com/google/uuid"
)

type SupplyService struct {
	repo         *repository.SupplyRepository
	camperRepo   *repository.CamperRepository
	auditService *AuditService
}

func NewSupplyService(repo *repository.SupplyRepository, camperRepo *repository.CamperRepository, auditService *AuditService) *SupplyService {
	return &SupplyService{repo: repo, camperRepo: camperRepo, auditService: auditService}
}

type CreateSupplyRequest struct {
	CamperID uuid.UUID `json:"camper_id" validate:"required"`
	ItemName   string    `json:"item_name" validate:"required"`
	Quantity   int       `json:"quantity" validate:"required,min=1"`
	Unit       string    `json:"unit"`
	Reason     string    `json:"reason" validate:"required"`
}

func (s *SupplyService) Create(req CreateSupplyRequest, userID uuid.UUID) (*model.SupplyRequest, error) {
	_, err := s.camperRepo.GetByID(req.CamperID)
	if err != nil {
		return nil, NewServiceError("CAMPER_NOT_FOUND", "营员不存在", ErrNotFound)
	}

	request := &model.SupplyRequest{
		CamperID: req.CamperID,
		RequestedBy: userID,
		ItemName: req.ItemName,
		Quantity: req.Quantity,
		Unit: req.Unit,
		Reason: req.Reason,
		Status: model.SupplyStatusPending,
	}

	if err := s.repo.Create(request); err != nil {
		return nil, err
	}

	s.auditService.Log(userID, model.AuditActionCreate, "supply", &request.ID, nil, request, nil, "", "", "创建物资申请")
	return request, nil
}

func (s *SupplyService) GetByID(id uuid.UUID) (*model.SupplyRequest, error) {
	request, err := s.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, repository.ErrRecordNotFound) {
			return nil, NewServiceError("REQUEST_NOT_FOUND", "申请不存在", ErrNotFound)
		}
		return nil, err
	}
	return request, nil
}

func (s *SupplyService) GetByCampID(campID uuid.UUID, status *model.SupplyStatus) ([]model.SupplyRequest, error) {
	return s.repo.GetByCampID(campID, status)
}

func (s *SupplyService) Approve(id uuid.UUID, remark string, userID uuid.UUID) (*model.SupplyRequest, error) {
	request, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	if request.Status != model.SupplyStatusPending {
		return nil, NewServiceError("INVALID_STATUS", "只有待审批的申请才能审批", ErrConflict)
	}

	if err := s.repo.Approve(id, userID, remark); err != nil {
		return nil, err
	}

	s.auditService.Log(userID, model.AuditActionStatusChange, "supply", &id,
		map[string]interface{}{"status": model.SupplyStatusPending},
		map[string]interface{}{"status": model.SupplyStatusApproved},
		nil, "", "", "审批物资申请")

	return s.GetByID(id)
}

func (s *SupplyService) Reject(id uuid.UUID, remark string, userID uuid.UUID) (*model.SupplyRequest, error) {
	request, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	if request.Status != model.SupplyStatusPending {
		return nil, NewServiceError("INVALID_STATUS", "只有待审批的申请才能拒绝", ErrConflict)
	}

	if err := s.repo.Reject(id, userID, remark); err != nil {
		return nil, err
	}

	s.auditService.Log(userID, model.AuditActionStatusChange, "supply", &id,
		map[string]interface{}{"status": model.SupplyStatusPending},
		map[string]interface{}{"status": model.SupplyStatusRejected},
		nil, "", "", "拒绝物资申请")

	return s.GetByID(id)
}

func (s *SupplyService) Issue(id uuid.UUID, userID uuid.UUID) (*model.SupplyRequest, error) {
	request, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	if request.Status != model.SupplyStatusApproved {
		return nil, NewServiceError("INVALID_STATUS", "只有已审批的申请才能发放", ErrConflict)
	}

	if err := s.repo.Issue(id); err != nil {
		return nil, err
	}

	s.auditService.Log(userID, model.AuditActionStatusChange, "supply", &id,
		map[string]interface{}{"status": model.SupplyStatusApproved},
		map[string]interface{}{"status": model.SupplyStatusIssued},
		nil, "", "", "发放物资")

	return s.GetByID(id)
}
