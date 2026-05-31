package handler

import (
	"floor-settlement/internal/dto"
	"floor-settlement/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ChangeOrderHandler struct {
	service *service.ChangeOrderService
}

func NewChangeOrderHandler(s *service.ChangeOrderService) *ChangeOrderHandler {
	return &ChangeOrderHandler{service: s}
}

func (h *ChangeOrderHandler) Create(c *fiber.Ctx) error {
	var req dto.ChangeOrderCreate
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	result, err := h.service.Create(c, &req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"data": result})
}

func (h *ChangeOrderHandler) GetByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	result, err := h.service.FindByID(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"data": result})
}

func (h *ChangeOrderHandler) Confirm(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	var req dto.ChangeOrderConfirm
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	result, err := h.service.Confirm(c, id, &req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"data": result})
}

func (h *ChangeOrderHandler) Filter(c *fiber.Ctx) error {
	var filter dto.ChangeOrderFilter
	if err := c.QueryParser(&filter); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	records, total, err := h.service.Filter(c, &filter)
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
