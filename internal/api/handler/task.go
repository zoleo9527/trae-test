package handler

import (
	"camp-management/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type TaskHandler struct {
	services *service.Services
}

func NewTaskHandler(services *service.Services) *TaskHandler {
	return &TaskHandler{services: services}
}

func (h *TaskHandler) Get(c *fiber.Ctx) error {
	taskID, err := ParseUUIDParam(c, "id")
	if err != nil {
		return HandleError(c, err)
	}

	task := h.services.Export.GetTask(taskID)
	if task == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"code":    "TASK_NOT_FOUND",
			"message": "任务不存在",
		})
	}

	return c.JSON(task)
}

func (h *TaskHandler) GetMyTasks(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(uuid.UUID)
	tasks := h.services.Export.GetTasksByUser(userID)
	return c.JSON(tasks)
}
