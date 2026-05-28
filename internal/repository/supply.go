package repository

import (
	"camp-management/internal/model"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SupplyRepository struct {
	baseRepository
}

func NewSupplyRepository(db *gorm.DB) *SupplyRepository {
	return &SupplyRepository{baseRepository{db: db}}
}

func (r *SupplyRepository) Create(request *model.SupplyRequest) error {
	return r.db.Create(request).Error
}

func (r *SupplyRepository) GetByID(id uuid.UUID) (*model.SupplyRequest, error) {
	var request model.SupplyRequest
	if err := r.db.Preload("Camper").Preload("Requester").Preload("Approver").First(&request, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &request, nil
}

func (r *SupplyRepository) GetByCampID(campID uuid.UUID, status *model.SupplyStatus) ([]model.SupplyRequest, error) {
	var requests []model.SupplyRequest
	query := r.db.Joins("JOIN campers ON campers.id = supply_requests.camper_id").
		Where("campers.camp_id = ?", campID).
		Preload("Camper").Preload("Requester").Preload("Approver")

	if status != nil {
		query = query.Where("supply_requests.status = ?", *status)
	}

	err := query.Order("supply_requests.created_at DESC").Find(&requests).Error
	return requests, err
}

func (r *SupplyRepository) Update(request *model.SupplyRequest) error {
	return r.db.Save(request).Error
}

func (r *SupplyRepository) Approve(id uuid.UUID, approvedBy uuid.UUID, remark string) error {
	now := time.Now()
	return r.db.Model(&model.SupplyRequest{}).
		Where("id = ? AND status = ?", id, model.SupplyStatusPending).
		Updates(map[string]interface{}{
			"status":      model.SupplyStatusApproved,
			"approved_by": approvedBy,
			"approved_at": &now,
			"remark":      remark,
		}).Error
}

func (r *SupplyRepository) Issue(id uuid.UUID) error {
	now := time.Now()
	return r.db.Model(&model.SupplyRequest{}).
		Where("id = ? AND status = ?", id, model.SupplyStatusApproved).
		Updates(map[string]interface{}{
			"status":    model.SupplyStatusIssued,
			"issued_at": &now,
		}).Error
}

func (r *SupplyRepository) Reject(id uuid.UUID, approvedBy uuid.UUID, remark string) error {
	now := time.Now()
	return r.db.Model(&model.SupplyRequest{}).
		Where("id = ? AND status = ?", id, model.SupplyStatusPending).
		Updates(map[string]interface{}{
			"status":      model.SupplyStatusRejected,
			"approved_by": approvedBy,
			"approved_at": &now,
			"remark":      remark,
		}).Error
}
