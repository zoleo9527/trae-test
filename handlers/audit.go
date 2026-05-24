package handlers

import (
	"jewelry-store-system/services"
	"jewelry-store-system/utils"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type AuditHandler struct {
	auditService *services.AuditService
}

func NewAuditHandler(db *gorm.DB) *AuditHandler {
	return &AuditHandler{
		auditService: services.NewAuditService(db),
	}
}

func (h *AuditHandler) GetAuditLogs(c *fiber.Ctx) error {
	module := c.Query("module")
	recordID, _ := strconv.Atoi(c.Query("record_id", "0"))

	logs, err := h.auditService.GetAuditLogs(module, uint(recordID))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to get audit logs")
	}

	return utils.SuccessResponse(c, logs)
}

func (h *AuditHandler) GetRecordAuditLogs(c *fiber.Ctx) error {
	module := c.Params("module")
	recordID, _ := strconv.Atoi(c.Params("id"))

	logs, err := h.auditService.GetAuditLogs(module, uint(recordID))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to get audit logs")
	}

	return utils.SuccessResponse(c, logs)
}

func (h *AuditHandler) GetStatusHistory(c *fiber.Ctx) error {
	module := c.Params("module")
	recordID, _ := strconv.Atoi(c.Params("id"))

	history, err := h.auditService.GetStatusHistory(module, uint(recordID))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to get status history")
	}

	return utils.SuccessResponse(c, history)
}
