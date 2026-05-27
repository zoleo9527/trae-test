package routes

import (
	"wedding-photo-backend/internal/handlers"
	"wedding-photo-backend/internal/models"
	"wedding-photo-backend/pkg/config"
	"wedding-photo-backend/pkg/middleware"

	"github.com/gofiber/fiber/v2"
)

func Setup(app *fiber.App, cfg *config.Config) {
	api := app.Group("/api")

	authHandler := handlers.NewAuthHandler(cfg)

	api.Post("/auth/login", authHandler.Login)

	auth := api.Group("", middleware.AuthRequired(cfg))
	{
		auth.Get("/auth/me", authHandler.GetCurrentUser)
		auth.Post("/auth/logout", authHandler.Logout)

		costumeHandler := handlers.NewCostumeHandler()
		costumes := auth.Group("/costumes")
		{
			costumes.Post("", costumeHandler.Create)
			costumes.Get("", costumeHandler.GetList)
			costumes.Get("/:id", costumeHandler.GetDetail)
			costumes.Put("/:id", costumeHandler.Update)
			costumes.Delete("/:id", costumeHandler.Delete)
		}

		scheduleHandler := handlers.NewScheduleHandler()
		schedules := auth.Group("/schedules")
		{
			schedules.Post("/customers", scheduleHandler.CreateCustomer)
			schedules.Get("/customers", scheduleHandler.GetCustomers)
			schedules.Post("", scheduleHandler.Create)
			schedules.Get("", scheduleHandler.GetList)
			schedules.Get("/:id", scheduleHandler.GetDetail)
			schedules.Patch("/:id/status", scheduleHandler.UpdateStatus)
		}

		dispatchHandler := handlers.NewDispatchHandler()
		dispatches := auth.Group("/dispatches")
		{
			dispatches.Post("", dispatchHandler.Create)
			dispatches.Get("", dispatchHandler.GetList)
			dispatches.Get("/:id", dispatchHandler.GetDetail)
			dispatches.Post("/:id/pickup", dispatchHandler.Pickup)
			dispatches.Post("/:id/return", dispatchHandler.Return)
			dispatches.Post("/:id/cancel", dispatchHandler.Cancel)
		}

		maintenanceHandler := handlers.NewMaintenanceHandler()
		maintenances := auth.Group("/maintenances")
		{
			maintenances.Post("", maintenanceHandler.Create)
			maintenances.Get("", maintenanceHandler.GetList)
			maintenances.Get("/:id", maintenanceHandler.GetDetail)
			maintenances.Post("/:id/complete", maintenanceHandler.Complete)
			maintenances.Patch("/:id/status", maintenanceHandler.UpdateStatus)
		}

		manager := auth.Group("", middleware.RoleRequired(
			string(models.RoleStoreManager),
		))
		{
			exportHandler := handlers.NewExportHandler()
			exports := manager.Group("/exports")
			{
				exports.Get("/dispatches", exportHandler.ExportDispatches)
				exports.Get("/maintenances", exportHandler.ExportMaintenances)
				exports.Get("/costumes", exportHandler.ExportCostumes)
			}

			logHandler := handlers.NewLogHandler()
			logs := manager.Group("/logs")
			{
				logs.Get("", logHandler.GetLogs)
			}
		}
	}

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"message": "婚纱影楼服装调度系统运行正常",
		})
	})
}
