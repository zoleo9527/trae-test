package controllers

import (
	"net/http"
	"tea-distribution/internal/auth"
	"tea-distribution/internal/services"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ShipmentController struct {
	shipmentService *services.ShipmentService
}

func NewShipmentController() *ShipmentController {
	return &ShipmentController{
		shipmentService: services.NewShipmentService(),
	}
}

func (ctrl *ShipmentController) Create(c *fiber.Ctx) error {
	user := auth.GetCurrentUser(c)
	var req services.CreateShipmentRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"code":    "VALIDATION_FAILED",
			"message": "请求参数错误: " + err.Error(),
		})
	}

	shipment, err := ctrl.shipmentService.Create(&req, user.UserID, user.Name)
	if err != nil {
		return handleAppError(c, err)
	}

	return c.Status(http.StatusCreated).JSON(shipment)
}

func (ctrl *ShipmentController) GetByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"code":    "VALIDATION_FAILED",
			"message": "无效的ID",
		})
	}

	shipment, err := ctrl.shipmentService.GetByID(id)
	if err != nil {
		return handleAppError(c, err)
	}

	return c.JSON(shipment)
}

func (ctrl *ShipmentController) List(c *fiber.Ctx) error {
	filter := &services.ShipmentFilter{
		Page:     c.QueryInt("page", 1),
		PageSize: c.QueryInt("page_size", 20),
		Status:   c.Query("status"),
	}

	if allocationID := c.Query("allocation_id"); allocationID != "" {
		filter.AllocationID, _ = uuid.Parse(allocationID)
	}
	if startDate := c.Query("start_date"); startDate != "" {
		filter.StartDate, _ = time.Parse("2006-01-02", startDate)
	}
	if endDate := c.Query("end_date"); endDate != "" {
		filter.EndDate, _ = time.Parse("2006-01-02", endDate)
	}

	shipments, total, err := ctrl.shipmentService.List(filter)
	if err != nil {
		return handleAppError(c, err)
	}

	return c.JSON(fiber.Map{
		"items": shipments,
		"total": total,
		"page":  filter.Page,
		"size":  filter.PageSize,
	})
}

func (ctrl *ShipmentController) ListAbnormal(c *fiber.Ctx) error {
	page := c.QueryInt("page", 1)
	pageSize := c.QueryInt("page_size", 20)

	shipments, total, err := ctrl.shipmentService.ListAbnormalShipments(page, pageSize)
	if err != nil {
		return handleAppError(c, err)
	}

	return c.JSON(fiber.Map{
		"items": shipments,
		"total": total,
		"page":  page,
		"size":  pageSize,
	})
}

func (ctrl *ShipmentController) StartReview(c *fiber.Ctx) error {
	user := auth.GetCurrentUser(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"code":    "VALIDATION_FAILED",
			"message": "无效的ID",
		})
	}

	shipment, err := ctrl.shipmentService.StartReview(id, user.UserID, user.Name)
	if err != nil {
		return handleAppError(c, err)
	}

	return c.JSON(shipment)
}

func (ctrl *ShipmentController) Review(c *fiber.Ctx) error {
	user := auth.GetCurrentUser(c)
	var req services.ReviewShipmentRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"code":    "VALIDATION_FAILED",
			"message": "请求参数错误: " + err.Error(),
		})
	}

	review, err := ctrl.shipmentService.Review(&req, user.UserID, user.Name)
	if err != nil {
		return handleAppError(c, err)
	}

	return c.JSON(review)
}

func (ctrl *ShipmentController) ResolveDispute(c *fiber.Ctx) error {
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

	shipment, err := ctrl.shipmentService.ResolveDispute(id, user.UserID, user.Name, req.Remark)
	if err != nil {
		return handleAppError(c, err)
	}

	return c.JSON(shipment)
}
