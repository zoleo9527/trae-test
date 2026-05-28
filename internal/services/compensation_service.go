package services

import (
	"errors"
	"log"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"water-delivery-service/internal/audit"
	"water-delivery-service/internal/async"
	"water-delivery-service/internal/database"
	"water-delivery-service/internal/models"
	"water-delivery-service/pkg/dto"
	"water-delivery-service/pkg/types"
)

type CompensationService struct {
	authService *AuthService
}

func NewCompensationService() *CompensationService {
	return &CompensationService{
		authService: NewAuthService(),
	}
}

func (s *CompensationService) Create(req *dto.CreateCompensationRequest, userID uuid.UUID, userRole types.Role, userStationID *uuid.UUID) (*models.Compensation, error) {
	var complaint models.Complaint
	if err := database.DB.Where("id = ?", req.ComplaintID).First(&complaint).Error; err != nil {
		return nil, errors.New("complaint not found")
	}

	if userRole != types.RoleAdmin && userStationID != nil && *userStationID != complaint.StationID {
		return nil, errors.New("access denied: complaint belongs to another station")
	}

	if complaint.Status == types.ComplaintStatusClosed || complaint.Status == types.ComplaintStatusRejected {
		return nil, errors.New("cannot create compensation for closed/rejected complaint")
	}

	if req.Amount <= 0 && req.WaterAmount <= 0 {
		return nil, errors.New("either amount or water_amount must be greater than 0")
	}

	status := types.CompensationStatusPending
	var approvedBy *uuid.UUID
	var approvedAt *time.Time

	if userRole == types.RoleAdmin || userRole == types.RoleStationMaster {
		status = types.CompensationStatusApproved
		approvedBy = &userID
		now := time.Now()
		approvedAt = &now
	}

	compensation := &models.Compensation{
		ComplaintID: req.ComplaintID,
		StationID:   complaint.StationID,
		Type:        req.Type,
		Amount:      req.Amount,
		WaterAmount: req.WaterAmount,
		Status:      status,
		Description: req.Description,
		ApprovedBy:  approvedBy,
		ApprovedAt:  approvedAt,
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(compensation).Error; err != nil {
			return err
		}

		if err := audit.LogCreateWithTx(tx, "compensation", compensation.ID, userID, map[string]interface{}{
			"complaint_id": req.ComplaintID,
			"type":         req.Type,
			"amount":       req.Amount,
			"water_amount": req.WaterAmount,
			"auto_approved": status == types.CompensationStatusApproved,
		}); err != nil {
			return err
		}

		if status == types.CompensationStatusApproved {
			if err := audit.LogApproveWithTx(tx, "compensation", compensation.ID, userID, true, "Auto-approved by role"); err != nil {
				return err
			}

			if complaint.Status == types.ComplaintStatusPending {
				if err := tx.Model(&complaint).Update("status", types.ComplaintStatusProcessing).Error; err != nil {
					return err
				}
				if err := audit.LogStatusChangeWithTx(tx, "complaint", complaint.ID, userID, string(types.ComplaintStatusPending), string(types.ComplaintStatusProcessing), "Compensation approved"); err != nil {
					return err
				}
			}

			var pendingRedeliveryCount int64
			tx.Model(&models.Redelivery{}).
				Where("complaint_id = ? AND status NOT IN ?", complaint.ID, []types.RedeliveryStatus{types.RedeliveryStatusDelivered, types.RedeliveryStatusCancelled}).
				Count(&pendingRedeliveryCount)

			var pendingCompCount int64
			tx.Model(&models.Compensation{}).
				Where("complaint_id = ? AND status = ? AND id != ?", complaint.ID, types.CompensationStatusPending, compensation.ID).
				Count(&pendingCompCount)

			if pendingRedeliveryCount == 0 && pendingCompCount == 0 {
				if complaint.Status == types.ComplaintStatusProcessing {
					now := time.Now()
					if err := tx.Model(&complaint).Updates(map[string]interface{}{
						"status":      types.ComplaintStatusResolved,
						"resolved_at": &now,
					}).Error; err != nil {
						return err
					}
					if err := audit.LogStatusChangeWithTx(tx, "complaint", complaint.ID, userID, string(types.ComplaintStatusProcessing), string(types.ComplaintStatusResolved), "All redeliveries and compensations completed"); err != nil {
						return err
					}
				}
			}
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	if _, err := async.SubmitTask(types.TaskTypeStatusNotify, map[string]interface{}{
		"entity_type": "compensation",
		"entity_id":   compensation.ID.String(),
		"old_status":  "",
		"new_status":  string(status),
	}); err != nil {
		log.Printf("Failed to submit notification task for compensation %s: %v", compensation.ID, err)
	}

	return compensation, nil
}

func (s *CompensationService) Approve(compensationID uuid.UUID, userID uuid.UUID, userRole types.Role, userStationID *uuid.UUID, req *dto.ApproveCompensationRequest) (*models.Compensation, error) {
	var compensation models.Compensation
	if err := database.DB.Where("id = ?", compensationID).First(&compensation).Error; err != nil {
		return nil, errors.New("compensation not found")
	}

	if userRole != types.RoleAdmin && userStationID != nil && *userStationID != compensation.StationID {
		return nil, errors.New("access denied: compensation belongs to another station")
	}

	if compensation.Status != types.CompensationStatusPending {
		return nil, errors.New("only pending compensation can be approved/rejected")
	}

	oldStatus := compensation.Status
	newStatus := types.CompensationStatusApproved
	if !req.Approved {
		newStatus = types.CompensationStatusRejected
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		updates := map[string]interface{}{
			"status": newStatus,
		}

		if req.Approved {
			now := time.Now()
			updates["approved_by"] = userID
			updates["approved_at"] = &now
		}

		if err := tx.Model(&compensation).Updates(updates).Error; err != nil {
			return err
		}

		if err := audit.LogApproveWithTx(tx, "compensation", compensationID, userID, req.Approved, req.Notes); err != nil {
			return err
		}

		if req.Approved {
			var pendingCount int64
			tx.Model(&models.Redelivery{}).
				Where("complaint_id = ? AND status NOT IN ?", compensation.ComplaintID, []types.RedeliveryStatus{types.RedeliveryStatusDelivered, types.RedeliveryStatusCancelled}).
				Count(&pendingCount)

			var compPendingCount int64
			tx.Model(&models.Compensation{}).
				Where("complaint_id = ? AND status = ? AND id != ?", compensation.ComplaintID, types.CompensationStatusPending, compensationID).
				Count(&compPendingCount)

			if pendingCount == 0 && compPendingCount == 0 {
				var complaint models.Complaint
				if err := tx.Where("id = ?", compensation.ComplaintID).First(&complaint).Error; err == nil {
					if complaint.Status == types.ComplaintStatusProcessing {
						now := time.Now()
						if err := tx.Model(&complaint).Updates(map[string]interface{}{
							"status":      types.ComplaintStatusResolved,
							"resolved_at": &now,
						}).Error; err != nil {
							return err
						}
						if err := audit.LogStatusChangeWithTx(tx, "complaint", complaint.ID, userID, string(types.ComplaintStatusProcessing), string(types.ComplaintStatusResolved), "All compensations approved"); err != nil {
							return err
						}
					}
				}
			}
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	if _, err := async.SubmitTask(types.TaskTypeStatusNotify, map[string]interface{}{
		"entity_type": "compensation",
		"entity_id":   compensationID.String(),
		"old_status":  oldStatus,
		"new_status":  newStatus,
	}); err != nil {
		log.Printf("Failed to submit notification task for compensation %s: %v", compensationID, err)
	}

	compensation.Status = newStatus
	return &compensation, nil
}

func (s *CompensationService) MarkPaid(compensationID uuid.UUID, userID uuid.UUID, userRole types.Role, userStationID *uuid.UUID) (*models.Compensation, error) {
	var compensation models.Compensation
	if err := database.DB.Where("id = ?", compensationID).First(&compensation).Error; err != nil {
		return nil, errors.New("compensation not found")
	}

	if userRole != types.RoleAdmin && userStationID != nil && *userStationID != compensation.StationID {
		return nil, errors.New("access denied: compensation belongs to another station")
	}

	if compensation.Status != types.CompensationStatusApproved {
		return nil, errors.New("only approved compensation can be marked as paid")
	}

	oldStatus := compensation.Status
	now := time.Now()

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&compensation).Updates(map[string]interface{}{
			"status": types.CompensationStatusPaid,
			"paid_at": &now,
		}).Error; err != nil {
			return err
		}

		if err := audit.LogStatusChangeWithTx(tx, "compensation", compensationID, userID, string(oldStatus), string(types.CompensationStatusPaid), ""); err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	compensation.Status = types.CompensationStatusPaid
	return &compensation, nil
}

func (s *CompensationService) GetByComplaint(complaintID uuid.UUID) ([]models.Compensation, error) {
	var compensations []models.Compensation
	err := database.DB.Where("complaint_id = ?", complaintID).
		Order("created_at DESC").
		Find(&compensations).Error
	return compensations, err
}

func (s *CompensationService) CalculateAmount(complaintType types.ComplaintType, waterAmount int) float64 {
	basePrice := 25.0
	switch complaintType {
	case types.ComplaintTypeDamagedBucket:
		return basePrice * float64(waterAmount) * 1.5
	case types.ComplaintTypeMissingDelivery:
		return basePrice * float64(waterAmount) * 1.2
	case types.ComplaintTypeLateDelivery:
		return basePrice * float64(waterAmount) * 0.5
	default:
		return basePrice * float64(waterAmount)
	}
}

func (s *CompensationService) GetPendingApprovals(stationID *uuid.UUID) ([]models.Compensation, error) {
	var compensations []models.Compensation
	query := database.DB.Where("status = ?", types.CompensationStatusPending)
	if stationID != nil {
		query = query.Where("station_id = ?", *stationID)
	}
	err := query.Order("created_at DESC").Find(&compensations).Error
	return compensations, err
}
