package utils

import (
	"github.com/gofiber/fiber/v2"
)

type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

type PaginatedResponse struct {
	Success  bool        `json:"success"`
	Message  string      `json:"message,omitempty"`
	Data     interface{} `json:"data,omitempty"`
	Page     int         `json:"page"`
	PageSize int         `json:"page_size"`
	Total    int64       `json:"total"`
	Pages    int         `json:"pages"`
}

func JSONResponse(c *fiber.Ctx, statusCode int, success bool, message string, data interface{}) error {
	return c.Status(statusCode).JSON(Response{
		Success: success,
		Message: message,
		Data:    data,
	})
}

func JSONError(c *fiber.Ctx, statusCode int, message string, err string) error {
	return c.Status(statusCode).JSON(Response{
		Success: false,
		Message: message,
		Error:   err,
	})
}

func PaginatedResult(c *fiber.Ctx, data interface{}, page, pageSize int, total int64) error {
	pages := int(total) / pageSize
	if int(total)%pageSize > 0 {
		pages++
	}
	return c.JSON(PaginatedResponse{
		Success:  true,
		Data:     data,
		Page:     page,
		PageSize: pageSize,
		Total:    total,
		Pages:    pages,
	})
}
