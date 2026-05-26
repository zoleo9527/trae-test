package controllers

import (
	"net/http"
	"tea-distribution/internal/auth"
	"tea-distribution/internal/models"
	"tea-distribution/internal/services"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type OrderController struct {
	orderService *services.OrderService
}

func NewOrderController() *OrderController {
	return &OrderController{
		orderService: services.NewOrderService(),
	}
}

func (ctrl *OrderController) Create(c *fiber.Ctx) error {
	user := auth.GetCurrentUser(c)
	var req services.CreateOrderRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"code":    "VALIDATION_FAILED",
			"message": "请求参数错误: " + err.Error(),
		})
	}

	order, err := ctrl.orderService.Create(&req, user.UserID, user.Name)
	if err != nil {
		return handleAppError(c, err)
	}

	return c.Status(http.StatusCreated).JSON(order)
}

func (ctrl *OrderController) GetByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"code":    "VALIDATION_FAILED",
			"message": "无效的ID",
		})
	}

	order, err := ctrl.orderService.GetByID(id)
	if err != nil {
		return handleAppError(c, err)
	}

	return c.JSON(order)
}

func (ctrl *OrderController) List(c *fiber.Ctx) error {
	filter := &services.OrderFilter{
		Page:     c.QueryInt("page", 1),
		PageSize: c.QueryInt("page_size", 20),
		Status:   c.Query("status"),
		Keyword:  c.Query("keyword"),
	}

	if storeID := c.Query("store_id"); storeID != "" {
		filter.StoreID, _ = uuid.Parse(storeID)
	}
	if salesID := c.Query("sales_id"); salesID != "" {
		filter.SalesID, _ = uuid.Parse(salesID)
	}
	if startDate := c.Query("start_date"); startDate != "" {
		filter.StartDate, _ = time.Parse("2006-01-02", startDate)
	}
	if endDate := c.Query("end_date"); endDate != "" {
		filter.EndDate, _ = time.Parse("2006-01-02", endDate)
	}

	orders, total, err := ctrl.orderService.List(filter)
	if err != nil {
		return handleAppError(c, err)
	}

	return c.JSON(fiber.Map{
		"items": orders,
		"total": total,
		"page":  filter.Page,
		"size":  filter.PageSize,
	})
}

func (ctrl *OrderController) Submit(c *fiber.Ctx) error {
	user := auth.GetCurrentUser(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"code":    "VALIDATION_FAILED",
			"message": "无效的ID",
		})
	}

	order, err := ctrl.orderService.Submit(id, user.UserID, user.Name)
	if err != nil {
		return handleAppError(c, err)
	}

	return c.JSON(order)
}

func (ctrl *OrderController) Approve(c *fiber.Ctx) error {
	user := auth.GetCurrentUser(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"code":    "VALIDATION_FAILED",
			"message": "无效的ID",
		})
	}

	var req struct {
		Remark string `json:"remark"`
	}
	c.BodyParser(&req)

	order, err := ctrl.orderService.Approve(id, user.UserID, user.Name, req.Remark)
	if err != nil {
		return handleAppError(c, err)
	}

	return c.JSON(order)
}

func (ctrl *OrderController) Reject(c *fiber.Ctx) error {
	user := auth.GetCurrentUser(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"code":    "VALIDATION_FAILED",
			"message": "无效的ID",
		})
	}

	var req struct {
		Reason string `json:"reason" validate:"required"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"code":    "VALIDATION_FAILED",
			"message": "请填写驳回原因",
		})
	}

	order, err := ctrl.orderService.Reject(id, user.UserID, user.Name, req.Reason)
	if err != nil {
		return handleAppError(c, err)
	}

	return c.JSON(order)
}

func (ctrl *OrderController) Cancel(c *fiber.Ctx) error {
	user := auth.GetCurrentUser(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"code":    "VALIDATION_FAILED",
			"message": "无效的ID",
		})
	}

	var req struct {
		Reason string `json:"reason" validate:"required"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"code":    "VALIDATION_FAILED",
			"message": "请填写取消原因",
		})
	}

	order, err := ctrl.orderService.Cancel(id, user.UserID, user.Name, req.Reason)
	if err != nil {
		return handleAppError(c, err)
	}

	return c.JSON(order)
}

func (ctrl *OrderController) BatchSubmit(c *fiber.Ctx) error {
	user := auth.GetCurrentUser(c)
	var req struct {
		IDs []uuid.UUID `json:"ids" validate:"required"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"code":    "VALIDATION_FAILED",
			"message": "请求参数错误",
		})
	}

	success, failed, errors := ctrl.orderService.BatchSubmit(req.IDs, user.UserID, user.Name)

	return c.JSON(fiber.Map{
		"success": success,
		"failed":  failed,
		"errors":  errors,
	})
}

func (ctrl *OrderController) BatchApprove(c *fiber.Ctx) error {
	user := auth.GetCurrentUser(c)
	var req struct {
		IDs    []uuid.UUID `json:"ids" validate:"required"`
		Remark string      `json:"remark"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"code":    "VALIDATION_FAILED",
			"message": "请求参数错误",
		})
	}

	success, failed, errors := ctrl.orderService.BatchApprove(req.IDs, user.UserID, user.Name, req.Remark)

	return c.JSON(fiber.Map{
		"success": success,
		"failed":  failed,
		"errors":  errors,
	})
}

func handleAppError(c *fiber.Ctx, err error) error {
	if appErr, ok := err.(*models.AppError); ok {
		status := http.StatusInternalServerError
		switch appErr.Code {
		case "VALIDATION_FAILED":
			status = http.StatusBadRequest
		case "NOT_FOUND":
			status = http.StatusNotFound
		case "PERMISSION_DENIED":
			status = http.StatusForbidden
		case "STATUS_CONFLICT":
			status = http.StatusConflict
		case "INSUFFICIENT_STOCK":
			status = http.StatusBadRequest
		case "PRICE_CONFLICT":
			status = http.StatusBadRequest
		case "BATCH_MIXED":
			status = http.StatusBadRequest
		}
		return c.Status(status).JSON(appErr)
	}
	return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
		"code":    "INTERNAL_ERROR",
		"message": err.Error(),
	})
}
