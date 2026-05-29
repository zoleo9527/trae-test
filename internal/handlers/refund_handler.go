package handlers

import (
	"runner-platform/internal/schemas"
	"runner-platform/internal/services"
	"runner-platform/internal/utils"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type RefundHandler struct {
	refundService *services.RefundService
	validate      *validator.Validate
}

func NewRefundHandler() *RefundHandler {
	return &RefundHandler{
		refundService: services.NewRefundService(),
		validate:      validator.New(),
	}
}

func (h *RefundHandler) CreateRefund(c *fiber.Ctx) error {
	var req schemas.CreateRefundRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationError(c, "Invalid request body")
	}

	if err := h.validate.Struct(req); err != nil {
		return utils.ValidationError(c, err.Error())
	}

	refund, err := h.refundService.CreateRefund(c, &req)
	if err != nil {
		return utils.Error(c, 3001, err.Error())
	}

	return utils.Success(c, refund)
}

func (h *RefundHandler) GetRefund(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.ValidationError(c, "Invalid refund ID")
	}

	refund, err := h.refundService.GetRefundByID(c, id)
	if err != nil {
		return utils.NotFound(c, err.Error())
	}

	return utils.Success(c, refund)
}

func (h *RefundHandler) GetRefundDetail(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.ValidationError(c, "Invalid refund ID")
	}

	detail, err := h.refundService.GetRefundDetail(c, id)
	if err != nil {
		return utils.NotFound(c, err.Error())
	}

	return utils.Success(c, detail)
}

func (h *RefundHandler) ListRefunds(c *fiber.Ctx) error {
	var query schemas.RefundQuery
	if err := c.QueryParser(&query); err != nil {
		return utils.ValidationError(c, "Invalid query parameters")
	}

	refunds, total, err := h.refundService.QueryRefunds(c, &query)
	if err != nil {
		return utils.Error(c, 3002, err.Error())
	}

	return utils.SuccessWithPagination(c, refunds, total, query.Page, query.PageSize)
}

func (h *RefundHandler) UpdateRefund(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.ValidationError(c, "Invalid refund ID")
	}

	var req schemas.UpdateRefundRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationError(c, "Invalid request body")
	}

	if err := h.validate.Struct(req); err != nil {
		return utils.ValidationError(c, err.Error())
	}

	refund, err := h.refundService.UpdateRefund(c, id, &req)
	if err != nil {
		return utils.Error(c, 3003, err.Error())
	}

	return utils.Success(c, refund)
}

func (h *RefundHandler) ReviewRefund(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.ValidationError(c, "Invalid refund ID")
	}

	var req schemas.ReviewRefundRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationError(c, "Invalid request body")
	}

	if err := h.validate.Struct(req); err != nil {
		return utils.ValidationError(c, err.Error())
	}

	refund, err := h.refundService.ReviewRefund(c, id, &req)
	if err != nil {
		return utils.Error(c, 3004, err.Error())
	}

	return utils.Success(c, refund)
}

func (h *RefundHandler) AddRemark(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return utils.ValidationError(c, "Invalid refund ID")
	}

	var req schemas.AddRemarkRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationError(c, "Invalid request body")
	}

	if err := h.validate.Struct(req); err != nil {
		return utils.ValidationError(c, err.Error())
	}

	remark, err := h.refundService.AddRemark(c, id, &req)
	if err != nil {
		return utils.Error(c, 3005, err.Error())
	}

	return utils.Success(c, remark)
}
