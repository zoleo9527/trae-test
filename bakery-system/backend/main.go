package main

import (
	"bakery-system/backend/database"
	"bakery-system/backend/handlers"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	database.Init()

	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,PUT,DELETE,PATCH,OPTIONS",
		AllowHeaders: "*",
	}))

	app.Use(logger.New())

	api := app.Group("/api")

	dashboardHandler := handlers.NewDashboardHandler()
	api.Get("/dashboard/stats", dashboardHandler.GetStats)
	api.Get("/dashboard/activities", dashboardHandler.GetRecentActivities)

	memberHandler := handlers.NewMemberHandler()
	api.Get("/members", memberHandler.GetMembers)
	api.Get("/members/:id", memberHandler.GetMember)
	api.Post("/members", memberHandler.CreateMember)
	api.Put("/members/:id", memberHandler.UpdateMember)
	api.Post("/members/:id/recharge", memberHandler.Recharge)
	api.Get("/members/:id/recharges", memberHandler.GetRecharges)

	orderHandler := handlers.NewOrderHandler()
	api.Get("/orders", orderHandler.GetOrders)
	api.Get("/orders/:id", orderHandler.GetOrder)
	api.Post("/orders", orderHandler.CreateOrder)
	api.Put("/orders/:id", orderHandler.UpdateOrder)
	api.Post("/orders/batch/status", orderHandler.BatchUpdateStatus)
	api.Post("/orders/:id/loss", orderHandler.UpdateMaterialLoss)

	refundHandler := handlers.NewRefundHandler()
	api.Get("/refunds", refundHandler.GetRefunds)
	api.Get("/refunds/:id", refundHandler.GetRefund)
	api.Post("/refunds", refundHandler.CreateRefund)
	api.Post("/refunds/:id/approve", refundHandler.ApproveRefund)
	api.Post("/refunds/:id/reject", refundHandler.RejectRefund)
	api.Post("/refunds/batch/review", refundHandler.BatchReview)

	productHandler := handlers.NewProductHandler()
	api.Get("/products", productHandler.GetProducts)
	api.Get("/products/:id", productHandler.GetProduct)
	api.Post("/products", productHandler.CreateProduct)
	api.Put("/products/:id", productHandler.UpdateProduct)

	log.Println("Server starting on :3001")
	log.Fatal(app.Listen(":3001"))
}
