package handler

import (
	"instrument-rental/middleware"
	"instrument-rental/model"
	"instrument-rental/service"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type InstrumentHandler struct {
	svc *service.InstrumentService
}

func NewInstrumentHandler() *InstrumentHandler {
	return &InstrumentHandler{svc: service.NewInstrumentService()}
}

func (h *InstrumentHandler) List(c *fiber.Ctx) error {
	page := service.ParseUintOrDefault(c.Query("page", "1"), 1)
	pageSize := service.ParseUintOrDefault(c.Query("page_size", "20"), 20)
	instruments, total, err := h.svc.List(
		c.Query("status"),
		c.Query("type"),
		c.Query("keyword"),
		int(page),
		int(pageSize),
	)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": instruments, "total": total, "page": page, "page_size": pageSize})
}

func (h *InstrumentHandler) Get(c *fiber.Ctx) error {
	id, _ := strconv.ParseUint(c.Params("id"), 10, 32)
	inst, err := h.svc.GetByID(uint(id))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "instrument not found"})
	}
	return c.JSON(inst)
}

func (h *InstrumentHandler) Create(c *fiber.Ctx) error {
	inst := &model.Instrument{}
	if err := c.BodyParser(inst); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	if err := h.svc.Create(inst); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(inst)
}

func (h *InstrumentHandler) Update(c *fiber.Ctx) error {
	id, _ := strconv.ParseUint(c.Params("id"), 10, 32)
	updates := make(map[string]any)
	if err := c.BodyParser(&updates); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	userID := middleware.GetUserID(c)
	if err := h.svc.Update(uint(id), updates, userID, c.IP()); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "updated"})
}

func (h *InstrumentHandler) Delete(c *fiber.Ctx) error {
	id, _ := strconv.ParseUint(c.Params("id"), 10, 32)
	userID := middleware.GetUserID(c)
	if err := h.svc.Delete(uint(id), userID, c.IP()); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "deleted"})
}

func (h *InstrumentHandler) Available(c *fiber.Ctx) error {
	instruments, err := h.svc.GetAvailable()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(instruments)
}
