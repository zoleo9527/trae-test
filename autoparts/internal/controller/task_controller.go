package controller

import (
	"strconv"

	"autoparts/internal/service"
	"autoparts/internal/util"
	apperrors "autoparts/pkg/errors"

	"github.com/gofiber/fiber/v2"
)

type TaskController struct {
	taskService *service.TaskService
}

func NewTaskController() *TaskController {
	return &TaskController{
		taskService: service.NewTaskService(),
	}
}

func (c *TaskController) GetByID(ctx *fiber.Ctx) error {
	id, err := strconv.ParseUint(ctx.Params("id"), 10, 32)
	if err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "无效的ID", nil)
	}

	task, err := c.taskService.GetTask(uint(id))
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			return util.Error(ctx, appErr.HTTPStatus(), string(appErr.Code), appErr.Message, appErr.Details)
		}
		return util.Error(ctx, fiber.StatusInternalServerError, string(apperrors.ErrCodeInternal), "获取任务失败", err.Error())
	}

	return util.Success(ctx, task)
}

func (c *TaskController) List(ctx *fiber.Ctx) error {
	user := util.GetUserFromContext(ctx)

	page, _ := strconv.Atoi(ctx.Query("page", "1"))
	pageSize, _ := strconv.Atoi(ctx.Query("page_size", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	tasks, total, err := c.taskService.GetUserTasks(user.ID, page, pageSize)
	if err != nil {
		return util.Error(ctx, fiber.StatusInternalServerError, string(apperrors.ErrCodeInternal), "获取任务列表失败", err.Error())
	}

	return util.SuccessWithPagination(ctx, tasks, page, pageSize, total)
}
