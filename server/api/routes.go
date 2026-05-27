package api

import (
	"carwash-system/middleware"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	api := app.Group("/api")

	api.Post("/auth/login", Login)
	api.Get("/auth/me", middleware.AuthRequired, GetCurrentUserInfo)

	api.Get("/dashboard/stats", middleware.AuthRequired, GetDashboardStats)
	api.Get("/dashboard/activity", middleware.AuthRequired, GetRecentActivity)

	members := api.Group("/members", middleware.AuthRequired)
	members.Get("", GetMembers)
	members.Get("/:id", GetMemberDetail)
	members.Post("", CreateMember)
	members.Put("/:id", UpdateMember)
	members.Post("/renew/batch", BatchRenewMembership)
	members.Get("/:id/logs", GetMemberLogs)

	packages := api.Group("/packages", middleware.AuthRequired)
	packages.Get("", GetPackages)
	packages.Post("", CreatePackage)
	packages.Put("/:id", UpdatePackage)
	packages.Delete("/:id", DeletePackage)

	orders := api.Group("/orders", middleware.AuthRequired)
	orders.Get("", GetMembershipOrders)
	orders.Get("/:id", GetOrderDetail)
	orders.Post("", CreateOrder)

	repairs := api.Group("/repairs", middleware.AuthRequired)
	repairs.Get("", GetRepairOrders)
	repairs.Get("/:id", GetRepairDetail)
	repairs.Post("", CreateRepairOrder)
	repairs.Put("/:id/status", UpdateRepairStatus)
	repairs.Post("/:id/escalate", EscalateRepair)
	repairs.Get("/:id/logs", GetRepairLogs)

	refunds := api.Group("/refunds", middleware.AuthRequired)
	refunds.Get("", GetRefundRequests)
	refunds.Get("/:id", GetRefundDetail)
	refunds.Post("", CreateRefundRequest)
	refunds.Put("/:id/review", ReviewRefund)

	activities := api.Group("/activities", middleware.AuthRequired)
	activities.Get("", GetActivities)
	activities.Get("/:id", GetActivityDetail)
	activities.Post("", CreateActivity)
	activities.Put("/:id", UpdateActivity)
	activities.Post("/:id/push", PushActivity)
	activities.Get("/:id/stats", GetActivityStats)

	sites := api.Group("/sites", middleware.AuthRequired)
	sites.Get("", GetSites)
	sites.Get("/:id/devices", GetSiteDevices)

	devices := api.Group("/devices", middleware.AuthRequired)
	devices.Get("", GetDevices)
}
