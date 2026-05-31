package handler

import (
	"floor-settlement/internal/dto"
	"floor-settlement/internal/model"
	"floor-settlement/internal/repository"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type TeamHandler struct {
	repo *repository.TeamRepository
}

func NewTeamHandler(repo *repository.TeamRepository) *TeamHandler {
	return &TeamHandler{repo: repo}
}

func (h *TeamHandler) Create(c *fiber.Ctx) error {
	var req dto.TeamCreate
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	projectID, err := uuid.Parse(req.ProjectID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	team := &model.Team{
		ProjectID:   projectID,
		Name:        req.Name,
		LeaderName:  req.LeaderName,
		LeaderPhone: req.LeaderPhone,
		TradeType:   req.TradeType,
	}

	if err := h.repo.Create(team); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"data": team})
}

func (h *TeamHandler) ListByProject(c *fiber.Ctx) error {
	projectID, err := uuid.Parse(c.Params("project_id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	teams, err := h.repo.ListByProject(projectID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"data": teams})
}

func (h *TeamHandler) GetByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	team, err := h.repo.FindByID(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"data": team})
}
