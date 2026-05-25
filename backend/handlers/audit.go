package handlers

import (
	"gallery-system/database"
	"gallery-system/models"
	"gallery-system/utils"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

func GetAuditLogs(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "20"))
	module := c.Query("module")
	action := c.Query("action")
	operatorID := c.Query("operator_id")
	resourceType := c.Query("resource_type")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	offset := (page - 1) * pageSize

	query := database.DB.Model(&models.AuditLog{})

	if module != "" {
		query = query.Where("module = ?", module)
	}
	if action != "" {
		query = query.Where("action = ?", action)
	}
	if operatorID != "" {
		query = query.Where("operator_id = ?", operatorID)
	}
	if resourceType != "" {
		query = query.Where("resource_type = ?", resourceType)
	}
	if startDate != "" {
		query = query.Where("created_at >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("created_at <= ?", endDate)
	}

	var total int64
	query.Count(&total)

	var logs []models.AuditLog
	if err := query.Preload("Operator").
		Order("created_at DESC").
		Offset(offset).Limit(pageSize).
		Find(&logs).Error; err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "查询失败", err.Error())
	}

	return utils.PaginatedResult(c, logs, page, pageSize, total)
}

func GetAuditLogDetail(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID格式错误", err.Error())
	}

	var log models.AuditLog
	if err := database.DB.Preload("Operator").First(&log, id).Error; err != nil {
		return utils.JSONError(c, fiber.StatusNotFound, "日志不存在", err.Error())
	}

	return utils.JSONResponse(c, fiber.StatusOK, true, "", log)
}

func GetSystemLogs(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "50"))
	level := c.Query("level")
	module := c.Query("module")
	traceID := c.Query("trace_id")

	offset := (page - 1) * pageSize

	query := database.DB.Model(&models.SystemLog{})

	if level != "" {
		query = query.Where("level = ?", level)
	}
	if module != "" {
		query = query.Where("module = ?", module)
	}
	if traceID != "" {
		query = query.Where("trace_id = ?", traceID)
	}

	var total int64
	query.Count(&total)

	var logs []models.SystemLog
	if err := query.Order("created_at DESC").
		Offset(offset).Limit(pageSize).
		Find(&logs).Error; err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "查询失败", err.Error())
	}

	return utils.PaginatedResult(c, logs, page, pageSize, total)
}

func GetAuditTrace(c *fiber.Ctx) error {
	resourceType := c.Query("resource_type")
	resourceNo := c.Query("resource_no")

	if resourceType == "" || resourceNo == "" {
		return utils.JSONError(c, fiber.StatusBadRequest, "请提供资源类型和资源编号", "")
	}

	var logs []models.AuditLog
	if err := database.DB.Where("resource_type = ? AND resource_no = ?", resourceType, resourceNo).
		Preload("Operator").
		Order("created_at ASC").
		Find(&logs).Error; err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "查询失败", err.Error())
	}

	return utils.JSONResponse(c, fiber.StatusOK, true, "", logs)
}
