package controller

import (
	"strconv"

	"autoparts/internal/dto"
	"autoparts/internal/service"
	"autoparts/internal/util"
	apperrors "autoparts/pkg/errors"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

type CustomerController struct {
	customerService *service.CustomerService
	validate        *validator.Validate
}

func NewCustomerController() *CustomerController {
	return &CustomerController{
		customerService: service.NewCustomerService(),
		validate:        validator.New(),
	}
}

func (c *CustomerController) Create(ctx *fiber.Ctx) error {
	user := util.GetUserFromContext(ctx)

	var req dto.CreateCustomerRequest
	if err := ctx.BodyParser(&req); err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "请求参数错误", err.Error())
	}

	if err := c.validate.Struct(&req); err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "参数验证失败", err.Error())
	}

	ip := ctx.IP()
	customer, err := c.customerService.Create(user, &req, ip)
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			return util.Error(ctx, appErr.HTTPStatus(), string(appErr.Code), appErr.Message, appErr.Details)
		}
		return util.Error(ctx, fiber.StatusInternalServerError, string(apperrors.ErrCodeInternal), "创建客户失败", err.Error())
	}

	return util.Success(ctx, customer)
}

func (c *CustomerController) Update(ctx *fiber.Ctx) error {
	user := util.GetUserFromContext(ctx)

	id, err := strconv.ParseUint(ctx.Params("id"), 10, 32)
	if err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "无效的ID", nil)
	}

	var req dto.UpdateCustomerRequest
	if err := ctx.BodyParser(&req); err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "请求参数错误", err.Error())
	}

	if err := c.validate.Struct(&req); err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "参数验证失败", err.Error())
	}

	ip := ctx.IP()
	customer, err := c.customerService.Update(user, uint(id), &req, ip)
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			return util.Error(ctx, appErr.HTTPStatus(), string(appErr.Code), appErr.Message, appErr.Details)
		}
		return util.Error(ctx, fiber.StatusInternalServerError, string(apperrors.ErrCodeInternal), "更新客户失败", err.Error())
	}

	return util.Success(ctx, customer)
}

func (c *CustomerController) GetByID(ctx *fiber.Ctx) error {
	id, err := strconv.ParseUint(ctx.Params("id"), 10, 32)
	if err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "无效的ID", nil)
	}

	customer, err := c.customerService.GetByID(uint(id))
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			return util.Error(ctx, appErr.HTTPStatus(), string(appErr.Code), appErr.Message, appErr.Details)
		}
		return util.Error(ctx, fiber.StatusInternalServerError, string(apperrors.ErrCodeInternal), "获取客户失败", err.Error())
	}

	return util.Success(ctx, customer)
}

func (c *CustomerController) Delete(ctx *fiber.Ctx) error {
	user := util.GetUserFromContext(ctx)

	id, err := strconv.ParseUint(ctx.Params("id"), 10, 32)
	if err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "无效的ID", nil)
	}

	ip := ctx.IP()
	if err := c.customerService.Delete(user, uint(id), ip); err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			return util.Error(ctx, appErr.HTTPStatus(), string(appErr.Code), appErr.Message, appErr.Details)
		}
		return util.Error(ctx, fiber.StatusInternalServerError, string(apperrors.ErrCodeInternal), "删除客户失败", err.Error())
	}

	return util.Success(ctx, nil)
}

func (c *CustomerController) List(ctx *fiber.Ctx) error {
	var filter dto.CustomerFilter
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

	customers, total, err := c.customerService.List(&filter)
	if err != nil {
		return util.Error(ctx, fiber.StatusInternalServerError, string(apperrors.ErrCodeInternal), "获取客户列表失败", err.Error())
	}

	return util.SuccessWithPagination(ctx, customers, filter.Page, filter.PageSize, total)
}
