package service

import (
	"encoding/json"
	"fmt"
	"math"
	"time"

	appErrors "watch-after-sales/backend/errors"
	"watch-after-sales/backend/dto"
	"watch-after-sales/backend/model"

	"gorm.io/gorm"
)

type RepairService struct {
	db              *gorm.DB
	auditService    *AuditService
	callbackService *CallbackService
}

func NewRepairService(db *gorm.DB, auditService *AuditService, callbackService *CallbackService) *RepairService {
	return &RepairService{db: db, auditService: auditService, callbackService: callbackService}
}

func (s *RepairService) Create(req dto.CreateRepairOrderRequest, operatorID uint, operatorName string) (*dto.RepairOrderResponse, *appErrors.AppError) {
	var customer model.Customer
	if err := s.db.First(&customer, req.CustomerID).Error; err != nil {
		return nil, appErrors.NewNotFoundError("customer not found")
	}

	if req.AssignedTechnicianID != nil {
		var tech model.User
		if err := s.db.Where("id = ? AND role = ?", *req.AssignedTechnicianID, model.RoleTechnician).First(&tech).Error; err != nil {
			return nil, appErrors.NewValidationError("assigned technician not found or not a technician")
		}
	}

	order := model.RepairOrder{
		CustomerID:           req.CustomerID,
		WatchBrand:           req.WatchBrand,
		WatchModel:           req.WatchModel,
		WatchSerial:          req.WatchSerial,
		IssueDescription:     req.IssueDescription,
		Status:               model.StatusRegistered,
		AssignedTechnicianID: req.AssignedTechnicianID,
		CreatedBy:            operatorID,
	}

	if err := s.db.Create(&order).Error; err != nil {
		return nil, appErrors.NewInternalError("failed to create repair order")
	}

	s.db.Preload("Customer").Preload("AssignedTechnician").Preload("Creator").First(&order, order.ID)

	s.auditService.Log("repair_order", order.ID, "create", nil, toJSONMap(order), operatorID, operatorName)

	return s.toResponse(&order), nil
}

func (s *RepairService) GetByID(id uint) (*dto.RepairOrderResponse, *appErrors.AppError) {
	var order model.RepairOrder
	if err := s.db.Preload("Customer").Preload("AssignedTechnician").Preload("Creator").
		Preload("ProgressLogs.Operator").
		Preload("PartLocks.Part").
		First(&order, id).Error; err != nil {
		return nil, appErrors.NewNotFoundError("repair order not found")
	}
	return s.toResponse(&order), nil
}

func (s *RepairService) List(filter dto.RepairFilterRequest) (*dto.PaginatedResponse, *appErrors.AppError) {
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.PageSize <= 0 {
		filter.PageSize = 20
	}

	query := s.db.Model(&model.RepairOrder{})

	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}
	if filter.WatchBrand != "" {
		query = query.Where("watch_brand ILIKE ?", "%"+filter.WatchBrand+"%")
	}
	if filter.AssignedTechnicianID != nil {
		query = query.Where("assigned_technician_id = ?", *filter.AssignedTechnicianID)
	}
	if filter.CustomerID != nil {
		query = query.Where("customer_id = ?", *filter.CustomerID)
	}
	if filter.DateFrom != "" {
		if t, err := time.Parse("2006-01-02", filter.DateFrom); err == nil {
			query = query.Where("created_at >= ?", t)
		}
	}
	if filter.DateTo != "" {
		if t, err := time.Parse("2006-01-02", filter.DateTo); err == nil {
			query = query.Where("created_at <= ?", t.Add(24*time.Hour))
		}
	}
	if filter.Keyword != "" {
		keyword := "%" + filter.Keyword + "%"
		query = query.Where("order_no ILIKE ? OR watch_brand ILIKE ? OR watch_model ILIKE ? OR issue_description ILIKE ?", keyword, keyword, keyword, keyword)
	}

	var total int64
	query.Count(&total)

	var orders []model.RepairOrder
	offset := (filter.Page - 1) * filter.PageSize
	if err := query.Preload("Customer").Preload("AssignedTechnician").Preload("Creator").
		Order("created_at DESC").Offset(offset).Limit(filter.PageSize).Find(&orders).Error; err != nil {
		return nil, appErrors.NewInternalError("failed to query repair orders")
	}

	data := make([]dto.RepairOrderResponse, len(orders))
	for i := range orders {
		data[i] = *s.toResponse(&orders[i])
	}

	totalPages := int(math.Ceil(float64(total) / float64(filter.PageSize)))

	return &dto.PaginatedResponse{
		Data:       data,
		Total:      total,
		Page:       filter.Page,
		PageSize:   filter.PageSize,
		TotalPages: totalPages,
	}, nil
}

func (s *RepairService) Update(id uint, req dto.UpdateRepairOrderRequest, operatorID uint, operatorName string) (*dto.RepairOrderResponse, *appErrors.AppError) {
	var order model.RepairOrder
	if err := s.db.First(&order, id).Error; err != nil {
		return nil, appErrors.NewNotFoundError("repair order not found")
	}

	oldData := toJSONMap(order)

	if req.WatchBrand != "" {
		order.WatchBrand = req.WatchBrand
	}
	if req.WatchModel != "" {
		order.WatchModel = req.WatchModel
	}
	if req.WatchSerial != "" {
		order.WatchSerial = req.WatchSerial
	}
	if req.IssueDescription != "" {
		order.IssueDescription = req.IssueDescription
	}
	if req.AssignedTechnicianID != nil {
		order.AssignedTechnicianID = req.AssignedTechnicianID
	}
	if req.QuotationPrice != nil {
		order.QuotationPrice = req.QuotationPrice
	}
	if req.QuotationNote != nil {
		order.QuotationNote = req.QuotationNote
	}
	if req.EstimatedCompletion != nil {
		if t, err := time.Parse(time.RFC3339, *req.EstimatedCompletion); err == nil {
			order.EstimatedCompletion = &t
		}
	}

	if err := s.db.Save(&order).Error; err != nil {
		return nil, appErrors.NewInternalError("failed to update repair order")
	}

	s.db.Preload("Customer").Preload("AssignedTechnician").Preload("Creator").First(&order, order.ID)

	s.auditService.Log("repair_order", order.ID, "update", oldData, toJSONMap(order), operatorID, operatorName)

	return s.toResponse(&order), nil
}

func (s *RepairService) ChangeStatus(id uint, req dto.StatusChangeRequest, operatorID uint, operatorName, operatorRole string) (*dto.RepairOrderResponse, *appErrors.AppError) {
	var order model.RepairOrder
	if err := s.db.Preload("Customer").Preload("AssignedTechnician").Preload("Creator").First(&order, id).Error; err != nil {
		return nil, appErrors.NewNotFoundError("repair order not found")
	}

	targetStatus := model.OrderStatus(req.Status)
	if !s.isValidTransition(order.Status, targetStatus) {
		s.auditService.Log("repair_order", order.ID, "status_change", toJSONMap(map[string]interface{}{"status": order.Status}), toJSONMap(map[string]interface{}{"status": targetStatus, "error": "invalid transition"}), operatorID, operatorName)
		return nil, appErrors.NewConflictError(fmt.Sprintf("invalid status transition from %s to %s", order.Status, targetStatus))
	}

	if !s.isRoleAllowed(targetStatus, model.Role(operatorRole)) {
		return nil, appErrors.NewForbiddenError(fmt.Sprintf("role %s cannot transition order to %s", operatorRole, targetStatus))
	}

	oldData := toJSONMap(order)
	oldStatus := order.Status

	order.Status = targetStatus

	switch targetStatus {
	case model.StatusCompleted:
		now := time.Now()
		order.CompletedAt = &now
	case model.StatusPickedUp:
		now := time.Now()
		order.PickedUpAt = &now
	}

	if err := s.db.Save(&order).Error; err != nil {
		return nil, appErrors.NewInternalError("failed to update order status")
	}

	s.auditService.Log("repair_order", order.ID, "status_change", oldData, toJSONMap(order), operatorID, operatorName)

	progressLog := model.ProgressLog{
		RepairOrderID: order.ID,
		StatusFrom:    string(oldStatus),
		StatusTo:      string(targetStatus),
		Note:          req.Note,
		OperatorID:    operatorID,
	}
	s.db.Create(&progressLog)

	if targetStatus == model.StatusCompleted {
		s.callbackService.ScheduleAutoCallback(order.ID, operatorID, operatorName)
	}

	s.db.Preload("Customer").Preload("AssignedTechnician").Preload("Creator").First(&order, order.ID)

	return s.toResponse(&order), nil
}

func (s *RepairService) BatchStatusChange(req dto.BatchStatusRequest, operatorID uint, operatorName, operatorRole string) *appErrors.AppError {
	targetStatus := model.OrderStatus(req.Status)

	if !s.isRoleAllowed(targetStatus, model.Role(operatorRole)) {
		return appErrors.NewForbiddenError(fmt.Sprintf("role %s cannot transition to %s", operatorRole, targetStatus))
	}

	var orders []model.RepairOrder
	if err := s.db.Where("id IN ?", req.OrderIDs).Find(&orders).Error; err != nil {
		return appErrors.NewInternalError("failed to query orders")
	}

	for _, order := range orders {
		if !s.isValidTransition(order.Status, targetStatus) {
			return appErrors.NewConflictError(fmt.Sprintf("order %d: invalid transition from %s to %s", order.ID, order.Status, targetStatus))
		}
	}

	for _, order := range orders {
		oldStatus := order.Status
		order.Status = targetStatus

		switch targetStatus {
		case model.StatusCompleted:
			now := time.Now()
			order.CompletedAt = &now
		case model.StatusPickedUp:
			now := time.Now()
			order.PickedUpAt = &now
		}

		s.db.Save(&order)

		s.auditService.Log("repair_order", order.ID, "status_change", toJSONMap(map[string]interface{}{"status": oldStatus}), toJSONMap(map[string]interface{}{"status": targetStatus}), operatorID, operatorName)

		progressLog := model.ProgressLog{
			RepairOrderID: order.ID,
			StatusFrom:    string(oldStatus),
			StatusTo:      string(targetStatus),
			Note:          req.Note,
			OperatorID:    operatorID,
		}
		s.db.Create(&progressLog)

		if targetStatus == model.StatusCompleted {
			s.callbackService.ScheduleAutoCallback(order.ID, operatorID, operatorName)
		}
	}

	return nil
}

func (s *RepairService) isValidTransition(from, to model.OrderStatus) bool {
	allowed, ok := model.AllowedTransitions[from]
	if !ok {
		return false
	}
	for _, status := range allowed {
		if status == to {
			return true
		}
	}
	return false
}

func (s *RepairService) isRoleAllowed(targetStatus model.OrderStatus, role model.Role) bool {
	roles, ok := model.StatusTransitionRoles[targetStatus]
	if !ok {
		return false
	}
	for _, r := range roles {
		if r == role {
			return true
		}
	}
	return false
}

func (s *RepairService) toResponse(order *model.RepairOrder) *dto.RepairOrderResponse {
	resp := &dto.RepairOrderResponse{
		ID:                   order.ID,
		OrderNo:              order.OrderNo,
		CustomerID:           order.CustomerID,
		WatchBrand:           order.WatchBrand,
		WatchModel:           order.WatchModel,
		WatchSerial:          order.WatchSerial,
		IssueDescription:     order.IssueDescription,
		Status:               string(order.Status),
		AssignedTechnicianID: order.AssignedTechnicianID,
		QuotationPrice:       order.QuotationPrice,
		QuotationNote:        order.QuotationNote,
		EstimatedCompletion:  order.EstimatedCompletion,
		CompletedAt:          order.CompletedAt,
		PickedUpAt:           order.PickedUpAt,
		CreatedBy:            order.CreatedBy,
		CreatedAt:            order.CreatedAt,
		UpdatedAt:            order.UpdatedAt,
	}

	if order.Customer.ID > 0 {
		resp.Customer = &dto.CustomerResponse{
			ID:        order.Customer.ID,
			Name:      order.Customer.Name,
			Phone:     order.Customer.Phone,
			Email:     order.Customer.Email,
			Address:   order.Customer.Address,
			CreatedAt: order.Customer.CreatedAt,
			UpdatedAt: order.Customer.UpdatedAt,
		}
	}

	if order.AssignedTechnician != nil {
		resp.AssignedTechnician = &dto.UserResponse{
			ID:          order.AssignedTechnician.ID,
			Username:    order.AssignedTechnician.Username,
			Role:        string(order.AssignedTechnician.Role),
			DisplayName: order.AssignedTechnician.DisplayName,
		}
	}

	if order.Creator.ID > 0 {
		resp.Creator = &dto.UserResponse{
			ID:          order.Creator.ID,
			Username:    order.Creator.Username,
			Role:        string(order.Creator.Role),
			DisplayName: order.Creator.DisplayName,
		}
	}

	if len(order.ProgressLogs) > 0 {
		resp.ProgressLogs = make([]dto.ProgressLogResponse, len(order.ProgressLogs))
		for i, log := range order.ProgressLogs {
			pl := dto.ProgressLogResponse{
				ID:            log.ID,
				RepairOrderID: log.RepairOrderID,
				StatusFrom:    log.StatusFrom,
				StatusTo:      log.StatusTo,
				Note:          log.Note,
				OperatorID:    log.OperatorID,
				CreatedAt:     log.CreatedAt,
			}
			if log.Operator.ID > 0 {
				pl.OperatorName = log.Operator.DisplayName
			}
			resp.ProgressLogs[i] = pl
		}
	}

	if len(order.PartLocks) > 0 {
		resp.PartLocks = make([]dto.PartLockResponse, len(order.PartLocks))
		for i, lock := range order.PartLocks {
			pl := dto.PartLockResponse{
				ID:            lock.ID,
				RepairOrderID: lock.RepairOrderID,
				PartID:        lock.PartID,
				Quantity:      lock.Quantity,
				LockedBy:      lock.LockedBy,
				LockedAt:      lock.LockedAt,
				ReleasedAt:    lock.ReleasedAt,
			}
			if lock.Part.ID > 0 {
				pl.PartName = lock.Part.Name
			}
			if lock.LockedByUser.ID > 0 {
				pl.LockedByName = lock.LockedByUser.DisplayName
			}
			resp.PartLocks[i] = pl
		}
	}

	return resp
}

func toJSONMap(v interface{}) model.JSONB {
	data, _ := json.Marshal(v)
	var result model.JSONB
	json.Unmarshal(data, &result)
	return result
}
