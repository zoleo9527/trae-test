package routes

import (
	"gallery-system/config"
	"gallery-system/handlers"
	"gallery-system/middleware"
	"gallery-system/models"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App, cfg *config.Config) {
	api := app.Group("/api/v1")

	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"success": true,
			"message": "OK",
			"version": "1.0.0",
		})
	})

	auth := api.Group("/auth")
	auth.Post("/login", handlers.Login(cfg))

	auth.Use(middleware.AuthRequired(cfg))
	auth.Get("/profile", handlers.GetCurrentUserProfile)
	auth.Put("/password", handlers.ChangePassword)

	managerOnly := middleware.RoleRequired(string(models.RoleManager))
	ticketingOnly := middleware.RoleRequired(string(models.RoleManager), string(models.RoleTicketing))
	activitiesOnly := middleware.RoleRequired(string(models.RoleManager), string(models.RoleActivities))
	allRoles := middleware.RoleRequired(string(models.RoleManager), string(models.RoleTicketing), string(models.RoleActivities))

	tickets := api.Group("/tickets")
	tickets.Use(middleware.AuthRequired(cfg), allRoles)
	tickets.Post("", ticketingOnly, handlers.CreateTicket)
	tickets.Get("/statistics", handlers.GetTicketStatistics)
	tickets.Get("", handlers.GetTicketList)
	tickets.Get("/:id", handlers.GetTicket)
	tickets.Put("/:id/status", ticketingOnly, handlers.UpdateTicketStatus)

	tickets.Post("/verify", ticketingOnly, handlers.VerifyTicket)
	tickets.Get("/:id/verify-logs", handlers.GetTicketVerifyLogs)
	tickets.Get("/verify-logs/all", handlers.GetTicketVerifyLogs)

	activities := api.Group("/activities")
	activities.Use(middleware.AuthRequired(cfg), allRoles)
	activities.Post("", activitiesOnly, handlers.CreateActivity)
	activities.Get("", handlers.GetActivityList)
	activities.Get("/:id", handlers.GetActivity)
	activities.Put("/:id/status", managerOnly, handlers.UpdateActivityStatus)
	activities.Put("/:id/checkin-status", activitiesOnly, handlers.UpdateActivityCheckinStatus)

	activities.Post("/:id/register", activitiesOnly, handlers.CreateRegistration)
	activities.Get("/:id/registrations", handlers.GetRegistrationList)
	activities.Post("/registrations/:id/confirm", activitiesOnly, handlers.ConfirmRegistration)
	activities.Post("/registrations/:id/checkin", activitiesOnly, handlers.CheckinRegistration)
	activities.Get("/:id/audit-logs", handlers.GetActivityAuditLogs)
	activities.Get("/registrations/:id/trace", handlers.GetRegistrationTrace)
	activities.Get("/:id/full-trace", handlers.GetActivityFullTrace)

	exhibits := api.Group("/exhibits")
	exhibits.Use(middleware.AuthRequired(cfg), allRoles)
	exhibits.Post("", managerOnly, handlers.CreateExhibit)
	exhibits.Get("", handlers.GetExhibitList)
	exhibits.Get("/:id", handlers.GetExhibit)

	exhibits.Post("/transfers", managerOnly, handlers.CreateTransfer)
	exhibits.Get("/transfers/all", handlers.GetTransferList)
	exhibits.Post("/transfers/:id/confirm", managerOnly, handlers.ConfirmTransfer)

	audit := api.Group("/audit")
	audit.Use(middleware.AuthRequired(cfg), managerOnly)
	audit.Get("/logs", handlers.GetAuditLogs)
	audit.Get("/logs/:id", handlers.GetAuditLogDetail)
	audit.Get("/trace", handlers.GetAuditTrace)
	audit.Get("/system-logs", handlers.GetSystemLogs)

	tasks := api.Group("/tasks")
	tasks.Use(middleware.AuthRequired(cfg), allRoles)
	tasks.Post("/export", handlers.CreateExportTask)
	tasks.Get("", handlers.GetTaskList)
	tasks.Get("/:id", handlers.GetTaskDetail)
}
