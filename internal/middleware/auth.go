package middleware

import (
	"runner-platform/internal/models"
	"runner-platform/internal/utils"
	"strings"

	"github.com/gofiber/fiber/v2"
)

func AuthMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return utils.Unauthorized(c, "Authorization header required")
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return utils.Unauthorized(c, "Invalid authorization format")
		}

		claims, err := utils.ParseToken(parts[1])
		if err != nil {
			return utils.Unauthorized(c, "Invalid or expired token")
		}

		c.Locals("user", claims)
		return c.Next()
	}
}

func RoleMiddleware(allowedRoles ...models.Role) fiber.Handler {
	return func(c *fiber.Ctx) error {
		claims := utils.GetCurrentUser(c)
		if claims == nil {
			return utils.Unauthorized(c, "User not authenticated")
		}

		for _, role := range allowedRoles {
			if claims.Role == role {
				return c.Next()
			}
		}

		return utils.Forbidden(c, "Insufficient permissions")
	}
}

func RequireAnyOf(roles ...models.Role) fiber.Handler {
	return RoleMiddleware(roles...)
}

func RequireAdmin() fiber.Handler {
	return RoleMiddleware(models.RoleAdmin)
}

func RequireOpsManager() fiber.Handler {
	return RoleMiddleware(models.RoleAdmin, models.RoleOpsManager)
}

func RequireDispatcher() fiber.Handler {
	return RoleMiddleware(models.RoleAdmin, models.RoleOpsManager, models.RoleDispatcher)
}

func RequireCustomerService() fiber.Handler {
	return RoleMiddleware(models.RoleAdmin, models.RoleOpsManager, models.RoleCustomerService)
}
