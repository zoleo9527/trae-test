package main

import (
	"log"
	"runner-platform/backend/database"
	"runner-platform/backend/handlers"
	"runner-platform/backend/middleware"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		},
	})

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	app.Use(logger.New())

	database.InitDB()

	api := app.Group("/api")
	api.Post("/login", handlers.Login)
	api.Get("/auth/me", middleware.AuthMiddleware, handlers.GetCurrentUser)

	orders := api.Group("/orders", middleware.AuthMiddleware)
	orders.Get("/", handlers.GetOrders)
	orders.Get("/:id", handlers.GetOrder)
	orders.Post("/", middleware.RequireRole("manager", "dispatcher"), handlers.CreateOrder)
	orders.Put("/:id/assign", middleware.RequireRole("dispatcher"), handlers.AssignOrder)
	orders.Put("/:id/status", handlers.UpdateOrderStatus)
	orders.Put("/:id/pickup", middleware.RequireRole("runner"), handlers.PickupOrder)
	orders.Put("/:id/deliver", middleware.RequireRole("runner"), handlers.DeliverOrder)

	appeals := api.Group("/appeals", middleware.AuthMiddleware)
	appeals.Get("/", handlers.GetAppeals)
	appeals.Get("/:id", handlers.GetAppeal)
	appeals.Post("/", middleware.RequireRole("runner", "customer_service"), handlers.CreateAppeal)
	appeals.Put("/:id/review", middleware.RequireRole("manager"), handlers.ReviewAppeal)

	subsidies := api.Group("/subsidies", middleware.AuthMiddleware)
	subsidies.Get("/", handlers.GetSubsidies)
	subsidies.Get("/:id", handlers.GetSubsidy)
	subsidies.Post("/calculate", middleware.RequireRole("manager"), handlers.CalculateSubsidy)

	api.Get("/runners", middleware.AuthMiddleware, handlers.GetRunners)
	api.Get("/timeline/:orderId", middleware.AuthMiddleware, handlers.GetOrderTimeline)

	log.Println("Server starting on :3001")
	log.Fatal(app.Listen(":3001"))
}
