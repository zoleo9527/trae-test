package middleware

import (
	"strings"

	"autoparts/internal/config"
	"autoparts/internal/model"
	"autoparts/internal/util"
	apperrors "autoparts/pkg/errors"

	"github.com/gofiber/fiber/v2"
)

func AuthRequired() fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return util.Error(c, fiber.StatusUnauthorized, string(apperrors.ErrCodeUnauthorized), "缺少授权令牌", nil)
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return util.Error(c, fiber.StatusUnauthorized, string(apperrors.ErrCodeUnauthorized), "授权令牌格式错误", nil)
		}

		claims, err := util.ParseToken(parts[1], config.AppConfigInstance.JWT.Secret)
		if err != nil {
			return util.Error(c, fiber.StatusUnauthorized, string(apperrors.ErrCodeUnauthorized), "无效的授权令牌", nil)
		}

		var user model.User
		if err := config.DB.First(&user, claims.UserID).Error; err != nil {
			return util.Error(c, fiber.StatusUnauthorized, string(apperrors.ErrCodeUnauthorized), "用户不存在", nil)
		}

		if !user.IsActive {
			return util.Error(c, fiber.StatusForbidden, string(apperrors.ErrCodeForbidden), "用户已被禁用", nil)
		}

		util.SetUserToContext(c, &user)
		return c.Next()
	}
}

func RoleRequired(roles ...model.Role) fiber.Handler {
	return func(c *fiber.Ctx) error {
		user := util.GetUserFromContext(c)
		if user == nil {
			return util.Error(c, fiber.StatusUnauthorized, string(apperrors.ErrCodeUnauthorized), "未授权访问", nil)
		}

		for _, role := range roles {
			if user.HasPermission(role) {
				return c.Next()
			}
		}

		return util.Error(c, fiber.StatusForbidden, string(apperrors.ErrCodeForbidden), "权限不足", nil)
	}
}

func SalesRequired() fiber.Handler {
	return RoleRequired(model.RoleSales, model.RoleOwner)
}

func WarehouseRequired() fiber.Handler {
	return RoleRequired(model.RoleWarehouse, model.RoleOwner)
}

func OwnerRequired() fiber.Handler {
	return RoleRequired(model.RoleOwner)
}

func AdminRequired() fiber.Handler {
	return RoleRequired(model.RoleAdmin)
}
