package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/fiber/v2/middleware/requestid"
	"water-delivery-service/internal/async"
	"water-delivery-service/internal/config"
	"water-delivery-service/internal/database"
	"water-delivery-service/internal/handlers"
	"water-delivery-service/internal/middleware"
	"water-delivery-service/pkg/types"
)

func main() {
	if err := config.Load(); err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	if err := database.Connect(); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	if err := database.AutoMigrate(); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	if err := SeedDemoData(); err != nil {
		log.Printf("Warning: Failed to seed demo data: %v", err)
	}

	app := fiber.New(fiber.Config{
		AppName:      "Water Delivery Service API",
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		BodyLimit:    50 * 1024 * 1024,
	})

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))
	app.Use(logger.New())
	app.Use(recover.New())
	app.Use(requestid.New())

	app.Static("/uploads", "./uploads")

	authHandler := handlers.NewAuthHandler()
	complaintHandler := handlers.NewComplaintHandler()

	api := app.Group("/api/v1")

	api.Post("/auth/login", authHandler.Login)

	auth := api.Group("", middleware.AuthMiddleware())

	auth.Get("/auth/me", authHandler.Me)

	complaints := auth.Group("/complaints")
	complaints.Post("", complaintHandler.Create)
	complaints.Get("", complaintHandler.Query)
	complaints.Get("/:id", complaintHandler.GetDetail)
	complaints.Put("/:id/status", complaintHandler.UpdateStatus)
	complaints.Post("/:id/assign", middleware.RoleMiddleware(types.RoleAdmin, types.RoleStationMaster), complaintHandler.Assign)
	complaints.Post("/:id/notes", complaintHandler.AddNote)
	complaints.Post("/:id/photos", complaintHandler.UploadPhoto)

	complaints.Post("/:id/redeliveries", middleware.RoleMiddleware(types.RoleAdmin, types.RoleStationMaster, types.RoleCustomerService), complaintHandler.CreateRedelivery)
	complaints.Put("/:id/redeliveries/:redeliveryId/status", middleware.RoleMiddleware(types.RoleAdmin, types.RoleStationMaster, types.RoleDriver), complaintHandler.UpdateRedeliveryStatus)

	complaints.Post("/:id/compensations", middleware.RoleMiddleware(types.RoleAdmin, types.RoleStationMaster, types.RoleCustomerService), complaintHandler.CreateCompensation)
	complaints.Put("/compensations/:compensationId/approve", middleware.RoleMiddleware(types.RoleAdmin, types.RoleStationMaster), complaintHandler.ApproveCompensation)
	complaints.Put("/compensations/:id/paid", middleware.RoleMiddleware(types.RoleAdmin, types.RoleStationMaster), complaintHandler.MarkCompensationPaid)

	driver := auth.Group("/driver", middleware.RoleMiddleware(types.RoleDriver))
	driver.Get("/redeliveries", complaintHandler.GetMyRedeliveries)

	station := auth.Group("/station", middleware.RoleMiddleware(types.RoleAdmin, types.RoleStationMaster))
	station.Get("/compensations/pending", complaintHandler.GetPendingCompensations)

	app.Get("/api/v1/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":    "ok",
			"timestamp": time.Now().Format(time.RFC3339),
		})
	})

	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"name":    "Water Delivery Service API",
			"version": "1.0.0",
			"docs":    "/api/v1/health",
		})
	})

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	workerPool := async.NewWorkerPool()
	workerPool.Start(ctx)

	addr := config.AppConfig.ServerHost + ":" + config.AppConfig.ServerPort
	log.Printf("Server starting on %s", addr)

	go func() {
		if err := app.Listen(addr); err != nil {
			log.Printf("Server error: %v", err)
		}
	}()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	log.Println("Shutting down gracefully...")
	cancel()
	workerPool.Stop()

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	if err := app.ShutdownWithContext(shutdownCtx); err != nil {
		log.Printf("Server shutdown error: %v", err)
	}

	log.Println("Server stopped")
}
