package handler

import (
	"github.com/cultural-store/inspection-service/internal/middleware"
	"github.com/cultural-store/inspection-service/internal/service"
	"github.com/gofiber/fiber/v2"
)

type StoreHandler struct {
	svc *service.Service
}

func NewStoreHandler(svc *service.Service) *StoreHandler {
	return &StoreHandler{svc: svc}
}

func (h *StoreHandler) List(c *fiber.Ctx) error {
	f := middleware.GetFilter(c)
	result, err := h.svc.ListStores(f)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(result)
}
