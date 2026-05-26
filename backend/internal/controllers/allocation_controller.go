package controllers

import (
	"net/http"
	"tea-distribution/internal/auth"
	"tea-distribution/internal/services"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type AllocationController struct {
	allocationService *services.AllocationService
}

func NewAllocationController() *AllocationController {
	return &AllocationController{
		allocationService: services.NewAllocationService(),
	}
}

func (ctrl *AllocationController) Create(c *fiber.Ctx) error {
	user := auth.GetCurrentUser(c)
	var req services.CreateAllocationRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"code":    "VALIDATION_FAILED",
			"message": "请求参数错误: " + err.Error(),
		})
	}

	allocation, err := ctrl.allocationService.Create(&req, user.UserID, user.Name)
	if err != nil {
		return handleAppError(c, err)
	}

	return c.Status(http.StatusCreated).JSON(allocation)
}

func (ctrl *AllocationController) GetByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"code":    "VALIDATION_FAILED",
			"message": "无效的ID",
		})
	}

	allocation, err := ctrl.allocationService.GetByID(id)
	if err != nil {
		return handleAppError(c, err)
	}

	return c.JSON(allocation)
}

func (ctrl *AllocationController) List(c *fiber.Ctx) error {
	filter := &services.AllocationFilter{
		Page:     c.QueryInt("page", 1),
		PageSize: c.QueryInt("page_size", 20),
		Status:   c.Query("status"),
	}

	if orderID := c.Query("order_id"); orderID != "" {
		filter.OrderID, _ = uuid.Parse(orderID)
	}
	if warehouseID := c.Query("warehouse_id"); warehouseID != "" {
		filter.WarehouseID, _ = uuid.Parse(warehouseID)
	}
	if startDate := c.Query("start_date"); startDate != "" {
		filter.StartDate, _ = time.Parse("2006-01-02", startDate)
	}
	if endDate := c.Query("end_date"); endDate != "" {
		filter.EndDate, _ = time.Parse("2006-01-02", endDate)
	}

	allocations, total, err := ctrl.allocationService.List(filter)
	if err != nil {
		return handleAppError(c, err)
	}

	return c.JSON(fiber.Map{
		"items": allocations,
		"total": total,
		"page":  filter.Page,
		"size":  filter.PageSize,
	})
}

func (ctrl *AllocationController) StartPicking(c *fiber.Ctx) error {
	user := auth.GetCurrentUser(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"code":    "VALIDATION_FAILED",
			"message": "无效的ID",
		})
	}

	allocation, err := ctrl.allocationService.StartPicking(id, user.UserID, user.Name)
	if err != nil {
		return handleAppError(c, err)
	}

	return c.JSON(allocation)
}

func (ctrl *AllocationController) ConfirmPacked(c *fiber.Ctx) error {
	user := auth.GetCurrentUser(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"code":    "VALIDATION_FAILED",
			"message": "无效的ID",
		})
	}

	var req struct {
		PickedItems []map[string]interface{} `json:"picked_items"`
	}
	c.BodyParser(&req)

	allocation, err := ctrl.allocationService.ConfirmPacked(id, user.UserID, user.Name, req.PickedItems)
	if err != nil {
		return handleAppError(c, err)
	}

	return c.JSON(allocation)
}

func (ctrl *AllocationController) MarkException(c *fiber.Ctx) error {
	user := auth.GetCurrentUser(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"code":    "VALIDATION_FAILED",
			"message": "无效的ID",
		})
	}

	var req struct {
		ExceptionMsg string `json:"exception_msg" validate:"required"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"code":    "VALIDATION_FAILED",
			"message": "请填写异常原因",
		})
	}

	allocation, err := ctrl.allocationService.MarkException(id, user.UserID, user.Name, req.ExceptionMsg)
	if err != nil {
		return handleAppError(c, err)
	}

	return c.JSON(allocation)
}

func (ctrl *AllocationController) ResolveException(c *fiber.Ctx) error {
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

	allocation, err := ctrl.allocationService.ResolveException(id, user.UserID, user.Name, req.Remark)
	if err != nil {
		return handleAppError(c, err)
	}

	return c.JSON(allocation)
}
