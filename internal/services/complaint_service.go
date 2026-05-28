package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"water-delivery-service/internal/audit"
	"water-delivery-service/internal/async"
	"water-delivery-service/internal/database"
	"water-delivery-service/internal/models"
	"water-delivery-service/internal/utils"
	"water-delivery-service/pkg/dto"
	"water-delivery-service/pkg/types"
)

type ComplaintService struct {
	authService *AuthService
}

func NewComplaintService() *ComplaintService {
	return &ComplaintService{
		authService: NewAuthService(),
	}
}

func (s *ComplaintService) Create(req *dto.CreateComplaintRequest, userID uuid.UUID, userRole types.Role, userStationID *uuid.UUID) (*models.Complaint, error) {
	var customer models.Customer
	if err := database.DB.Where("id = ?", req.CustomerID).First(&customer).Error; err != nil {
		return nil, errors.New("customer not found")
	}

	if userRole != types.RoleAdmin && userStationID != nil && *userStationID != customer.StationID {
		return nil, errors.New("access denied: customer belongs to another station")
	}

	if req.Priority < 1 || req.Priority > 5 {
		req.Priority = 1
	}

	complaint := &models.Complaint{
		CustomerID:      req.CustomerID,
		StationID:       customer.StationID,
		OrderID:         req.OrderID,
		Type:            req.Type,
		Status:          types.ComplaintStatusPending,
		Priority:        req.Priority,
		Title:           req.Title,
		Description:     req.Description,
		EmptyBucketDiff: req.EmptyBucketDiff,
		ReportedBy:      userID,
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(complaint).Error; err != nil {
			return err
		}

		if err := audit.LogCreateWithTx(tx, "complaint", complaint.ID, userID, map[string]interface{}{
			"type":    req.Type,
			"title":   req.Title,
			"station_id": customer.StationID,
		}); err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	if _, err := async.SubmitTask(types.TaskTypeStatusNotify, map[string]interface{}{
		"entity_type": "complaint",
		"entity_id":   complaint.ID.String(),
		"old_status":  "",
		"new_status":  string(types.ComplaintStatusPending),
	}); err != nil {
		log.Printf("Failed to submit notification task for complaint %s: %v", complaint.ID, err)
	}

	return complaint, nil
}

func (s *ComplaintService) UpdateStatus(complaintID uuid.UUID, userID uuid.UUID, userRole types.Role, userStationID *uuid.UUID, req *dto.UpdateComplaintStatusRequest) (*models.Complaint, error) {
	var complaint models.Complaint
	if err := database.DB.Where("id = ?", complaintID).First(&complaint).Error; err != nil {
		return nil, errors.New("complaint not found")
	}

	if userRole != types.RoleAdmin && userStationID != nil && *userStationID != complaint.StationID {
		return nil, errors.New("access denied: complaint belongs to another station")
	}

	if userRole == types.RoleDriver {
		var hasAccess bool
		database.DB.Raw(`
			SELECT CASE WHEN c.assigned_to = ? OR EXISTS (
				SELECT 1 FROM redeliveries r WHERE r.complaint_id = c.id AND r.driver_id = ?
			) THEN true ELSE false END
			FROM complaints c WHERE c.id = ?
		`, userID, userID, complaintID).Scan(&hasAccess)
		if !hasAccess {
			return nil, errors.New("access denied: not assigned to this complaint or its redeliveries")
		}
	}

	oldStatus := complaint.Status
	validTransitions := map[types.ComplaintStatus][]types.ComplaintStatus{
		types.ComplaintStatusPending:    {types.ComplaintStatusProcessing, types.ComplaintStatusRejected, types.ComplaintStatusClosed},
		types.ComplaintStatusProcessing: {types.ComplaintStatusResolved, types.ComplaintStatusRejected, types.ComplaintStatusClosed},
		types.ComplaintStatusResolved:   {types.ComplaintStatusClosed, types.ComplaintStatusProcessing},
		types.ComplaintStatusRejected:   {types.ComplaintStatusProcessing},
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

		if req.Status == types.ComplaintStatusResolved || req.Status == types.ComplaintStatusClosed {
			now := time.Now()
			updates["resolved_at"] = &now
		}

		if err := tx.Model(&complaint).Updates(updates).Error; err != nil {
			return err
		}

		if err := audit.LogStatusChangeWithTx(tx, "complaint", complaintID, userID, string(oldStatus), string(req.Status), req.Notes); err != nil {
			return err
		}

		if req.Notes != "" {
			note := &models.ComplaintNote{
				ComplaintID: complaintID,
				CreatedBy:   userID,
				Content:     req.Notes,
				IsInternal:  true,
			}
			if err := tx.Create(note).Error; err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	if _, err := async.SubmitTask(types.TaskTypeStatusNotify, map[string]interface{}{
		"entity_type": "complaint",
		"entity_id":   complaintID.String(),
		"old_status":  oldStatus,
		"new_status":  req.Status,
	}); err != nil {
		log.Printf("Failed to submit notification task for complaint %s: %v", complaintID, err)
	}

	complaint.Status = req.Status
	return &complaint, nil
}

func (s *ComplaintService) Assign(complaintID uuid.UUID, userID uuid.UUID, userRole types.Role, userStationID *uuid.UUID, req *dto.AssignComplaintRequest) (*models.Complaint, error) {
	var complaint models.Complaint
	if err := database.DB.Where("id = ?", complaintID).First(&complaint).Error; err != nil {
		return nil, errors.New("complaint not found")
	}

	if userRole != types.RoleAdmin && userStationID != nil && *userStationID != complaint.StationID {
		return nil, errors.New("access denied: complaint belongs to another station")
	}

	var assignee models.User
	if err := database.DB.Where("id = ? AND is_active = true", req.AssignedTo).First(&assignee).Error; err != nil {
		return nil, errors.New("assignee not found")
	}

	if userRole != types.RoleAdmin && assignee.StationID != nil && *assignee.StationID != complaint.StationID {
		return nil, errors.New("assignee belongs to another station")
	}

	oldAssignee := complaint.AssignedTo

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&complaint).Update("assigned_to", req.AssignedTo).Error; err != nil {
			return err
		}

		if err := audit.LogAssignWithTx(tx, "complaint", complaintID, userID, oldAssignee, req.AssignedTo); err != nil {
			return err
		}

		if complaint.Status == types.ComplaintStatusPending {
			if err := tx.Model(&complaint).Update("status", types.ComplaintStatusProcessing).Error; err != nil {
				return err
			}
			if err := audit.LogStatusChangeWithTx(tx, "complaint", complaintID, userID, string(types.ComplaintStatusPending), string(types.ComplaintStatusProcessing), "Auto-processing on assignment"); err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	complaint.AssignedTo = &req.AssignedTo
	return &complaint, nil
}

func (s *ComplaintService) Query(filter *dto.ComplaintQueryFilter, user *utils.JWTClaims) (*dto.PaginatedResponse, error) {
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.PageSize < 1 || filter.PageSize > 100 {
		filter.PageSize = 20
	}

	db := database.DB.Table("complaints c").
		Select(`c.id, c.type, c.status, c.priority, c.title, c.empty_bucket_diff, c.created_at,
			cu.name as customer_name, cu.phone as customer_phone,
			ws.name as station_name,
			au.full_name as reporter_name,
			asu.full_name as assigned_name,
			EXISTS(SELECT 1 FROM redeliveries r WHERE r.complaint_id = c.id) as has_redelivery,
			EXISTS(SELECT 1 FROM compensations comp WHERE comp.complaint_id = c.id) as has_compensation,
			(SELECT COUNT(*) FROM complaint_photos cp WHERE cp.complaint_id = c.id) as photo_count`).
		Joins("LEFT JOIN customers cu ON cu.id = c.customer_id").
		Joins("LEFT JOIN water_stations ws ON ws.id = c.station_id").
		Joins("LEFT JOIN users au ON au.id = c.reported_by").
		Joins("LEFT JOIN users asu ON asu.id = c.assigned_to").
		Where("c.deleted_at IS NULL")

	if user.Role != types.RoleAdmin {
		db = db.Where("c.station_id = ?", *user.StationID)
	}

	if user.Role == types.RoleDriver {
		db = db.Where("(c.assigned_to = ? OR EXISTS (SELECT 1 FROM redeliveries r WHERE r.complaint_id = c.id AND r.driver_id = ?))", user.UserID, user.UserID)
	}

	if filter.StationID != nil {
		if user.Role == types.RoleAdmin || (user.StationID != nil && *user.StationID == *filter.StationID) {
			db = db.Where("c.station_id = ?", *filter.StationID)
		}
	}

	if filter.CustomerID != nil {
		db = db.Where("c.customer_id = ?", *filter.CustomerID)
	}
	if filter.AssignedTo != nil {
		db = db.Where("c.assigned_to = ?", *filter.AssignedTo)
	}
	if filter.Status != nil {
		db = db.Where("c.status = ?", *filter.Status)
	}
	if filter.Type != nil {
		db = db.Where("c.type = ?", *filter.Type)
	}
	if filter.Priority != nil {
		db = db.Where("c.priority = ?", *filter.Priority)
	}
	if filter.Search != "" {
		search := "%" + strings.ToLower(filter.Search) + "%"
		db = db.Where("(LOWER(c.title) LIKE ? OR LOWER(cu.name) LIKE ? OR LOWER(cu.phone) LIKE ?)", search, search, search)
	}

	var total int64
	db.Count(&total)

	var results []dto.ComplaintListResponse
	offset := (filter.Page - 1) * filter.PageSize
	err := db.Order("c.priority DESC, c.created_at DESC").
		Limit(filter.PageSize).
		Offset(offset).
		Scan(&results).Error

	if err != nil {
		return nil, err
	}

	return &dto.PaginatedResponse{
		Data:       results,
		Page:       filter.Page,
		PageSize:   filter.PageSize,
		Total:      total,
		TotalPages: int(math.Ceil(float64(total) / float64(filter.PageSize))),
	}, nil
}

func (s *ComplaintService) GetDetail(complaintID uuid.UUID, user *utils.JWTClaims) (*dto.ComplaintDetailResponse, error) {
	var complaint models.Complaint
	if err := database.DB.Where("id = ?", complaintID).First(&complaint).Error; err != nil {
		return nil, errors.New("complaint not found")
	}

	if user.Role != types.RoleAdmin && user.StationID != nil && *user.StationID != complaint.StationID {
		return nil, errors.New("access denied")
	}

	if user.Role == types.RoleDriver {
		var hasAccess bool
		database.DB.Raw(`
			SELECT CASE WHEN c.assigned_to = ? OR EXISTS (
				SELECT 1 FROM redeliveries r WHERE r.complaint_id = c.id AND r.driver_id = ?
			) THEN true ELSE false END
			FROM complaints c WHERE c.id = ?
		`, user.UserID, user.UserID, complaintID).Scan(&hasAccess)
		if !hasAccess {
			return nil, errors.New("access denied: not assigned to this complaint or its redeliveries")
		}
	}

	var result dto.ComplaintDetailResponse

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Table("complaints c").
			Select(`c.id, c.customer_id, c.station_id, c.order_id, c.type, c.status, c.priority, c.title, 
				c.description, c.empty_bucket_diff, c.assigned_to, c.reported_by, c.created_at, c.resolved_at,
				cu.name as customer_name, cu.phone as customer_phone, cu.address as customer_address,
				ws.name as station_name,
				au.full_name as reporter_name,
				asu.full_name as assigned_name`).
			Joins("LEFT JOIN customers cu ON cu.id = c.customer_id").
			Joins("LEFT JOIN water_stations ws ON ws.id = c.station_id").
			Joins("LEFT JOIN users au ON au.id = c.reported_by").
			Joins("LEFT JOIN users asu ON asu.id = c.assigned_to").
			Where("c.id = ?", complaintID).
			Scan(&result).Error; err != nil {
			return err
		}

		var redeliveries []models.Redelivery
		if err := tx.Where("complaint_id = ?", complaintID).Order("created_at DESC").Find(&redeliveries).Error; err != nil {
			return err
		}
		result.Redeliveries = make([]dto.RedeliveryResponse, len(redeliveries))
		for i, r := range redeliveries {
			result.Redeliveries[i] = s.toRedeliveryResponse(&r)
		}

		var compensations []models.Compensation
		if err := tx.Where("complaint_id = ?", complaintID).Order("created_at DESC").Find(&compensations).Error; err != nil {
			return err
		}
		result.Compensations = make([]dto.CompensationResponse, len(compensations))
		for i, c := range compensations {
			result.Compensations[i] = s.toCompensationResponse(&c)
		}

		var photos []models.ComplaintPhoto
		if err := tx.Where("complaint_id = ?", complaintID).Order("created_at DESC").Find(&photos).Error; err != nil {
			return err
		}
		result.Photos = make([]dto.PhotoResponse, len(photos))
		for i, p := range photos {
			result.Photos[i] = s.toPhotoResponse(&p)
		}

		noteQuery := tx.Where("complaint_id = ?", complaintID)
		if user.Role == types.RoleCustomerService {
			noteQuery = noteQuery.Where("is_internal = ?", false)
		}
		var notes []models.ComplaintNote
		if err := noteQuery.Order("created_at DESC").Find(&notes).Error; err != nil {
			return err
		}
		result.Notes = make([]dto.NoteResponse, len(notes))
		for i, n := range notes {
			result.Notes[i] = s.toNoteResponse(&n)
		}

		auditLogs, err := audit.GetComplaintAuditLogsWithTx(tx, complaintID)
		if err != nil {
			return err
		}
		result.AuditLogs = make([]dto.AuditLogResponse, len(auditLogs))
		for i, a := range auditLogs {
			result.AuditLogs[i] = s.toAuditLogResponse(&a)
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return &result, nil
}

func (s *ComplaintService) AddNote(complaintID uuid.UUID, userID uuid.UUID, userRole types.Role, userStationID *uuid.UUID, req *dto.AddNoteRequest) (*models.ComplaintNote, error) {
	var complaint models.Complaint
	if err := database.DB.Where("id = ?", complaintID).First(&complaint).Error; err != nil {
		return nil, errors.New("complaint not found")
	}

	if userRole != types.RoleAdmin && userStationID != nil && *userStationID != complaint.StationID {
		return nil, errors.New("access denied: complaint belongs to another station")
	}

	if userRole == types.RoleDriver {
		var hasAccess bool
		database.DB.Raw(`
			SELECT CASE WHEN c.assigned_to = ? OR EXISTS (
				SELECT 1 FROM redeliveries r WHERE r.complaint_id = c.id AND r.driver_id = ?
			) THEN true ELSE false END
			FROM complaints c WHERE c.id = ?
		`, userID, userID, complaintID).Scan(&hasAccess)
		if !hasAccess {
			return nil, errors.New("access denied: not assigned to this complaint or its redeliveries")
		}
	}

	note := &models.ComplaintNote{
		ComplaintID: complaintID,
		CreatedBy:   userID,
		Content:     req.Content,
		IsInternal:  req.IsInternal,
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(note).Error; err != nil {
			return err
		}
		if err := audit.LogCreateNoteWithTx(tx, complaintID, note.ID, userID, req.IsInternal); err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		return nil, err
	}

	return note, nil
}

func (s *ComplaintService) UploadPhoto(complaintID uuid.UUID, userID uuid.UUID, userRole types.Role, userStationID *uuid.UUID, fileURL string, fileHash string, fileSize int64, description string) (*models.ComplaintPhoto, error) {
	var complaint models.Complaint
	if err := database.DB.Where("id = ?", complaintID).First(&complaint).Error; err != nil {
		return nil, errors.New("complaint not found")
	}

	if userRole != types.RoleAdmin && userStationID != nil && *userStationID != complaint.StationID {
		return nil, errors.New("access denied: complaint belongs to another station")
	}

	if userRole == types.RoleDriver {
		var hasAccess bool
		database.DB.Raw(`
			SELECT CASE WHEN c.assigned_to = ? OR EXISTS (
				SELECT 1 FROM redeliveries r WHERE r.complaint_id = c.id AND r.driver_id = ?
			) THEN true ELSE false END
			FROM complaints c WHERE c.id = ?
		`, userID, userID, complaintID).Scan(&hasAccess)
		if !hasAccess {
			return nil, errors.New("access denied: not assigned to this complaint or its redeliveries")
		}
	}

	photo := &models.ComplaintPhoto{
		ComplaintID: complaintID,
		UploadedBy:  userID,
		FileURL:     fileURL,
		FileHash:    fileHash,
		FileSize:    fileSize,
		Description: description,
		Verified:    false,
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(photo).Error; err != nil {
			return err
		}
		if err := audit.LogUploadWithTx(tx, "complaint", complaintID, userID, fileURL, fileHash); err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		return nil, err
	}

	if _, err := async.SubmitTask(types.TaskTypePhotoVerification, map[string]interface{}{
		"photo_id": photo.ID.String(),
	}); err != nil {
		log.Printf("Failed to submit photo verification task for photo %s: %v", photo.ID, err)
	}

	return photo, nil
}

func (s *ComplaintService) toRedeliveryResponse(r *models.Redelivery) dto.RedeliveryResponse {
	var driverName *string
	if r.DriverID != nil {
		name := s.authService.GetUserName(*r.DriverID)
		driverName = &name
	}
	return dto.RedeliveryResponse{
		ID:                r.ID,
		ComplaintID:       r.ComplaintID,
		DriverID:          r.DriverID,
		DriverName:        driverName,
		WaterAmount:       r.WaterAmount,
		EmptyBucketAdjust: r.EmptyBucketAdjust,
		Status:            r.Status,
		ScheduledAt:       r.ScheduledAt,
		DeliveredAt:       r.DeliveredAt,
		PhotoURL:          r.PhotoURL,
		Notes:             r.Notes,
		CreatedAt:         r.CreatedAt,
	}
}

func (s *ComplaintService) toCompensationResponse(c *models.Compensation) dto.CompensationResponse {
	var approverName *string
	if c.ApprovedBy != nil {
		name := s.authService.GetUserName(*c.ApprovedBy)
		approverName = &name
	}
	return dto.CompensationResponse{
		ID:           c.ID,
		ComplaintID:  c.ComplaintID,
		Type:         c.Type,
		Amount:       c.Amount,
		WaterAmount:  c.WaterAmount,
		Status:       c.Status,
		Description:  c.Description,
		ApprovedBy:   c.ApprovedBy,
		ApproverName: approverName,
		ApprovedAt:   c.ApprovedAt,
		PaidAt:       c.PaidAt,
		CreatedAt:    c.CreatedAt,
	}
}

func (s *ComplaintService) toPhotoResponse(p *models.ComplaintPhoto) dto.PhotoResponse {
	return dto.PhotoResponse{
		ID:           p.ID,
		ComplaintID:  p.ComplaintID,
		UploadedBy:   p.UploadedBy,
		UploaderName: s.authService.GetUserName(p.UploadedBy),
		FileURL:      p.FileURL,
		Description:  p.Description,
		Verified:     p.Verified,
		CreatedAt:    p.CreatedAt,
	}
}

func (s *ComplaintService) toNoteResponse(n *models.ComplaintNote) dto.NoteResponse {
	return dto.NoteResponse{
		ID:         n.ID,
		ComplaintID: n.ComplaintID,
		CreatedBy:  n.CreatedBy,
		CreatorName: s.authService.GetUserName(n.CreatedBy),
		Content:    n.Content,
		IsInternal: n.IsInternal,
		CreatedAt:  n.CreatedAt,
	}
}

func (s *ComplaintService) toAuditLogResponse(a *models.AuditLog) dto.AuditLogResponse {
	resp := dto.AuditLogResponse{
		ID:         a.ID,
		EntityType: a.EntityType,
		EntityID:   a.EntityID,
		Action:     a.Action,
		UserID:     a.UserID,
		UserName:   s.authService.GetUserName(a.UserID),
		FieldName:  a.FieldName,
		OldValue:   a.OldValue,
		NewValue:   a.NewValue,
		Metadata:   a.Metadata,
		CreatedAt:  a.CreatedAt,
	}

	if a.Metadata != nil && *a.Metadata != "" {
		var meta map[string]interface{}
		if err := json.Unmarshal([]byte(*a.Metadata), &meta); err == nil {
			if noteIDStr, ok := meta["note_id"].(string); ok {
				if noteID, err := uuid.Parse(noteIDStr); err == nil {
					resp.NoteID = &noteID
				}
			}
			if isInternal, ok := meta["is_internal"].(bool); ok {
				resp.IsInternal = &isInternal
			}
		}
	}

	return resp
}
