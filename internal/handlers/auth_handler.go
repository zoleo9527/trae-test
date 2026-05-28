package handlers

import (
	"net/http"

	"github.com/gofiber/fiber/v2"
	"water-delivery-service/internal/middleware"
	"water-delivery-service/internal/services"
	"water-delivery-service/pkg/dto"
)

type AuthHandler struct {
	authService *services.AuthService
}

func NewAuthHandler() *AuthHandler {
	return &AuthHandler{
		authService: services.NewAuthService(),
	}
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req dto.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	resp, err := h.authService.Login(&req)
	if err != nil {
		return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(resp)
}

func (h *AuthHandler) Me(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
			"error": "User not authenticated",
		})
	}

	return c.JSON(fiber.Map{
		"user": dto.UserInfo{
			ID:        user.UserID,
			Username:  user.Username,
			Role:      user.Role,
			StationID: user.StationID,
		},
	})
}
