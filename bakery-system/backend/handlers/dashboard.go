package handlers

import (
	"bakery-system/backend/database"
	"bakery-system/backend/models"

	"github.com/gofiber/fiber/v2"
)

type DashboardHandler struct{}

func NewDashboardHandler() *DashboardHandler {
	return &DashboardHandler{}
}

func (h *DashboardHandler) GetStats(c *fiber.Ctx) error {
	var pendingOrders int64
	var preparingOrders int64
	var pendingRefunds int64
	var rejectedRefunds int64
	var needReviewOrders int64

	database.DB.Model(&models.Order{}).Where("status = ?", "pending").Count(&pendingOrders)
	database.DB.Model(&models.Order{}).Where("status = ?", "preparing").Count(&preparingOrders)
	database.DB.Model(&models.Refund{}).Where("status = ?", "pending").Count(&pendingRefunds)
	database.DB.Model(&models.Refund{}).Where("status = ?", "rejected").Count(&rejectedRefunds)

	database.DB.Model(&models.Order{}).
		Where("status IN ? OR material_loss > 0", []string{"pending"}).
		Count(&needReviewOrders)

	var todayOrders int64
	var todayRevenue float64
	database.DB.Model(&models.Order{}).Where("DATE(created_at) = DATE('now')").Count(&todayOrders)
	database.DB.Model(&models.Order{}).Where("DATE(created_at) = DATE('now') AND status != 'cancelled'").Select("COALESCE(SUM(pay_amount), 0)").Scan(&todayRevenue)

	var totalMembers int64
	var totalBalance float64
	database.DB.Model(&models.Member{}).Count(&totalMembers)
	database.DB.Model(&models.Member{}).Select("COALESCE(SUM(balance), 0)").Scan(&totalBalance)

	var pendingOrdersList []models.Order
	database.DB.Where("status = ?", "pending").Order("created_at asc").Limit(10).Preload("Items").Find(&pendingOrdersList)

	var pendingRefundsList []models.Refund
	database.DB.Where("status = ?", "pending").Order("created_at asc").Limit(10).Preload("Order").Find(&pendingRefundsList)

	var rejectedRefundsList []models.Refund
	database.DB.Where("status = ?", "rejected").Order("updated_at desc").Limit(10).Preload("Order").Find(&rejectedRefundsList)

	return c.JSON(fiber.Map{
		"pendingOrders":      pendingOrders,
		"preparingOrders":    preparingOrders,
		"pendingRefunds":     pendingRefunds,
		"rejectedRefunds":    rejectedRefunds,
		"needReviewOrders":   needReviewOrders,
		"todayOrders":        todayOrders,
		"todayRevenue":       todayRevenue,
		"totalMembers":       totalMembers,
		"totalBalance":       totalBalance,
		"pendingOrdersList":  pendingOrdersList,
		"pendingRefundsList": pendingRefundsList,
		"rejectedRefundsList": rejectedRefundsList,
	})
}

func (h *DashboardHandler) GetRecentActivities(c *fiber.Ctx) error {
	var logs []models.StatusLog
	database.DB.Order("created_at desc").Limit(30).Find(&logs)

	var orders []models.Order
	database.DB.Order("created_at desc").Limit(10).Preload("Items").Find(&orders)

	var refunds []models.Refund
	database.DB.Order("created_at desc").Limit(10).Preload("Order").Find(&refunds)

	return c.JSON(fiber.Map{
		"logs":    logs,
		"orders":  orders,
		"refunds": refunds,
	})
}

func (h *DashboardHandler) GetUnifiedTimeline(c *fiber.Ctx) error {
	relatedType := c.Query("relatedType")
	relatedID := c.Query("relatedID")
	memberID := c.Query("memberID")
	orderID := c.Query("orderID")

	var logs []models.StatusLog
	query := database.DB.Order("created_at asc")

	if relatedType != "" && relatedID != "" {
		query = query.Where("related_id = ? AND related_type = ?", relatedID, relatedType)
	} else if memberID != "" {
		query = query.Where("related_id = ? AND related_type = ?", memberID, "recharge")
	} else if orderID != "" {
		query = query.Where("related_id = ? AND related_type = ?", orderID, "order")
	} else {
		query = query.Where("1 = 0")
	}

	query.Find(&logs)

	if orderID != "" {
		var refundLogs []models.StatusLog
		database.DB.Where("related_type = ? AND related_id IN (?)",
			"refund",
			database.DB.Model(&models.Refund{}).Select("id").Where("order_id = ?", orderID),
		).Order("created_at asc").Find(&refundLogs)
		logs = append(logs, refundLogs...)
	}

	if memberID != "" {
		var orderLogs []models.StatusLog
		database.DB.Where("related_type = ? AND related_id IN (?)",
			"order",
			database.DB.Model(&models.Order{}).Select("id").Where("member_id = ?", memberID),
		).Order("created_at asc").Find(&orderLogs)
		logs = append(logs, orderLogs...)

		var refundLogs []models.StatusLog
		database.DB.Where("related_type = ? AND related_id IN (?)",
			"refund",
			database.DB.Model(&models.Refund{}).Select("id").Where("member_id = ?", memberID),
		).Order("created_at asc").Find(&refundLogs)
		logs = append(logs, refundLogs...)
	}

	return c.JSON(fiber.Map{"data": logs})
}
