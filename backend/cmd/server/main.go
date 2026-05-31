package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"

	"floor-settlement/internal/config"
	"floor-settlement/internal/database"
	"floor-settlement/internal/handler"
	"floor-settlement/internal/repository"
	"floor-settlement/internal/router"
	"floor-settlement/internal/service"
	"floor-settlement/seed"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"gorm.io/gorm"
)

func main() {
	cfg := config.Load()

	db := database.Connect(cfg)

	if err := runMigrations(db); err != nil {
		log.Fatalf("migration failed: %v", err)
	}

	repository.Init(db)
	service.Init(cfg.JWTSecret)

	auditService := service.NewAuditService()
	service.RecordAudit = auditService.RecordFromContext

	authService := service.NewAuthService()
	attendanceService := service.NewAttendanceService()
	settlementService := service.NewSettlementService()
	qualityService := service.NewQualityService()
	reworkService := service.NewReworkService()
	deliveryService := service.NewDeliveryService()
	changeOrderService := service.NewChangeOrderService()
	asyncTaskService := service.NewAsyncTaskService(settlementService, 2)

	if len(os.Args) > 1 && os.Args[1] == "seed" {
		log.Println("running seed data...")
		if err := seed.Seed(db, authService); err != nil {
			log.Fatalf("seed failed: %v", err)
		}
		log.Println("seed data completed")
		return
	}

	projectRepo := &repository.ProjectRepository{}
	teamRepo := &repository.TeamRepository{}

	authHandler := handler.NewAuthHandler(authService)
	projectHandler := handler.NewProjectHandler(projectRepo)
	teamHandler := handler.NewTeamHandler(teamRepo)
	attendanceHandler := handler.NewAttendanceHandler(attendanceService)
	settlementHandler := handler.NewSettlementHandler(settlementService, asyncTaskService)
	deliveryHandler := handler.NewDeliveryHandler(deliveryService)
	changeOrderHandler := handler.NewChangeOrderHandler(changeOrderService)
	qualityHandler := handler.NewQualityHandler(qualityService)
	reworkHandler := handler.NewReworkHandler(reworkService)
	auditHandler := handler.NewAuditHandler(auditService)
	asyncTaskHandler := handler.NewAsyncTaskHandler(asyncTaskService)

	app := fiber.New(fiber.Config{
		AppName:      "Floor Settlement API",
		ServerHeader: "Floor-Settlement",
	})

	app.Use(recover.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders: "Origin,Content-Type,Accept,Authorization",
	}))

	router.SetupRoutes(
		app,
		authHandler,
		projectHandler,
		teamHandler,
		attendanceHandler,
		settlementHandler,
		deliveryHandler,
		changeOrderHandler,
		qualityHandler,
		reworkHandler,
		auditHandler,
		asyncTaskHandler,
		authService,
	)

	asyncTaskService.Start()

	go func() {
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, os.Interrupt)
		<-quit
		fmt.Println("\nshutting down...")
		asyncTaskService.Stop()
		_ = app.Shutdown()
	}()

	addr := ":" + cfg.ServerPort
	fmt.Printf("server starting on %s\n", addr)
	if err := app.Listen(addr); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

func runMigrations(db *gorm.DB) error {
	sql, err := os.ReadFile("migrations/001_init.sql")
	if err != nil {
		return fmt.Errorf("read migration file: %w", err)
	}
	if err := db.Exec(string(sql)).Error; err != nil {
		log.Printf("migration warning (tables may already exist): %v", err)
	}
	return nil
}
