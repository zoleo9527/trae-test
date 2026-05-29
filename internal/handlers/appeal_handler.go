package handlers

import (
	"runner-platform/internal/schemas"
	"runner-platform/internal/services"
	"runner-platform/internal/utils"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type AppealHandler struct {
	appealService *services.AppealService
	validate      *validator.Validate
}

func NewAppealHandler() *AppealHandler {
	return &AppealHandler{
		appealService: services.NewAppealService(),
		validate:      validator.New(),
	}
}

func (h *AppealHandler) CreateAppeal(c *fiber.Ctx) error {
	var req schemas.CreateAppealRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationError(c, "Invalid request body")
	}

	if err := h.validate.Struct(req); err != nil {
		return utils.ValidationError(c, err.Error())
	}

	appeal, err := h.appealService.CreateAppeal(c, &req)
	if err != nil {
		return utils.Error(c, 4001, err.Error())
	}

	return utils.Success(c, appeal)
}

func (h *AppealHandler) GetAppeal(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.ValidationError(c, "Invalid appeal ID")
	}

	appeal, err := h.appealService.GetAppealByID(c, id)
	if err != nil {
		return utils.NotFound(c, err.Error())
	}

	return utils.Success(c, appeal)
}

func (h *AppealHandler) GetAppealDetail(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.ValidationError(c, "Invalid appeal ID")
	}

	detail, err := h.appealService.GetAppealDetail(c, id)
	if err != nil {
		return utils.NotFound(c, err.Error())
	}

	return utils.Success(c, detail)
}

func (h *AppealHandler) ListAppeals(c *fiber.Ctx) error {
	var query schemas.AppealQuery
	if err := c.QueryParser(&query); err != nil {
		return utils.ValidationError(c, "Invalid query parameters")
	}

	appeals, total, err := h.appealService.QueryAppeals(c, &query)
	if err != nil {
		return utils.Error(c, 4002, err.Error())
	}

	return utils.SuccessWithPagination(c, appeals, total, query.Page, query.PageSize)
}

func (h *AppealHandler) HandleAppeal(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.ValidationError(c, "Invalid appeal ID")
	}

	var req schemas.HandleAppealRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationError(c, "Invalid request body")
	}

	if err := h.validate.Struct(req); err != nil {
		return utils.ValidationError(c, err.Error())
	}

	appeal, err := h.appealService.HandleAppeal(c, id, &req)
	if err != nil {
		return utils.Error(c, 4003, err.Error())
	}

	return utils.Success(c, appeal)
}

func (h *AppealHandler) AddRemark(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.ValidationError(c, "Invalid appeal ID")
	}

	var req schemas.AddRemarkRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationError(c, "Invalid request body")
	}

	if err := h.validate.Struct(req); err != nil {
		return utils.ValidationError(c, err.Error())
	}

	remark, err := h.appealService.AddRemark(c, id, &req)
	if err != nil {
		return utils.Error(c, 4004, err.Error())
	}

	return utils.Success(c, remark)
}
