package handler

import (
	"strconv"

	"watch-after-sales/backend/dto"
	"watch-after-sales/backend/service"

	"github.com/gofiber/fiber/v2"
)

type RepairHandler struct {
	repairService *service.RepairService
}

func NewRepairHandler(repairService *service.RepairService) *RepairHandler {
	return &RepairHandler{repairService: repairService}
}

func (h *RepairHandler) Create(c *fiber.Ctx) error {
	var req dto.CreateRepairOrderRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"code": 400, "message": "invalid request body", "type": "validation"})
	}

	if req.CustomerID == 0 || req.WatchBrand == "" || req.WatchModel == "" || req.IssueDescription == "" {
		return c.Status(400).JSON(fiber.Map{"code": 400, "message": "customer_id, watch_brand, watch_model and issue_description are required", "type": "validation"})
	}

	operatorID := c.Locals("user_id").(uint)
	operatorName := c.Locals("display_name").(string)

	resp, appErr := h.repairService.Create(req, operatorID, operatorName)
	if appErr != nil {
		return c.Status(appErr.Code).JSON(appErr)
	}

	return c.Status(201).JSON(resp)
}

func (h *RepairHandler) List(c *fiber.Ctx) error {
	filter := dto.RepairFilterRequest{
		Status:              c.Query("status"),
		WatchBrand:          c.Query("watch_brand"),
		Keyword:             c.Query("keyword"),
		DateFrom:            c.Query("date_from"),
		DateTo:              c.Query("date_to"),
		Page:                c.QueryInt("page", 1),
		PageSize:            c.QueryInt("page_size", 20),
	}

	if aid := c.Query("assigned_technician_id"); aid != "" {
		if id, err := strconv.ParseUint(aid, 10, 32); err == nil {
			uid := uint(id)
			filter.AssignedTechnicianID = &uid
		}
	}
	if cid := c.Query("customer_id"); cid != "" {
		if id, err := strconv.ParseUint(cid, 10, 32); err == nil {
			uid := uint(id)
			filter.CustomerID = &uid
		}
	}

	resp, appErr := h.repairService.List(filter)
	if appErr != nil {
		return c.Status(appErr.Code).JSON(appErr)
	}

	return c.JSON(resp)
}

func (h *RepairHandler) GetByID(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"code": 400, "message": "invalid id", "type": "validation"})
	}

	resp, appErr := h.repairService.GetByID(uint(id))
	if appErr != nil {
		return c.Status(appErr.Code).JSON(appErr)
	}

	return c.JSON(resp)
}

func (h *RepairHandler) Update(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"code": 400, "message": "invalid id", "type": "validation"})
	}

	var req dto.UpdateRepairOrderRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"code": 400, "message": "invalid request body", "type": "validation"})
	}

	operatorID := c.Locals("user_id").(uint)
	operatorName := c.Locals("display_name").(string)

	resp, appErr := h.repairService.Update(uint(id), req, operatorID, operatorName)
	if appErr != nil {
		return c.Status(appErr.Code).JSON(appErr)
	}

	return c.JSON(resp)
}

func (h *RepairHandler) ChangeStatus(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"code": 400, "message": "invalid id", "type": "validation"})
	}

	var req dto.StatusChangeRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"code": 400, "message": "invalid request body", "type": "validation"})
	}

	if req.Status == "" {
		return c.Status(400).JSON(fiber.Map{"code": 400, "message": "status is required", "type": "validation"})
	}

	operatorID := c.Locals("user_id").(uint)
	operatorName := c.Locals("display_name").(string)
	operatorRole := c.Locals("role").(string)

	resp, appErr := h.repairService.ChangeStatus(uint(id), req, operatorID, operatorName, operatorRole)
	if appErr != nil {
		return c.Status(appErr.Code).JSON(appErr)
	}

	return c.JSON(resp)
}

func (h *RepairHandler) BatchStatusChange(c *fiber.Ctx) error {
	var req dto.BatchStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"code": 400, "message": "invalid request body", "type": "validation"})
	}

	if len(req.OrderIDs) == 0 || req.Status == "" {
		return c.Status(400).JSON(fiber.Map{"code": 400, "message": "order_ids and status are required", "type": "validation"})
	}

	operatorID := c.Locals("user_id").(uint)
	operatorName := c.Locals("display_name").(string)
	operatorRole := c.Locals("role").(string)

	appErr := h.repairService.BatchStatusChange(req, operatorID, operatorName, operatorRole)
	if appErr != nil {
		return c.Status(appErr.Code).JSON(appErr)
	}

	return c.JSON(fiber.Map{"message": "batch status update successful"})
}
