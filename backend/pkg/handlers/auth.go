package handlers

import (
	"github.com/gofiber/fiber/v2"
	"golf-range/pkg/database"
	"golf-range/pkg/middleware"
	"golf-range/pkg/models"
)

func Login(c *fiber.Ctx) error {
	var req models.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "请求格式错误"})
	}

	var user models.User
	result := database.DB.Where("username = ? AND password = ?", req.Username, req.Password).First(&user)
	if result.Error != nil {
		return c.Status(401).JSON(fiber.Map{"error": "用户名或密码错误"})
	}

	token := middleware.GenerateToken(&user)

	return c.JSON(models.AuthResponse{
		Token: token,
		User:  user,
	})
}

func GetCurrentUser(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		return c.Status(401).JSON(fiber.Map{"error": "未授权"})
	}

	var dbUser models.User
	result := database.DB.Where("id = ?", user.ID).First(&dbUser)
	if result.Error != nil {
		return c.Status(404).JSON(fiber.Map{"error": "用户不存在"})
	}

	return c.JSON(dbUser)
}

func ListUsers(c *fiber.Ctx) error {
	var users []models.User
	result := database.DB.Find(&users)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "查询失败"})
	}
	return c.JSON(users)
}
