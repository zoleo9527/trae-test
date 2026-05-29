package handler

import (
	"github.com/cultural-store/inspection-service/internal/middleware"
	"github.com/cultural-store/inspection-service/internal/model"
	"github.com/cultural-store/inspection-service/internal/service"
	"github.com/gofiber/fiber/v2"
)

type ReplenishmentHandler struct {
	svc *service.Service
}

func NewReplenishmentHandler(svc *service.Service) *ReplenishmentHandler {
	return &ReplenishmentHandler{svc: svc}
}

func (h *ReplenishmentHandler) List(c *fiber.Ctx) error {
	f := middleware.GetFilter(c)
	result, err := h.svc.ListReplenishmentOrders(f)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(result)
}

func (h *ReplenishmentHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	o, err := h.svc.GetReplenishmentOrder(id)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "order not found"})
	}
	return c.JSON(o)
}

func (h *ReplenishmentHandler) Create(c *fiber.Ctx) error {
	var req model.CreateReplenishmentRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	if req.StoreID == "" || len(req.Items) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "store_id and items required"})
	}
	operatorID := c.Locals("user_id").(string)
	operatorName := c.Locals("display_name").(string)
	o, err := h.svc.CreateReplenishmentOrder(req, operatorID, operatorName)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(o)
}

func (h *ReplenishmentHandler) UpdateStatus(c *fiber.Ctx) error {
	id := c.Params("id")
	var req model.UpdateReplenishmentStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	if req.Status == "" {
		return c.Status(400).JSON(fiber.Map{"error": "status required"})
	}
	operatorID := c.Locals("user_id").(string)
	operatorName := c.Locals("display_name").(string)
	if err := h.svc.UpdateReplenishmentOrderStatus(id, req.Status, operatorID, operatorName); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "status updated"})
}

func (h *ReplenishmentHandler) ListItems(c *fiber.Ctx) error {
	id := c.Params("id")
	items, err := h.svc.GetReplenishmentItems(id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(items)
}
