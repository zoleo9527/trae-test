package handlers

import (
	"runner-platform/internal/schemas"
	"runner-platform/internal/services"
	"runner-platform/internal/utils"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type SubsidyHandler struct {
	subsidyService *services.SubsidyService
	validate       *validator.Validate
}

func NewSubsidyHandler() *SubsidyHandler {
	return &SubsidyHandler{
		subsidyService: services.NewSubsidyService(),
		validate:       validator.New(),
	}
}

func (h *SubsidyHandler) CreateSubsidy(c *fiber.Ctx) error {
	var req schemas.CreateSubsidyRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationError(c, "Invalid request body")
	}

	if err := h.validate.Struct(req); err != nil {
		return utils.ValidationError(c, err.Error())
	}

	subsidy, err := h.subsidyService.CreateSubsidy(c, &req)
	if err != nil {
		return utils.Error(c, 5001, err.Error())
	}

	return utils.Success(c, subsidy)
}

func (h *SubsidyHandler) GetSubsidy(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.ValidationError(c, "Invalid subsidy ID")
	}

	subsidy, err := h.subsidyService.GetSubsidyByID(c, id)
	if err != nil {
		return utils.NotFound(c, err.Error())
	}

	return utils.Success(c, subsidy)
}

func (h *SubsidyHandler) GetSubsidyDetail(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.ValidationError(c, "Invalid subsidy ID")
	}

	detail, err := h.subsidyService.GetSubsidyDetail(c, id)
	if err != nil {
		return utils.NotFound(c, err.Error())
	}

	return utils.Success(c, detail)
}

func (h *SubsidyHandler) ListSubsidies(c *fiber.Ctx) error {
	var query schemas.SubsidyQuery
	if err := c.QueryParser(&query); err != nil {
		return utils.ValidationError(c, "Invalid query parameters")
	}

	subsidies, total, err := h.subsidyService.QuerySubsidies(c, &query)
	if err != nil {
		return utils.Error(c, 5002, err.Error())
	}

	return utils.SuccessWithPagination(c, subsidies, total, query.Page, query.PageSize)
}

func (h *SubsidyHandler) ReviewSubsidy(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.ValidationError(c, "Invalid subsidy ID")
	}

	var req schemas.ReviewSubsidyRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationError(c, "Invalid request body")
	}

	if err := h.validate.Struct(req); err != nil {
		return utils.ValidationError(c, err.Error())
	}

	subsidy, err := h.subsidyService.ReviewSubsidy(c, id, &req)
	if err != nil {
		return utils.Error(c, 5003, err.Error())
	}

	return utils.Success(c, subsidy)
}

func (h *SubsidyHandler) MarkPaid(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.ValidationError(c, "Invalid subsidy ID")
	}

	var req schemas.MarkPaidRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationError(c, "Invalid request body")
	}

	if err := h.validate.Struct(req); err != nil {
		return utils.ValidationError(c, err.Error())
	}

	subsidy, err := h.subsidyService.MarkPaid(c, id, &req)
	if err != nil {
		return utils.Error(c, 5004, err.Error())
	}

	return utils.Success(c, subsidy)
}

func (h *SubsidyHandler) AddRemark(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.ValidationError(c, "Invalid subsidy ID")
	}

	var req schemas.AddRemarkRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationError(c, "Invalid request body")
	}

	if err := h.validate.Struct(req); err != nil {
		return utils.ValidationError(c, err.Error())
	}

	remark, err := h.subsidyService.AddRemark(c, id, &req)
	if err != nil {
		return utils.Error(c, 5005, err.Error())
	}

	return utils.Success(c, remark)
}
