package controllers

import (
	"tea-distribution/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type AuditController struct {
	auditService *services.AuditService
}

func NewAuditController() *AuditController {
	return &AuditController{
		auditService: services.NewAuditService(),
	}
}

func (ctrl *AuditController) List(c *fiber.Ctx) error {
	entityType := c.Query("entity_type")
	entityIDStr := c.Query("entity_id")
	page := c.QueryInt("page", 1)
	pageSize := c.QueryInt("page_size", 20)

	var entityID uuid.UUID
	if entityIDStr != "" {
		entityID, _ = uuid.Parse(entityIDStr)
	}

	logs, total, err := ctrl.auditService.List(entityType, entityID, page, pageSize)
	if err != nil {
		return handleAppError(c, err)
	}

	return c.JSON(fiber.Map{
		"items": logs,
		"total": total,
		"page":  page,
		"size":  pageSize,
	})
}
