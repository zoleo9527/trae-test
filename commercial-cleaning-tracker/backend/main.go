package main

import (
	"log"

	"github.com/cleaning-tracker/backend/config"
	"github.com/cleaning-tracker/backend/handlers"
	"github.com/cleaning-tracker/backend/models"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	config.InitDB()

	config.DB.AutoMigrate(
		&models.User{},
		&models.Project{},
		&models.Schedule{},
		&models.Shift{},
		&models.CheckIn{},
		&models.Inspection{},
		&models.Rectification{},
		&models.MaterialRequisition{},
		&models.FollowUp{},
	)

	config.SeedDemoData()

	app := fiber.New()

	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:5173, http://localhost:4173",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, PATCH, OPTIONS",
	}))

	api := app.Group("/api")

	api.Post("/login", handlers.Login)

	authAll := handlers.AuthMiddleware(
		models.RoleScheduler,
		models.RoleWorker,
		models.RoleInspector,
		models.RoleManager,
	)

	authScheduler := handlers.AuthMiddleware(models.RoleScheduler, models.RoleManager)
	authInspector := handlers.AuthMiddleware(models.RoleInspector, models.RoleManager)
	authManager := handlers.AuthMiddleware(models.RoleManager)
	authWorker := handlers.AuthMiddleware(models.RoleWorker, models.RoleManager)

	api.Get("/projects", authAll, handlers.GetProjects)
	api.Get("/workers", authAll, handlers.GetWorkers)
	api.Get("/dashboard/stats", authManager, handlers.GetDashboardStats)

	schedule := api.Group("/schedules")
	schedule.Get("/", authAll, handlers.GetSchedules)
	schedule.Get("/:id", authAll, handlers.GetSchedule)
	schedule.Post("/", authScheduler, handlers.CreateSchedule)
	schedule.Post("/:id/publish", authScheduler, handlers.PublishSchedule)

	shift := api.Group("/shifts")
	shift.Get("/", authAll, handlers.GetShifts)
	shift.Get("/:id", authAll, handlers.GetShift)

	checkin := api.Group("/checkins")
	checkin.Get("/", authAll, handlers.GetCheckIns)
	checkin.Post("/", authWorker, handlers.CreateCheckIn)
	checkin.Post("/:id/checkout", authWorker, handlers.CheckOut)
	checkin.Patch("/:id/correct", authManager, handlers.CorrectCheckIn)

	inspection := api.Group("/inspections")
	inspection.Get("/", authAll, handlers.GetInspections)
	inspection.Post("/", authInspector, handlers.CreateInspection)

	rect := api.Group("/rectifications")
	rect.Get("/", authAll, handlers.GetRectifications)
	rect.Post("/", authInspector, handlers.CreateRectification)
	rect.Post("/:id/complete", authWorker, handlers.CompleteRectification)
	rect.Post("/:id/verify", authInspector, handlers.VerifyRectification)

	material := api.Group("/materials")
	material.Get("/", authAll, handlers.GetMaterialRequisitions)
	material.Post("/", authWorker, handlers.CreateMaterialRequisition)
	material.Patch("/:id/approve", authScheduler, handlers.ApproveMaterialRequisition)

	followup := api.Group("/followups")
	followup.Get("/", authAll, handlers.GetFollowUps)
	followup.Post("/", authManager, handlers.CreateFollowUp)
	followup.Post("/:id/complete", authManager, handlers.CompleteFollowUp)

	api.Get("/trace-chain", authAll, handlers.GetTraceChain)

	log.Println("Server starting on :3000")
	log.Fatal(app.Listen(":3000"))
}
