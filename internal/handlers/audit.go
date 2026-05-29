package handlers

import (
	"exhibition-system/internal/models"
	"exhibition-system/internal/services"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type AuditHandler struct {
	auditService *services.AuditService
}

func NewAuditHandler() *AuditHandler {
	return &AuditHandler{
		auditService: services.NewAuditService(),
	}
}

func (h *AuditHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "20"))
	resourceType := c.Query("resource_type")
	resourceID := c.Query("resource_id")
	projectID := c.Query("project_id")

	var rt *models.ResourceType
	if resourceType != "" {
		rtVal := models.ResourceType(resourceType)
		rt = &rtVal
	}

	var rid *uint
	if resourceID != "" {
		if id, err := strconv.Atoi(resourceID); err == nil {
			uid := uint(id)
			rid = &uid
		}
	}

	var pid *uint
	if projectID != "" {
		if id, err := strconv.Atoi(projectID); err == nil {
			uid := uint(id)
			pid = &uid
		}
	}

	logs, total, err := h.auditService.List(rt, rid, pid, page, pageSize)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data":  logs,
		"total": total,
		"page":  page,
		"size":  pageSize,
	})
}

func (h *AuditHandler) Get(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))

	log, err := h.auditService.GetByID(uint(id))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Audit log not found"})
	}

	return c.JSON(log)
}
