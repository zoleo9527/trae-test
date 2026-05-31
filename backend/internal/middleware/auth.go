package middleware

import (
	"floor-settlement/internal/dto"
	"floor-settlement/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

func JWTAuth(authService *service.AuthService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		token := c.Get("Authorization")
		if len(token) > 7 && token[:7] == "Bearer " {
			token = token[7:]
		} else {
			return c.Status(401).JSON(fiber.Map{"error": "missing or invalid token"})
		}

		claims, err := authService.ValidateToken(token)
		if err != nil {
			return c.Status(401).JSON(fiber.Map{"error": "invalid token", "detail": err.Error()})
		}

		user, err := authService.GetUserFromClaims(claims)
		if err != nil {
			return c.Status(401).JSON(fiber.Map{"error": "invalid claims"})
		}

		c.Locals("user", user)
		c.Locals("claims", claims)
		return c.Next()
	}
}

func RoleRequired(roles ...string) fiber.Handler {
	allowed := make(map[string]bool, len(roles))
	for _, r := range roles {
		allowed[r] = true
	}
	return func(c *fiber.Ctx) error {
		user, ok := c.Locals("user").(*dto.UserSummary)
		if !ok || user == nil {
			return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
		}
		if !allowed[user.Role] {
			return c.Status(403).JSON(fiber.Map{"error": "forbidden", "role": user.Role})
		}
		return c.Next()
	}
}

func ProjectScope() fiber.Handler {
	return func(c *fiber.Ctx) error {
		user, ok := c.Locals("user").(*dto.UserSummary)
		if !ok || user == nil {
			return c.Next()
		}
		if user.ProjectID != nil {
			c.Locals("scoped_project_id", user.ProjectID.String())
		}
		if user.TeamID != nil {
			c.Locals("scoped_team_id", user.TeamID.String())
		}
		return c.Next()
	}
}

func OptionalAuth(authService *service.AuthService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		token := c.Get("Authorization")
		if len(token) > 7 && token[:7] == "Bearer " {
			token = token[7:]
			claims, err := authService.ValidateToken(token)
			if err == nil {
				user, err := authService.GetUserFromClaims(claims)
				if err == nil {
					c.Locals("user", user)
					c.Locals("claims", claims)
				}
			}
		}
		return c.Next()
	}
}

func GetUserID(c *fiber.Ctx) uuid.UUID {
	user, ok := c.Locals("user").(*dto.UserSummary)
	if !ok || user == nil {
		return uuid.Nil
	}
	return user.ID
}

func GetUserRole(c *fiber.Ctx) string {
	user, ok := c.Locals("user").(*dto.UserSummary)
	if !ok || user == nil {
		return ""
	}
	return user.Role
}
