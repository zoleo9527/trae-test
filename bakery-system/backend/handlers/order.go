package handlers

import (
	"bakery-system/backend/database"
	"bakery-system/backend/models"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
)

type OrderHandler struct{}

func NewOrderHandler() *OrderHandler {
	return &OrderHandler{}
}

func (h *OrderHandler) GetOrders(c *fiber.Ctx) error {
	var orders []models.Order
	query := database.DB.Model(&models.Order{}).Preload("Items")

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if search := c.Query("search"); search != "" {
		query = query.Where("order_no LIKE ? OR member_name LIKE ? OR member_phone LIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}
	if date := c.Query("date"); date != "" {
		query = query.Where("DATE(created_at) = ?", date)
	}

	query.Order("created_at desc").Find(&orders)
	return c.JSON(fiber.Map{"data": orders})
}

func (h *OrderHandler) GetOrder(c *fiber.Ctx) error {
	id := c.Params("id")
	var order models.Order
	if err := database.DB.Preload("Items").Preload("Refunds").First(&order, "id = ?", id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Order not found"})
	}

	var statusLogs []models.StatusLog
	database.DB.Where("related_id = ? AND related_type = ?", id, "order").Order("created_at asc").Find(&statusLogs)
	order.StatusHistory = statusLogs

	return c.JSON(order)
}

func (h *OrderHandler) CreateOrder(c *fiber.Ctx) error {
	var order models.Order
	if err := c.BodyParser(&order); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	order.OrderNo = fmt.Sprintf("ORD%s%06d", time.Now().Format("20060102"), time.Now().Unix()%1000000)
	order.Status = "pending"

	tx := database.DB.Begin()
	tx.Create(&order)

	for i := range order.Items {
		order.Items[i].OrderID = order.ID
		tx.Create(&order.Items[i])
	}

	if order.UseBalance > 0 && order.MemberID != "" {
		var member models.Member
		if err := tx.First(&member, "id = ?", order.MemberID).Error; err == nil {
			if member.Balance >= order.UseBalance {
				tx.Model(&member).Update("balance", member.Balance-order.UseBalance)
				database.AddStatusLog(member.ID, "recharge", "", "completed", order.Operator,
					fmt.Sprintf("订单抵扣余额: %.2f, 订单号: %s", order.UseBalance, order.OrderNo))
			}
		}
	}

	database.AddStatusLog(order.ID, "order", "", "pending", order.Operator, "订单创建")
	tx.Commit()

	return c.Status(201).JSON(order)
}

func (h *OrderHandler) UpdateOrder(c *fiber.Ctx) error {
	id := c.Params("id")
	var order models.Order
	if err := database.DB.First(&order, "id = ?", id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Order not found"})
	}

	var data map[string]interface{}
	if err := c.BodyParser(&data); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	oldStatus := order.Status
	database.DB.Model(&order).Updates(data)

	if newStatus, ok := data["status"].(string); ok && newStatus != oldStatus {
		operator := ""
		if op, ok := data["operator"].(string); ok {
			operator = op
		}
		remark := "状态变更"
		if r, ok := data["remark"].(string); ok && r != "" {
			remark = r
		}
		database.AddStatusLog(order.ID, "order", oldStatus, newStatus, operator, remark)
	} else {
		operator := ""
		if op, ok := data["operator"].(string); ok {
			operator = op
		}
		remark := "改单"
		if r, ok := data["remark"].(string); ok && r != "" {
			remark = r
		}
		database.AddStatusLog(order.ID, "order", oldStatus, oldStatus, operator, remark)
	}

	return c.JSON(order)
}

func (h *OrderHandler) BatchUpdateStatus(c *fiber.Ctx) error {
	var req struct {
		IDs       []string `json:"ids"`
		Status    string   `json:"status"`
		Operator  string   `json:"operator"`
		Remark    string   `json:"remark"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	tx := database.DB.Begin()
	for _, id := range req.IDs {
		var order models.Order
		if err := tx.First(&order, "id = ?", id).Error; err == nil {
			oldStatus := order.Status
			tx.Model(&order).Update("status", req.Status)
			database.AddStatusLog(id, "order", oldStatus, req.Status, req.Operator, req.Remark)
		}
	}
	tx.Commit()

	return c.JSON(fiber.Map{"success": true, "count": len(req.IDs)})
}

func (h *OrderHandler) UpdateMaterialLoss(c *fiber.Ctx) error {
	id := c.Params("id")
	var order models.Order
	if err := database.DB.First(&order, "id = ?", id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Order not found"})
	}

	var data struct {
		MaterialLoss float64 `json:"materialLoss"`
		Remark       string  `json:"remark"`
		Operator     string  `json:"operator"`
	}
	if err := c.BodyParser(&data); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	database.DB.Model(&order).Update("material_loss", data.MaterialLoss)
	database.AddStatusLog(id, "order", order.Status, order.Status, data.Operator, fmt.Sprintf("记录原料损耗: %.2f, 备注: %s", data.MaterialLoss, data.Remark))

	return c.JSON(fiber.Map{"success": true})
}
