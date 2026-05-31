package handlers

import (
	"bakery-system/backend/database"
	"bakery-system/backend/models"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
)

type RefundHandler struct{}

func NewRefundHandler() *RefundHandler {
	return &RefundHandler{}
}

func (h *RefundHandler) GetRefunds(c *fiber.Ctx) error {
	var refunds []models.Refund
	query := database.DB.Model(&models.Refund{}).Preload("Order")

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if search := c.Query("search"); search != "" {
		query = query.Where("refund_no LIKE ? OR member_name LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	query.Order("created_at desc").Find(&refunds)
	return c.JSON(fiber.Map{"data": refunds})
}

func (h *RefundHandler) GetRefund(c *fiber.Ctx) error {
	id := c.Params("id")
	var refund models.Refund
	if err := database.DB.Preload("Order").Preload("Order.Items").First(&refund, "id = ?", id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Refund not found"})
	}

	var statusLogs []models.StatusLog
	database.DB.Where("related_id = ? AND related_type = ?", id, "refund").Order("created_at asc").Find(&statusLogs)
	refund.StatusHistory = statusLogs

	return c.JSON(refund)
}

func (h *RefundHandler) CreateRefund(c *fiber.Ctx) error {
	var refund models.Refund
	if err := c.BodyParser(&refund); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	refund.RefundNo = fmt.Sprintf("REF%s%06d", time.Now().Format("20060102"), time.Now().Unix()%1000000)
	refund.Status = "pending"

	var order models.Order
	database.DB.First(&order, "id = ?", refund.OrderID)
	refund.MemberID = order.MemberID
	refund.MemberName = order.MemberName

	database.DB.Create(&refund)
	database.AddStatusLog(refund.ID, "refund", "", "pending", refund.Applicant, "退款申请创建")

	return c.Status(201).JSON(refund)
}

func (h *RefundHandler) ApproveRefund(c *fiber.Ctx) error {
	id := c.Params("id")
	var refund models.Refund
	if err := database.DB.First(&refund, "id = ?", id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Refund not found"})
	}

	var data struct {
		Reviewer string `json:"reviewer"`
		Remark   string `json:"remark"`
	}
	if err := c.BodyParser(&data); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	tx := database.DB.Begin()

	now := time.Now()
	tx.Model(&refund).Updates(map[string]interface{}{
		"status":      "approved",
		"reviewer":    data.Reviewer,
		"review_time": now,
	})

	if refund.RefundType == "balance" {
		var member models.Member
		tx.First(&member, "id = ?", refund.MemberID)
		tx.Model(&member).Update("balance", member.Balance+refund.RefundAmount)
		database.AddStatusLog(member.ID, "recharge", "", "completed", data.Reviewer,
			fmt.Sprintf("退款退回余额: %.2f, 退款单号: %s", refund.RefundAmount, refund.RefundNo))
	}

	tx.Commit()

	database.AddStatusLog(id, "refund", refund.Status, "approved", data.Reviewer, data.Remark)

	return c.JSON(refund)
}

func (h *RefundHandler) RejectRefund(c *fiber.Ctx) error {
	id := c.Params("id")
	var refund models.Refund
	if err := database.DB.First(&refund, "id = ?", id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Refund not found"})
	}

	var data struct {
		Reviewer     string `json:"reviewer"`
		RejectReason string `json:"rejectReason"`
	}
	if err := c.BodyParser(&data); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	now := time.Now()
	database.DB.Model(&refund).Updates(map[string]interface{}{
		"status":        "rejected",
		"reviewer":      data.Reviewer,
		"review_time":   now,
		"reject_reason": data.RejectReason,
	})

	database.AddStatusLog(id, "refund", refund.Status, "rejected", data.Reviewer, data.RejectReason)

	return c.JSON(refund)
}

func (h *RefundHandler) BatchReview(c *fiber.Ctx) error {
	var req struct {
		IDs          []string `json:"ids"`
		Action       string   `json:"action"`
		Reviewer     string   `json:"reviewer"`
		Remark       string   `json:"remark"`
		RejectReason string   `json:"rejectReason"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	newStatus := "approved"
	if req.Action == "reject" {
		newStatus = "rejected"
	}

	tx := database.DB.Begin()
	now := time.Now()

	for _, id := range req.IDs {
		var refund models.Refund
		if err := tx.First(&refund, "id = ?", id).Error; err == nil {
			updates := map[string]interface{}{
				"status":      newStatus,
				"reviewer":    req.Reviewer,
				"review_time": now,
			}
			if req.Action == "reject" {
				updates["reject_reason"] = req.RejectReason
			}
			tx.Model(&refund).Updates(updates)

			if req.Action == "approve" && refund.RefundType == "balance" {
				var member models.Member
				tx.First(&member, "id = ?", refund.MemberID)
				tx.Model(&member).Update("balance", member.Balance+refund.RefundAmount)
				database.AddStatusLog(member.ID, "recharge", "", "completed", req.Reviewer,
					fmt.Sprintf("退款退回余额: %.2f, 退款单号: %s", refund.RefundAmount, refund.RefundNo))
			}

			database.AddStatusLog(id, "refund", refund.Status, newStatus, req.Reviewer, req.Remark)
		}
	}
	tx.Commit()

	return c.JSON(fiber.Map{"success": true, "count": len(req.IDs)})
}
