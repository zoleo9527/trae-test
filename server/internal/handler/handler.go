package handler

import (
	"time"
	"weddingsys/internal"
	"weddingsys/internal/repository"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type Handler struct {
	store *repository.Store
}

func New(store *repository.Store) *Handler {
	return &Handler{store: store}
}

func (h *Handler) authUser(c *fiber.Ctx) *internal.User {
	token := c.Get("X-Auth-Token")
	if token == "" {
		token = c.Query("token")
	}
	return h.store.SessionUser(token)
}

func (h *Handler) requireAuth(c *fiber.Ctx) *internal.User {
	u := h.authUser(c)
	if u == nil {
		c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
		return nil
	}
	return u
}

func (h *Handler) Login(c *fiber.Ctx) error {
	var req internal.LoginReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad request"})
	}
	u := h.store.FindUser(req.Username, req.Password)
	if u == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "账号或密码错误"})
	}
	token := uuid.NewString()
	h.store.AddSession(token, u.ID)
	return c.JSON(fiber.Map{"token": token, "user": u})
}

func (h *Handler) Me(c *fiber.Ctx) error {
	u := h.requireAuth(c)
	if u == nil {
		return nil
	}
	return c.JSON(u)
}

func (h *Handler) ListOrders(c *fiber.Ctx) error {
	u := h.requireAuth(c)
	if u == nil {
		return nil
	}
	all := h.store.Orders()
	return c.JSON(all)
}

func (h *Handler) GetOrder(c *fiber.Ctx) error {
	u := h.requireAuth(c)
	if u == nil {
		return nil
	}
	id := c.Params("id")
	o := h.store.FindOrder(id)
	if o == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "not found"})
	}
	return c.JSON(o)
}

func (h *Handler) AddSlot(c *fiber.Ctx) error {
	u := h.requireAuth(c)
	if u == nil {
		return nil
	}
	id := c.Params("id")
	var req internal.AddSlotReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad request"})
	}
	h.store.UpdateOrder(id, func(o *internal.Order) {
		o.Slots = append(o.Slots, internal.PhotoSlot{
			ID:           "s" + uuid.NewString()[:6],
			At:           req.At,
			Place:        req.Place,
			Photographer: req.Photographer,
		})
		o.Timeline = append(o.Timeline, internal.TimelineEvent{
			ID:     "t" + uuid.NewString()[:6],
			At:     time.Now().Format(time.RFC3339),
			Stage:  "档期",
			Actor:  u.Name,
			Action: "新增拍摄档期",
			Detail: req.Place + " · " + req.Photographer,
		})
	})
	return c.JSON(h.store.FindOrder(id))
}

func (h *Handler) RescheduleSlot(c *fiber.Ctx) error {
	u := h.requireAuth(c)
	if u == nil {
		return nil
	}
	id := c.Params("id")
	slotID := c.Params("slotId")
	var req internal.AddSlotReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad request"})
	}
	h.store.UpdateOrder(id, func(o *internal.Order) {
		for i, s := range o.Slots {
			if s.ID == slotID {
				old := s
				o.Slots[i].At = req.At
				o.Slots[i].Place = req.Place
				o.Slots[i].Photographer = req.Photographer
				o.Timeline = append(o.Timeline, internal.TimelineEvent{
					ID:     "t" + uuid.NewString()[:6],
					At:     time.Now().Format(time.RFC3339),
					Stage:  "档期",
					Actor:  u.Name,
					Action: "改期",
					Detail: old.Place + " → " + req.Place,
				})
				return
			}
		}
	})
	return c.JSON(h.store.FindOrder(id))
}

func (h *Handler) AddSelection(c *fiber.Ctx) error {
	u := h.requireAuth(c)
	if u == nil {
		return nil
	}
	id := c.Params("id")
	var req internal.AddSelectionReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad request"})
	}
	h.store.UpdateOrder(id, func(o *internal.Order) {
		version := len(o.Selections) + 1
		sel := internal.Selection{
			ID:         "sel" + uuid.NewString()[:6],
			Version:    version,
			CreatedAt:  time.Now().Format(time.RFC3339),
			Photos:     req.Photos,
			EditorID:   u.ID,
			EditorName: u.Name,
			Confirmed:  false,
			Note:       req.Note,
		}
		o.Selections = append(o.Selections, sel)
		o.Timeline = append(o.Timeline, internal.TimelineEvent{
			ID:     "t" + uuid.NewString()[:6],
			At:     time.Now().Format(time.RFC3339),
			Stage:  "选片",
			Actor:  u.Name,
			Action: "上传选片版本",
			Detail: "v" + itoa(version) + " · " + itoa(len(req.Photos)) + " 张",
		})
	})
	return c.JSON(h.store.FindOrder(id))
}

func (h *Handler) ConfirmSelection(c *fiber.Ctx) error {
	u := h.requireAuth(c)
	if u == nil {
		return nil
	}
	id := c.Params("id")
	selID := c.Params("selId")
	var req internal.ConfirmSelectionReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad request"})
	}
	h.store.UpdateOrder(id, func(o *internal.Order) {
		for i, s := range o.Selections {
			if s.ID == selID {
				o.Selections[i].Confirmed = req.Confirm
				o.Timeline = append(o.Timeline, internal.TimelineEvent{
					ID:     "t" + uuid.NewString()[:6],
					At:     time.Now().Format(time.RFC3339),
					Stage:  "选片",
					Actor:  u.Name,
					Action: ternary(req.Confirm, "确认选片", "取消确认"),
					Detail: "v" + itoa(s.Version),
				})
				return
			}
		}
	})
	return c.JSON(h.store.FindOrder(id))
}

func (h *Handler) PayPayment(c *fiber.Ctx) error {
	u := h.requireAuth(c)
	if u == nil {
		return nil
	}
	id := c.Params("id")
	pid := c.Params("payId")
	var req internal.PayPaymentReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad request"})
	}
	h.store.UpdateOrder(id, func(o *internal.Order) {
		for i, p := range o.Payments {
			if p.ID == pid {
				o.Payments[i].Paid = true
				o.Payments[i].PaidAt = time.Now().Format(time.RFC3339)
				if req.Note != "" {
					o.Payments[i].Note = req.Note
				}
				o.Timeline = append(o.Timeline, internal.TimelineEvent{
					ID:     "t" + uuid.NewString()[:6],
					At:     time.Now().Format(time.RFC3339),
					Stage:  "尾款",
					Actor:  u.Name,
					Action: "收款到账",
					Detail: p.Stage + " · " + itoa(p.Amount) + " 元",
				})
				return
			}
		}
	})
	return c.JSON(h.store.FindOrder(id))
}

func (h *Handler) CreateException(c *fiber.Ctx) error {
	u := h.requireAuth(c)
	if u == nil {
		return nil
	}
	id := c.Params("id")
	var req internal.CreateExceptionReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad request"})
	}
	h.store.UpdateOrder(id, func(o *internal.Order) {
		e := internal.ExceptionItem{
			ID:        "e" + uuid.NewString()[:6],
			OrderID:   id,
			Kind:      req.Kind,
			Severity:  req.Severity,
			Status:    "处理中",
			Summary:   req.Summary,
			Detail:    req.Detail,
			CreatedAt: time.Now().Format(time.RFC3339),
		}
		o.Exceptions = append(o.Exceptions, e)
		o.Timeline = append(o.Timeline, internal.TimelineEvent{
			ID:     "t" + uuid.NewString()[:6],
			At:     time.Now().Format(time.RFC3339),
			Stage:  "异常",
			Actor:  u.Name,
			Action: "发起异常",
			Detail: req.Kind + " · " + req.Summary,
		})
	})
	return c.JSON(h.store.FindOrder(id))
}

func (h *Handler) CloseException(c *fiber.Ctx) error {
	u := h.requireAuth(c)
	if u == nil {
		return nil
	}
	id := c.Params("id")
	eid := c.Params("excId")
	var req internal.CloseExceptionReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad request"})
	}
	h.store.UpdateOrder(id, func(o *internal.Order) {
		for i, e := range o.Exceptions {
			if e.ID == eid {
				o.Exceptions[i].Status = "已关闭"
				o.Exceptions[i].ClosedAt = time.Now().Format(time.RFC3339)
				o.Exceptions[i].HandledBy = u.Name
				o.Timeline = append(o.Timeline, internal.TimelineEvent{
					ID:     "t" + uuid.NewString()[:6],
					At:     time.Now().Format(time.RFC3339),
					Stage:  "异常",
					Actor:  u.Name,
					Action: "关闭异常",
					Detail: e.Kind + " · " + req.Note,
				})
				return
			}
		}
	})
	return c.JSON(h.store.FindOrder(id))
}

func itoa(i int) string {
	if i == 0 {
		return "0"
	}
	neg := i < 0
	if neg {
		i = -i
	}
	var buf [20]byte
	pos := len(buf)
	for i > 0 {
		pos--
		buf[pos] = byte('0' + i%10)
		i /= 10
	}
	if neg {
		pos--
		buf[pos] = '-'
	}
	return string(buf[pos:])
}

func ternary[T any](b bool, a, c T) T {
	if b {
		return a
	}
	return c
}
