package middleware

import (
	"instrument-rental/model"

	"github.com/gofiber/fiber/v2"
)

func RequireRole(roles ...model.Role) fiber.Handler {
	roleSet := make(map[model.Role]bool, len(roles))
	for _, r := range roles {
		roleSet[r] = true
	}
	return func(c *fiber.Ctx) error {
		roleStr := GetRole(c)
		role := model.Role(roleStr)
		if !roleSet[role] {
			return c.Status(403).JSON(fiber.Map{"error": "insufficient permissions"})
		}
		return c.Next()
	}
}
