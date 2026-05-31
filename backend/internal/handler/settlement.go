package handler

import (
	"floor-settlement/internal/dto"
	"floor-settlement/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type SettlementHandler struct {
	service         *service.SettlementService
	asyncTaskService *service.AsyncTaskService
}

func NewSettlementHandler(s *service.SettlementService, asyncSvc *service.AsyncTaskService) *SettlementHandler {
	return &SettlementHandler{
		service:         s,
		asyncTaskService: asyncSvc,
	}
}

func (h *SettlementHandler) Generate(c *fiber.Ctx) error {
	var req dto.GenerateSettlementRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	claims, _ := c.Locals("user").(*dto.UserSummary)
	operator := service.OperatorInfo{ID: claims.ID, Name: claims.RealName, Role: claims.Role, ProjectID: claims.ProjectID, TeamID: claims.TeamID}

	task, err := h.asyncTaskService.CreateSettlementTask(&operator, &req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data": fiber.Map{
			"task_id": task.ID,
			"status":  task.Status,
			"message": "settlement generation started",
		},
	})
}

func (h *SettlementHandler) GenerateSync(c *fiber.Ctx) error {
	var req dto.GenerateSettlementRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	claims, _ := c.Locals("user").(*dto.UserSummary)
	operator := service.OperatorInfo{ID: claims.ID, Name: claims.RealName, Role: claims.Role, ProjectID: claims.ProjectID, TeamID: claims.TeamID}

	result, err := h.service.GenerateFromAttendance(&operator, &req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"data": result})
}

func (h *SettlementHandler) GetByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	result, err := h.service.FindByID(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"data": result})
}

func (h *SettlementHandler) Filter(c *fiber.Ctx) error {
	var filter dto.SettlementFilter
	if err := c.QueryParser(&filter); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	records, total, err := h.service.Filter(c, &filter)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data":      records,
		"total":     total,
		"page":      filter.Page,
		"page_size": filter.PageSize,
	})
}

func (h *SettlementHandler) TransitionStatus(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	var req dto.SettlementStatusAction
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	result, err := h.service.TransitionStatus(c, id, &req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"data": result})
}

func (h *SettlementHandler) Dashboard(c *fiber.Ctx) error {
	projectIDStr := c.Query("project_id")
	if projectIDStr == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "project_id is required"})
	}

	projectID, err := uuid.Parse(projectIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	result, err := h.service.GetDashboardStats(projectID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"data": result})
}
