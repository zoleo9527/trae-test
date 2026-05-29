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

type EnquiryController struct {
	enquiryService *service.EnquiryService
	taskService    *service.TaskService
	validate       *validator.Validate
}

func NewEnquiryController() *EnquiryController {
	return &EnquiryController{
		enquiryService: service.NewEnquiryService(),
		taskService:    service.NewTaskService(),
		validate:       validator.New(),
	}
}

func (c *EnquiryController) Create(ctx *fiber.Ctx) error {
	user := util.GetUserFromContext(ctx)

	var req dto.CreateEnquiryRequest
	if err := ctx.BodyParser(&req); err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "请求参数错误", err.Error())
	}

	if err := c.validate.Struct(&req); err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "参数验证失败", err.Error())
	}

	ip := ctx.IP()
	enquiry, err := c.enquiryService.Create(user, &req, ip)
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			return util.Error(ctx, appErr.HTTPStatus(), string(appErr.Code), appErr.Message, appErr.Details)
		}
		return util.Error(ctx, fiber.StatusInternalServerError, string(apperrors.ErrCodeInternal), "创建询价单失败", err.Error())
	}

	return util.Success(ctx, enquiry)
}

func (c *EnquiryController) Update(ctx *fiber.Ctx) error {
	user := util.GetUserFromContext(ctx)

	id, err := strconv.ParseUint(ctx.Params("id"), 10, 32)
	if err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "无效的ID", nil)
	}

	var req dto.UpdateEnquiryRequest
	if err := ctx.BodyParser(&req); err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "请求参数错误", err.Error())
	}

	if err := c.validate.Struct(&req); err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "参数验证失败", err.Error())
	}

	ip := ctx.IP()
	enquiry, err := c.enquiryService.Update(user, uint(id), &req, ip)
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			return util.Error(ctx, appErr.HTTPStatus(), string(appErr.Code), appErr.Message, appErr.Details)
		}
		return util.Error(ctx, fiber.StatusInternalServerError, string(apperrors.ErrCodeInternal), "更新询价单失败", err.Error())
	}

	return util.Success(ctx, enquiry)
}

func (c *EnquiryController) GetByID(ctx *fiber.Ctx) error {
	id, err := strconv.ParseUint(ctx.Params("id"), 10, 32)
	if err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "无效的ID", nil)
	}

	enquiry, err := c.enquiryService.GetByID(uint(id))
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			return util.Error(ctx, appErr.HTTPStatus(), string(appErr.Code), appErr.Message, appErr.Details)
		}
		return util.Error(ctx, fiber.StatusInternalServerError, string(apperrors.ErrCodeInternal), "获取询价单失败", err.Error())
	}

	return util.Success(ctx, enquiry)
}

func (c *EnquiryController) GetChainTrace(ctx *fiber.Ctx) error {
	id, err := strconv.ParseUint(ctx.Params("id"), 10, 32)
	if err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "无效的ID", nil)
	}

	trace, err := c.enquiryService.GetChainTrace(uint(id))
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			return util.Error(ctx, appErr.HTTPStatus(), string(appErr.Code), appErr.Message, appErr.Details)
		}
		return util.Error(ctx, fiber.StatusInternalServerError, string(apperrors.ErrCodeInternal), "获取链路追踪失败", err.Error())
	}

	return util.Success(ctx, trace)
}

func (c *EnquiryController) Delete(ctx *fiber.Ctx) error {
	user := util.GetUserFromContext(ctx)

	id, err := strconv.ParseUint(ctx.Params("id"), 10, 32)
	if err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "无效的ID", nil)
	}

	ip := ctx.IP()
	if err := c.enquiryService.Delete(user, uint(id), ip); err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			return util.Error(ctx, appErr.HTTPStatus(), string(appErr.Code), appErr.Message, appErr.Details)
		}
		return util.Error(ctx, fiber.StatusInternalServerError, string(apperrors.ErrCodeInternal), "删除询价单失败", err.Error())
	}

	return util.Success(ctx, nil)
}

func (c *EnquiryController) List(ctx *fiber.Ctx) error {
	var filter dto.EnquiryFilter
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

	enquiries, total, err := c.enquiryService.List(&filter)
	if err != nil {
		return util.Error(ctx, fiber.StatusInternalServerError, string(apperrors.ErrCodeInternal), "获取询价单列表失败", err.Error())
	}

	return util.SuccessWithPagination(ctx, enquiries, filter.Page, filter.PageSize, total)
}

func (c *EnquiryController) Cancel(ctx *fiber.Ctx) error {
	user := util.GetUserFromContext(ctx)

	id, err := strconv.ParseUint(ctx.Params("id"), 10, 32)
	if err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "无效的ID", nil)
	}

	ip := ctx.IP()
	enquiry, err := c.enquiryService.Cancel(user, uint(id), ip)
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			return util.Error(ctx, appErr.HTTPStatus(), string(appErr.Code), appErr.Message, appErr.Details)
		}
		return util.Error(ctx, fiber.StatusInternalServerError, string(apperrors.ErrCodeInternal), "取消询价单失败", err.Error())
	}

	return util.Success(ctx, enquiry)
}

func (c *EnquiryController) Export(ctx *fiber.Ctx) error {
	user := util.GetUserFromContext(ctx)

	var filter dto.EnquiryFilter
	if err := ctx.BodyParser(&filter); err != nil {
		filter.Page = 1
		filter.PageSize = 10000
	}

	ip := ctx.IP()
	task, err := c.taskService.CreateTask(user, model.TaskTypeExportEnquiry, "导出询价单", filter, ip)
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			return util.Error(ctx, appErr.HTTPStatus(), string(appErr.Code), appErr.Message, appErr.Details)
		}
		return util.Error(ctx, fiber.StatusInternalServerError, string(apperrors.ErrCodeInternal), "创建导出任务失败", err.Error())
	}

	return util.Success(ctx, task)
}
