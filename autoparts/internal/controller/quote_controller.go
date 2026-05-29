package controller

import (
	"strconv"

	"autoparts/internal/dto"
	"autoparts/internal/model"
	"autoparts/internal/service"
	"autoparts/internal/util"
	apperrors "autoparts/pkg/errors"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

type QuoteController struct {
	quoteService *service.QuoteService
	taskService  *service.TaskService
	validate     *validator.Validate
}

func NewQuoteController() *QuoteController {
	return &QuoteController{
		quoteService: service.NewQuoteService(),
		taskService:  service.NewTaskService(),
		validate:     validator.New(),
	}
}

func (c *QuoteController) Create(ctx *fiber.Ctx) error {
	user := util.GetUserFromContext(ctx)

	var req dto.CreateQuoteRequest
	if err := ctx.BodyParser(&req); err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "请求参数错误", err.Error())
	}

	if err := c.validate.Struct(&req); err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "参数验证失败", err.Error())
	}

	ip := ctx.IP()
	quote, err := c.quoteService.Create(user, &req, ip)
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			return util.Error(ctx, appErr.HTTPStatus(), string(appErr.Code), appErr.Message, appErr.Details)
		}
		return util.Error(ctx, fiber.StatusInternalServerError, string(apperrors.ErrCodeInternal), "创建报价单失败", err.Error())
	}

	return util.Success(ctx, quote)
}

func (c *QuoteController) GetByID(ctx *fiber.Ctx) error {
	id, err := strconv.ParseUint(ctx.Params("id"), 10, 32)
	if err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "无效的ID", nil)
	}

	quote, err := c.quoteService.GetByID(uint(id))
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			return util.Error(ctx, appErr.HTTPStatus(), string(appErr.Code), appErr.Message, appErr.Details)
		}
		return util.Error(ctx, fiber.StatusInternalServerError, string(apperrors.ErrCodeInternal), "获取报价单失败", err.Error())
	}

	return util.Success(ctx, quote)
}

func (c *QuoteController) Review(ctx *fiber.Ctx) error {
	user := util.GetUserFromContext(ctx)

	id, err := strconv.ParseUint(ctx.Params("id"), 10, 32)
	if err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "无效的ID", nil)
	}

	var req dto.ReviewQuoteRequest
	if err := ctx.BodyParser(&req); err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "请求参数错误", err.Error())
	}

	if err := c.validate.Struct(&req); err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "参数验证失败", err.Error())
	}

	ip := ctx.IP()
	quote, err := c.quoteService.Review(user, uint(id), &req, ip)
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			return util.Error(ctx, appErr.HTTPStatus(), string(appErr.Code), appErr.Message, appErr.Details)
		}
		return util.Error(ctx, fiber.StatusInternalServerError, string(apperrors.ErrCodeInternal), "审核报价单失败", err.Error())
	}

	return util.Success(ctx, quote)
}

func (c *QuoteController) Cancel(ctx *fiber.Ctx) error {
	user := util.GetUserFromContext(ctx)

	id, err := strconv.ParseUint(ctx.Params("id"), 10, 32)
	if err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "无效的ID", nil)
	}

	ip := ctx.IP()
	quote, err := c.quoteService.Cancel(user, uint(id), ip)
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			return util.Error(ctx, appErr.HTTPStatus(), string(appErr.Code), appErr.Message, appErr.Details)
		}
		return util.Error(ctx, fiber.StatusInternalServerError, string(apperrors.ErrCodeInternal), "取消报价单失败", err.Error())
	}

	return util.Success(ctx, quote)
}

func (c *QuoteController) List(ctx *fiber.Ctx) error {
	var filter dto.QuoteFilter
	if err := ctx.BodyParser(&filter); err != nil {
		filter.Page = 1
		filter.PageSize = 20
	}

	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.PageSize < 1 || filter.PageSize > 100 {
		filter.PageSize = 20
	}

	quotes, total, err := c.quoteService.List(&filter)
	if err != nil {
		return util.Error(ctx, fiber.StatusInternalServerError, string(apperrors.ErrCodeInternal), "获取报价单列表失败", err.Error())
	}

	return util.SuccessWithPagination(ctx, quotes, filter.Page, filter.PageSize, total)
}

func (c *QuoteController) Export(ctx *fiber.Ctx) error {
	user := util.GetUserFromContext(ctx)

	var filter dto.QuoteFilter
	if err := ctx.BodyParser(&filter); err != nil {
		filter.Page = 1
		filter.PageSize = 10000
	}

	ip := ctx.IP()
	task, err := c.taskService.CreateTask(user, model.TaskTypeExportQuote, "导出报价单", filter, ip)
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			return util.Error(ctx, appErr.HTTPStatus(), string(appErr.Code), appErr.Message, appErr.Details)
		}
		return util.Error(ctx, fiber.StatusInternalServerError, string(apperrors.ErrCodeInternal), "创建导出任务失败", err.Error())
	}

	return util.Success(ctx, task)
}
