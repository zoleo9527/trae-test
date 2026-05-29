package main

import (
	"log"
	"os"

	"github.com/cultural-store/inspection-service/internal/config"
	"github.com/cultural-store/inspection-service/internal/database"
	"github.com/cultural-store/inspection-service/internal/handler"
	"github.com/cultural-store/inspection-service/internal/repository"
	"github.com/cultural-store/inspection-service/internal/router"
	"github.com/cultural-store/inspection-service/internal/seed"
	"github.com/cultural-store/inspection-service/internal/service"
	"github.com/cultural-store/inspection-service/internal/worker"
	"github.com/gofiber/fiber/v2"
)

func main() {
	cfg := config.Load()

	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer db.Close()

	if os.Getenv("SKIP_MIGRATION") != "true" {
		if err := database.RunMigrations(cfg.DatabaseURL); err != nil {
			log.Printf("migration warning: %v (continuing)", err)
		}
	}

	repo := repository.NewRepo(db)
	asyncWorker := worker.NewAsyncWorker(repo)
	asyncWorker.Start()
	defer asyncWorker.Stop()

	svc := service.NewService(repo, cfg.JWTSecret, cfg.JWTExpireHours, asyncWorker)

	if os.Getenv("SEED_DATA") == "true" {
		log.Println("seeding demo data...")
		if err := seed.Seed(db); err != nil {
			log.Printf("seed warning: %v", err)
		}
	}

	os.MkdirAll(cfg.UploadDir+"/inspections", 0755)
	os.MkdirAll(cfg.UploadDir+"/rectifications", 0755)

	app := fiber.New(fiber.Config{
		AppName:               "Cultural Store Inspection Service",
		DisableStartupMessage: false,
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := 500
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{"error": err.Error()})
		},
	})

	app.Static("/uploads", cfg.UploadDir)

	authH := handler.NewAuthHandler(svc)
	storeH := handler.NewStoreHandler(svc)
	inspH := handler.NewInspectionHandler(svc)
	rectH := handler.NewRectificationHandler(svc)
	productH := handler.NewProductHandler(svc)
	inventoryH := handler.NewInventoryHandler(svc)
	replenH := handler.NewReplenishmentHandler(svc)
	transferH := handler.NewTransferHandler(svc)
	redemptionH := handler.NewRedemptionHandler(svc)
	auditH := handler.NewAuditLogHandler(svc)

	router.Setup(app, cfg.JWTSecret, cfg.AllowedOrigins,
		authH, storeH, inspH, rectH, productH, inventoryH,
		replenH, transferH, redemptionH, auditH)

	app.Get("/health", func(c *fiber.Ctx) error {
		if err := db.Ping(); err != nil {
			return c.Status(503).JSON(fiber.Map{"status": "unhealthy"})
		}
		return c.JSON(fiber.Map{"status": "healthy"})
	})

	log.Printf("starting server on port %s", cfg.Port)
	if err := app.Listen(":" + cfg.Port); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
