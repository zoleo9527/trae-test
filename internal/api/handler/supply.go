package handler

import (
	"camp-management/internal/model"
	"camp-management/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type SupplyHandler struct {
	supplyService *service.SupplyService
	authService   *service.AuthService
}

func NewSupplyHandler(supplyService *service.SupplyService, authService *service.AuthService) *SupplyHandler {
	return &SupplyHandler{supplyService: supplyService, authService: authService}
}

func (h *SupplyHandler) Create(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(uuid.UUID)

	var req service.CreateSupplyRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"code":    "INVALID_REQUEST",
			"message": "请求参数错误",
		})
	}

	request, err := h.supplyService.Create(req, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return c.Status(fiber.StatusCreated).JSON(request)
}

func (h *SupplyHandler) Get(c *fiber.Ctx) error {
	id, err := ParseUUIDParam(c, "id")
	if err != nil {
		return HandleError(c, err)
	}

	request, err := h.supplyService.GetByID(id)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(request)
}

func (h *SupplyHandler) GetByCampID(c *fiber.Ctx) error {
	campID, err := ParseUUIDParam(c, "campId")
	if err != nil {
		return HandleError(c, err)
	}

	statusStr := c.Query("status")
	var status *model.SupplyStatus
	if statusStr != "" {
		s := model.SupplyStatus(statusStr)
		status = &s
	}

	requests, err := h.supplyService.GetByCampID(campID, status)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(requests)
}

func (h *SupplyHandler) Approve(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(uuid.UUID)
	id, err := ParseUUIDParam(c, "id")
	if err != nil {
		return HandleError(c, err)
	}

	var req struct {
		Remark string `json:"remark"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"code":    "INVALID_REQUEST",
			"message": "请求参数错误",
		})
	}

	request, err := h.supplyService.Approve(id, req.Remark, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(request)
}

func (h *SupplyHandler) Reject(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(uuid.UUID)
	id, err := ParseUUIDParam(c, "id")
	if err != nil {
		return HandleError(c, err)
	}

	var req struct {
		Remark string `json:"remark" validate:"required"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"code":    "INVALID_REQUEST",
			"message": "请求参数错误",
		})
	}

	request, err := h.supplyService.Reject(id, req.Remark, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(request)
}

func (h *SupplyHandler) Issue(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(uuid.UUID)
	id, err := ParseUUIDParam(c, "id")
	if err != nil {
		return HandleError(c, err)
	}

	request, err := h.supplyService.Issue(id, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(request)
}
