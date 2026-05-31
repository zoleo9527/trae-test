package handler

import (
	"watch-after-sales/backend/dto"
	"watch-after-sales/backend/service"

	"github.com/gofiber/fiber/v2"
)

type CallbackHandler struct {
	callbackService *service.CallbackService
}

func NewCallbackHandler(callbackService *service.CallbackService) *CallbackHandler {
	return &CallbackHandler{callbackService: callbackService}
}

func (h *CallbackHandler) Create(c *fiber.Ctx) error {
	var req dto.CreateCallbackRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"code": 400, "message": "invalid request body", "type": "validation"})
	}

	if req.RepairOrderID == 0 || req.CallbackType == "" || req.ScheduledAt == "" {
		return c.Status(400).JSON(fiber.Map{"code": 400, "message": "repair_order_id, callback_type and scheduled_at are required", "type": "validation"})
	}

	operatorID := c.Locals("user_id").(uint)
	operatorName := c.Locals("display_name").(string)

	resp, appErr := h.callbackService.Create(req, operatorID, operatorName)
	if appErr != nil {
		return c.Status(appErr.Code).JSON(appErr)
	}

	return c.Status(201).JSON(resp)
}

func (h *CallbackHandler) List(c *fiber.Ctx) error {
	page := c.QueryInt("page", 1)
	pageSize := c.QueryInt("page_size", 20)

	resp, appErr := h.callbackService.List(page, pageSize)
	if appErr != nil {
		return c.Status(appErr.Code).JSON(appErr)
	}

	return c.JSON(resp)
}

func (h *CallbackHandler) Complete(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"code": 400, "message": "invalid id", "type": "validation"})
	}

	var req dto.CompleteCallbackRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"code": 400, "message": "invalid request body", "type": "validation"})
	}

	if req.Result == "" {
		return c.Status(400).JSON(fiber.Map{"code": 400, "message": "result is required", "type": "validation"})
	}

	operatorID := c.Locals("user_id").(uint)
	operatorName := c.Locals("display_name").(string)

	resp, appErr := h.callbackService.Complete(uint(id), req, operatorID, operatorName)
	if appErr != nil {
		return c.Status(appErr.Code).JSON(appErr)
	}

	return c.JSON(resp)
}

func (h *CallbackHandler) GetOverdue(c *fiber.Ctx) error {
	resp, appErr := h.callbackService.GetOverdue()
	if appErr != nil {
		return c.Status(appErr.Code).JSON(appErr)
	}

	return c.JSON(resp)
}
