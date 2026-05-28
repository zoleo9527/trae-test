package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"water-delivery-service/internal/utils"
	"water-delivery-service/pkg/types"
)

type contextKey string

const (
	UserContextKey contextKey = "user"
)

func AuthMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Authorization header is required",
			})
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid authorization header format",
			})
		}

		claims, err := utils.ParseJWT(parts[1])
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid or expired token",
			})
		}

		c.Locals(UserContextKey, claims)
		return c.Next()
	}
}

func RoleMiddleware(allowedRoles ...types.Role) fiber.Handler {
	return func(c *fiber.Ctx) error {
		claims, ok := c.Locals(UserContextKey).(*utils.JWTClaims)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "User not authenticated",
			})
		}

		for _, role := range allowedRoles {
			if claims.Role == role {
				return c.Next()
			}
		}

		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Insufficient permissions",
		})
	}
}

func GetCurrentUser(c *fiber.Ctx) *utils.JWTClaims {
	claims, ok := c.Locals(UserContextKey).(*utils.JWTClaims)
	if !ok {
		return nil
	}
	return claims
}

func StationScoped(c *fiber.Ctx, stationID *uuid.UUID) bool {
	claims := GetCurrentUser(c)
	if claims == nil {
		return false
	}

	if claims.Role == types.RoleAdmin {
		return true
	}

	if claims.StationID != nil && stationID != nil && *claims.StationID == *stationID {
		return true
	}

	return false
}
