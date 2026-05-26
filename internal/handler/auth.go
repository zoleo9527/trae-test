package handler

import (
	"context"
	"database/sql"
	"time"

	"github.com/gofiber/fiber/v2"

	"swimclub/internal/audit"
	"swimclub/internal/auth"
	"swimclub/internal/dto"
	"swimclub/internal/model"
)

type Handler struct {
	DB    *sql.DB
	Audit *audit.Logger
}

func (h *Handler) ctx() context.Context { return context.Background() }

func (h *Handler) Me(c *fiber.Ctx) error {
	cl := auth.Current(c)
	return c.JSON(fiber.Map{"id": cl.UserID, "role": cl.Role, "name": cl.Name})
}

func (h *Handler) Login(c *fiber.Ctx) error {
	var req dto.LoginReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad request"})
	}
	var u model.User
	err := h.DB.QueryRowContext(h.ctx(),
		`SELECT id, username, password_hash, role, display_name, created_at FROM users WHERE username=$1`,
		req.Username).Scan(&u.ID, &u.Username, &u.PasswordHash, &u.Role, &u.DisplayName, &u.CreatedAt)
	if err != nil || !auth.CheckPassword(u.PasswordHash, req.Password) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid credentials"})
	}
	secret := c.Locals("jwt_secret").([]byte)
	expire := c.Locals("jwt_expire").(time.Duration)
	tok, exp, err := auth.Sign(secret, u.ID, string(u.Role), u.DisplayName, expire)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(dto.LoginResp{Token: tok, ExpiresAt: exp, User: u})
}

func (h *Handler) CreateUser(c *fiber.Ctx) error {
	var req dto.CreateUserReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad request"})
	}
	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	var id int64
	err = h.DB.QueryRowContext(h.ctx(),
		`INSERT INTO users(username,password_hash,role,display_name) VALUES($1,$2,$3,$4) RETURNING id`,
		req.Username, hash, string(req.Role), req.DisplayName).Scan(&id)
	if err != nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "username taken"})
	}
	_ = h.Audit.Record(h.ctx(), "user", id, "create", nil,
		map[string]any{"username": req.Username, "role": string(req.Role), "display_name": req.DisplayName},
		auth.Current(c).UserID, auth.Current(c).Name)
	return c.JSON(fiber.Map{"id": id})
}

func (h *Handler) ListUsers(c *fiber.Ctx) error {
	rows, err := h.DB.QueryContext(h.ctx(), `SELECT id, username, role, display_name, created_at FROM users ORDER BY id`)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()
	out := []model.User{}
	for rows.Next() {
		var u model.User
		if err := rows.Scan(&u.ID, &u.Username, &u.Role, &u.DisplayName, &u.CreatedAt); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		out = append(out, u)
	}
	return c.JSON(out)
}
