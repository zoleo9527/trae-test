package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"

	"camp-management/internal/config"
	"camp-management/internal/handlers"
	"camp-management/internal/middleware"
	"camp-management/internal/seed"
	"camp-management/pkg/database"
)

func main() {
	_ = godotenv.Load()

	cfg := config.Load()

	db, err := database.Init(cfg.DBPath)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	if err := seed.Run(db); err != nil {
		log.Printf("Seed warning: %v", err)
	}

	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		},
	})

	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:5173,http://localhost:3000",
		AllowCredentials: true,
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization",
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
	}))

	app.Use(logger.New())

	authHandler := handlers.NewAuthHandler(db, cfg.JWTSecret)
	camperHandler := handlers.NewCamperHandler(db)
	attendanceHandler := handlers.NewAttendanceHandler(db)
	medicalHandler := handlers.NewMedicalHandler(db)
	roomHandler := handlers.NewRoomHandler(db)
	supplyHandler := handlers.NewSupplyHandler(db)
	feedbackHandler := handlers.NewFeedbackHandler(db)
	dashboardHandler := handlers.NewDashboardHandler(db)

	api := app.Group("/api")

	api.Post("/auth/login", authHandler.Login)
	api.Get("/auth/me", middleware.AuthRequired(cfg.JWTSecret), authHandler.Me)

	protected := api.Group("", middleware.AuthRequired(cfg.JWTSecret))

	protected.Get("/dashboard/stats", dashboardHandler.GetStats)
	protected.Get("/dashboard/todo", dashboardHandler.GetTodoItems)

	campers := protected.Group("/campers")
	campers.Get("", camperHandler.List)
	campers.Get("/:id", camperHandler.Get)
	campers.Post("", middleware.RequireRole("director"), camperHandler.Create)
	campers.Put("/:id", middleware.RequireRole("director", "teacher"), camperHandler.Update)
	campers.Delete("/:id", middleware.RequireRole("director"), camperHandler.Delete)
	campers.Get("/:id/timeline", camperHandler.GetTimeline)

	attendance := protected.Group("/attendance")
	attendance.Get("", attendanceHandler.List)
	attendance.Get("/:id", attendanceHandler.Get)
	attendance.Post("", middleware.RequireRole("teacher", "director"), attendanceHandler.Create)
	attendance.Put("/:id", middleware.RequireRole("teacher", "director"), attendanceHandler.Update)
	attendance.Post("/:id/approve", middleware.RequireRole("director"), attendanceHandler.Approve)
	attendance.Post("/:id/reject", middleware.RequireRole("director"), attendanceHandler.Reject)

	medical := protected.Group("/medical")
	medical.Get("", medicalHandler.List)
	medical.Get("/:id", medicalHandler.Get)
	medical.Post("", middleware.RequireRole("teacher", "logistics", "director"), medicalHandler.Create)
	medical.Put("/:id", middleware.RequireRole("teacher", "logistics", "director"), medicalHandler.Update)
	medical.Post("/:id/resolve", middleware.RequireRole("logistics", "director"), medicalHandler.Resolve)
	medical.Post("/:id/followup", middleware.RequireRole("teacher", "director"), medicalHandler.AddFollowUp)

	rooms := protected.Group("/rooms")
	rooms.Get("", roomHandler.List)
	rooms.Get("/:id", roomHandler.Get)
	rooms.Post("", middleware.RequireRole("logistics", "director"), roomHandler.Create)
	rooms.Put("/:id", middleware.RequireRole("logistics", "director"), roomHandler.Update)
	rooms.Post("/assign", middleware.RequireRole("logistics", "director"), roomHandler.AssignCamper)
	rooms.Post("/unassign", middleware.RequireRole("logistics", "director"), roomHandler.UnassignCamper)

	supplies := protected.Group("/supplies")
	supplies.Get("", supplyHandler.List)
	supplies.Get("/:id", supplyHandler.Get)
	supplies.Post("", middleware.RequireRole("logistics", "director"), supplyHandler.Create)
	supplies.Put("/:id", middleware.RequireRole("logistics", "director"), supplyHandler.Update)
	supplies.Post("/:id/fulfill", middleware.RequireRole("logistics", "director"), supplyHandler.Fulfill)

	feedback := protected.Group("/feedback")
	feedback.Get("", feedbackHandler.List)
	feedback.Get("/:id", feedbackHandler.Get)
	feedback.Post("", middleware.RequireRole("teacher", "director"), feedbackHandler.Create)
	feedback.Put("/:id", middleware.RequireRole("teacher", "director"), feedbackHandler.Update)
	feedback.Post("/:id/complete", middleware.RequireRole("teacher", "director"), feedbackHandler.Complete)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	log.Printf("Server starting on port %s", port)
	log.Fatal(app.Listen(":" + port))
}
