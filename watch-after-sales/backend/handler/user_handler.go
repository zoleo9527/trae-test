package handler

import (
	"watch-after-sales/backend/service"

	"github.com/gofiber/fiber/v2"
)

type UserHandler struct {
	userService *service.UserService
}

func NewUserHandler(userService *service.UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

func (h *UserHandler) List(c *fiber.Ctx) error {
	resp, appErr := h.userService.List()
	if appErr != nil {
		return c.Status(appErr.Code).JSON(appErr)
	}
	return c.JSON(resp)
}

func (h *UserHandler) GetByID(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"code": 400, "message": "invalid id", "type": "validation"})
	}

	resp, appErr := h.userService.GetByID(uint(id))
	if appErr != nil {
		return c.Status(appErr.Code).JSON(appErr)
	}
	return c.JSON(resp)
}
