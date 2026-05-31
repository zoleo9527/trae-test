package handler

import (
	"strconv"

	"watch-after-sales/backend/dto"
	"watch-after-sales/backend/service"

	"github.com/gofiber/fiber/v2"
)

type AuditHandler struct {
	auditService *service.AuditService
}

func NewAuditHandler(auditService *service.AuditService) *AuditHandler {
	return &AuditHandler{auditService: auditService}
}

func (h *AuditHandler) List(c *fiber.Ctx) error {
	filter := dto.AuditFilterRequest{
		EntityType: c.Query("entity_type"),
		DateFrom:   c.Query("date_from"),
		DateTo:     c.Query("date_to"),
		Page:       c.QueryInt("page", 1),
		PageSize:   c.QueryInt("page_size", 20),
	}

	if eid := c.Query("entity_id"); eid != "" {
		if id, err := strconv.ParseUint(eid, 10, 32); err == nil {
			uid := uint(id)
			filter.EntityID = &uid
		}
	}
	if oid := c.Query("operator_id"); oid != "" {
		if id, err := strconv.ParseUint(oid, 10, 32); err == nil {
			uid := uint(id)
			filter.OperatorID = &uid
		}
	}

	resp, appErr := h.auditService.List(filter)
	if appErr != nil {
		return c.Status(appErr.Code).JSON(appErr)
	}

	return c.JSON(resp)
}
