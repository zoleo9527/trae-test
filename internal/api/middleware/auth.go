package middleware

import (
	"camp-management/internal/service"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type AuthMiddleware struct {
	jwtSecret string
	authService *service.AuthService
}

func NewAuthMiddleware(jwtSecret string) *AuthMiddleware {
	return &AuthMiddleware{jwtSecret: jwtSecret}
}

func (m *AuthMiddleware) SetAuthService(authService *service.AuthService) {
	m.authService = authService
}

type ContextKey string

const (
	UserIDKey   ContextKey = "user_id"
	UserRoleKey ContextKey = "user_role"
	UserKey     ContextKey = "user"
)

func (m *AuthMiddleware) AuthRequired() fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"code":    "MISSING_TOKEN",
				"message": "缺少认证令牌",
			})
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"code":    "INVALID_TOKEN_FORMAT",
				"message": "令牌格式错误",
			})
		}

		tokenString := parts[1]

		token, err := jwt.ParseWithClaims(tokenString, &service.JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fiber.NewError(fiber.StatusUnauthorized, "无效的签名方法")
			}
			return []byte(m.jwtSecret), nil
		})

		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"code":    "INVALID_TOKEN",
				"message": "无效的令牌",
			})
		}

		if claims, ok := token.Claims.(*service.JWTClaims); ok && token.Valid {
			c.Locals(string(UserIDKey), claims.UserID)
			c.Locals(string(UserRoleKey), claims.Role)

			if m.authService != nil {
				user, err := m.authService.GetUserByID(claims.UserID)
				if err == nil {
					c.Locals(string(UserKey), user)
				}
			}

			return c.Next()
		}

		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"code":    "INVALID_TOKEN",
			"message": "无效的令牌",
		})
	}
}

func (m *AuthMiddleware) RequireRole(roles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userRole, ok := c.Locals(string(UserRoleKey)).(string)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"code":    "UNAUTHORIZED",
				"message": "未授权访问",
			})
		}

		for _, role := range roles {
			if userRole == role {
				return c.Next()
			}
		}

		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"code":    "FORBIDDEN",
			"message": "权限不足",
		})
	}
}

func GetUserID(c *fiber.Ctx) uuid.UUID {
	if userID, ok := c.Locals(string(UserIDKey)).(uuid.UUID); ok {
		return userID
	}
	return uuid.Nil
}

func GetUser(c *fiber.Ctx) *service.JWTClaims {
	return nil
}
