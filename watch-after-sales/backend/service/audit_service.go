package service

import (
	"encoding/json"
	"math"

	appErrors "watch-after-sales/backend/errors"
	"watch-after-sales/backend/dto"
	"watch-after-sales/backend/model"

	"gorm.io/gorm"
)

type AuditService struct {
	db *gorm.DB
}

func NewAuditService(db *gorm.DB) *AuditService {
	return &AuditService{db: db}
}

func (s *AuditService) Log(entityType string, entityID uint, action string, oldValue, newValue model.JSONB, operatorID uint, operatorName string) {
	log := model.AuditLog{
		EntityType:   entityType,
		EntityID:     entityID,
		Action:       action,
		OldValue:     oldValue,
		NewValue:     newValue,
		OperatorID:   operatorID,
		OperatorName: operatorName,
	}
	s.db.Create(&log)
}

func (s *AuditService) List(filter dto.AuditFilterRequest) (*dto.PaginatedResponse, *appErrors.AppError) {
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.PageSize <= 0 {
		filter.PageSize = 20
	}

	query := s.db.Model(&model.AuditLog{})

	if filter.EntityType != "" {
		query = query.Where("entity_type = ?", filter.EntityType)
	}
	if filter.EntityID != nil {
		query = query.Where("entity_id = ?", *filter.EntityID)
	}
	if filter.OperatorID != nil {
		query = query.Where("operator_id = ?", *filter.OperatorID)
	}
	if filter.DateFrom != "" {
		query = query.Where("created_at >= ?", filter.DateFrom)
	}
	if filter.DateTo != "" {
		query = query.Where("created_at <= ?", filter.DateTo)
	}

	var total int64
	query.Count(&total)

	var logs []model.AuditLog
	offset := (filter.Page - 1) * filter.PageSize
	if err := query.Order("created_at DESC").Offset(offset).Limit(filter.PageSize).Find(&logs).Error; err != nil {
		return nil, appErrors.NewInternalError("failed to query audit logs")
	}

	data := make([]dto.AuditLogResponse, len(logs))
	for i, log := range logs {
		data[i] = dto.AuditLogResponse{
			ID:           log.ID,
			EntityType:   log.EntityType,
			EntityID:     log.EntityID,
			Action:       log.Action,
			OldValue:     log.OldValue,
			NewValue:     log.NewValue,
			OperatorID:   log.OperatorID,
			OperatorName: log.OperatorName,
			CreatedAt:    log.CreatedAt,
		}
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

func init() {
	_ = json.Marshal
}
