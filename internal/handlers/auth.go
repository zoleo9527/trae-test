package handlers

import (
	"exhibition-system/internal/database"
	"exhibition-system/internal/middleware"
	"exhibition-system/internal/models"
	"exhibition-system/internal/services"

	"github.com/gofiber/fiber/v2"
)

type AuthHandler struct {
	auditService *services.AuditService
}

func NewAuthHandler() *AuthHandler {
	return &AuthHandler{
		auditService: services.NewAuditService(),
	}
}

type LoginRequest struct {
	Username string `json:"username" validate:"required"`
	Password string `json:"password" validate:"required"`
}

type LoginResponse struct {
	Token string      `json:"token"`
	User  *models.User `json:"user"`
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	var user models.User
	if err := database.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid credentials",
		})
	}

	if !user.Active {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Account is disabled",
		})
	}

	if !user.CheckPassword(req.Password) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid credentials",
		})
	}

	token, err := middleware.GenerateToken(&user)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate token",
		})
	}

	h.auditService.Log(
		user.ID,
		models.ActionLogin,
		models.ResourceUser,
		user.ID,
		nil,
		nil,
		nil,
		"User logged in",
		c.IP(),
		c.Get("User-Agent"),
	)

	return c.JSON(LoginResponse{
		Token: token,
		User:  &user,
	})
}

func (h *AuthHandler) GetCurrentUser(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	return c.JSON(user)
}

func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)

	h.auditService.Log(
		userID,
		models.ActionLogout,
		models.ResourceUser,
		userID,
		nil,
		nil,
		nil,
		"User logged out",
		c.IP(),
		c.Get("User-Agent"),
	)

	return c.JSON(fiber.Map{
		"message": "Logged out successfully",
	})
}
