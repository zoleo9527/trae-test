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
	database.DB.Model(&models.Order{}).Where("status IN ?", []string{"modified", "pending"}).Count(&needReviewOrders)

	var todayOrders int64
	var todayRevenue float64
	database.DB.Model(&models.Order{}).Where("DATE(created_at) = DATE('now')").Count(&todayOrders)
	database.DB.Model(&models.Order{}).Where("DATE(created_at) = DATE('now')").Select("COALESCE(SUM(pay_amount), 0)").Scan(&todayRevenue)

	var totalMembers int64
	var totalBalance float64
	database.DB.Model(&models.Member{}).Count(&totalMembers)
	database.DB.Model(&models.Member{}).Select("COALESCE(SUM(balance), 0)").Scan(&totalBalance)

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
	})
}

func (h *DashboardHandler) GetRecentActivities(c *fiber.Ctx) error {
	var logs []models.StatusLog
	database.DB.Order("created_at desc").Limit(20).Find(&logs)

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
