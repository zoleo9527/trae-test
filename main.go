package main

import (
	"camp-management/internal/api"
	"camp-management/internal/api/handler"
	"camp-management/internal/api/middleware"
	"camp-management/internal/async"
	"camp-management/internal/repository"
	"camp-management/internal/service"
	"camp-management/pkg/config"
	"camp-management/pkg/database"
	"log"
)

func main() {
	cfg := config.Load()

	db, err := database.NewPostgresDB(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	if err := database.AutoMigrate(db); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	taskQueue := async.NewTaskQueue(cfg.AsyncWorkerCount)
	taskQueue.Start()
	defer taskQueue.Stop()

	repos := repository.NewRepositories(db)
	services := service.NewServices(repos, taskQueue, cfg.JWTSecret)
	handlers := handler.NewHandlers(services)
	authMiddleware := middleware.NewAuthMiddleware(cfg.JWTSecret)

	if err := database.SeedDemoData(db, services.Auth); err != nil {
		log.Printf("Warning: Failed to seed demo data: %v", err)
	}

	app := api.SetupRouter(handlers, authMiddleware)

	log.Printf("Server starting on %s:%s", cfg.ServerHost, cfg.ServerPort)
	log.Printf("API Docs: POST /api/auth/login (see README for test accounts)")
	
	if err := app.Listen(cfg.ServerHost + ":" + cfg.ServerPort); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
