package controllers

import (
	"net/http"
	"os"
	"tea-distribution/internal/auth"
	"tea-distribution/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ExportController struct {
	exportService *services.ExportService
}

func NewExportController() *ExportController {
	return &ExportController{
		exportService: services.NewExportService(),
	}
}

func (ctrl *ExportController) ExportOrders(c *fiber.Ctx) error {
	user := auth.GetCurrentUser(c)
	var payload services.ExportOrdersPayload
	if err := c.BodyParser(&payload); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"code":    "VALIDATION_FAILED",
			"message": "请求参数错误: " + err.Error(),
		})
	}

	task, err := ctrl.exportService.ExportOrders(&payload, user.UserID)
	if err != nil {
		return handleAppError(c, err)
	}

	return c.Status(http.StatusAccepted).JSON(task)
}

func (ctrl *ExportController) ExportShipments(c *fiber.Ctx) error {
	user := auth.GetCurrentUser(c)
	var payload services.ExportShipmentsPayload
	if err := c.BodyParser(&payload); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"code":    "VALIDATION_FAILED",
			"message": "请求参数错误: " + err.Error(),
		})
	}

	task, err := ctrl.exportService.ExportShipments(&payload, user.UserID)
	if err != nil {
		return handleAppError(c, err)
	}

	return c.Status(http.StatusAccepted).JSON(task)
}

func (ctrl *ExportController) GetTask(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"code":    "VALIDATION_FAILED",
			"message": "无效的ID",
		})
	}

	task, err := ctrl.exportService.GetExportTask(id)
	if err != nil {
		return handleAppError(c, err)
	}

	return c.JSON(task)
}

func (ctrl *ExportController) ListTasks(c *fiber.Ctx) error {
	user := auth.GetCurrentUser(c)
	status := c.Query("status")
	page := c.QueryInt("page", 1)
	pageSize := c.QueryInt("page_size", 20)

	tasks, total, err := ctrl.exportService.ListExportTasks(user.UserID, status, page, pageSize)
	if err != nil {
		return handleAppError(c, err)
	}

	return c.JSON(fiber.Map{
		"items": tasks,
		"total": total,
		"page":  page,
		"size":  pageSize,
	})
}

func (ctrl *ExportController) Download(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"code":    "VALIDATION_FAILED",
			"message": "无效的ID",
		})
	}

	task, err := ctrl.exportService.GetExportTask(id)
	if err != nil {
		return handleAppError(c, err)
	}

	if task.Status != "done" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"code":    "TASK_NOT_COMPLETED",
			"message": "任务尚未完成",
		})
	}

	if task.FilePath == "" {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{
			"code":    "FILE_NOT_FOUND",
			"message": "文件不存在",
		})
	}

	if _, err := os.Stat(task.FilePath); os.IsNotExist(err) {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{
			"code":    "FILE_NOT_FOUND",
			"message": "文件已被删除",
		})
	}

	return c.Download(task.FilePath)
}
