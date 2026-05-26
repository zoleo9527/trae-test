package handler

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"

	"swimclub/internal/auth"
	"swimclub/internal/dto"
	"swimclub/internal/model"
)

func (h *Handler) CreateMember(c *fiber.Ctx) error {
	var req dto.CreateMemberReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad request"})
	}
	if req.MembershipEnd.IsZero() {
		req.MembershipEnd = time.Now().Add(365 * 24 * time.Hour)
	}
	var id int64
	err := h.DB.QueryRowContext(h.ctx(),
		`INSERT INTO members(name,phone,membership_end,balance,courses_total,courses_used,user_id)
		 VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
		req.Name, req.Phone, req.MembershipEnd, req.Balance, req.CoursesTotal, req.CoursesUsed, req.UserID).Scan(&id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	_ = h.Audit.Record(h.ctx(), "member", id, "create", nil,
		map[string]any{"name": req.Name, "phone": req.Phone, "membership_end": req.MembershipEnd},
		auth.Current(c).UserID, auth.Current(c).Name)
	return c.JSON(fiber.Map{"id": id})
}

func (h *Handler) ListMembers(c *fiber.Ctx) error {
	var q dto.ListQuery
	_ = c.QueryParser(&q)
	sql := `SELECT id, user_id, name, phone, membership_end, balance, courses_total, courses_used, status, created_at FROM members WHERE 1=1`
	args := []any{}
	i := 1
	if q.Q != "" {
		sql += fmt.Sprintf(" AND (name ILIKE $%d OR phone ILIKE $%d)", i, i+1)
		args = append(args, "%"+q.Q+"%", "%"+q.Q+"%")
		i += 2
	}
	if q.Status != "" {
		sql += fmt.Sprintf(" AND status = $%d", i)
		args = append(args, q.Status)
		i++
	}
	sql += " ORDER BY id DESC"
	if q.Limit <= 0 {
		q.Limit = 50
	}
	sql += fmt.Sprintf(" LIMIT $%d", i)
	args = append(args, q.Limit)

	rows, err := h.DB.QueryContext(h.ctx(), sql, args...)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()
	out := []model.Member{}
	for rows.Next() {
		var m model.Member
		if err := rows.Scan(&m.ID, &m.UserID, &m.Name, &m.Phone, &m.MembershipEnd, &m.Balance, &m.CoursesTotal, &m.CoursesUsed, &m.Status, &m.CreatedAt); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		out = append(out, m)
	}
	return c.JSON(out)
}

func (h *Handler) GetMember(c *fiber.Ctx) error {
	id := c.ParamsInt("id", 0)
	var m model.Member
	err := h.DB.QueryRowContext(h.ctx(),
		`SELECT id, user_id, name, phone, membership_end, balance, courses_total, courses_used, status, created_at FROM members WHERE id=$1`, id).
		Scan(&m.ID, &m.UserID, &m.Name, &m.Phone, &m.MembershipEnd, &m.Balance, &m.CoursesTotal, &m.CoursesUsed, &m.Status, &m.CreatedAt)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "not found"})
	}
	return c.JSON(m)
}

func (h *Handler) PatchMember(c *fiber.Ctx) error {
	id := c.ParamsInt("id", 0)
	var req struct {
		Name          *string    `json:"name"`
		Phone         *string    `json:"phone"`
		MembershipEnd *time.Time `json:"membership_end"`
		Balance       *int64     `json:"balance"`
		CoursesTotal  *int       `json:"courses_total"`
		CoursesUsed   *int       `json:"courses_used"`
		Status        *string    `json:"status"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad request"})
	}
	var old model.Member
	err := h.DB.QueryRowContext(h.ctx(),
		`SELECT id, user_id, name, phone, membership_end, balance, courses_total, courses_used, status, created_at FROM members WHERE id=$1`, id).
		Scan(&old.ID, &old.UserID, &old.Name, &old.Phone, &old.MembershipEnd, &old.Balance, &old.CoursesTotal, &old.CoursesUsed, &old.Status, &old.CreatedAt)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "not found"})
	}
	updates := ""
	args := []any{}
	i := 1
	if req.Name != nil {
		updates += fmt.Sprintf(" name = $%d,", i); args = append(args, *req.Name); i++
	}
	if req.Phone != nil {
		updates += fmt.Sprintf(" phone = $%d,", i); args = append(args, *req.Phone); i++
	}
	if req.MembershipEnd != nil {
		updates += fmt.Sprintf(" membership_end = $%d,", i); args = append(args, *req.MembershipEnd); i++
	}
	if req.Balance != nil {
		updates += fmt.Sprintf(" balance = $%d,", i); args = append(args, *req.Balance); i++
	}
	if req.CoursesTotal != nil {
		updates += fmt.Sprintf(" courses_total = $%d,", i); args = append(args, *req.CoursesTotal); i++
	}
	if req.CoursesUsed != nil {
		updates += fmt.Sprintf(" courses_used = $%d,", i); args = append(args, *req.CoursesUsed); i++
	}
	if req.Status != nil {
		updates += fmt.Sprintf(" status = $%d,", i); args = append(args, *req.Status); i++
	}
	if updates == "" {
		return c.JSON(fiber.Map{"ok": true})
	}
	updates = updates[:len(updates)-1]
	args = append(args, id)
	q := fmt.Sprintf("UPDATE members SET %s WHERE id = $%d", updates, i)
	if _, err := h.DB.ExecContext(h.ctx(), q, args...); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	oldM := map[string]any{"name": old.Name, "phone": old.Phone, "membership_end": old.MembershipEnd, "balance": old.Balance, "courses_total": old.CoursesTotal, "courses_used": old.CoursesUsed, "status": old.Status}
	newM := map[string]any{}
	if req.Name != nil { newM["name"] = *req.Name }
	if req.Phone != nil { newM["phone"] = *req.Phone }
	if req.MembershipEnd != nil { newM["membership_end"] = *req.MembershipEnd }
	if req.Balance != nil { newM["balance"] = *req.Balance }
	if req.CoursesTotal != nil { newM["courses_total"] = *req.CoursesTotal }
	if req.CoursesUsed != nil { newM["courses_used"] = *req.CoursesUsed }
	if req.Status != nil { newM["status"] = *req.Status }
	_ = h.Audit.Record(h.ctx(), "member", int64(id), "update", oldM, newM, auth.Current(c).UserID, auth.Current(c).Name)
	return c.JSON(fiber.Map{"ok": true})
}
