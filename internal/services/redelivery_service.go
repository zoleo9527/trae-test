package services

import (
	"errors"
	"fmt"
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

type RedeliveryService struct {
	authService *AuthService
}

func NewRedeliveryService() *RedeliveryService {
	return &RedeliveryService{
		authService: NewAuthService(),
	}
}

func (s *RedeliveryService) Create(req *dto.CreateRedeliveryRequest, userID uuid.UUID) (*models.Redelivery, error) {
	var complaint models.Complaint
	if err := database.DB.Where("id = ?", req.ComplaintID).First(&complaint).Error; err != nil {
		return nil, errors.New("complaint not found")
	}

	if complaint.Status == types.ComplaintStatusClosed || complaint.Status == types.ComplaintStatusRejected {
		return nil, errors.New("cannot create redelivery for closed/rejected complaint")
	}

	redelivery := &models.Redelivery{
		ComplaintID:       req.ComplaintID,
		DriverID:          req.DriverID,
		StationID:         complaint.StationID,
		WaterAmount:       req.WaterAmount,
		EmptyBucketAdjust: req.EmptyBucketAdjust,
		Status:            types.RedeliveryStatusScheduled,
		ScheduledAt:       req.ScheduledAt,
		Notes:             req.Notes,
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(redelivery).Error; err != nil {
			return err
		}

		if err := audit.LogCreateWithTx(tx, "redelivery", redelivery.ID, userID, map[string]interface{}{
			"complaint_id":        req.ComplaintID,
			"water_amount":        req.WaterAmount,
			"empty_bucket_adjust": req.EmptyBucketAdjust,
			"scheduled_at":        req.ScheduledAt,
		}); err != nil {
			return err
		}

		if complaint.Status == types.ComplaintStatusPending {
			if err := tx.Model(&complaint).Update("status", types.ComplaintStatusProcessing).Error; err != nil {
				return err
			}
			if err := audit.LogStatusChangeWithTx(tx, "complaint", complaint.ID, userID, string(types.ComplaintStatusPending), string(types.ComplaintStatusProcessing), "Redelivery scheduled"); err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	async.SubmitTask(types.TaskTypeStatusNotify, map[string]interface{}{
		"entity_type": "redelivery",
		"entity_id":   redelivery.ID.String(),
		"old_status":  "",
		"new_status":  string(types.RedeliveryStatusScheduled),
	})

	return redelivery, nil
}

func (s *RedeliveryService) UpdateStatus(redeliveryID uuid.UUID, userID uuid.UUID, userRole types.Role, userStationID *uuid.UUID, req *dto.UpdateRedeliveryStatusRequest) (*models.Redelivery, error) {
	var redelivery models.Redelivery
	if err := database.DB.Where("id = ?", redeliveryID).First(&redelivery).Error; err != nil {
		return nil, errors.New("redelivery not found")
	}

	if userRole != types.RoleAdmin && userStationID != nil && *userStationID != redelivery.StationID {
		return nil, errors.New("access denied: redelivery belongs to another station")
	}

	if userRole == types.RoleDriver && (redelivery.DriverID == nil || *redelivery.DriverID != userID) {
		return nil, errors.New("access denied: not assigned to this redelivery")
	}

	oldStatus := redelivery.Status

	validTransitions := map[types.RedeliveryStatus][]types.RedeliveryStatus{
		types.RedeliveryStatusScheduled: {types.RedeliveryStatusInTransit, types.RedeliveryStatusCancelled},
		types.RedeliveryStatusInTransit: {types.RedeliveryStatusDelivered, types.RedeliveryStatusFailed},
		types.RedeliveryStatusFailed:    {types.RedeliveryStatusScheduled, types.RedeliveryStatusCancelled},
	}

	valid := false
	for _, allowed := range validTransitions[oldStatus] {
		if allowed == req.Status {
			valid = true
			break
		}
	}
	if !valid {
		return nil, fmt.Errorf("invalid status transition from %s to %s", oldStatus, req.Status)
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		updates := map[string]interface{}{
			"status": req.Status,
		}

		if req.Status == types.RedeliveryStatusDelivered {
			now := time.Now()
			updates["delivered_at"] = &now

			if req.PhotoURL != nil {
				updates["photo_url"] = *req.PhotoURL
			}

			var complaint models.Complaint
			if err := tx.Where("id = ?", redelivery.ComplaintID).First(&complaint).Error; err == nil {
				if redelivery.EmptyBucketAdjust != 0 {
					if err := tx.Model(&models.Customer{}).
						Where("id = ?", complaint.CustomerID).
						UpdateColumn("empty_buckets", gorm.Expr("empty_buckets + ?", redelivery.EmptyBucketAdjust)).Error; err != nil {
						return err
					}
				}
			}
		}

		if err := tx.Model(&redelivery).Updates(updates).Error; err != nil {
			return err
		}

		if err := audit.LogStatusChangeWithTx(tx, "redelivery", redeliveryID, userID, string(oldStatus), string(req.Status), req.Notes); err != nil {
			return err
		}

		if req.Status == types.RedeliveryStatusDelivered {
			var pendingCount int64
			tx.Model(&models.Redelivery{}).
				Where("complaint_id = ? AND status NOT IN ?", redelivery.ComplaintID, []types.RedeliveryStatus{types.RedeliveryStatusDelivered, types.RedeliveryStatusCancelled}).
				Count(&pendingCount)

			var compPendingCount int64
			tx.Model(&models.Compensation{}).
				Where("complaint_id = ? AND status = ?", redelivery.ComplaintID, types.CompensationStatusPending).
				Count(&compPendingCount)

			if pendingCount == 0 && compPendingCount == 0 {
				var complaint models.Complaint
				if err := tx.Where("id = ?", redelivery.ComplaintID).First(&complaint).Error; err == nil {
					if complaint.Status == types.ComplaintStatusProcessing {
						now := time.Now()
						if err := tx.Model(&complaint).Updates(map[string]interface{}{
							"status":      types.ComplaintStatusResolved,
							"resolved_at": &now,
						}).Error; err != nil {
							return err
						}
						if err := audit.LogStatusChangeWithTx(tx, "complaint", complaint.ID, userID, string(types.ComplaintStatusProcessing), string(types.ComplaintStatusResolved), "All redeliveries completed"); err != nil {
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

	async.SubmitTask(types.TaskTypeStatusNotify, map[string]interface{}{
		"entity_type": "redelivery",
		"entity_id":   redeliveryID.String(),
		"old_status":  oldStatus,
		"new_status":  req.Status,
	})

	redelivery.Status = req.Status
	return &redelivery, nil
}

func (s *RedeliveryService) GetByComplaint(complaintID uuid.UUID) ([]models.Redelivery, error) {
	var redeliveries []models.Redelivery
	err := database.DB.Where("complaint_id = ?", complaintID).
		Order("created_at DESC").
		Find(&redeliveries).Error
	return redeliveries, err
}

func (s *RedeliveryService) GetByDriver(driverID uuid.UUID) ([]models.Redelivery, error) {
	var redeliveries []models.Redelivery
	err := database.DB.Where("driver_id = ? AND status NOT IN ?", driverID, []types.RedeliveryStatus{types.RedeliveryStatusDelivered, types.RedeliveryStatusCancelled}).
		Order("scheduled_at ASC").
		Find(&redeliveries).Error
	return redeliveries, err
}
