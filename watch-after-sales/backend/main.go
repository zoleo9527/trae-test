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
	userService := service.NewUserService(database.DB)
	customerService := service.NewCustomerService(database.DB)

	scheduler := service.NewScheduler(database.DB, partService)
	scheduler.Start()

	authHandler := handler.NewAuthHandler(authService)
	repairHandler := handler.NewRepairHandler(repairService)
	partHandler := handler.NewPartHandler(partService)
	auditHandler := handler.NewAuditHandler(auditService)
	callbackHandler := handler.NewCallbackHandler(callbackService)
	exportHandler := handler.NewExportHandler(exportService)
	userHandler := handler.NewUserHandler(userService)
	customerHandler := handler.NewCustomerHandler(customerService, auditService)

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

	auth.Get("/users", middleware.RequireRole("manager", "consultant"), userHandler.List)
	auth.Get("/users/:id", middleware.RequireRole("manager", "consultant"), userHandler.GetByID)

	auth.Get("/customers", customerHandler.List)
	auth.Get("/customers/:id", customerHandler.GetByID)
	auth.Post("/customers", customerHandler.Create)

	auth.Post("/parts", middleware.RequireRole("manager", "consultant"), partHandler.Create)
	auth.Get("/parts", middleware.RequireRole("manager", "consultant", "technician"), partHandler.List)
	auth.Get("/parts/:id", middleware.RequireRole("manager", "consultant", "technician"), partHandler.GetByID)
	auth.Patch("/parts/:id", middleware.RequireRole("manager", "consultant"), partHandler.Update)
	auth.Post("/repairs/:id/lock-part", middleware.RequireRole("manager", "technician"), partHandler.LockPart)
	auth.Delete("/repairs/:id/lock-part/:lockId", middleware.RequireRole("manager", "technician"), partHandler.UnlockPart)

	auth.Get("/audit-logs", middleware.RequireRole("manager"), auditHandler.List)

	auth.Post("/callbacks", middleware.RequireRole("manager", "consultant"), callbackHandler.Create)
	auth.Get("/callbacks", middleware.RequireRole("manager", "consultant", "technician"), callbackHandler.List)
	auth.Patch("/callbacks/:id/complete", middleware.RequireRole("manager", "consultant"), callbackHandler.Complete)
	auth.Get("/callbacks/overdue", middleware.RequireRole("manager", "consultant"), callbackHandler.GetOverdue)

	auth.Get("/exports/repairs/csv", middleware.RequireRole("manager", "consultant"), exportHandler.ExportRepairsCSV)

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
