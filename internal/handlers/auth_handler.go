package handlers

import (
	"runner-platform/internal/models"
	"runner-platform/internal/schemas"
	"runner-platform/internal/services"
	"runner-platform/internal/utils"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

type AuthHandler struct {
	authService *services.AuthService
	validate    *validator.Validate
}

func NewAuthHandler() *AuthHandler {
	return &AuthHandler{
		authService: services.NewAuthService(),
		validate:    validator.New(),
	}
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req schemas.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationError(c, "Invalid request body")
	}

	if err := h.validate.Struct(req); err != nil {
		return utils.ValidationError(c, err.Error())
	}

	resp, err := h.authService.Login(&req)
	if err != nil {
		return utils.Error(c, 1001, err.Error())
	}

	return utils.Success(c, resp)
}

func (h *AuthHandler) GetCurrentUser(c *fiber.Ctx) error {
	claims := utils.GetCurrentUser(c)
	if claims == nil {
		return utils.Unauthorized(c, "User not authenticated")
	}

	user, err := h.authService.GetUserByID(claims.UserID)
	if err != nil {
		return utils.Error(c, 1002, "User not found")
	}

	return utils.Success(c, &schemas.UserInfo{
		ID:       user.ID.String(),
		Username: user.Username,
		RealName: user.RealName,
		Role:     string(user.Role),
		Email:    user.Email,
		Phone:    user.Phone,
	})
}

func (h *AuthHandler) ChangePassword(c *fiber.Ctx) error {
	claims := utils.GetCurrentUser(c)
	if claims == nil {
		return utils.Unauthorized(c, "User not authenticated")
	}

	var req schemas.ChangePasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationError(c, "Invalid request body")
	}

	if err := h.validate.Struct(req); err != nil {
		return utils.ValidationError(c, err.Error())
	}

	if err := h.authService.ChangePassword(claims.UserID, &req); err != nil {
		return utils.Error(c, 1003, err.Error())
	}

	return utils.Success(c, map[string]string{"message": "Password changed successfully"})
}

func (h *AuthHandler) GetUsersByRole(c *fiber.Ctx) error {
	role := c.Params("role")
	if role == "" {
		return utils.ValidationError(c, "Role parameter is required")
	}

	users, err := h.authService.GetUsersByRole(models.Role(role))
	if err != nil {
		return utils.Error(c, 1004, err.Error())
	}

	return utils.Success(c, users)
}
