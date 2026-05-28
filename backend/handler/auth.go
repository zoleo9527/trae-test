package handler

import (
	"instrument-rental/config"
	"instrument-rental/middleware"
	"instrument-rental/service"

	"github.com/gofiber/fiber/v2"
)

type AuthHandler struct {
	svc *service.AuthService
}

func NewAuthHandler(cfg *config.Config) *AuthHandler {
	return &AuthHandler{svc: service.NewAuthService(cfg)}
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	input := &service.LoginInput{}
	if err := c.BodyParser(input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	if input.Username == "" || input.Password == "" {
		return c.Status(400).JSON(fiber.Map{"error": "username and password required"})
	}
	resp, err := h.svc.Login(input)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "invalid credentials"})
	}
	return c.JSON(resp)
}

func (h *AuthHandler) Register(c *fiber.Ctx) error {
	input := &service.RegisterInput{}
	if err := c.BodyParser(input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	if input.Username == "" || input.Password == "" || input.Name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "username, password and name required"})
	}
	if input.Role == "" {
		input.Role = "consultant"
	}
	user, err := h.svc.Register(input)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "registration failed: " + err.Error()})
	}
	return c.Status(201).JSON(user)
}

func (h *AuthHandler) Me(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	user, err := h.svc.GetCurrentUser(userID)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "user not found"})
	}
	return c.JSON(user)
}
