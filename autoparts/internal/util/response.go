package util

import (
	"github.com/gofiber/fiber/v2"
)

type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   *ErrorInfo  `json:"error,omitempty"`
	Meta    *MetaInfo   `json:"meta,omitempty"`
}

type ErrorInfo struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

type MetaInfo struct {
	Page     int   `json:"page"`
	PageSize int   `json:"page_size"`
	Total    int64 `json:"total"`
	Pages    int   `json:"pages"`
}

func Success(c *fiber.Ctx, data interface{}) error {
	return c.JSON(Response{
		Success: true,
		Data:    data,
	})
}

func SuccessWithPagination(c *fiber.Ctx, data interface{}, page, pageSize int, total int64) error {
	pages := int(total) / pageSize
	if int(total)%pageSize > 0 {
		pages++
	}
	return c.JSON(Response{
		Success: true,
		Data:    data,
		Meta: &MetaInfo{
			Page:     page,
			PageSize: pageSize,
			Total:    total,
			Pages:    pages,
		},
	})
}

func Error(c *fiber.Ctx, statusCode int, code, message string, details interface{}) error {
	return c.Status(statusCode).JSON(Response{
		Success: false,
		Error: &ErrorInfo{
			Code:    code,
			Message: message,
			Details: details,
		},
	})
}
