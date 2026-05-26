package auth

import (
	"errors"
	"tea-distribution/internal/config"
	"tea-distribution/internal/models"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type Claims struct {
	UserID   uuid.UUID `json:"user_id"`
	Username string    `json:"username"`
	Name     string    `json:"name"`
	Role     string    `json:"role"`
	jwt.RegisteredClaims
}

func GenerateToken(user *models.User) (string, error) {
	expirationTime := time.Now().Add(time.Duration(config.AppConfig.JWTExpireHours) * time.Hour)
	claims := &Claims{
		UserID:   user.ID,
		Username: user.Username,
		Name:     user.Name,
		Role:     user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "tea-distribution",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.AppConfig.JWTSecret))
}

func ParseToken(tokenString string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(config.AppConfig.JWTSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

func JWTMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"code":    "UNAUTHORIZED",
				"message": "未提供认证令牌",
			})
		}

		if len(authHeader) < 7 || authHeader[:7] != "Bearer " {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"code":    "UNAUTHORIZED",
				"message": "认证令牌格式错误",
			})
		}

		tokenString := authHeader[7:]
		claims, err := ParseToken(tokenString)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"code":    "UNAUTHORIZED",
				"message": "认证令牌无效或已过期",
			})
		}

		c.Locals("user", claims)
		return c.Next()
	}
}

func GetCurrentUser(c *fiber.Ctx) *Claims {
	user, ok := c.Locals("user").(*Claims)
	if !ok {
		return nil
	}
	return user
}

func RequireRoles(roles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		user := GetCurrentUser(c)
		if user == nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"code":    "UNAUTHORIZED",
				"message": "未登录",
			})
		}

		for _, role := range roles {
			if user.Role == role {
				return c.Next()
			}
		}

		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"code":    "PERMISSION_DENIED",
			"message": "权限不足",
			"details": fiber.Map{
				"required_roles": roles,
				"current_role":   user.Role,
			},
		})
	}
}

func RequireManager() fiber.Handler {
	return RequireRoles(models.RoleManager)
}

func RequireSalesOrManager() fiber.Handler {
	return RequireRoles(models.RoleSales, models.RoleManager)
}

func RequireWarehouseOrManager() fiber.Handler {
	return RequireRoles(models.RoleWarehouse, models.RoleManager)
}
