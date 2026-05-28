package handler

import (
	"instrument-rental/middleware"
	"instrument-rental/service"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type MaintenanceHandler struct {
	svc *service.MaintenanceService
}

func NewMaintenanceHandler() *MaintenanceHandler {
	return &MaintenanceHandler{svc: service.NewMaintenanceService()}
}

func (h *MaintenanceHandler) List(c *fiber.Ctx) error {
	page := service.ParseUintOrDefault(c.Query("page", "1"), 1)
	pageSize := service.ParseUintOrDefault(c.Query("page_size", "20"), 20)
	instrumentID := service.ParseUintOrDefault(c.Query("instrument_id"), 0)
	records, total, err := h.svc.List(
		instrumentID,
		c.Query("type"),
		c.Query("status"),
		int(page), int(pageSize),
	)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": records, "total": total, "page": page, "page_size": pageSize})
}

func (h *MaintenanceHandler) Get(c *fiber.Ctx) error {
	id, _ := strconv.ParseUint(c.Params("id"), 10, 32)
	record, err := h.svc.GetByID(uint(id))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "maintenance record not found"})
	}
	return c.JSON(record)
}

func (h *MaintenanceHandler) Create(c *fiber.Ctx) error {
	input := &service.CreateMaintenanceInput{}
	if err := c.BodyParser(input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	userID := middleware.GetUserID(c)
	record, err := h.svc.Create(input, userID, c.IP())
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(record)
}

func (h *MaintenanceHandler) Update(c *fiber.Ctx) error {
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
