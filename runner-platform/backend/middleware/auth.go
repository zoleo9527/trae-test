package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
)

func AuthMiddleware(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(401).JSON(fiber.Map{"error": "未授权"})
	}

	token := strings.TrimPrefix(authHeader, "Bearer ")
	parts := strings.Split(token, "|")
	if len(parts) != 2 {
		return c.Status(401).JSON(fiber.Map{"error": "无效的token格式"})
	}

	userID := parts[0]
	role := parts[1]

	c.Locals("userID", userID)
	c.Locals("userRole", role)

	return c.Next()
}

func RequireRole(roles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userRole := c.Locals("userRole")
		if userRole == nil {
			return c.Status(401).JSON(fiber.Map{"error": "未授权"})
		}

		roleStr := userRole.(string)
		for _, role := range roles {
			if role == roleStr {
				return c.Next()
			}
		}

		return c.Status(403).JSON(fiber.Map{"error": "权限不足"})
	}
}
