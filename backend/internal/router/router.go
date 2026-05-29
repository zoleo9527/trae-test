package router

import (
	"github.com/cultural-store/inspection-service/internal/handler"
	"github.com/cultural-store/inspection-service/internal/middleware"
	"github.com/gofiber/fiber/v2"
)

func Setup(app *fiber.App, jwtSecret string, allowedOrigins string,
	authH *handler.AuthHandler,
	storeH *handler.StoreHandler,
	inspH *handler.InspectionHandler,
	rectH *handler.RectificationHandler,
	productH *handler.ProductHandler,
	inventoryH *handler.InventoryHandler,
	replenH *handler.ReplenishmentHandler,
	transferH *handler.TransferHandler,
	redemptionH *handler.RedemptionHandler,
	auditH *handler.AuditLogHandler,
) {
	app.Use(middleware.CORS(allowedOrigins))
	app.Use(middleware.RequestLogger())

	app.Post("/api/auth/login", authH.Login)

	api := app.Group("/api", middleware.JWTAuth(jwtSecret))

	api.Get("/auth/me", authH.Me)

	api.Get("/stores", storeH.List)

	api.Get("/inspections", inspH.List)
	api.Post("/inspections", inspH.Create)
	api.Get("/inspections/:id", inspH.Get)
	api.Put("/inspections/:id", inspH.Update)
	api.Get("/inspections/:id/items", inspH.ListItems)
	api.Post("/inspections/:id/items", inspH.CreateItem)
	api.Put("/inspections/:id/items/:itemId", inspH.UpdateItem)
	api.Get("/inspections/:id/items/:itemId/photos", inspH.ListPhotos)
	api.Post("/inspections/:id/items/:itemId/photos", inspH.UploadPhoto)

	api.Get("/rectifications", rectH.List)
	api.Post("/rectifications", rectH.Create)
	api.Get("/rectifications/:id", rectH.Get)
	api.Put("/rectifications/:id", rectH.Update)
	api.Get("/rectifications/:id/photos", rectH.ListPhotos)
	api.Post("/rectifications/:id/photos", rectH.UploadPhoto)
	api.Get("/rectifications/:id/comments", rectH.ListComments)
	api.Post("/rectifications/:id/comments", rectH.CreateComment)

	api.Get("/products", productH.List)
	api.Post("/products", productH.Create, middleware.RequireRole("admin", "planning_specialist"))
	api.Get("/products/:id", productH.Get)
	api.Put("/products/:id", productH.Update, middleware.RequireRole("admin", "planning_specialist"))

	api.Get("/inventory", inventoryH.List)
	api.Post("/inventory/adjust", inventoryH.Adjust, middleware.RequireRole("admin", "warehouse_manager"))

	api.Get("/replenishments", replenH.List)
	api.Post("/replenishments", replenH.Create)
	api.Get("/replenishments/:id", replenH.Get)
	api.Put("/replenishments/:id/status", replenH.UpdateStatus)
	api.Get("/replenishments/:id/items", replenH.ListItems)

	api.Get("/transfers", transferH.List)
	api.Post("/transfers", transferH.Create)
	api.Put("/transfers/:id/status", transferH.UpdateStatus)
	api.Get("/transfers/:id/items", transferH.ListItems)

	api.Get("/redemptions", redemptionH.List)
	api.Post("/redemptions", redemptionH.Create)
	api.Put("/redemptions/:id/fulfill", redemptionH.Fulfill, middleware.RequireRole("admin", "store_manager"))

	api.Get("/audit-logs", auditH.List)
}
