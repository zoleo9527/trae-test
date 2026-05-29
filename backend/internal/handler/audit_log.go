package handler

import (
	"github.com/cultural-store/inspection-service/internal/middleware"
	"github.com/cultural-store/inspection-service/internal/service"
	"github.com/gofiber/fiber/v2"
)

type AuditLogHandler struct {
	svc *service.Service
}

func NewAuditLogHandler(svc *service.Service) *AuditLogHandler {
	return &AuditLogHandler{svc: svc}
}

func (h *AuditLogHandler) List(c *fiber.Ctx) error {
	entityType := c.Query("entity_type", "")
	entityID := c.Query("entity_id", "")
	f := middleware.GetFilter(c)
	result, err := h.svc.ListAuditLogs(entityType, entityID, f)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(result)
}
