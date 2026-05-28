package service

import (
	"camp-management/internal/model"
	"camp-management/internal/repository"

	"github.com/google/uuid"
)

type AuditService struct {
	repo *repository.AuditRepository
}

func NewAuditService(repo *repository.AuditRepository) *AuditService {
	return &AuditService{repo: repo}
}

func (s *AuditService) Log(userID uuid.UUID, action model.AuditAction, resourceType string, resourceID *uuid.UUID, oldValues, newValues interface{}, changes map[string]interface{}, ip, userAgent, remark string) error {
	return s.repo.Log(userID, action, resourceType, resourceID, oldValues, newValues, changes, ip, userAgent, remark)
}

func (s *AuditService) Query(opts repository.QueryOptions) ([]model.AuditLog, int64, error) {
	return s.repo.Query(opts)
}

func (s *AuditService) GetByResource(resourceType string, resourceID uuid.UUID) ([]model.AuditLog, error) {
	return s.repo.GetByResource(resourceType, resourceID)
}

func (s *AuditService) GetByUser(userID uuid.UUID, limit int) ([]model.AuditLog, error) {
	return s.repo.GetByUser(userID, limit)
}
