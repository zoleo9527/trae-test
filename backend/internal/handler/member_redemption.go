package handler

import (
	"github.com/cultural-store/inspection-service/internal/middleware"
	"github.com/cultural-store/inspection-service/internal/model"
	"github.com/cultural-store/inspection-service/internal/service"
	"github.com/gofiber/fiber/v2"
)

type RedemptionHandler struct {
	svc *service.Service
}

func NewRedemptionHandler(svc *service.Service) *RedemptionHandler {
	return &RedemptionHandler{svc: svc}
}

func (h *RedemptionHandler) List(c *fiber.Ctx) error {
	f := middleware.GetFilter(c)
	result, err := h.svc.ListMemberRedemptions(f)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(result)
}

func (h *RedemptionHandler) Create(c *fiber.Ctx) error {
	var req model.CreateRedemptionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	if req.MemberPhone == "" || req.ProductID == "" || req.StoreID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "member_phone, product_id and store_id required"})
	}
	operatorID := c.Locals("user_id").(string)
	operatorName := c.Locals("display_name").(string)
	mr, err := h.svc.CreateMemberRedemption(req, operatorID, operatorName)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(mr)
}

func (h *RedemptionHandler) Fulfill(c *fiber.Ctx) error {
	id := c.Params("id")
	var req model.FulfillRedemptionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	if req.Status == "" {
		return c.Status(400).JSON(fiber.Map{"error": "status required"})
	}
	operatorID := c.Locals("user_id").(string)
	operatorName := c.Locals("display_name").(string)
	if err := h.svc.FulfillMemberRedemption(id, req.Status, operatorID, operatorName); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "redemption updated"})
}
