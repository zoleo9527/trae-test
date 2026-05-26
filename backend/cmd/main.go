package main

import (
	"flag"
	"fmt"
	"log"
	"tea-distribution/internal/config"
	"tea-distribution/internal/db"
	"tea-distribution/internal/routes"
	"tea-distribution/internal/seed"
	"tea-distribution/internal/services"

	"github.com/gofiber/fiber/v2"
)

func main() {
	seedFlag := flag.Bool("seed", false, "Initialize demo data")
	flag.Parse()

	if err := config.Load(); err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	if err := db.Connect(); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	if err := db.AutoMigrate(); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	if *seedFlag {
		if err := seed.SeedDemoData(); err != nil {
			log.Fatalf("Failed to seed demo data: %v", err)
		}
		log.Println("Demo data initialized successfully")
	}

	taskService := services.NewTaskService()
	taskService.Start()
	defer taskService.Stop()

	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"code":    "INTERNAL_ERROR",
				"message": err.Error(),
			})
		},
	})

	routes.SetupRoutes(app)

	addr := fmt.Sprintf("%s:%s", config.AppConfig.ServerHost, config.AppConfig.ServerPort)
	log.Printf("Server starting on %s", addr)
	if err := app.Listen(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
