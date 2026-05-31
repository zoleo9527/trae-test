package handler

import (
	"watch-after-sales/backend/dto"
	"watch-after-sales/backend/service"

	"github.com/gofiber/fiber/v2"
)

type ExportHandler struct {
	exportService *service.ExportService
}

func NewExportHandler(exportService *service.ExportService) *ExportHandler {
	return &ExportHandler{exportService: exportService}
}

func (h *ExportHandler) ExportRepairsCSV(c *fiber.Ctx) error {
	filter := dto.RepairFilterRequest{
		Status:     c.Query("status"),
		WatchBrand: c.Query("watch_brand"),
		Keyword:    c.Query("keyword"),
		DateFrom:   c.Query("date_from"),
		DateTo:     c.Query("date_to"),
		Page:       1,
		PageSize:   10000,
	}

	buf, appErr := h.exportService.ExportRepairsCSV(filter)
	if appErr != nil {
		return c.Status(appErr.Code).JSON(appErr)
	}

	c.Set("Content-Type", "text/csv; charset=utf-8")
	c.Set("Content-Disposition", "attachment; filename=repair_orders.csv")

	return c.Send(buf.Bytes())
}
