package handlers

import (
	"runner-platform/internal/schemas"
	"runner-platform/internal/services"
	"runner-platform/internal/utils"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type OrderHandler struct {
	orderService *services.OrderService
	validate     *validator.Validate
}

func NewOrderHandler() *OrderHandler {
	return &OrderHandler{
		orderService: services.NewOrderService(),
		validate:     validator.New(),
	}
}

func (h *OrderHandler) CreateOrder(c *fiber.Ctx) error {
	var req schemas.CreateOrderRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationError(c, "Invalid request body")
	}

	if err := h.validate.Struct(req); err != nil {
		return utils.ValidationError(c, err.Error())
	}

	order, err := h.orderService.CreateOrder(c, &req)
	if err != nil {
		return utils.Error(c, 2001, err.Error())
	}

	return utils.Success(c, order)
}

func (h *OrderHandler) GetOrder(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.ValidationError(c, "Invalid order ID")
	}

	order, err := h.orderService.GetOrderByID(id)
	if err != nil {
		return utils.NotFound(c, "Order not found")
	}

	return utils.Success(c, order)
}

func (h *OrderHandler) ListOrders(c *fiber.Ctx) error {
	var query schemas.OrderQuery
	if err := c.QueryParser(&query); err != nil {
		return utils.ValidationError(c, "Invalid query parameters")
	}

	orders, total, err := h.orderService.QueryOrders(&query)
	if err != nil {
		return utils.Error(c, 2002, err.Error())
	}

	return utils.SuccessWithPagination(c, orders, total, query.Page, query.PageSize)
}

func (h *OrderHandler) AssignOrder(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.ValidationError(c, "Invalid order ID")
	}

	var req schemas.AssignOrderRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationError(c, "Invalid request body")
	}

	if err := h.validate.Struct(req); err != nil {
		return utils.ValidationError(c, err.Error())
	}

	order, err := h.orderService.AssignOrder(c, id, &req)
	if err != nil {
		return utils.Error(c, 2003, err.Error())
	}

	return utils.Success(c, order)
}

func (h *OrderHandler) UpdateOrderStatus(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.ValidationError(c, "Invalid order ID")
	}

	var req schemas.UpdateOrderStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationError(c, "Invalid request body")
	}

	if err := h.validate.Struct(req); err != nil {
		return utils.ValidationError(c, err.Error())
	}

	order, err := h.orderService.UpdateOrderStatus(c, id, &req)
	if err != nil {
		return utils.Error(c, 2004, err.Error())
	}

	return utils.Success(c, order)
}
