package main

import (
	"log"
	"exhibition-system/internal/config"
	"exhibition-system/internal/database"
	"exhibition-system/internal/handlers"
	"exhibition-system/internal/middleware"
	"exhibition-system/internal/models"
	"exhibition-system/internal/services"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func main() {
	if err := config.Load(); err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	if err := database.Connect(); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	if err := database.Migrate(); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	if err := database.Seed(); err != nil {
		log.Fatalf("Failed to seed database: %v", err)
	}

	app := fiber.New(fiber.Config{
		AppName:      "Exhibition System API",
		ReadTimeout:  30,
		WriteTimeout: 30,
	})

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,PUT,DELETE,PATCH,OPTIONS",
		AllowHeaders: "Origin,Content-Type,Accept,Authorization",
	}))

	app.Use(logger.New())
	app.Use(recover.New())

	authHandler := handlers.NewAuthHandler()
	projectHandler := handlers.NewProjectHandler()
	certificateHandler := handlers.NewCertificateHandler()
	materialHandler := handlers.NewMaterialHandler()
	inspectionHandler := handlers.NewInspectionHandler()
	teardownHandler := handlers.NewTeardownHandler()
	dashboardHandler := handlers.NewDashboardHandler()
	auditHandler := handlers.NewAuditHandler()

	api := app.Group("/api")

	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"message": "Exhibition System API is running",
		})
	})

	auth := api.Group("/auth")
	auth.Post("/login", authHandler.Login)
	auth.Get("/me", middleware.AuthRequired(), authHandler.GetCurrentUser)
	auth.Post("/logout", middleware.AuthRequired(), authHandler.Logout)

	dashboard := api.Group("/dashboard", middleware.AuthRequired())
	dashboard.Get("/stats", dashboardHandler.GetStats)
	dashboard.Get("/pending", dashboardHandler.GetPendingItems)
	dashboard.Get("/activity", dashboardHandler.GetRecentActivity)

	projects := api.Group("/projects", middleware.AuthRequired())
	projects.Get("/", projectHandler.List)
	projects.Post("/", projectHandler.Create)
	projects.Get("/:id", projectHandler.Get)
	projects.Put("/:id", projectHandler.Update)
	projects.Delete("/:id", middleware.RequireRole(models.RoleManager), projectHandler.Delete)
	projects.Patch("/:id/phase", projectHandler.UpdatePhase)

	certificates := api.Group("/certificates", middleware.AuthRequired())
	certificates.Get("/", certificateHandler.List)
	certificates.Post("/", certificateHandler.Create)
	certificates.Get("/:id", certificateHandler.Get)
	certificates.Post("/batch-approve", middleware.RequireRole(models.RoleSupervisor), certificateHandler.BatchApprove)
	certificates.Post("/:id/approve", middleware.RequireRole(models.RoleSupervisor), certificateHandler.Approve)
	certificates.Post("/:id/reject", middleware.RequireRole(models.RoleSupervisor), certificateHandler.Reject)

	materials := api.Group("/materials", middleware.AuthRequired())
	materials.Get("/", materialHandler.List)
	materials.Post("/", materialHandler.Create)
	materials.Get("/:id", materialHandler.Get)
	materials.Post("/:id/version", materialHandler.CreateNewVersion)
	materials.Get("/:id/versions", materialHandler.GetVersionHistory)
	materials.Patch("/:id/status", materialHandler.UpdateStatus)

	inspections := api.Group("/inspections", middleware.AuthRequired())
	inspections.Get("/", inspectionHandler.List)
	inspections.Post("/", inspectionHandler.Create)
	inspections.Get("/:id", inspectionHandler.Get)
	inspections.Post("/:id/submit", inspectionHandler.Submit)
	inspections.Post("/:id/approve", middleware.RequireRole(models.RoleSupervisor), inspectionHandler.Approve)
	inspections.Post("/:id/reject", middleware.RequireRole(models.RoleSupervisor), inspectionHandler.Reject)

	teardowns := api.Group("/teardowns", middleware.AuthRequired())
	teardowns.Get("/", teardownHandler.List)
	teardowns.Post("/", teardownHandler.Create)
	teardowns.Get("/:id", teardownHandler.Get)
	teardowns.Post("/:id/submit", teardownHandler.Submit)
	teardowns.Post("/:id/approve", middleware.RequireRole(models.RoleSupervisor), teardownHandler.Approve)
	teardowns.Post("/:id/reject", middleware.RequireRole(models.RoleSupervisor), teardownHandler.Reject)
	teardowns.Patch("/:id/issues/:issueId/status", teardownHandler.UpdateIssueStatus)

	audit := api.Group("/audit", middleware.AuthRequired(), middleware.RequireRole(models.RoleManager))
	audit.Get("/", auditHandler.List)
	audit.Get("/:id", auditHandler.Get)

	jobs := api.Group("/jobs", middleware.AuthRequired(), middleware.RequireRole(models.RoleManager))
	jobs.Get("/", func(c *fiber.Ctx) error {
		page, _ := strconv.Atoi(c.Query("page", "1"))
		pageSize, _ := strconv.Atoi(c.Query("page_size", "20"))
		status := c.Query("status")

		var jobs []models.AsyncJob
		var total int64

		query := database.DB.Model(&models.AsyncJob{}).Preload("Operator")
		if status != "" {
			query = query.Where("status = ?", status)
		}
		query.Count(&total)

		offset := (page - 1) * pageSize
		err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&jobs).Error
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}

		return c.JSON(fiber.Map{
			"data":  jobs,
			"total": total,
			"page":  page,
			"size":  pageSize,
		})
	})
	jobs.Post("/process", func(c *fiber.Ctx) error {
		asyncJobService := services.NewAsyncJobService()
		if err := asyncJobService.ProcessPendingJobs(); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		return c.JSON(fiber.Map{"message": "Pending jobs processed"})
	})

	log.Printf("Server starting on %s:%s", config.AppConfig.Server.Host, config.AppConfig.Server.Port)
	log.Printf("API Documentation: http://%s:%s/api/health", config.AppConfig.Server.Host, config.AppConfig.Server.Port)
	log.Printf("Demo accounts created, check logs for details")

	if err := app.Listen(config.AppConfig.Server.Host + ":" + config.AppConfig.Server.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
