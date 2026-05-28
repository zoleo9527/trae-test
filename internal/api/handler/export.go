package handler

import (
	"camp-management/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ExportHandler struct {
	exportService *service.ExportService
	authService   *service.AuthService
}

func NewExportHandler(exportService *service.ExportService, authService *service.AuthService) *ExportHandler {
	return &ExportHandler{exportService: exportService, authService: authService}
}

func (h *ExportHandler) ExportCampers(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(uuid.UUID)
	campID, err := ParseUUIDParam(c, "campId")
	if err != nil {
		return HandleError(c, err)
	}

	keyword := c.Query("keyword", "")

	task, err := h.exportService.ExportCampersAsync(campID, keyword, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(fiber.Map{
		"message": "导出任务已提交",
		"task_id": task.ID,
	})
}

func (h *ExportHandler) ExportRegistrations(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(uuid.UUID)
	campID, err := ParseUUIDParam(c, "campId")
	if err != nil {
		return HandleError(c, err)
	}

	task, err := h.exportService.ExportRegistrationsAsync(campID, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(fiber.Map{
		"message": "导出任务已提交",
		"task_id": task.ID,
	})
}

func (h *ExportHandler) GetTask(c *fiber.Ctx) error {
	taskID, err := ParseUUIDParam(c, "id")
	if err != nil {
		return HandleError(c, err)
	}

	task := h.exportService.GetTask(taskID)
	if task == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"code":    "TASK_NOT_FOUND",
			"message": "任务不存在",
		})
	}

	return c.JSON(task)
}

func (h *ExportHandler) GetMyTasks(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(uuid.UUID)
	tasks := h.exportService.GetTasksByUser(userID)
	return c.JSON(tasks)
}
