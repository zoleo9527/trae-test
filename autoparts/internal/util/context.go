package util

import (
	"autoparts/internal/model"

	"github.com/gofiber/fiber/v2"
)

type ContextKey string

const (
	UserContextKey ContextKey = "user"
)

func SetUserToContext(c *fiber.Ctx, user *model.User) {
	c.Locals(string(UserContextKey), user)
}

func GetUserFromContext(c *fiber.Ctx) *model.User {
	if user, ok := c.Locals(string(UserContextKey)).(*model.User); ok {
		return user
	}
	return nil
}

func GetUserIDFromContext(c *fiber.Ctx) uint {
	if user := GetUserFromContext(c); user != nil {
		return user.ID
	}
	return 0
}

func GetUserRoleFromContext(c *fiber.Ctx) model.Role {
	if user := GetUserFromContext(c); user != nil {
		return user.Role
	}
	return ""
}
