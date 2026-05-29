package utils

import (
	"net/http"

	"github.com/gofiber/fiber/v2"
)

type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

type PaginationResponse struct {
	Total    int64       `json:"total"`
	Page     int         `json:"page"`
	PageSize int         `json:"page_size"`
	List     interface{} `json:"list"`
}

func Success(c *fiber.Ctx, data interface{}) error {
	return c.JSON(Response{
		Code:    0,
		Message: "success",
		Data:    data,
	})
}

func SuccessWithPagination(c *fiber.Ctx, list interface{}, total int64, page, pageSize int) error {
	return c.JSON(Response{
		Code:    0,
		Message: "success",
		Data: PaginationResponse{
			Total:    total,
			Page:     page,
			PageSize: pageSize,
			List:     list,
		},
	})
}

func Error(c *fiber.Ctx, code int, message string) error {
	return c.Status(http.StatusBadRequest).JSON(Response{
		Code:    code,
		Message: message,
	})
}

func ErrorWithStatus(c *fiber.Ctx, statusCode, code int, message string) error {
	return c.Status(statusCode).JSON(Response{
		Code:    code,
		Message: message,
	})
}

func Unauthorized(c *fiber.Ctx, message string) error {
	return ErrorWithStatus(c, http.StatusUnauthorized, 401, message)
}

func Forbidden(c *fiber.Ctx, message string) error {
	return ErrorWithStatus(c, http.StatusForbidden, 403, message)
}

func NotFound(c *fiber.Ctx, message string) error {
	return ErrorWithStatus(c, http.StatusNotFound, 404, message)
}

func ValidationError(c *fiber.Ctx, message string) error {
	return ErrorWithStatus(c, http.StatusUnprocessableEntity, 422, message)
}
