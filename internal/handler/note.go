package handler

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"

	"swimclub/internal/auth"
	"swimclub/internal/dto"
	"swimclub/internal/model"
)

func (h *Handler) CreateNote(c *fiber.Ctx) error {
	var req dto.CreateNoteReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad request"})
	}
	if req.Target == "" || req.TargetID == 0 || req.Content == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "target/target_id/content required"})
	}
	var id int64
	err := h.DB.QueryRowContext(h.ctx(),
		`INSERT INTO notes(target,target_id,author_id,content) VALUES($1,$2,$3,$4) RETURNING id`,
		req.Target, req.TargetID, auth.Current(c).UserID, req.Content).Scan(&id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	_ = h.Audit.Record(h.ctx(), "note", id, "create", nil,
		map[string]any{"target": req.Target, "target_id": req.TargetID, "content": req.Content},
		auth.Current(c).UserID, auth.Current(c).Name)
	return c.JSON(fiber.Map{"id": id})
}

func (h *Handler) ListNotes(c *fiber.Ctx) error {
	target := c.Query("target", "")
	targetID := c.QueryInt("target_id", 0)
	sql := `SELECT n.id, n.target, n.target_id, n.author_id, n.content, n.created_at, u.display_name
		FROM notes n JOIN users u ON u.id = n.author_id WHERE 1=1`
	args := []any{}
	i := 1
	if target != "" {
		sql += fmt.Sprintf(" AND n.target = $%d", i); args = append(args, target); i++
	}
	if targetID != 0 {
		sql += fmt.Sprintf(" AND n.target_id = $%d", i); args = append(args, targetID); i++
	}
	sql += " ORDER BY n.created_at DESC LIMIT 100"
	rows, err := h.DB.QueryContext(h.ctx(), sql, args...)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var (
			n        model.Note
			authorName string
		)
		if err := rows.Scan(&n.ID, &n.Target, &n.TargetID, &n.AuthorID, &n.Content, &n.CreatedAt, &authorName); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		out = append(out, map[string]any{"id": n.ID, "target": n.Target, "target_id": n.TargetID, "author_id": n.AuthorID, "author_name": authorName, "content": n.Content, "created_at": n.CreatedAt})
	}
	return c.JSON(out)
}

func (h *Handler) ListAudit(c *fiber.Ctx) error {
	entType := c.Query("entity_type", "")
	entID := c.QueryInt("entity_id", 0)
	limit := c.QueryInt("limit", 50)
	offset := c.QueryInt("offset", 0)
	logs, err := h.Audit.List(h.ctx(), entType, int64(entID), limit, offset)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(logs)
}

func (h *Handler) enqueue(kind string, targetID int64, payload string) {
	_, _ = h.DB.ExecContext(h.ctx(),
		`INSERT INTO notification_jobs(kind, target_id, payload, next_run_at) VALUES($1,$2,$3,$4)`,
		kind, targetID, payload, time.Now().UTC().Add(5*time.Second))
}
