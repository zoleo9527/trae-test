package main

import (
	"jewelry-store-system/config"
	"jewelry-store-system/database"
	"jewelry-store-system/routes"
	"jewelry-store-system/services"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	if err := database.AutoMigrate(db); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	if err := database.SeedDemoData(db); err != nil {
		log.Fatalf("Failed to seed demo data: %v", err)
	}

	asyncService := services.GetAsyncTaskService(db)
	asyncService.Start()

	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		},
	})

	app.Use(cors.New())
	app.Use(logger.New())

	routes.Setup(app, db, cfg)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Printf("Server starting on port %s", cfg.ServerPort)
		if err := app.Listen(":" + cfg.ServerPort); err != nil {
			log.Fatalf("Server error: %v", err)
		}
	}()

	<-quit
	log.Println("Shutting down server...")

	if err := app.Shutdown(); err != nil {
		log.Printf("Server shutdown error: %v", err)
	}

	asyncService.Stop()

	log.Println("Server gracefully stopped")
}
