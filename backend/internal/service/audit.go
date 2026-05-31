package service

import (
	"floor-settlement/internal/model"
	"floor-settlement/internal/repository"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type AuditService struct {
	repo *repository.AuditTrailRepository
}

func NewAuditService() *AuditService {
	return &AuditService{
		repo: &repository.AuditTrailRepository{},
	}
}

func (s *AuditService) Record(entityType string, entityID uuid.UUID, action string, before, after map[string]interface{}, operatorID uuid.UUID, operatorName, operatorRole, remark string) error {
	trail := &model.AuditTrail{
		EntityType:   entityType,
		EntityID:     entityID,
		Action:       action,
		BeforeValue:  model.MapJSON(before),
		AfterValue:   model.MapJSON(after),
		OperatorID:   operatorID,
		OperatorName: operatorName,
		OperatorRole: operatorRole,
		Remark:       remark,
	}
	return s.repo.Create(trail)
}

func (s *AuditService) RecordFromContext(c *fiber.Ctx, entityType string, entityID uuid.UUID, action string, before, after map[string]interface{}, remark string) error {
	authSvc := NewAuthService()

	token := c.Get("Authorization")
	if len(token) > 7 && token[:7] == "Bearer " {
		token = token[7:]
	}

	claims, err := authSvc.ValidateToken(token)
	if err != nil {
		return err
	}

	operatorID, err := uuid.Parse(claims["user_id"].(string))
	if err != nil {
		return err
	}

	operatorName := ""
	if v, ok := claims["real_name"].(string); ok {
		operatorName = v
	}

	operatorRole := ""
	if v, ok := claims["role"].(string); ok {
		operatorRole = v
	}

	return s.Record(entityType, entityID, action, before, after, operatorID, operatorName, operatorRole, remark)
}

func (s *AuditService) Query(entityType, entityID, operatorID, action, startDate, endDate string, page, pageSize int) ([]model.AuditTrail, int64, error) {
	return s.repo.Filter(entityType, entityID, operatorID, action, startDate, endDate, page, pageSize)
}

func (s *AuditService) GetEntityHistory(entityType string, entityID uuid.UUID) ([]model.AuditTrail, error) {
	return s.repo.FindByEntity(entityType, entityID)
}
