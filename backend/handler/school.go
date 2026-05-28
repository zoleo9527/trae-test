package handler

import (
	"instrument-rental/middleware"
	"instrument-rental/service"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type SchoolHandler struct {
	svc *service.SchoolService
}

func NewSchoolHandler() *SchoolHandler {
	return &SchoolHandler{svc: service.NewSchoolService()}
}

func (h *SchoolHandler) List(c *fiber.Ctx) error {
	page := service.ParseUintOrDefault(c.Query("page", "1"), 1)
	pageSize := service.ParseUintOrDefault(c.Query("page_size", "20"), 20)
	schools, total, err := h.svc.List(
		c.Query("status"),
		c.Query("keyword"),
		int(page), int(pageSize),
	)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": schools, "total": total, "page": page, "page_size": pageSize})
}

func (h *SchoolHandler) Get(c *fiber.Ctx) error {
	id, _ := strconv.ParseUint(c.Params("id"), 10, 32)
	school, err := h.svc.GetByID(uint(id))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "school not found"})
	}
	return c.JSON(school)
}

func (h *SchoolHandler) Create(c *fiber.Ctx) error {
	input := &service.CreateSchoolInput{}
	if err := c.BodyParser(input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	if input.Name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "school name required"})
	}
	if input.CooperationStatus == "" {
		input.CooperationStatus = "active"
	}
	userID := middleware.GetUserID(c)
	school, err := h.svc.Create(input, userID, c.IP())
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(school)
}

func (h *SchoolHandler) Update(c *fiber.Ctx) error {
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

func (h *SchoolHandler) Delete(c *fiber.Ctx) error {
	id, _ := strconv.ParseUint(c.Params("id"), 10, 32)
	userID := middleware.GetUserID(c)
	if err := h.svc.Delete(uint(id), userID, c.IP()); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "deleted"})
}
