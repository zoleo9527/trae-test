package handler

import (
	"floor-settlement/internal/dto"
	"floor-settlement/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ReworkHandler struct {
	service *service.ReworkService
}

func NewReworkHandler(s *service.ReworkService) *ReworkHandler {
	return &ReworkHandler{service: s}
}

func (h *ReworkHandler) Create(c *fiber.Ctx) error {
	var req dto.ReworkCreate
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	result, err := h.service.Create(c, &req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"data": result})
}

func (h *ReworkHandler) GetByID(c *fiber.Ctx) error {
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

func (h *ReworkHandler) UpdateStatus(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	var req dto.ReworkStatusUpdate
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	result, err := h.service.UpdateStatus(c, id, &req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"data": result})
}

func (h *ReworkHandler) Filter(c *fiber.Ctx) error {
	var filter dto.ReworkFilter
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

func (h *ReworkHandler) ByInspection(c *fiber.Ctx) error {
	inspectionIDStr := c.Params("inspection_id")
	if inspectionIDStr == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "inspection_id is required"})
	}

	inspectionID, err := uuid.Parse(inspectionIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	records, err := h.service.FindByQualityInspection(inspectionID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"data": records})
}
