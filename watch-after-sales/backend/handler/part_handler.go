package handler

import (
	"watch-after-sales/backend/dto"
	"watch-after-sales/backend/service"

	"github.com/gofiber/fiber/v2"
)

type PartHandler struct {
	partService *service.PartService
}

func NewPartHandler(partService *service.PartService) *PartHandler {
	return &PartHandler{partService: partService}
}

func (h *PartHandler) Create(c *fiber.Ctx) error {
	var req dto.CreatePartRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"code": 400, "message": "invalid request body", "type": "validation"})
	}

	if req.Name == "" || req.Sku == "" {
		return c.Status(400).JSON(fiber.Map{"code": 400, "message": "name and sku are required", "type": "validation"})
	}

	operatorID := c.Locals("user_id").(uint)
	operatorName := c.Locals("display_name").(string)

	resp, appErr := h.partService.Create(req, operatorID, operatorName)
	if appErr != nil {
		return c.Status(appErr.Code).JSON(appErr)
	}

	return c.Status(201).JSON(resp)
}

func (h *PartHandler) List(c *fiber.Ctx) error {
	page := c.QueryInt("page", 1)
	pageSize := c.QueryInt("page_size", 20)

	resp, appErr := h.partService.List(page, pageSize)
	if appErr != nil {
		return c.Status(appErr.Code).JSON(appErr)
	}

	return c.JSON(resp)
}

func (h *PartHandler) GetByID(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"code": 400, "message": "invalid id", "type": "validation"})
	}

	resp, appErr := h.partService.GetByID(uint(id))
	if appErr != nil {
		return c.Status(appErr.Code).JSON(appErr)
	}

	return c.JSON(resp)
}

func (h *PartHandler) Update(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"code": 400, "message": "invalid id", "type": "validation"})
	}

	var req dto.UpdatePartRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"code": 400, "message": "invalid request body", "type": "validation"})
	}

	operatorID := c.Locals("user_id").(uint)
	operatorName := c.Locals("display_name").(string)

	resp, appErr := h.partService.Update(uint(id), req, operatorID, operatorName)
	if appErr != nil {
		return c.Status(appErr.Code).JSON(appErr)
	}

	return c.JSON(resp)
}

func (h *PartHandler) LockPart(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"code": 400, "message": "invalid id", "type": "validation"})
	}

	var req dto.LockPartRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"code": 400, "message": "invalid request body", "type": "validation"})
	}

	if req.PartID == 0 || req.Quantity <= 0 {
		return c.Status(400).JSON(fiber.Map{"code": 400, "message": "part_id and quantity (>0) are required", "type": "validation"})
	}

	operatorID := c.Locals("user_id").(uint)
	operatorName := c.Locals("display_name").(string)

	resp, appErr := h.partService.LockPart(uint(id), req, operatorID, operatorName)
	if appErr != nil {
		return c.Status(appErr.Code).JSON(appErr)
	}

	return c.Status(201).JSON(resp)
}

func (h *PartHandler) UnlockPart(c *fiber.Ctx) error {
	repairID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"code": 400, "message": "invalid repair order id", "type": "validation"})
	}

	lockID, err := c.ParamsInt("lockId")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"code": 400, "message": "invalid lock id", "type": "validation"})
	}

	operatorID := c.Locals("user_id").(uint)
	operatorName := c.Locals("display_name").(string)

	appErr := h.partService.UnlockPart(uint(repairID), uint(lockID), operatorID, operatorName)
	if appErr != nil {
		return c.Status(appErr.Code).JSON(appErr)
	}

	return c.JSON(fiber.Map{"message": "part lock released"})
}
