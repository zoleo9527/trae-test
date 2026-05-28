package handler

import (
	"instrument-rental/middleware"
	"instrument-rental/service"

	"github.com/gofiber/fiber/v2"
)

type BatchHandler struct {
	svc *service.BatchService
}

func NewBatchHandler() *BatchHandler {
	return &BatchHandler{svc: service.NewBatchService()}
}

func (h *BatchHandler) UpdateRentals(c *fiber.Ctx) error {
	input := struct {
		IDs     []uint         `json:"ids"`
		Updates map[string]any `json:"updates"`
	}{}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	userID := middleware.GetUserID(c)
	result := h.svc.BatchUpdateRentals(input.IDs, input.Updates, userID, c.IP())
	return c.JSON(result)
}

func (h *BatchHandler) UpdatePayments(c *fiber.Ctx) error {
	input := struct {
		IDs     []uint         `json:"ids"`
		Updates map[string]any `json:"updates"`
	}{}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	userID := middleware.GetUserID(c)
	result := h.svc.BatchUpdatePayments(input.IDs, input.Updates, userID, c.IP())
	return c.JSON(result)
}

func (h *BatchHandler) UpdateSchools(c *fiber.Ctx) error {
	input := struct {
		IDs     []uint         `json:"ids"`
		Updates map[string]any `json:"updates"`
	}{}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	userID := middleware.GetUserID(c)
	result := h.svc.BatchUpdateSchools(input.IDs, input.Updates, userID, c.IP())
	return c.JSON(result)
}

func (h *BatchHandler) CreatePayments(c *fiber.Ctx) error {
	input := struct {
		Payments []service.CreatePaymentInput `json:"payments"`
	}{}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	userID := middleware.GetUserID(c)
	result := h.svc.BatchCreatePayments(input.Payments, userID, c.IP())
	return c.JSON(result)
}
