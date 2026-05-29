package main

import (
	"log"
	"os"
	"os/signal"
	"runner-platform/internal/config"
	"runner-platform/internal/database"
	"runner-platform/internal/handlers"
	"runner-platform/internal/middleware"
	"runner-platform/internal/seed"
	"runner-platform/internal/worker"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func main() {
	config.Load()
	database.Init()
	database.AutoMigrate()
	seed.Seed()

	app := fiber.New(fiber.Config{
		ErrorHandler: customErrorHandler,
	})

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,PUT,DELETE,PATCH,OPTIONS",
		AllowHeaders: "Origin,Content-Type,Accept,Authorization",
	}))

	app.Use(logger.New())
	app.Use(recover.New())

	authHandler := handlers.NewAuthHandler()
	orderHandler := handlers.NewOrderHandler()
	refundHandler := handlers.NewRefundHandler()
	appealHandler := handlers.NewAppealHandler()
	subsidyHandler := handlers.NewSubsidyHandler()
	logHandler := handlers.NewLogHandler()

	api := app.Group("/api/v1")

	api.Post("/auth/login", authHandler.Login)

	auth := api.Group("", middleware.AuthMiddleware())

	auth.Get("/auth/me", authHandler.GetCurrentUser)
	auth.Put("/auth/password", authHandler.ChangePassword)
	auth.Get("/users/role/:role", middleware.RequireAdmin(), authHandler.GetUsersByRole)

	auth.Get("/dashboard/stats", logHandler.GetDashboardStats)

	orders := auth.Group("/orders")
	orders.Post("", middleware.RequireDispatcher(), orderHandler.CreateOrder)
	orders.Get("", orderHandler.ListOrders)
	orders.Get("/:id", orderHandler.GetOrder)
	orders.Post("/:id/assign", middleware.RequireDispatcher(), orderHandler.AssignOrder)
	orders.Put("/:id/status", middleware.RequireDispatcher(), orderHandler.UpdateOrderStatus)

	refunds := auth.Group("/refunds")
	refunds.Post("", refundHandler.CreateRefund)
	refunds.Get("", refundHandler.ListRefunds)
	refunds.Get("/:id", refundHandler.GetRefund)
	refunds.Get("/:id/detail", refundHandler.GetRefundDetail)
	refunds.Put("/:id", refundHandler.UpdateRefund)
	refunds.Post("/:id/review", middleware.RequireCustomerService(), refundHandler.ReviewRefund)
	refunds.Post("/:id/remarks", refundHandler.AddRemark)

	appeals := auth.Group("/appeals")
	appeals.Post("", appealHandler.CreateAppeal)
	appeals.Get("", appealHandler.ListAppeals)
	appeals.Get("/:id", appealHandler.GetAppeal)
	appeals.Get("/:id/detail", appealHandler.GetAppealDetail)
	appeals.Post("/:id/handle", middleware.RequireCustomerService(), appealHandler.HandleAppeal)
	appeals.Post("/:id/remarks", appealHandler.AddRemark)

	subsidies := auth.Group("/subsidies")
	subsidies.Post("", middleware.RequireOpsManager(), subsidyHandler.CreateSubsidy)
	subsidies.Get("", subsidyHandler.ListSubsidies)
	subsidies.Get("/:id", subsidyHandler.GetSubsidy)
	subsidies.Get("/:id/detail", subsidyHandler.GetSubsidyDetail)
	subsidies.Post("/:id/review", middleware.RequireOpsManager(), subsidyHandler.ReviewSubsidy)
	subsidies.Post("/:id/paid", middleware.RequireOpsManager(), subsidyHandler.MarkPaid)
	subsidies.Post("/:id/remarks", subsidyHandler.AddRemark)

	logs := auth.Group("/logs")
	logs.Get("", logHandler.ListLogs)

	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "ok",
			"time":   time.Now().Format(time.RFC3339),
		})
	})

	taskWorker := worker.NewTaskWorker()
	taskWorker.Start()

	go func() {
		log.Printf("Server starting on port %s", config.AppConfig.Port)
		if err := app.Listen(":" + config.AppConfig.Port); err != nil {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")
	taskWorker.Stop()

	if err := app.Shutdown(); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited properly")
}

func customErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	message := "Internal Server Error"

	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
		message = e.Message
	}

	log.Printf("Error: %v, Path: %s, Method: %s", err, c.Path(), c.Method())

	return c.Status(code).JSON(fiber.Map{
		"code":    code,
		"message": message,
		"data":    nil,
	})
}
