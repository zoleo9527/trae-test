package handler

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"

	"swimclub/internal/auth"
	"swimclub/internal/dto"
	"swimclub/internal/model"
)

func (h *Handler) CreateRenewal(c *fiber.Ctx) error {
	var req dto.CreateRenewalReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad request"})
	}
	if req.Channel == "" {
		req.Channel = "sms"
	}
	var id int64
	err := h.DB.QueryRowContext(h.ctx(),
		`INSERT INTO renewal_reminders(member_id,expire_at,channel,status,assigned_to) VALUES($1,$2,$3,'open',$4) RETURNING id`,
		req.MemberID, req.ExpireAt, req.Channel, req.AssignedTo).Scan(&id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	_ = h.Audit.Record(h.ctx(), "renewal", id, "create", nil,
		map[string]any{"member_id": req.MemberID, "expire_at": req.ExpireAt, "channel": req.Channel, "assigned_to": req.AssignedTo},
		auth.Current(c).UserID, auth.Current(c).Name)
	h.enqueue("renewal_created", id, fmt.Sprintf(`{"member_id":%d,"id":%d}`, req.MemberID, id))
	return c.JSON(fiber.Map{"id": id})
}

func (h *Handler) ListRenewals(c *fiber.Ctx) error {
	var q dto.ListQuery
	_ = c.QueryParser(&q)
	sql := `SELECT id, member_id, expire_at, channel, status, assigned_to, note, noticed_by, noticed_at, closed_reason, created_at, updated_at
		FROM renewal_reminders WHERE 1=1`
	args := []any{}
	i := 1
	if q.MemberID != 0 {
		sql += fmt.Sprintf(" AND member_id = $%d", i); args = append(args, q.MemberID); i++
	}
	if q.Status != "" {
		sql += fmt.Sprintf(" AND status = $%d", i); args = append(args, q.Status); i++
	}
	if q.Assigned != 0 {
		sql += fmt.Sprintf(" AND assigned_to = $%d", i); args = append(args, q.Assigned); i++
	}
	if q.Channel != "" {
		sql += fmt.Sprintf(" AND channel = $%d", i); args = append(args, q.Channel); i++
	}
	sql += " ORDER BY expire_at ASC"
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
	out := []model.RenewalReminder{}
	for rows.Next() {
		var r model.RenewalReminder
		if err := rows.Scan(&r.ID, &r.MemberID, &r.ExpireAt, &r.Channel, &r.Status, &r.AssignedTo, &r.Note, &r.NoticedBy, &r.NoticedAt, &r.ClosedReason, &r.CreatedAt, &r.UpdatedAt); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		out = append(out, r)
	}
	return c.JSON(out)
}

func (h *Handler) GetRenewal(c *fiber.Ctx) error {
	id := c.ParamsInt("id", 0)
	var r model.RenewalReminder
	err := h.DB.QueryRowContext(h.ctx(),
		`SELECT id, member_id, expire_at, channel, status, assigned_to, note, noticed_by, noticed_at, closed_reason, created_at, updated_at
		 FROM renewal_reminders WHERE id=$1`, id).
		Scan(&r.ID, &r.MemberID, &r.ExpireAt, &r.Channel, &r.Status, &r.AssignedTo, &r.Note, &r.NoticedBy, &r.NoticedAt, &r.ClosedReason, &r.CreatedAt, &r.UpdatedAt)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "not found"})
	}
	return c.JSON(r)
}

func (h *Handler) UpdateRenewal(c *fiber.Ctx) error {
	id := c.ParamsInt("id", 0)
	var req dto.UpdateRenewalReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad request"})
	}
	var old model.RenewalReminder
	err := h.DB.QueryRowContext(h.ctx(),
		`SELECT id, member_id, expire_at, channel, status, assigned_to, note, noticed_by, noticed_at, closed_reason, created_at, updated_at
		 FROM renewal_reminders WHERE id=$1`, id).
		Scan(&old.ID, &old.MemberID, &old.ExpireAt, &old.Channel, &old.Status, &old.AssignedTo, &old.Note, &old.NoticedBy, &old.NoticedAt, &old.ClosedReason, &old.CreatedAt, &old.UpdatedAt)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "not found"})
	}

	updates := ""
	args := []any{}
	i := 1
	if req.AssignedTo != nil {
		updates += fmt.Sprintf(" assigned_to = $%d,", i); args = append(args, *req.AssignedTo); i++
	}
	if req.Note != nil {
		updates += fmt.Sprintf(" note = $%d,", i); args = append(args, *req.Note); i++
	}
	if req.ClosedReason != nil {
		updates += fmt.Sprintf(" closed_reason = $%d,", i); args = append(args, *req.ClosedReason); i++
	}
	if req.Status != "" && req.Status != old.Status {
		updates += fmt.Sprintf(" status = $%d,", i); args = append(args, string(req.Status)); i++
		if req.Status == model.RenewalNoticed || req.Status == model.RenewalPaid || req.Status == model.RenewalClosed {
			updates += fmt.Sprintf(" noticed_by = $%d, noticed_at = $%d,", i, i+1)
			args = append(args, auth.Current(c).UserID, time.Now().UTC())
			i += 2
		}
	}
	if updates == "" {
		return c.JSON(fiber.Map{"ok": true})
	}
	updates += fmt.Sprintf(" updated_at = $%d", i)
	args = append(args, time.Now().UTC())
	i++
	args = append(args, id)
	q := fmt.Sprintf("UPDATE renewal_reminders SET %s WHERE id = $%d", updates, i)
	if _, err := h.DB.ExecContext(h.ctx(), q, args...); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	oldM := map[string]any{"status": old.Status, "assigned_to": old.AssignedTo, "note": old.Note, "closed_reason": old.ClosedReason}
	newM := map[string]any{}
	if req.AssignedTo != nil { newM["assigned_to"] = *req.AssignedTo }
	if req.Note != nil { newM["note"] = *req.Note }
	if req.ClosedReason != nil { newM["closed_reason"] = *req.ClosedReason }
	if req.Status != "" { newM["status"] = string(req.Status) }
	_ = h.Audit.Record(h.ctx(), "renewal", int64(id), "update", oldM, newM, auth.Current(c).UserID, auth.Current(c).Name)
	return c.JSON(fiber.Map{"ok": true})
}
