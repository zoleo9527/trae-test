package middleware

import (
	"gallery-system/config"
	"gallery-system/utils"
	"strings"

	"github.com/gofiber/fiber/v2"
)

type contextKey string

const (
	UserContextKey contextKey = "user"
)

func AuthRequired(cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return utils.JSONError(c, fiber.StatusUnauthorized, "未授权", "缺少Authorization头")
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return utils.JSONError(c, fiber.StatusUnauthorized, "未授权", "Authorization格式错误")
		}

		claims, err := utils.ParseToken(cfg, parts[1])
		if err != nil {
			return utils.JSONError(c, fiber.StatusUnauthorized, "未授权", "Token无效或已过期")
		}

		c.Locals(UserContextKey, claims)
		return c.Next()
	}
}

func RoleRequired(roles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		claims := c.Locals(UserContextKey).(*utils.Claims)
		if claims == nil {
			return utils.JSONError(c, fiber.StatusUnauthorized, "未授权", "用户未登录")
		}

		for _, role := range roles {
			if claims.Role == role {
				return c.Next()
			}
		}

		return utils.JSONError(c, fiber.StatusForbidden, "权限不足", "该操作需要特定角色权限")
	}
}

func GetCurrentUser(c *fiber.Ctx) *utils.Claims {
	claims, ok := c.Locals(UserContextKey).(*utils.Claims)
	if !ok {
		return nil
	}
	return claims
}
