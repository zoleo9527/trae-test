package handler

import (
	"github.com/cultural-store/inspection-service/internal/middleware"
	"github.com/cultural-store/inspection-service/internal/model"
	"github.com/cultural-store/inspection-service/internal/service"
	"github.com/gofiber/fiber/v2"
)

type TransferHandler struct {
	svc *service.Service
}

func NewTransferHandler(svc *service.Service) *TransferHandler {
	return &TransferHandler{svc: svc}
}

func (h *TransferHandler) List(c *fiber.Ctx) error {
	f := middleware.GetFilter(c)
	result, err := h.svc.ListTransferOrders(f)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(result)
}

func (h *TransferHandler) Create(c *fiber.Ctx) error {
	var req model.CreateTransferRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	if req.FromStoreID == "" || req.ToStoreID == "" || len(req.Items) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "from_store_id, to_store_id and items required"})
	}
	operatorID := c.Locals("user_id").(string)
	operatorName := c.Locals("display_name").(string)
	o, err := h.svc.CreateTransferOrder(req, operatorID, operatorName)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(o)
}

func (h *TransferHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	o, err := h.svc.GetTransferOrder(id)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "order not found"})
	}
	return c.JSON(o)
}

func (h *TransferHandler) UpdateStatus(c *fiber.Ctx) error {
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
	if err := h.svc.UpdateTransferOrderStatus(id, req.Status, operatorID, operatorName); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "status updated"})
}

func (h *TransferHandler) ListItems(c *fiber.Ctx) error {
	id := c.Params("id")
	items, err := h.svc.GetTransferItems(id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(items)
}
