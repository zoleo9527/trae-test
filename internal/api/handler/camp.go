package handler

import (
	"camp-management/internal/model"
	"camp-management/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type CampHandler struct {
	campService *service.CampService
	authService *service.AuthService
}

func NewCampHandler(campService *service.CampService, authService *service.AuthService) *CampHandler {
	return &CampHandler{campService: campService, authService: authService}
}

func (h *CampHandler) Create(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(uuid.UUID)

	var req service.CreateCampRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"code":    "INVALID_REQUEST",
			"message": "请求参数错误",
		})
	}

	camp, err := h.campService.Create(req, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return c.Status(fiber.StatusCreated).JSON(camp)
}

func (h *CampHandler) List(c *fiber.Ctx) error {
	statusStr := c.Query("status")
	var status *model.CampStatus
	if statusStr != "" {
		s := model.CampStatus(statusStr)
		status = &s
	}

	camps, err := h.campService.List(status)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(camps)
}

func (h *CampHandler) Get(c *fiber.Ctx) error {
	id, err := ParseUUIDParam(c, "id")
	if err != nil {
		return HandleError(c, err)
	}

	camp, err := h.campService.GetByID(id)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(camp)
}

func (h *CampHandler) UpdateStatus(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(uuid.UUID)
	id, err := ParseUUIDParam(c, "id")
	if err != nil {
		return HandleError(c, err)
	}

	var req struct {
		Status model.CampStatus `json:"status" validate:"required"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"code":    "INVALID_REQUEST",
			"message": "请求参数错误",
		})
	}

	camp, err := h.campService.UpdateStatus(id, req.Status, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(camp)
}
