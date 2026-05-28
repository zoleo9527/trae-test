package handler

import (
	"instrument-rental/middleware"
	"instrument-rental/service"

	"github.com/gofiber/fiber/v2"
)

type DashboardHandler struct {
	svc *service.DashboardService
}

func NewDashboardHandler() *DashboardHandler {
	return &DashboardHandler{svc: service.NewDashboardService()}
}

func (h *DashboardHandler) GetStats(c *fiber.Ctx) error {
	stats, err := h.svc.GetStats()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(stats)
}

func (h *DashboardHandler) GetRecentActivities(c *fiber.Ctx) error {
	limit := int(service.ParseUintOrDefault(c.Query("limit", "20"), 20))
	activities, err := h.svc.GetRecentActivities(limit)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": activities})
}

func (h *DashboardHandler) GetAuditLogs(c *fiber.Ctx) error {
	page := int(service.ParseUintOrDefault(c.Query("page", "1"), 1))
	pageSize := int(service.ParseUintOrDefault(c.Query("page_size", "20"), 20))
	entityType := c.Query("entity_type")
	entityID := service.ParseUintOrDefault(c.Query("entity_id"), 0)
	userID := service.ParseUintOrDefault(c.Query("user_id"), 0)
	logs, total, err := middleware.GetAuditLogs(entityType, entityID, userID, page, pageSize)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": logs, "total": total, "page": page, "page_size": pageSize})
}
