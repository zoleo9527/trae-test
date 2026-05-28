package handler

import (
	"instrument-rental/middleware"
	"instrument-rental/service"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type RentalHandler struct {
	svc *service.RentalService
}

func NewRentalHandler() *RentalHandler {
	return &RentalHandler{svc: service.NewRentalService()}
}

func (h *RentalHandler) List(c *fiber.Ctx) error {
	page := service.ParseUintOrDefault(c.Query("page", "1"), 1)
	pageSize := service.ParseUintOrDefault(c.Query("page_size", "20"), 20)
	schoolID := service.ParseUintOrDefault(c.Query("school_id"), 0)
	instrumentID := service.ParseUintOrDefault(c.Query("instrument_id"), 0)
	rentals, total, err := h.svc.List(
		schoolID, instrumentID,
		c.Query("status"),
		c.Query("start_date"),
		c.Query("end_date"),
		int(page), int(pageSize),
	)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": rentals, "total": total, "page": page, "page_size": pageSize})
}

func (h *RentalHandler) Get(c *fiber.Ctx) error {
	id, _ := strconv.ParseUint(c.Params("id"), 10, 32)
	rental, err := h.svc.GetByID(uint(id))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "rental not found"})
	}
	return c.JSON(rental)
}

func (h *RentalHandler) Create(c *fiber.Ctx) error {
	input := &service.CreateRentalInput{}
	if err := c.BodyParser(input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	userID := middleware.GetUserID(c)
	rental, err := h.svc.Create(input, userID, c.IP())
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(rental)
}

func (h *RentalHandler) BatchCreate(c *fiber.Ctx) error {
	input := &service.BatchCreateRentalInput{}
	if err := c.BodyParser(input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	userID := middleware.GetUserID(c)
	rentals, err := h.svc.BatchCreate(input.Rentals, userID, c.IP())
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(fiber.Map{"data": rentals, "count": len(rentals)})
}

func (h *RentalHandler) Update(c *fiber.Ctx) error {
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
