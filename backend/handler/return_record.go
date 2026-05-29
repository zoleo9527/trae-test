package handler

import (
	"instrument-rental/middleware"
	"instrument-rental/model"
	"instrument-rental/service"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type ReturnHandler struct {
	svc *service.ReturnService
}

func NewReturnHandler() *ReturnHandler {
	return &ReturnHandler{svc: service.NewReturnService()}
}

func (h *ReturnHandler) List(c *fiber.Ctx) error {
	page := service.ParseUintOrDefault(c.Query("page", "1"), 1)
	pageSize := service.ParseUintOrDefault(c.Query("page_size", "20"), 20)
	rentalID := service.ParseUintOrDefault(c.Query("rental_id"), 0)
	records, total, err := h.svc.List(
		rentalID,
		c.Query("status"),
		c.Query("condition"),
		int(page), int(pageSize),
	)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": records, "total": total, "page": page, "page_size": pageSize})
}

func (h *ReturnHandler) Get(c *fiber.Ctx) error {
	id, _ := strconv.ParseUint(c.Params("id"), 10, 32)
	record, err := h.svc.GetByID(uint(id))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "return record not found"})
	}
	return c.JSON(record)
}

func (h *ReturnHandler) Create(c *fiber.Ctx) error {
	input := &service.CreateReturnInput{}
	if err := c.BodyParser(input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	userID := middleware.GetUserID(c)
	record, err := h.svc.Create(input, userID, c.IP())
	if err != nil {
		if bizErr, ok := err.(*service.BusinessError); ok {
			return c.Status(bizErr.Code).JSON(fiber.Map{"error": bizErr.Message})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(record)
}

func (h *ReturnHandler) Review(c *fiber.Ctx) error {
	id, _ := strconv.ParseUint(c.Params("id"), 10, 32)
	input := struct {
		Status      string `json:"status"`
		ReviewNotes string `json:"review_notes"`
	}{}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	userID := middleware.GetUserID(c)
	if err := h.svc.Review(uint(id), model.ReturnStatus(input.Status), input.ReviewNotes, userID, c.IP()); err != nil {
		if bizErr, ok := err.(*service.BusinessError); ok {
			return c.Status(bizErr.Code).JSON(fiber.Map{"error": bizErr.Message})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "reviewed"})
}
