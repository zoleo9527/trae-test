package routes

import (
	"tea-distribution/internal/auth"
	"tea-distribution/internal/controllers"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func SetupRoutes(app *fiber.App) {
	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	api := app.Group("/api")

	authCtrl := controllers.NewAuthController()
	api.Post("/auth/login", authCtrl.Login)

	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	authorized := api.Group("", auth.JWTMiddleware())

	authorized.Get("/auth/me", authCtrl.GetCurrentUser)
	authorized.Post("/auth/logout", authCtrl.Logout)

	orderCtrl := controllers.NewOrderController()
	orders := authorized.Group("/orders")
	{
		orders.Get("", orderCtrl.List)
		orders.Post("", auth.RequireSalesOrManager(), orderCtrl.Create)
		orders.Get("/:id", orderCtrl.GetByID)
		orders.Post("/:id/submit", auth.RequireSalesOrManager(), orderCtrl.Submit)
		orders.Post("/:id/approve", auth.RequireManager(), orderCtrl.Approve)
		orders.Post("/:id/reject", auth.RequireManager(), orderCtrl.Reject)
		orders.Post("/:id/cancel", auth.RequireSalesOrManager(), orderCtrl.Cancel)
		orders.Post("/batch/submit", auth.RequireSalesOrManager(), orderCtrl.BatchSubmit)
		orders.Post("/batch/approve", auth.RequireManager(), orderCtrl.BatchApprove)
	}

	allocationCtrl := controllers.NewAllocationController()
	allocations := authorized.Group("/allocations")
	{
		allocations.Get("", allocationCtrl.List)
		allocations.Post("", auth.RequireWarehouseOrManager(), allocationCtrl.Create)
		allocations.Get("/:id", allocationCtrl.GetByID)
		allocations.Post("/:id/start-picking", auth.RequireWarehouseOrManager(), allocationCtrl.StartPicking)
		allocations.Post("/:id/confirm-packed", auth.RequireWarehouseOrManager(), allocationCtrl.ConfirmPacked)
		allocations.Post("/:id/mark-exception", auth.RequireWarehouseOrManager(), allocationCtrl.MarkException)
		allocations.Post("/:id/resolve-exception", auth.RequireWarehouseOrManager(), allocationCtrl.ResolveException)
	}

	shipmentCtrl := controllers.NewShipmentController()
	shipments := authorized.Group("/shipments")
	{
		shipments.Get("", shipmentCtrl.List)
		shipments.Get("/abnormal", auth.RequireWarehouseOrManager(), shipmentCtrl.ListAbnormal)
		shipments.Post("", auth.RequireWarehouseOrManager(), shipmentCtrl.Create)
		shipments.Get("/:id", shipmentCtrl.GetByID)
		shipments.Post("/:id/start-review", auth.RequireWarehouseOrManager(), shipmentCtrl.StartReview)
		shipments.Post("/:id/review", auth.RequireWarehouseOrManager(), shipmentCtrl.Review)
		shipments.Post("/:id/resolve-dispute", auth.RequireManager(), shipmentCtrl.ResolveDispute)
	}

	auditCtrl := controllers.NewAuditController()
	audit := authorized.Group("/audit-logs")
	{
		audit.Get("", auth.RequireManager(), auditCtrl.List)
	}

	exportCtrl := controllers.NewExportController()
	exports := authorized.Group("/exports")
	{
		exports.Post("/orders", auth.RequireManager(), exportCtrl.ExportOrders)
		exports.Post("/shipments", auth.RequireManager(), exportCtrl.ExportShipments)
		exports.Get("/tasks", exportCtrl.ListTasks)
		exports.Get("/tasks/:id", exportCtrl.GetTask)
		exports.Get("/tasks/:id/download", exportCtrl.Download)
	}
}
