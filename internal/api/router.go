package api

import (
	"camp-management/internal/api/handler"
	"camp-management/internal/api/middleware"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func SetupRouter(handlers *handler.Handlers, authMiddleware *middleware.AuthMiddleware) *fiber.App {
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"code":    "INTERNAL_ERROR",
				"message": err.Error(),
			})
		},
	})

	app.Use(cors.New())
	app.Use(logger.New())
	app.Use(recover.New())

	api := app.Group("/api")

	auth := api.Group("/auth")
	auth.Post("/login", handlers.Auth.Login)
	auth.Get("/me", authMiddleware.AuthRequired(), handlers.Auth.Me)

	camps := api.Group("/camps", authMiddleware.AuthRequired())
	camps.Post("/", authMiddleware.RequireRole("director"), handlers.Camp.Create)
	camps.Get("/", handlers.Camp.List)
	camps.Get("/:id", handlers.Camp.Get)
	camps.Patch("/:id/status", authMiddleware.RequireRole("director"), handlers.Camp.UpdateStatus)

	campers := api.Group("/campers", authMiddleware.AuthRequired())
	campers.Post("/", handlers.Camper.Create)
	campers.Post("/batch", handlers.Camper.BatchCreate)
	campers.Get("/search/:campId", handlers.Camper.Search)
	campers.Get("/:id", handlers.Camper.Get)
	campers.Patch("/:id/status", handlers.Camper.UpdateStatus)
	campers.Get("/without-room/:campId", handlers.Camper.GetWithoutRoom)
	campers.Post("/assign-room", handlers.Camper.AssignRoom)
	campers.Post("/batch-assign-room", handlers.Camper.BatchAssignRoom)
	campers.Delete("/:id/room", handlers.Camper.UnassignRoom)

	rooms := api.Group("/rooms", authMiddleware.AuthRequired())
	rooms.Post("/", authMiddleware.RequireRole("director", "logistics"), handlers.Room.Create)
	rooms.Post("/batch", authMiddleware.RequireRole("director", "logistics"), handlers.Room.BatchCreate)
	rooms.Get("/camp/:campId", handlers.Room.GetByCampID)
	rooms.Get("/available/:campId", handlers.Room.GetAvailable)
	rooms.Get("/stats/:campId", handlers.Room.GetStats)
	rooms.Get("/:id", handlers.Room.Get)

	registrations := api.Group("/registrations", authMiddleware.AuthRequired())
	registrations.Post("/", handlers.Registration.Create)
	registrations.Get("/:id", handlers.Registration.Get)
	registrations.Get("/camp/:campId", handlers.Registration.GetByCampID)
	registrations.Post("/:id/confirm", handlers.Registration.Confirm)
	registrations.Post("/:id/paid", handlers.Registration.MarkPaid)
	registrations.Post("/:id/cancel", handlers.Registration.Cancel)

	activities := api.Group("/activities", authMiddleware.AuthRequired())
	activities.Post("/", authMiddleware.RequireRole("director", "teacher"), handlers.Activity.Create)
	activities.Post("/batch", authMiddleware.RequireRole("director", "teacher"), handlers.Activity.BatchCreate)
	activities.Get("/camp/:campId", handlers.Activity.GetByCampID)
	activities.Get("/:id", handlers.Activity.Get)
	activities.Post("/checkin", handlers.Activity.CheckIn)
	activities.Post("/batch-checkin", handlers.Activity.BatchCheckIn)
	activities.Get("/:id/attendances", handlers.Activity.GetAttendances)
	activities.Get("/camper/:camperId", handlers.Activity.GetCamperAttendances)

	medical := api.Group("/medical", authMiddleware.AuthRequired())
	medical.Post("/", handlers.Medical.Create)
	medical.Get("/:id", handlers.Medical.Get)
	medical.Get("/camp/:campId", handlers.Medical.GetByCampID)
	medical.Get("/camper/:camperId", handlers.Medical.GetByCamperID)
	medical.Post("/:id/resolve", handlers.Medical.Resolve)
	medical.Post("/:id/notify-parent", handlers.Medical.NotifyParent)

	supply := api.Group("/supply", authMiddleware.AuthRequired())
	supply.Post("/", handlers.Supply.Create)
	supply.Get("/:id", handlers.Supply.Get)
	supply.Get("/camp/:campId", handlers.Supply.GetByCampID)
	supply.Post("/:id/approve", authMiddleware.RequireRole("director", "logistics"), handlers.Supply.Approve)
	supply.Post("/:id/reject", authMiddleware.RequireRole("director", "logistics"), handlers.Supply.Reject)
	supply.Post("/:id/issue", authMiddleware.RequireRole("logistics"), handlers.Supply.Issue)

	audit := api.Group("/audit", authMiddleware.AuthRequired(), authMiddleware.RequireRole("director"))
	audit.Get("/", handlers.Audit.Query)
	audit.Get("/resource/:resourceType/:resourceId", handlers.Audit.GetByResource)
	audit.Get("/my", handlers.Audit.GetMyLogs)

	export := api.Group("/export", authMiddleware.AuthRequired())
	export.Get("/campers/:campId", handlers.Export.ExportCampers)
	export.Get("/registrations/:campId", handlers.Export.ExportRegistrations)
	export.Get("/tasks/my", handlers.Export.GetMyTasks)
	export.Get("/tasks/:id", handlers.Export.GetTask)

	tasks := api.Group("/tasks", authMiddleware.AuthRequired())
	tasks.Get("/my", handlers.Task.GetMyTasks)
	tasks.Get("/:id", handlers.Task.Get)

	return app
}
