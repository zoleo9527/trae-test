package handlers

import (
	"camp-server/internal/middleware"
	"camp-server/internal/models"

	"github.com/gofiber/fiber/v2"
)

type LoginRequest struct {
	Username string `json:"username"`
}

func Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	var user models.User
	if err := models.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	return c.JSON(fiber.Map{
		"token": user.ID.String(),
		"user":  user,
	})
}

func GetCurrentUser(c *fiber.Ctx) error {
	userCtx := c.Locals("user").(*middleware.UserContext)
	var fullUser models.User
	if err := models.DB.First(&fullUser, "id = ?", userCtx.ID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User not found",
		})
	}
	return c.JSON(fullUser)
}

func ListUsers(c *fiber.Ctx) error {
	var users []models.User
	if err := models.DB.Find(&users).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(users)
}
