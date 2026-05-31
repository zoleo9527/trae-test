package middleware

import (
	"watch-after-sales/backend/model"

	"github.com/gofiber/fiber/v2"
)

func RequireRole(roles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userRole := c.Locals("role").(string)

		for _, role := range roles {
			if userRole == role {
				return c.Next()
			}
		}

		allowedRoles := make([]model.Role, len(roles))
		for i, r := range roles {
			allowedRoles[i] = model.Role(r)
		}

		return c.Status(403).JSON(fiber.Map{
			"code":    403,
			"message": "insufficient permissions",
			"type":    "forbidden",
		})
	}
}
