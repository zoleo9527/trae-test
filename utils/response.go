package utils

import "github.com/gofiber/fiber/v2"

type Pagination struct {
	Page     int `json:"page"`
	PageSize int `json:"page_size"`
	Total    int64 `json:"total"`
	Pages    int `json:"pages"`
}

type Response struct {
	Success    bool        `json:"success"`
	Data       interface{} `json:"data,omitempty"`
	Message    string      `json:"message,omitempty"`
	Pagination *Pagination `json:"pagination,omitempty"`
}

func SuccessResponse(c *fiber.Ctx, data interface{}) error {
	return c.JSON(Response{
		Success: true,
		Data:    data,
	})
}

func SuccessResponseWithPagination(c *fiber.Ctx, data interface{}, page, pageSize int, total int64) error {
	pages := int(total) / pageSize
	if int(total)%pageSize > 0 {
		pages++
	}

	return c.JSON(Response{
		Success: true,
		Data:    data,
		Pagination: &Pagination{
			Page:     page,
			PageSize: pageSize,
			Total:    total,
			Pages:    pages,
		},
	})
}

func ErrorResponse(c *fiber.Ctx, status int, message string) error {
	return c.Status(status).JSON(Response{
		Success: false,
		Message: message,
	})
}
