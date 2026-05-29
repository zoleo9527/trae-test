package router

import (
	"github.com/cultural-store/inspection-service/internal/handler"
	"github.com/cultural-store/inspection-service/internal/middleware"
	"github.com/cultural-store/inspection-service/internal/model"
	"github.com/gofiber/fiber/v2"
)

type StoreFetcher interface {
	GetReplenishmentOrderByID(id string) (*model.ReplenishmentOrder, error)
	GetTransferOrderByID(id string) (*model.TransferOrder, error)
	GetMemberRedemptionByID(id string) (*model.MemberRedemption, error)
	GetRectificationByID(id string) (*model.Rectification, error)
}

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
	storeFetcher StoreFetcher,
) {
	app.Use(middleware.CORS(allowedOrigins))
	app.Use(middleware.RequestLogger())

	app.Post("/api/auth/login", authH.Login)

	api := app.Group("/api", middleware.JWTAuth(jwtSecret))

	api.Get("/auth/me", authH.Me)

	api.Get("/stores", storeH.List)

	api.Get("/inspections", middleware.InjectStoreID(), inspH.List)
	api.Post("/inspections", middleware.InjectStoreID(), inspH.Create)
	api.Get("/inspections/:id", inspH.Get)
	api.Put("/inspections/:id", inspH.Update)
	api.Get("/inspections/:id/items", inspH.ListItems)
	api.Post("/inspections/:id/items", inspH.CreateItem)
	api.Put("/inspections/:id/items/:itemId", inspH.UpdateItem)
	api.Get("/inspections/:id/items/:itemId/photos", inspH.ListPhotos)
	api.Post("/inspections/:id/items/:itemId/photos", inspH.UploadPhoto)

	api.Get("/rectifications", middleware.InjectStoreID(), rectH.List)
	api.Post("/rectifications", rectH.Create)
	api.Get("/rectifications/:id", middleware.RequireRectificationStoreAccess(storeFetcher), rectH.Get)
	api.Put("/rectifications/:id", middleware.RequireRectificationStoreAccess(storeFetcher), rectH.Update)
	api.Get("/rectifications/:id/photos", middleware.RequireRectificationStoreAccess(storeFetcher), rectH.ListPhotos)
	api.Post("/rectifications/:id/photos", middleware.RequireRectificationStoreAccess(storeFetcher), rectH.UploadPhoto)
	api.Get("/rectifications/:id/comments", middleware.RequireRectificationStoreAccess(storeFetcher), rectH.ListComments)
	api.Post("/rectifications/:id/comments", middleware.RequireRectificationStoreAccess(storeFetcher), rectH.CreateComment)

	api.Get("/products", middleware.InjectStoreID(), productH.List)
	api.Post("/products", middleware.RequireRole("admin", "planning_specialist"), productH.Create)
	api.Get("/products/:id", productH.Get)
	api.Put("/products/:id", middleware.RequireRole("admin", "planning_specialist"), productH.Update)

	api.Get("/inventory", middleware.InjectStoreID(), inventoryH.List)
	api.Post("/inventory/adjust", middleware.RequireRole("admin", "warehouse_manager"), inventoryH.Adjust)

	api.Get("/replenishments", middleware.InjectStoreID(), replenH.List)
	api.Post("/replenishments", middleware.InjectStoreID(), replenH.Create)
	api.Get("/replenishments/:id", middleware.RequireReplenishmentStoreAccess(storeFetcher), replenH.Get)
	api.Put("/replenishments/:id/status", middleware.RequireReplenishmentStoreAccess(storeFetcher), replenH.UpdateStatus)
	api.Get("/replenishments/:id/items", middleware.RequireReplenishmentStoreAccess(storeFetcher), replenH.ListItems)

	api.Get("/transfers", middleware.InjectStoreID(), transferH.List)
	api.Post("/transfers", transferH.Create)
	api.Get("/transfers/:id", middleware.RequireTransferStoreAccess(storeFetcher), transferH.Get)
	api.Put("/transfers/:id/status", middleware.RequireTransferStoreAccess(storeFetcher), transferH.UpdateStatus)
	api.Get("/transfers/:id/items", middleware.RequireTransferStoreAccess(storeFetcher), transferH.ListItems)

	api.Get("/redemptions", middleware.InjectStoreID(), redemptionH.List)
	api.Post("/redemptions", middleware.InjectStoreID(), redemptionH.Create)
	api.Get("/redemptions/:id", middleware.RequireRedemptionStoreAccess(storeFetcher), redemptionH.Get)
	api.Put("/redemptions/:id/fulfill", middleware.RequireRole("admin", "store_manager"), middleware.RequireRedemptionStoreAccess(storeFetcher), redemptionH.Fulfill)

	api.Get("/audit-logs", auditH.List)
}
