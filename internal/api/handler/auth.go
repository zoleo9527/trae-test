package handler

import (
	"camp-management/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req service.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"code":    "INVALID_REQUEST",
			"message": "请求参数错误",
		})
	}

	ip := c.IP()
	userAgent := c.Get("User-Agent")

	result, err := h.authService.Login(req, ip, userAgent)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(result)
}

func (h *AuthHandler) Me(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(uuid.UUID)
	user, err := h.authService.GetUserByID(userID)
	if err != nil {
		return HandleError(c, err)
	}
	return c.JSON(user)
}
