package api

import (
	"net/http"
	"strconv"

	"carwash-system/middleware"
	"carwash-system/models"

	"github.com/gofiber/fiber/v2"
)

func GetRepairOrders(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "20"))
	status := c.Query("status")
	priority := c.Query("priority")
	siteID := c.Query("site_id")

	user := middleware.GetCurrentUser(c)

	query := models.DB.Model(&models.RepairOrder{}).Preload("Device.Site").Preload("Reporter").Preload("Handler")

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if priority != "" {
		query = query.Where("priority = ?", priority)
	}
	if siteID != "" {
		query = query.Joins("JOIN devices ON devices.id = repair_orders.device_id").Where("devices.site_id = ?", siteID)
	}

	if user.Role == "inspector" {
		query = query.Where("handler_id = ? OR status = ?", user.UserID, "pending")
	}

	var total int64
	query.Count(&total)

	var orders []models.RepairOrder
	query.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&orders)

	return c.JSON(fiber.Map{
		"items": orders,
		"total": total,
		"page":  page,
		"size":  pageSize,
	})
}

func GetRepairDetail(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))
	var order models.RepairOrder
	if err := models.DB.Preload("Device.Site").Preload("Reporter").Preload("Handler").First(&order, id).Error; err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "报修单不存在"})
	}
	return c.JSON(order)
}

func CreateRepairOrder(c *fiber.Ctx) error {
	var order models.RepairOrder
	if err := c.BodyParser(&order); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "参数错误"})
	}

	user := middleware.GetCurrentUser(c)
	order.ReporterID = user.UserID
	order.Status = "pending"
	order.Level = 1

	if err := models.DB.Create(&order).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "创建失败"})
	}

	models.DB.Create(&models.TicketLog{
		TicketType: "repair",
		TicketID:   order.ID,
		Action:     "create",
		OperatorID: user.UserID,
		Remark:     "创建报修单",
		NewStatus:  "pending",
	})

	return c.JSON(order)
}

type UpdateStatusRequest struct {
	Status string `json:"status"`
	Remark string `json:"remark"`
}

func UpdateRepairStatus(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))
	var order models.RepairOrder
	if err := models.DB.First(&order, id).Error; err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "报修单不存在"})
	}

	var req UpdateStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "参数错误"})
	}

	user := middleware.GetCurrentUser(c)
	oldStatus := order.Status
	order.Status = req.Status

	if req.Status == "processing" && order.HandlerID == nil {
		order.HandlerID = &user.UserID
	}

	models.DB.Save(&order)

	models.DB.Create(&models.TicketLog{
		TicketType: "repair",
		TicketID:   order.ID,
		Action:     "update_status",
		OperatorID: user.UserID,
		Remark:     req.Remark,
		OldStatus:  oldStatus,
		NewStatus:  req.Status,
	})

	return c.JSON(order)
}

func EscalateRepair(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))
	var order models.RepairOrder
	if err := models.DB.First(&order, id).Error; err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "报修单不存在"})
	}

	user := middleware.GetCurrentUser(c)
	oldLevel := order.Level
	order.Level++
	order.Status = "escalated"

	models.DB.Save(&order)

	models.DB.Create(&models.TicketLog{
		TicketType: "repair",
		TicketID:   order.ID,
		Action:     "escalate",
		OperatorID: user.UserID,
		Remark:     "异常升级",
		OldStatus:  string(rune(oldLevel)),
		NewStatus:  string(rune(order.Level)),
	})

	return c.JSON(order)
}

func GetRepairLogs(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))
	var logs []models.TicketLog
	models.DB.Where("ticket_type = ? AND ticket_id = ?", "repair", id).
		Preload("Operator").Order("created_at ASC").Find(&logs)
	return c.JSON(logs)
}

func GetRefundRequests(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "20"))
	status := c.Query("status")

	user := middleware.GetCurrentUser(c)

	query := models.DB.Model(&models.RefundRequest{}).Preload("Member").Preload("Applicant").Preload("Reviewer")

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if user.Role == "service" {
		query = query.Where("applicant_id = ?", user.UserID)
	}

	var total int64
	query.Count(&total)

	var requests []models.RefundRequest
	query.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&requests)

	return c.JSON(fiber.Map{
		"items": requests,
		"total": total,
		"page":  page,
		"size":  pageSize,
	})
}

func GetRefundDetail(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))
	var req models.RefundRequest
	if err := models.DB.Preload("Member").Preload("Applicant").Preload("Reviewer").First(&req, id).Error; err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "退款申请不存在"})
	}
	return c.JSON(req)
}

func CreateRefundRequest(c *fiber.Ctx) error {
	var req models.RefundRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "参数错误"})
	}

	user := middleware.GetCurrentUser(c)
	req.ApplicantID = user.UserID
	req.Status = "pending"

	models.DB.Create(&req)

	models.DB.Create(&models.TicketLog{
		TicketType: "refund",
		TicketID:   req.ID,
		Action:     "create",
		OperatorID: user.UserID,
		Remark:     "创建退款申请",
		NewStatus:  "pending",
	})

	return c.JSON(req)
}

type ReviewRequest struct {
	Status        string `json:"status"`
	ReviewOpinion string `json:"review_opinion"`
}

func ReviewRefund(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))
	var req models.RefundRequest
	if err := models.DB.First(&req, id).Error; err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "退款申请不存在"})
	}

	var review ReviewRequest
	if err := c.BodyParser(&review); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "参数错误"})
	}

	user := middleware.GetCurrentUser(c)
	oldStatus := req.Status
	req.Status = review.Status
	req.ReviewOpinion = review.ReviewOpinion
	req.ReviewerID = &user.UserID

	if review.Status == "approved" {
		now := models.DB.Config.NowFunc()
		req.RefundTime = &now
	}

	models.DB.Save(&req)

	models.DB.Create(&models.TicketLog{
		TicketType: "refund",
		TicketID:   req.ID,
		Action:     "review",
		OperatorID: user.UserID,
		Remark:     review.ReviewOpinion,
		OldStatus:  oldStatus,
		NewStatus:  review.Status,
	})

	return c.JSON(req)
}
