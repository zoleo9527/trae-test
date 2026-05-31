package handler

import (
	"floor-settlement/internal/dto"
	"floor-settlement/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type AsyncTaskHandler struct {
	service *service.AsyncTaskService
}

func NewAsyncTaskHandler(s *service.AsyncTaskService) *AsyncTaskHandler {
	return &AsyncTaskHandler{service: s}
}

func (h *AsyncTaskHandler) GetByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	result, err := h.service.GetTask(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"data": result})
}
