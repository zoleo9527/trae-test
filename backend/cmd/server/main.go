package main

import (
	"camp-server/internal/database"
	"camp-server/internal/handlers"
	"camp-server/internal/middleware"
	"camp-server/internal/models"
	"camp-server/internal/seed"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	database.Init()
	models.SetDB(database.DB)

	err := database.DB.AutoMigrate(
		&models.User{},
		&models.Store{},
		&models.CollabProduct{},
		&models.Inventory{},
		&models.Order{},
		&models.Inspection{},
		&models.ExceptionRecord{},
		&models.OperationLog{},
		&models.ReviewRecord{},
	)
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	var userCount int64
	database.DB.Model(&models.User{}).Count(&userCount)
	if userCount == 0 {
		seed.Seed()
	}

	app := fiber.New(fiber.Config{
		BodyLimit: 10 * 1024 * 1024,
	})

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,PUT,DELETE,PATCH,OPTIONS",
		AllowHeaders: "Origin,Content-Type,Accept,Authorization",
	}))

	api := app.Group("/api")

	api.Post("/login", handlers.Login)

	auth := api.Group("")
	auth.Use(middleware.Auth())

	auth.Get("/user", handlers.GetCurrentUser)
	auth.Get("/users", handlers.ListUsers)

	auth.Get("/dashboard", handlers.GetDashboard)

	auth.Get("/stores", handlers.ListStores)

	products := auth.Group("/products")
	products.Get("", handlers.ListProducts)
	products.Get("/:id", handlers.GetProduct)
	products.Post("", middleware.RequireRole(models.RolePlanner), handlers.CreateProduct)
	products.Put("/:id", middleware.RequireRole(models.RolePlanner), handlers.UpdateProduct)
	products.Post("/:id/submit", middleware.RequireRole(models.RolePlanner), handlers.SubmitForApproval)
	products.Post("/:id/approve", middleware.RequireRole(models.RoleManager), handlers.ApproveProduct)
	products.Post("/:id/reject", middleware.RequireRole(models.RoleManager), handlers.RejectProduct)
	products.Post("/:id/on-shelf", middleware.RequireRole(models.RoleWarehouse), handlers.OnShelfProduct)
	products.Post("/:id/off-shelf", middleware.RequireRole(models.RoleManager), handlers.OffShelfProduct)
	products.Post("/:id/complete-review", middleware.RequireRole(models.RoleManager, models.RolePlanner), handlers.CompleteReview)
	products.Get("/:id/review-summary", handlers.GetProductReviewSummary)

	orders := auth.Group("/orders")
	orders.Get("", handlers.ListOrders)
	orders.Get("/:id", handlers.GetOrder)
	orders.Post("", handlers.CreateOrder)
	orders.Post("/:id/approve", middleware.RequireRole(models.RoleManager), handlers.ApproveOrder)
	orders.Post("/:id/reject", middleware.RequireRole(models.RoleManager), handlers.RejectOrder)
	orders.Post("/:id/ship", middleware.RequireRole(models.RoleWarehouse), handlers.ShipOrder)
	orders.Post("/:id/receive", middleware.RequireRole(models.RoleWarehouse, models.RoleManager), handlers.ReceiveOrder)
	orders.Post("/:id/complete", middleware.RequireRole(models.RoleWarehouse, models.RoleManager), handlers.CompleteOrder)

	inventory := auth.Group("/inventory")
	inventory.Get("", handlers.ListInventory)
	inventory.Get("/:id", handlers.GetInventory)
	inventory.Post("/:id/stock-count", middleware.RequireRole(models.RoleWarehouse, models.RoleManager), handlers.StockCount)
	inventory.Post("/:id/adjust", middleware.RequireRole(models.RoleWarehouse, models.RoleManager), handlers.AdjustInventory)

	inspections := auth.Group("/inspections")
	inspections.Get("", handlers.ListInspections)
	inspections.Get("/:id", handlers.GetInspection)
	inspections.Post("", middleware.RequireRole(models.RoleManager), handlers.CreateInspection)
	inspections.Post("/:id/follow-up", handlers.FollowUpInspection)
	inspections.Post("/:id/close", middleware.RequireRole(models.RoleManager), handlers.CloseInspection)

	exceptions := auth.Group("/exceptions")
	exceptions.Get("", handlers.ListExceptions)
	exceptions.Get("/:id", handlers.GetException)
	exceptions.Post("", handlers.CreateException)
	exceptions.Post("/:id/assign", middleware.RequireRole(models.RoleManager), handlers.AssignException)
	exceptions.Post("/:id/resolve", middleware.RequireRole(models.RoleWarehouse, models.RoleManager), handlers.ResolveException)
	exceptions.Post("/:id/review", middleware.RequireRole(models.RoleManager), handlers.ReviewException)
	exceptions.Post("/:id/reopen", handlers.ReopenException)
	exceptions.Delete("/:id", middleware.RequireRole(models.RoleManager), handlers.DeleteException)

	reviews := auth.Group("/reviews")
	reviews.Get("", handlers.ListReviews)
	reviews.Get("/:id", handlers.GetReview)
	reviews.Post("", middleware.RequireRole(models.RoleManager, models.RolePlanner), handlers.CreateReview)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	log.Printf("Server starting on port %s...", port)
	log.Fatal(app.Listen(":" + port))
}
