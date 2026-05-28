package handler

import (
	"camp-management/internal/repository"
	"camp-management/internal/service"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type AuditHandler struct {
	auditService *service.AuditService
	authService  *service.AuthService
}

func NewAuditHandler(auditService *service.AuditService, authService *service.AuthService) *AuditHandler {
	return &AuditHandler{auditService: auditService, authService: authService}
}

func (h *AuditHandler) Query(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "50"))
	resourceType := c.Query("resource_type")
	action := c.Query("action")

	opts := repository.QueryOptions{
		Offset: (page - 1) * pageSize,
		Limit:  pageSize,
		SortBy: "created_at",
		SortDesc: true,
	}

	if resourceType != "" {
		opts.Filters = append(opts.Filters, repository.QueryFilter{
			Field:    "resource_type",
			Operator: "eq",
			Value:    resourceType,
		})
	}

	if action != "" {
		opts.Filters = append(opts.Filters, repository.QueryFilter{
			Field:    "action",
			Operator: "eq",
			Value:    action,
		})
	}

	logs, total, err := h.auditService.Query(opts)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(NewPageResult(logs, total, page, pageSize))
}

func (h *AuditHandler) GetByResource(c *fiber.Ctx) error {
	resourceType := c.Params("resourceType")
	resourceID, err := ParseUUIDParam(c, "resourceId")
	if err != nil {
		return HandleError(c, err)
	}

	logs, err := h.auditService.GetByResource(resourceType, resourceID)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(logs)
}

func (h *AuditHandler) GetMyLogs(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(uuid.UUID)
	limit, _ := strconv.Atoi(c.Query("limit", "50"))

	logs, err := h.auditService.GetByUser(userID, limit)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(logs)
}
