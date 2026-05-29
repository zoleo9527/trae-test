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

type LockController struct {
	lockService *service.LockService
	taskService *service.TaskService
	validate    *validator.Validate
}

func NewLockController() *LockController {
	return &LockController{
		lockService: service.NewLockService(),
		taskService: service.NewTaskService(),
		validate:    validator.New(),
	}
}

func (c *LockController) Create(ctx *fiber.Ctx) error {
	user := util.GetUserFromContext(ctx)

	var req dto.CreateLockOrderRequest
	if err := ctx.BodyParser(&req); err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "请求参数错误", err.Error())
	}

	if err := c.validate.Struct(&req); err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "参数验证失败", err.Error())
	}

	ip := ctx.IP()
	lockOrder, err := c.lockService.Create(user, &req, ip)
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			return util.Error(ctx, appErr.HTTPStatus(), string(appErr.Code), appErr.Message, appErr.Details)
		}
		return util.Error(ctx, fiber.StatusInternalServerError, string(apperrors.ErrCodeInternal), "创建锁库单失败", err.Error())
	}

	return util.Success(ctx, lockOrder)
}

func (c *LockController) GetByID(ctx *fiber.Ctx) error {
	id, err := strconv.ParseUint(ctx.Params("id"), 10, 32)
	if err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "无效的ID", nil)
	}

	lockOrder, err := c.lockService.GetByID(uint(id))
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			return util.Error(ctx, appErr.HTTPStatus(), string(appErr.Code), appErr.Message, appErr.Details)
		}
		return util.Error(ctx, fiber.StatusInternalServerError, string(apperrors.ErrCodeInternal), "获取锁库单失败", err.Error())
	}

	return util.Success(ctx, lockOrder)
}

func (c *LockController) Release(ctx *fiber.Ctx) error {
	user := util.GetUserFromContext(ctx)

	id, err := strconv.ParseUint(ctx.Params("id"), 10, 32)
	if err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "无效的ID", nil)
	}

	ip := ctx.IP()
	lockOrder, err := c.lockService.Release(user, uint(id), ip)
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			return util.Error(ctx, appErr.HTTPStatus(), string(appErr.Code), appErr.Message, appErr.Details)
		}
		return util.Error(ctx, fiber.StatusInternalServerError, string(apperrors.ErrCodeInternal), "释放锁库单失败", err.Error())
	}

	return util.Success(ctx, lockOrder)
}

func (c *LockController) Pick(ctx *fiber.Ctx) error {
	user := util.GetUserFromContext(ctx)

	id, err := strconv.ParseUint(ctx.Params("id"), 10, 32)
	if err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "无效的ID", nil)
	}

	var req dto.PickLockRequest
	if err := ctx.BodyParser(&req); err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "请求参数错误", err.Error())
	}

	if err := c.validate.Struct(&req); err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "参数验证失败", err.Error())
	}

	ip := ctx.IP()
	lockOrder, err := c.lockService.Pick(user, uint(id), &req, ip)
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			return util.Error(ctx, appErr.HTTPStatus(), string(appErr.Code), appErr.Message, appErr.Details)
		}
		return util.Error(ctx, fiber.StatusInternalServerError, string(apperrors.ErrCodeInternal), "拣货失败", err.Error())
	}

	return util.Success(ctx, lockOrder)
}

func (c *LockController) RequestReturn(ctx *fiber.Ctx) error {
	user := util.GetUserFromContext(ctx)

	id, err := strconv.ParseUint(ctx.Params("id"), 10, 32)
	if err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "无效的ID", nil)
	}

	var req dto.ReturnRequest
	if err := ctx.BodyParser(&req); err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "请求参数错误", err.Error())
	}

	if err := c.validate.Struct(&req); err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "参数验证失败", err.Error())
	}

	ip := ctx.IP()
	lockOrder, err := c.lockService.RequestReturn(user, uint(id), &req, ip)
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			return util.Error(ctx, appErr.HTTPStatus(), string(appErr.Code), appErr.Message, appErr.Details)
		}
		return util.Error(ctx, fiber.StatusInternalServerError, string(apperrors.ErrCodeInternal), "申请退货失败", err.Error())
	}

	return util.Success(ctx, lockOrder)
}

func (c *LockController) ReviewReturn(ctx *fiber.Ctx) error {
	user := util.GetUserFromContext(ctx)

	lockOrderID, err := strconv.ParseUint(ctx.Params("lockOrderId"), 10, 32)
	if err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "无效的锁库单ID", nil)
	}

	itemID, err := strconv.ParseUint(ctx.Params("itemId"), 10, 32)
	if err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "无效的明细ID", nil)
	}

	var req dto.ReviewReturnRequest
	if err := ctx.BodyParser(&req); err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "请求参数错误", err.Error())
	}

	if err := c.validate.Struct(&req); err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "参数验证失败", err.Error())
	}

	ip := ctx.IP()
	lockItem, err := c.lockService.ReviewReturn(user, uint(lockOrderID), uint(itemID), &req, ip)
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			return util.Error(ctx, appErr.HTTPStatus(), string(appErr.Code), appErr.Message, appErr.Details)
		}
		return util.Error(ctx, fiber.StatusInternalServerError, string(apperrors.ErrCodeInternal), "审核退货失败", err.Error())
	}

	return util.Success(ctx, lockItem)
}

func (c *LockController) List(ctx *fiber.Ctx) error {
	var filter dto.LockOrderFilter
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

	lockOrders, total, err := c.lockService.List(&filter)
	if err != nil {
		return util.Error(ctx, fiber.StatusInternalServerError, string(apperrors.ErrCodeInternal), "获取锁库单列表失败", err.Error())
	}

	return util.SuccessWithPagination(ctx, lockOrders, filter.Page, filter.PageSize, total)
}

func (c *LockController) BatchRelease(ctx *fiber.Ctx) error {
	user := util.GetUserFromContext(ctx)

	var req dto.IDsRequest
	if err := ctx.BodyParser(&req); err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "请求参数错误", err.Error())
	}

	if err := c.validate.Struct(&req); err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "参数验证失败", err.Error())
	}

	ip := ctx.IP()
	result, err := c.lockService.BatchRelease(user, req.IDs, ip)
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			return util.Error(ctx, appErr.HTTPStatus(), string(appErr.Code), appErr.Message, appErr.Details)
		}
		return util.Error(ctx, fiber.StatusInternalServerError, string(apperrors.ErrCodeInternal), "批量释放失败", err.Error())
	}

	return util.Success(ctx, result)
}

func (c *LockController) Export(ctx *fiber.Ctx) error {
	user := util.GetUserFromContext(ctx)

	var filter dto.LockOrderFilter
	if err := ctx.BodyParser(&filter); err != nil {
		filter.Page = 1
		filter.PageSize = 10000
	}

	ip := ctx.IP()
	task, err := c.taskService.CreateTask(user, model.TaskTypeExportLock, "导出锁库单", filter, ip)
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			return util.Error(ctx, appErr.HTTPStatus(), string(appErr.Code), appErr.Message, appErr.Details)
		}
		return util.Error(ctx, fiber.StatusInternalServerError, string(apperrors.ErrCodeInternal), "创建导出任务失败", err.Error())
	}

	return util.Success(ctx, task)
}
