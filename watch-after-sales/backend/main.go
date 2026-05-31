package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"watch-after-sales/backend/config"
	"watch-after-sales/backend/database"
	"watch-after-sales/backend/handler"
	"watch-after-sales/backend/middleware"
	"watch-after-sales/backend/seed"
	"watch-after-sales/backend/service"

	"github.com/gofiber/fiber/v2"
)

func main() {
	config.Load()

	if err := database.Connect(); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Database connected and migrated successfully")

	seed.Seed(database.DB)

	auditService := service.NewAuditService(database.DB)
	callbackService := service.NewCallbackService(database.DB)
	repairService := service.NewRepairService(database.DB, auditService, callbackService)
	partService := service.NewPartService(database.DB, auditService)
	authService := service.NewAuthService(database.DB)
	exportService := service.NewExportService(database.DB)

	scheduler := service.NewScheduler(database.DB, partService)
	scheduler.Start()

	authHandler := handler.NewAuthHandler(authService)
	repairHandler := handler.NewRepairHandler(repairService)
	partHandler := handler.NewPartHandler(partService)
	auditHandler := handler.NewAuditHandler(auditService)
	callbackHandler := handler.NewCallbackHandler(callbackService)
	exportHandler := handler.NewExportHandler(exportService)

	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := 500
			msg := "internal server error"
			errType := "internal"

			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
				msg = e.Message
			}

			return c.Status(code).JSON(fiber.Map{
				"code":    code,
				"message": msg,
				"type":    errType,
			})
		},
	})

	app.Use(func(c *fiber.Ctx) error {
		c.Set("Access-Control-Allow-Origin", "*")
		c.Set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS")
		c.Set("Access-Control-Allow-Headers", "Origin,Content-Type,Accept,Authorization")

		if c.Method() == "OPTIONS" {
			return c.SendStatus(204)
		}

		return c.Next()
	})

	api := app.Group("/api")

	api.Post("/auth/login", authHandler.Login)

	auth := api.Group("", middleware.AuthMiddleware())

	auth.Post("/repairs", repairHandler.Create)
	auth.Get("/repairs", repairHandler.List)
	auth.Get("/repairs/:id", repairHandler.GetByID)
	auth.Patch("/repairs/:id", repairHandler.Update)
	auth.Post("/repairs/:id/status", repairHandler.ChangeStatus)
	auth.Post("/repairs/batch-status", repairHandler.BatchStatusChange)

	auth.Post("/parts", partHandler.Create)
	auth.Get("/parts", partHandler.List)
	auth.Get("/parts/:id", partHandler.GetByID)
	auth.Patch("/parts/:id", partHandler.Update)
	auth.Post("/repairs/:id/lock-part", partHandler.LockPart)
	auth.Delete("/repairs/:id/lock-part/:lockId", partHandler.UnlockPart)

	auth.Get("/audit-logs", auditHandler.List)

	auth.Post("/callbacks", callbackHandler.Create)
	auth.Get("/callbacks", callbackHandler.List)
	auth.Patch("/callbacks/:id/complete", callbackHandler.Complete)
	auth.Get("/callbacks/overdue", callbackHandler.GetOverdue)

	auth.Get("/exports/repairs/csv", exportHandler.ExportRepairsCSV)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	go func() {
		if err := app.Listen(":" + config.AppConfig.Port); err != nil {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	log.Printf("Server started on port %s", config.AppConfig.Port)

	<-quit
	log.Println("Shutting down server...")

	scheduler.Stop()

	if err := app.Shutdown(); err != nil {
		log.Printf("Error during shutdown: %v", err)
	}

	log.Println("Server stopped")
}
