package routes

import (
	"jewelry-store-system/config"
	"jewelry-store-system/handlers"
	"jewelry-store-system/middleware"
	"jewelry-store-system/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func Setup(app *fiber.App, db *gorm.DB, cfg *config.Config) {
	authHandler := handlers.NewAuthHandler(db, cfg)
	quotationHandler := handlers.NewQuotationHandler(db)
	maintenanceHandler := handlers.NewMaintenanceHandler(db)
	customerHandler := handlers.NewCustomerHandler(db)
	productHandler := handlers.NewProductHandler(db)
	auditHandler := handlers.NewAuditHandler(db)

	api := app.Group("/api")

	auth := api.Group("/auth")
	auth.Post("/login", authHandler.Login)

	protected := api.Group("", middleware.AuthRequired(cfg))

	protected.Get("/auth/me", authHandler.Me)

	quotations := protected.Group("/quotations")
	quotations.Post("", quotationHandler.Create)
	quotations.Get("", quotationHandler.List)
	quotations.Get("/:id", quotationHandler.Get)
	quotations.Put("/:id", quotationHandler.Update)
	quotations.Post("/:id/submit", quotationHandler.Submit)
	quotations.Post("/:id/approve", middleware.RequireRole(models.RoleManager), quotationHandler.Approve)
	quotations.Post("/:id/complete", quotationHandler.Complete)

	maintenances := protected.Group("/maintenances")
	maintenances.Post("", maintenanceHandler.Create)
	maintenances.Get("", maintenanceHandler.List)
	maintenances.Get("/:id", maintenanceHandler.Get)
	maintenances.Put("/:id", maintenanceHandler.Update)
	maintenances.Post("/:id/status", maintenanceHandler.UpdateStatus)
	maintenances.Post("/:id/assign", middleware.RequireRole(models.RoleManager, models.RoleAfterSales), maintenanceHandler.Assign)

	customers := protected.Group("/customers")
	customers.Post("", customerHandler.Create)
	customers.Get("", customerHandler.List)
	customers.Get("/:id", customerHandler.Get)
	customers.Put("/:id", customerHandler.Update)
	customers.Delete("/:id", middleware.RequireRole(models.RoleManager), customerHandler.Delete)

	products := protected.Group("/products")
	products.Post("", middleware.RequireRole(models.RoleManager), productHandler.Create)
	products.Get("", productHandler.List)
	products.Get("/:id", productHandler.Get)
	products.Put("/:id", middleware.RequireRole(models.RoleManager), productHandler.Update)
	products.Delete("/:id", middleware.RequireRole(models.RoleManager), productHandler.Delete)

	audit := protected.Group("/audit")
	audit.Get("/logs", middleware.RequireRole(models.RoleManager), auditHandler.GetAuditLogs)
	audit.Get("/logs/:module/:id", auditHandler.GetRecordAuditLogs)
	audit.Get("/history/:module/:id", auditHandler.GetStatusHistory)
}
