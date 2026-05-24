package handlers

import (
	"jewelry-store-system/config"
	"jewelry-store-system/middleware"
	"jewelry-store-system/models"
	"jewelry-store-system/utils"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type AuthHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewAuthHandler(db *gorm.DB, cfg *config.Config) *AuthHandler {
	return &AuthHandler{db: db, cfg: cfg}
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
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	var user models.User
	if err := h.db.Where("username = ?", req.Username).First(&user).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, "Invalid username or password")
	}

	if !middleware.CheckPasswordHash(req.Password, user.Password) {
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, "Invalid username or password")
	}

	token, err := middleware.GenerateToken(&user, h.cfg)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to generate token")
	}

	return utils.SuccessResponse(c, LoginResponse{
		Token: token,
		User:  &user,
	})
}

func (h *AuthHandler) Me(c *fiber.Ctx) error {
	userID, _, _ := middleware.GetCurrentUser(c)

	var user models.User
	if err := h.db.First(&user, userID).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "User not found")
	}

	return utils.SuccessResponse(c, user)
}
