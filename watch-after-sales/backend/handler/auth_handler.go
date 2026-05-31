package handler

import (
	"watch-after-sales/backend/dto"
	"watch-after-sales/backend/service"

	"github.com/gofiber/fiber/v2"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req dto.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"code": 400, "message": "invalid request body", "type": "validation"})
	}

	if req.Username == "" || req.Password == "" {
		return c.Status(400).JSON(fiber.Map{"code": 400, "message": "username and password are required", "type": "validation"})
	}

	resp, appErr := h.authService.Login(req.Username, req.Password)
	if appErr != nil {
		return c.Status(appErr.Code).JSON(appErr)
	}

	return c.JSON(resp)
}
