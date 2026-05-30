package middleware

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"golf-range/pkg/database"
	"golf-range/pkg/models"
)

type UserContext struct {
	ID   uuid.UUID    `json:"id"`
	Name string       `json:"name"`
	Role models.Role  `json:"role"`
}

func AuthRequired(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(401).JSON(fiber.Map{"error": "未授权访问"})
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return c.Status(401).JSON(fiber.Map{"error": "授权格式错误"})
	}

	token := parts[1]
	user, err := parseToken(token)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "无效的令牌"})
	}

	c.Locals("user", user)
	return c.Next()
}

func parseToken(token string) (*UserContext, error) {
	decoded, err := base64.StdEncoding.DecodeString(token)
	if err != nil {
		return nil, err
	}

	var user UserContext
	err = json.Unmarshal(decoded, &user)
	if err != nil {
		return nil, err
	}

	var dbUser models.User
	result := database.DB.Where("id = ?", user.ID).First(&dbUser)
	if result.Error != nil {
		return nil, errors.New("用户不存在")
	}

	return &user, nil
}

func GetCurrentUser(c *fiber.Ctx) *UserContext {
	user, ok := c.Locals("user").(*UserContext)
	if !ok {
		return nil
	}
	return user
}

func ErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	var e *fiber.Error
	if errors.As(err, &e) {
		code = e.Code
	}

	return c.Status(code).JSON(fiber.Map{
		"error":   err.Error(),
		"code":    code,
		"success": false,
	})
}

func GenerateToken(user *models.User) string {
	ctx := UserContext{
		ID:   user.ID,
		Name: user.Name,
		Role: user.Role,
	}
	data, _ := json.Marshal(ctx)
	return base64.StdEncoding.EncodeToString(data)
}

func RequireRole(roles ...models.Role) fiber.Handler {
	return func(c *fiber.Ctx) error {
		user := GetCurrentUser(c)
		if user == nil {
			return c.Status(401).JSON(fiber.Map{"error": "未授权"})
		}

		for _, role := range roles {
			if user.Role == role {
				return c.Next()
			}
		}

		return c.Status(403).JSON(fiber.Map{"error": "权限不足"})
	}
}

func CreateAuditLog(c *fiber.Ctx, action string, entityType string, entityID uuid.UUID, oldValue string, newValue string, bookingID *uuid.UUID, memberID *uuid.UUID) {
	user := GetCurrentUser(c)
	if user == nil {
		return
	}

	log := models.AuditLog{
		BookingID:  bookingID,
		MemberID:   memberID,
		UserID:     user.ID,
		UserName:   user.Name,
		Action:     action,
		EntityType: entityType,
		EntityID:   entityID,
		OldValue:   oldValue,
		NewValue:   newValue,
		IpAddress:  c.IP(),
		CreatedAt:  time.Now(),
	}
	database.DB.Create(&log)
}
