package service

import (
	"time"

	appErrors "watch-after-sales/backend/errors"
	"watch-after-sales/backend/dto"
	"watch-after-sales/backend/model"

	"gorm.io/gorm"
)

type CallbackService struct {
	db *gorm.DB
}

func NewCallbackService(db *gorm.DB) *CallbackService {
	return &CallbackService{db: db}
}

func (s *CallbackService) Create(req dto.CreateCallbackRequest, operatorID uint, operatorName string) (*dto.CallbackResponse, *appErrors.AppError) {
	var order model.RepairOrder
	if err := s.db.First(&order, req.RepairOrderID).Error; err != nil {
		return nil, appErrors.NewNotFoundError("repair order not found")
	}

	scheduledAt, err := time.Parse(time.RFC3339, req.ScheduledAt)
	if err != nil {
		return nil, appErrors.NewValidationError("invalid scheduled_at format, use RFC3339")
	}

	callback := model.SatisfactionCallback{
		RepairOrderID: req.RepairOrderID,
		CallbackType:  model.CallbackType(req.CallbackType),
		ScheduledAt:   scheduledAt,
		OperatorID:    operatorID,
	}

	if err := s.db.Create(&callback).Error; err != nil {
		return nil, appErrors.NewInternalError("failed to create callback")
	}

	s.db.Preload("RepairOrder").Preload("Operator").First(&callback, callback.ID)

	return s.toResponse(&callback), nil
}

func (s *CallbackService) Complete(id uint, req dto.CompleteCallbackRequest, operatorID uint, operatorName string) (*dto.CallbackResponse, *appErrors.AppError) {
	var callback model.SatisfactionCallback
	if err := s.db.First(&callback, id).Error; err != nil {
		return nil, appErrors.NewNotFoundError("callback not found")
	}

	if callback.CompletedAt != nil {
		return nil, appErrors.NewConflictError("callback already completed")
	}

	now := time.Now()
	result := model.CallbackResult(req.Result)
	callback.CompletedAt = &now
	callback.Result = &result
	callback.Note = &req.Note

	if err := s.db.Save(&callback).Error; err != nil {
		return nil, appErrors.NewInternalError("failed to complete callback")
	}

	s.db.Preload("RepairOrder").Preload("Operator").First(&callback, callback.ID)

	return s.toResponse(&callback), nil
}

func (s *CallbackService) List(page, pageSize int) (*dto.PaginatedResponse, *appErrors.AppError) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}

	var total int64
	s.db.Model(&model.SatisfactionCallback{}).Count(&total)

	var callbacks []model.SatisfactionCallback
	offset := (page - 1) * pageSize
	if err := s.db.Preload("RepairOrder").Preload("Operator").Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&callbacks).Error; err != nil {
		return nil, appErrors.NewInternalError("failed to query callbacks")
	}

	data := make([]dto.CallbackResponse, len(callbacks))
	for i := range callbacks {
		data[i] = *s.toResponse(&callbacks[i])
	}

	totalPages := int(float64(total)/float64(pageSize) + 0.99)
	if totalPages*pageSize < int(total) {
		totalPages++
	}

	return &dto.PaginatedResponse{
		Data:       data,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

func (s *CallbackService) GetOverdue() ([]dto.CallbackResponse, *appErrors.AppError) {
	var callbacks []model.SatisfactionCallback
	now := time.Now()
	if err := s.db.Preload("RepairOrder").Preload("Operator").
		Where("completed_at IS NULL AND scheduled_at < ?", now).
		Order("scheduled_at ASC").Find(&callbacks).Error; err != nil {
		return nil, appErrors.NewInternalError("failed to query overdue callbacks")
	}

	data := make([]dto.CallbackResponse, len(callbacks))
	for i := range callbacks {
		data[i] = *s.toResponse(&callbacks[i])
	}
	return data, nil
}

func (s *CallbackService) ScheduleAutoCallback(repairOrderID uint, operatorID uint, operatorName string) {
	scheduledAt := time.Now().Add(3 * 24 * time.Hour)

	callback := model.SatisfactionCallback{
		RepairOrderID: repairOrderID,
		CallbackType:  model.CallbackSatisfaction,
		ScheduledAt:   scheduledAt,
		OperatorID:    operatorID,
	}
	s.db.Create(&callback)
}

func (s *CallbackService) toResponse(cb *model.SatisfactionCallback) *dto.CallbackResponse {
	resultStr := ""
	if cb.Result != nil {
		resultStr = string(*cb.Result)
	}

	noteStr := ""
	if cb.Note != nil {
		noteStr = *cb.Note
	}

	return &dto.CallbackResponse{
		ID:            cb.ID,
		RepairOrderID: cb.RepairOrderID,
		CallbackType:  string(cb.CallbackType),
		ScheduledAt:   cb.ScheduledAt,
		CompletedAt:   cb.CompletedAt,
		Result:        &resultStr,
		Note:          &noteStr,
		OperatorID:    cb.OperatorID,
		IsOverdue:     cb.CompletedAt == nil && cb.ScheduledAt.Before(time.Now()),
		CreatedAt:     cb.CreatedAt,
		UpdatedAt:     cb.UpdatedAt,
	}
}
