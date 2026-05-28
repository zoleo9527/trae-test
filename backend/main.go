package main

import (
	"instrument-rental/config"
	"instrument-rental/database"
	"instrument-rental/handler"
	"instrument-rental/middleware"
	"instrument-rental/model"
	"instrument-rental/seed"
	"instrument-rental/task"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func main() {
	cfg := config.Load()

	if err := database.Connect(cfg); err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	database.DB.AutoMigrate(
		&model.User{},
		&model.Instrument{},
		&model.School{},
		&model.Rental{},
		&model.ReturnRecord{},
		&model.Maintenance{},
		&model.Payment{},
		&model.AuditLog{},
	)

	seed.Run(cfg)

	scheduler := task.NewScheduler()
	scheduler.Start()
	defer scheduler.Stop()

	app := fiber.New(fiber.Config{
		AppName: "Instrument Rental API",
	})

	app.Use(recover.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	authHandler := handler.NewAuthHandler(cfg)
	instrumentHandler := handler.NewInstrumentHandler()
	rentalHandler := handler.NewRentalHandler()
	returnHandler := handler.NewReturnHandler()
	maintenanceHandler := handler.NewMaintenanceHandler()
	schoolHandler := handler.NewSchoolHandler()
	paymentHandler := handler.NewPaymentHandler()
	dashboardHandler := handler.NewDashboardHandler()
	batchHandler := handler.NewBatchHandler()

	app.Post("/api/auth/login", authHandler.Login)
	app.Post("/api/auth/register", middleware.AuthRequired(cfg), middleware.RequireRole(model.RoleAdmin), authHandler.Register)
	app.Get("/api/auth/me", middleware.AuthRequired(cfg), authHandler.Me)

	api := app.Group("/api", middleware.AuthRequired(cfg))

	instruments := api.Group("/instruments")
	instruments.Get("/", instrumentHandler.List)
	instruments.Get("/available", instrumentHandler.Available)
	instruments.Get("/:id", instrumentHandler.Get)
	instruments.Post("/", middleware.RequireRole(model.RoleAdmin, model.RoleConsultant), instrumentHandler.Create)
	instruments.Put("/:id", middleware.RequireRole(model.RoleAdmin, model.RoleConsultant), instrumentHandler.Update)
	instruments.Delete("/:id", middleware.RequireRole(model.RoleAdmin), instrumentHandler.Delete)

	rentals := api.Group("/rentals")
	rentals.Get("/", rentalHandler.List)
	rentals.Get("/:id", rentalHandler.Get)
	rentals.Post("/", middleware.RequireRole(model.RoleAdmin, model.RoleConsultant), rentalHandler.Create)
	rentals.Post("/batch", middleware.RequireRole(model.RoleAdmin, model.RoleConsultant), rentalHandler.BatchCreate)
	rentals.Put("/:id", middleware.RequireRole(model.RoleAdmin, model.RoleConsultant), rentalHandler.Update)

	returns := api.Group("/returns")
	returns.Get("/", returnHandler.List)
	returns.Get("/:id", returnHandler.Get)
	returns.Post("/", middleware.RequireRole(model.RoleAdmin, model.RoleConsultant, model.RoleStoreOwner), returnHandler.Create)
	returns.Put("/:id/review", middleware.RequireRole(model.RoleAdmin), returnHandler.Review)

	maintenances := api.Group("/maintenances")
	maintenances.Get("/", maintenanceHandler.List)
	maintenances.Get("/:id", maintenanceHandler.Get)
	maintenances.Post("/", middleware.RequireRole(model.RoleAdmin, model.RoleMaintenance), maintenanceHandler.Create)
	maintenances.Put("/:id", middleware.RequireRole(model.RoleAdmin, model.RoleMaintenance), maintenanceHandler.Update)

	schools := api.Group("/schools")
	schools.Get("/", schoolHandler.List)
	schools.Get("/:id", schoolHandler.Get)
	schools.Post("/", middleware.RequireRole(model.RoleAdmin, model.RoleConsultant), schoolHandler.Create)
	schools.Put("/:id", middleware.RequireRole(model.RoleAdmin, model.RoleConsultant), schoolHandler.Update)
	schools.Delete("/:id", middleware.RequireRole(model.RoleAdmin), schoolHandler.Delete)

	payments := api.Group("/payments")
	payments.Get("/", paymentHandler.List)
	payments.Get("/:id", paymentHandler.Get)
	payments.Post("/", middleware.RequireRole(model.RoleAdmin, model.RoleConsultant), paymentHandler.Create)
	payments.Put("/:id", middleware.RequireRole(model.RoleAdmin, model.RoleConsultant), paymentHandler.Update)
	payments.Post("/:id/record", middleware.RequireRole(model.RoleAdmin, model.RoleConsultant), paymentHandler.RecordPayment)
	payments.Post("/batch", middleware.RequireRole(model.RoleAdmin), paymentHandler.BatchUpdate)

	dashboards := api.Group("/dashboard")
	dashboards.Get("/stats", dashboardHandler.GetStats)
	dashboards.Get("/activities", dashboardHandler.GetRecentActivities)
	dashboards.Get("/audit-logs", dashboardHandler.GetAuditLogs)
	dashboards.Get("/items/pending", dashboardHandler.GetPendingItems)
	dashboards.Get("/items/rejected", dashboardHandler.GetRejectedItems)
	dashboards.Get("/items/needs-review", dashboardHandler.GetNeedsReviewItems)

	batches := api.Group("/batch", middleware.RequireRole(model.RoleAdmin))
	batches.Put("/rentals", batchHandler.UpdateRentals)
	batches.Put("/payments", batchHandler.UpdatePayments)
	batches.Put("/schools", batchHandler.UpdateSchools)
	batches.Post("/payments", batchHandler.CreatePayments)

	log.Printf("Starting Instrument Rental API on :%s", cfg.Port)
	log.Fatal(app.Listen(":" + cfg.Port))
}
