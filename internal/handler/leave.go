package handler

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"

	"swimclub/internal/auth"
	"swimclub/internal/dto"
	"swimclub/internal/model"
)

func (h *Handler) CreateLeave(c *fiber.Ctx) error {
	var req dto.CreateLeaveReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad request"})
	}
	if req.EndDate.Before(req.StartDate) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "end before start"})
	}
	var id int64
	err := h.DB.QueryRowContext(h.ctx(),
		`INSERT INTO leave_requests(member_id,start_date,end_date,reason,status,course_deduct,created_by)
		 VALUES($1,$2,$3,$4,'pending',$5,$6) RETURNING id`,
		req.MemberID, req.StartDate, req.EndDate, req.Reason, req.CourseDeduct, auth.Current(c).UserID).Scan(&id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	_ = h.Audit.Record(h.ctx(), "leave_request", id, "create", nil,
		map[string]any{"member_id": req.MemberID, "start": req.StartDate, "end": req.EndDate, "reason": req.Reason, "course_deduct": req.CourseDeduct},
		auth.Current(c).UserID, auth.Current(c).Name)

	h.enqueue("leave_created", id, fmt.Sprintf(`{"member_id":%d,"leave_id":%d}`, req.MemberID, id))
	return c.JSON(fiber.Map{"id": id})
}

func (h *Handler) ListLeaves(c *fiber.Ctx) error {
	var q dto.ListQuery
	_ = c.QueryParser(&q)
	sql := `SELECT id, member_id, start_date, end_date, reason, status, course_deduct, approver_id, approved_at, reject_reason, created_by, created_at, updated_at
		FROM leave_requests WHERE 1=1`
	args := []any{}
	i := 1
	if q.MemberID != 0 {
		sql += fmt.Sprintf(" AND member_id = $%d", i); args = append(args, q.MemberID); i++
	}
	if q.Status != "" {
		sql += fmt.Sprintf(" AND status = $%d", i); args = append(args, q.Status); i++
	}
	if !q.From.IsZero() {
		sql += fmt.Sprintf(" AND created_at >= $%d", i); args = append(args, q.From); i++
	}
	if !q.To.IsZero() {
		sql += fmt.Sprintf(" AND created_at <= $%d", i); args = append(args, q.To); i++
	}
	sql += " ORDER BY created_at DESC"
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
	out := []model.LeaveRequest{}
	for rows.Next() {
		var l model.LeaveRequest
		if err := rows.Scan(&l.ID, &l.MemberID, &l.StartDate, &l.EndDate, &l.Reason, &l.Status, &l.CourseDeduct, &l.ApproverID, &l.ApprovedAt, &l.RejectReason, &l.CreatedBy, &l.CreatedAt, &l.UpdatedAt); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		out = append(out, l)
	}
	return c.JSON(out)
}

func (h *Handler) GetLeave(c *fiber.Ctx) error {
	id := c.ParamsInt("id", 0)
	var l model.LeaveRequest
	err := h.DB.QueryRowContext(h.ctx(),
		`SELECT id, member_id, start_date, end_date, reason, status, course_deduct, approver_id, approved_at, reject_reason, created_by, created_at, updated_at
		 FROM leave_requests WHERE id=$1`, id).
		Scan(&l.ID, &l.MemberID, &l.StartDate, &l.EndDate, &l.Reason, &l.Status, &l.CourseDeduct, &l.ApproverID, &l.ApprovedAt, &l.RejectReason, &l.CreatedBy, &l.CreatedAt, &l.UpdatedAt)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "not found"})
	}
	return c.JSON(l)
}

func (h *Handler) ApproveLeave(c *fiber.Ctx) error {
	id := c.ParamsInt("id", 0)
	var req dto.ApproveLeaveReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad request"})
	}
	tx, err := h.DB.BeginTx(h.ctx(), nil)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	defer tx.Rollback()

	var old model.LeaveRequest
	err = tx.QueryRowContext(h.ctx(),
		`SELECT id, member_id, start_date, end_date, reason, status, course_deduct, approver_id, approved_at, reject_reason, created_by, created_at, updated_at
		 FROM leave_requests WHERE id=$1 FOR UPDATE`, id).
		Scan(&old.ID, &old.MemberID, &old.StartDate, &old.EndDate, &old.Reason, &old.Status, &old.CourseDeduct, &old.ApproverID, &old.ApprovedAt, &old.RejectReason, &old.CreatedBy, &old.CreatedAt, &old.UpdatedAt)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "not found"})
	}
	if old.Status != model.LeavePending {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "not pending"})
	}

	var coursesUsed int
	if req.ApplyDeduct {
		if err := tx.QueryRowContext(h.ctx(), `SELECT courses_used FROM members WHERE id=$1 FOR UPDATE`, old.MemberID).Scan(&coursesUsed); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		if _, err := tx.ExecContext(h.ctx(), `UPDATE members SET courses_used = courses_used + $1 WHERE id=$2`, req.CourseDeduct, old.MemberID); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
	}

	now := time.Now().UTC()
	if _, err := tx.ExecContext(h.ctx(),
		`UPDATE leave_requests SET status='approved', approver_id=$1, approved_at=$2, course_deduct=$3, updated_at=$4 WHERE id=$5`,
		auth.Current(c).UserID, now, req.CourseDeduct, now, id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	if err := tx.Commit(); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	oldM := map[string]any{"status": old.Status, "course_deduct": old.CourseDeduct, "approver_id": old.ApproverID, "approved_at": old.ApprovedAt}
	newM := map[string]any{"status": "approved", "course_deduct": req.CourseDeduct, "approver_id": auth.Current(c).UserID, "approved_at": now, "member_courses_used_add": req.CourseDeduct}
	_ = h.Audit.Record(h.ctx(), "leave_request", int64(id), "approve", oldM, newM, auth.Current(c).UserID, auth.Current(c).Name)
	h.enqueue("leave_approved", int64(id), fmt.Sprintf(`{"member_id":%d,"leave_id":%d}`, old.MemberID, id))
	return c.JSON(fiber.Map{"ok": true})
}

func (h *Handler) RejectLeave(c *fiber.Ctx) error {
	id := c.ParamsInt("id", 0)
	var req dto.RejectLeaveReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad request"})
	}
	var old model.LeaveRequest
	err := h.DB.QueryRowContext(h.ctx(),
		`SELECT id, member_id, start_date, end_date, reason, status, course_deduct, approver_id, approved_at, reject_reason, created_by, created_at, updated_at
		 FROM leave_requests WHERE id=$1`, id).
		Scan(&old.ID, &old.MemberID, &old.StartDate, &old.EndDate, &old.Reason, &old.Status, &old.CourseDeduct, &old.ApproverID, &old.ApprovedAt, &old.RejectReason, &old.CreatedBy, &old.CreatedAt, &old.UpdatedAt)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "not found"})
	}
	if old.Status != model.LeavePending {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "not pending"})
	}
	if _, err := h.DB.ExecContext(h.ctx(),
		`UPDATE leave_requests SET status='rejected', reject_reason=$1, approver_id=$2, updated_at=$3 WHERE id=$4`,
		req.Reason, auth.Current(c).UserID, time.Now().UTC(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	oldM := map[string]any{"status": old.Status, "reject_reason": old.RejectReason}
	newM := map[string]any{"status": "rejected", "reject_reason": req.Reason}
	_ = h.Audit.Record(h.ctx(), "leave_request", int64(id), "reject", oldM, newM, auth.Current(c).UserID, auth.Current(c).Name)
	return c.JSON(fiber.Map{"ok": true})
}

func (h *Handler) CancelLeave(c *fiber.Ctx) error {
	id := c.ParamsInt("id", 0)
	if _, err := h.DB.ExecContext(h.ctx(),
		`UPDATE leave_requests SET status='cancelled', updated_at=$1 WHERE id=$2 AND status='pending'`,
		time.Now().UTC(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"ok": true})
}
