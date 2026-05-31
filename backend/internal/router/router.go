package router

import (
	"floor-settlement/internal/handler"
	"floor-settlement/internal/middleware"
	"floor-settlement/internal/service"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(
	app *fiber.App,
	authHandler *handler.AuthHandler,
	projectHandler *handler.ProjectHandler,
	teamHandler *handler.TeamHandler,
	attendanceHandler *handler.AttendanceHandler,
	settlementHandler *handler.SettlementHandler,
	deliveryHandler *handler.DeliveryHandler,
	changeOrderHandler *handler.ChangeOrderHandler,
	qualityHandler *handler.QualityHandler,
	reworkHandler *handler.ReworkHandler,
	auditHandler *handler.AuditHandler,
	authService *service.AuthService,
) {
	api := app.Group("/api")

	api.Post("/auth/login", authHandler.Login)

	auth := api.Group("", middleware.JWTAuth(authService))

	auth.Get("/auth/me", authHandler.Me)

	auth.Post("/projects", projectHandler.Create)
	auth.Get("/projects", projectHandler.List)
	auth.Get("/projects/:id", projectHandler.GetByID)

	auth.Post("/teams", teamHandler.Create)
	auth.Get("/teams/project/:project_id", teamHandler.ListByProject)
	auth.Get("/teams/:id", teamHandler.GetByID)

	auth.Post("/attendance", middleware.RoleRequired("team_leader", "project_manager", "admin"), attendanceHandler.Create)
	auth.Get("/attendance", attendanceHandler.Filter)
	auth.Get("/attendance/summary", attendanceHandler.GetSummary)
	auth.Get("/attendance/:id", attendanceHandler.GetByID)
	auth.Put("/attendance/:id", middleware.RoleRequired("team_leader", "project_manager", "admin"), attendanceHandler.Update)
	auth.Delete("/attendance/:id", middleware.RoleRequired("admin"), attendanceHandler.Delete)

	auth.Post("/settlements/generate", middleware.RoleRequired("project_manager", "admin"), settlementHandler.Generate)
	auth.Get("/settlements/dashboard", settlementHandler.Dashboard)
	auth.Get("/settlements", settlementHandler.Filter)
	auth.Get("/settlements/:id", settlementHandler.GetByID)
	auth.Post("/settlements/:id/status", settlementHandler.TransitionStatus)

	auth.Post("/deliveries", middleware.RoleRequired("project_manager", "admin"), deliveryHandler.Create)
	auth.Get("/deliveries", deliveryHandler.Filter)
	auth.Get("/deliveries/:id", deliveryHandler.GetByID)
	auth.Put("/deliveries/:id", middleware.RoleRequired("project_manager", "admin"), deliveryHandler.Update)

	auth.Post("/change-orders", middleware.RoleRequired("project_manager", "quality_engineer", "admin"), changeOrderHandler.Create)
	auth.Get("/change-orders", changeOrderHandler.Filter)
	auth.Get("/change-orders/:id", changeOrderHandler.GetByID)
	auth.Post("/change-orders/:id/confirm", middleware.RoleRequired("project_manager", "admin"), changeOrderHandler.Confirm)

	auth.Post("/quality", middleware.RoleRequired("quality_engineer", "admin"), qualityHandler.Create)
	auth.Get("/quality/pass-rate", qualityHandler.PassRate)
	auth.Get("/quality", qualityHandler.Filter)
	auth.Get("/quality/:id", qualityHandler.GetByID)
	auth.Put("/quality/:id", middleware.RoleRequired("quality_engineer", "admin"), qualityHandler.Update)

	auth.Post("/reworks", middleware.RoleRequired("quality_engineer", "project_manager", "admin"), reworkHandler.Create)
	auth.Get("/reworks", reworkHandler.Filter)
	auth.Get("/reworks/by-inspection/:inspection_id", reworkHandler.ByInspection)
	auth.Get("/reworks/:id", reworkHandler.GetByID)
	auth.Put("/reworks/:id/status", middleware.RoleRequired("quality_engineer", "admin"), reworkHandler.UpdateStatus)

	auth.Get("/audit", auditHandler.Filter)
	auth.Get("/audit/history", auditHandler.EntityHistory)
}
