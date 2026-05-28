package handler

import (
	"instrument-rental/middleware"
	"instrument-rental/service"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type PaymentHandler struct {
	svc *service.PaymentService
}

func NewPaymentHandler() *PaymentHandler {
	return &PaymentHandler{svc: service.NewPaymentService()}
}

func (h *PaymentHandler) List(c *fiber.Ctx) error {
	page := service.ParseUintOrDefault(c.Query("page", "1"), 1)
	pageSize := service.ParseUintOrDefault(c.Query("page_size", "20"), 20)
	schoolID := service.ParseUintOrDefault(c.Query("school_id"), 0)
	payments, total, err := h.svc.List(
		schoolID,
		c.Query("status"),
		c.Query("start_date"),
		c.Query("end_date"),
		int(page), int(pageSize),
	)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": payments, "total": total, "page": page, "page_size": pageSize})
}

func (h *PaymentHandler) Get(c *fiber.Ctx) error {
	id, _ := strconv.ParseUint(c.Params("id"), 10, 32)
	payment, err := h.svc.GetByID(uint(id))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "payment not found"})
	}
	return c.JSON(payment)
}

func (h *PaymentHandler) Create(c *fiber.Ctx) error {
	input := &service.CreatePaymentInput{}
	if err := c.BodyParser(input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	userID := middleware.GetUserID(c)
	payment, err := h.svc.Create(input, userID, c.IP())
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(payment)
}

func (h *PaymentHandler) Update(c *fiber.Ctx) error {
	id, _ := strconv.ParseUint(c.Params("id"), 10, 32)
	updates := make(map[string]any)
	if err := c.BodyParser(&updates); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	userID := middleware.GetUserID(c)
	if err := h.svc.Update(uint(id), updates, userID, c.IP()); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "updated"})
}

func (h *PaymentHandler) RecordPayment(c *fiber.Ctx) error {
	id, _ := strconv.ParseUint(c.Params("id"), 10, 32)
	input := struct {
		PaidAmount    float64 `json:"paid_amount"`
		PaymentMethod string  `json:"payment_method"`
	}{}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	userID := middleware.GetUserID(c)
	if err := h.svc.RecordPayment(uint(id), input.PaidAmount, input.PaymentMethod, userID, c.IP()); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "payment recorded"})
}

func (h *PaymentHandler) BatchUpdate(c *fiber.Ctx) error {
	input := &service.BatchUpdatePaymentInput{}
	if err := c.BodyParser(input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	userID := middleware.GetUserID(c)
	count, err := h.svc.BatchUpdate(input, userID, c.IP())
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"updated": count})
}
