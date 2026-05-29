package handlers

import (
	"runner-platform/internal/schemas"
	"runner-platform/internal/services"
	"runner-platform/internal/utils"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

type LogHandler struct {
	logService *services.LogService
	validate   *validator.Validate
}

func NewLogHandler() *LogHandler {
	return &LogHandler{
		logService: services.NewLogService(),
		validate:   validator.New(),
	}
}

func (h *LogHandler) ListLogs(c *fiber.Ctx) error {
	var query schemas.OperationLogQuery
	if err := c.QueryParser(&query); err != nil {
		return utils.ValidationError(c, "Invalid query parameters")
	}

	logs, total, err := h.logService.QueryLogs(&query)
	if err != nil {
		return utils.Error(c, 6001, err.Error())
	}

	return utils.SuccessWithPagination(c, logs, total, query.Page, query.PageSize)
}

func (h *LogHandler) GetDashboardStats(c *fiber.Ctx) error {
	stats, err := h.logService.GetDashboardStats()
	if err != nil {
		return utils.Error(c, 6002, err.Error())
	}

	return utils.Success(c, stats)
}
