package handler

import (
	"watch-after-sales/backend/dto"
	"watch-after-sales/backend/service"

	"github.com/gofiber/fiber/v2"
)

type CustomerHandler struct {
	customerService *service.CustomerService
	auditService    *service.AuditService
}

func NewCustomerHandler(customerService *service.CustomerService, auditService *service.AuditService) *CustomerHandler {
	return &CustomerHandler{customerService: customerService, auditService: auditService}
}

func (h *CustomerHandler) List(c *fiber.Ctx) error {
	resp, appErr := h.customerService.List()
	if appErr != nil {
		return c.Status(appErr.Code).JSON(appErr)
	}
	return c.JSON(resp)
}

func (h *CustomerHandler) GetByID(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"code": 400, "message": "invalid id", "type": "validation"})
	}

	resp, appErr := h.customerService.GetByID(uint(id))
	if appErr != nil {
		return c.Status(appErr.Code).JSON(appErr)
	}
	return c.JSON(resp)
}

func (h *CustomerHandler) Create(c *fiber.Ctx) error {
	var req dto.CreateCustomerRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"code": 400, "message": "invalid request body", "type": "validation"})
	}

	if req.Name == "" || req.Phone == "" {
		return c.Status(400).JSON(fiber.Map{"code": 400, "message": "name and phone are required", "type": "validation"})
	}

	operatorID := c.Locals("user_id").(uint)
	operatorName := c.Locals("display_name").(string)

	resp, appErr := h.customerService.Create(req, operatorID, operatorName, h.auditService)
	if appErr != nil {
		return c.Status(appErr.Code).JSON(appErr)
	}

	return c.Status(201).JSON(resp)
}
