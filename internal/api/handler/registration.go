package handler

import (
	"camp-management/internal/repository"
	"camp-management/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type RegistrationHandler struct {
	registrationService *service.RegistrationService
	authService         *service.AuthService
}

func NewRegistrationHandler(registrationService *service.RegistrationService, authService *service.AuthService) *RegistrationHandler {
	return &RegistrationHandler{registrationService: registrationService, authService: authService}
}

func (h *RegistrationHandler) Create(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(uuid.UUID)

	var req service.CreateRegistrationRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"code":    "INVALID_REQUEST",
			"message": "请求参数错误",
		})
	}

	reg, err := h.registrationService.Create(req, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return c.Status(fiber.StatusCreated).JSON(reg)
}

func (h *RegistrationHandler) Get(c *fiber.Ctx) error {
	id, err := ParseUUIDParam(c, "id")
	if err != nil {
		return HandleError(c, err)
	}

	reg, err := h.registrationService.GetByID(id)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(reg)
}

func (h *RegistrationHandler) GetByCampID(c *fiber.Ctx) error {
	campID, err := ParseUUIDParam(c, "campId")
	if err != nil {
		return HandleError(c, err)
	}

	regs, _, err := h.registrationService.GetByCampID(campID, repository.QueryOptions{Limit: 100})
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(regs)
}

func (h *RegistrationHandler) Confirm(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(uuid.UUID)
	id, err := ParseUUIDParam(c, "id")
	if err != nil {
		return HandleError(c, err)
	}

	reg, err := h.registrationService.Confirm(id, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(reg)
}

func (h *RegistrationHandler) MarkPaid(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(uuid.UUID)
	id, err := ParseUUIDParam(c, "id")
	if err != nil {
		return HandleError(c, err)
	}

	var req struct {
		Amount float64 `json:"amount" validate:"required"`
		Method string  `json:"method" validate:"required"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"code":    "INVALID_REQUEST",
			"message": "请求参数错误",
		})
	}

	reg, err := h.registrationService.MarkPaid(id, req.Amount, req.Method, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(reg)
}

func (h *RegistrationHandler) Cancel(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(uuid.UUID)
	id, err := ParseUUIDParam(c, "id")
	if err != nil {
		return HandleError(c, err)
	}

	reg, err := h.registrationService.Cancel(id, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(reg)
}
