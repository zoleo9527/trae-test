package handler

import (
	"floor-settlement/internal/dto"
	"floor-settlement/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type AuditHandler struct {
	service *service.AuditService
}

func NewAuditHandler(s *service.AuditService) *AuditHandler {
	return &AuditHandler{service: s}
}

func (h *AuditHandler) Filter(c *fiber.Ctx) error {
	var filter dto.AuditFilter
	if err := c.QueryParser(&filter); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	records, total, err := h.service.Query(filter.EntityType, filter.EntityID, filter.OperatorID, filter.Action, filter.StartDate, filter.EndDate, filter.Page, filter.PageSize)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data":      records,
		"total":     total,
		"page":      filter.Page,
		"page_size": filter.PageSize,
	})
}

func (h *AuditHandler) EntityHistory(c *fiber.Ctx) error {
	entityType := c.Query("entity_type")
	if entityType == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "entity_type is required"})
	}

	entityIDStr := c.Query("entity_id")
	if entityIDStr == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "entity_id is required"})
	}

	entityID, err := uuid.Parse(entityIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	records, err := h.service.GetEntityHistory(entityType, entityID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"data": records})
}
