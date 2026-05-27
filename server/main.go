package main

import (
	"log"

	"carwash-system/api"
	"carwash-system/middleware"
	"carwash-system/models"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	models.InitDB()
	models.SeedData()

	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.ErrorHandler,
	})

	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:5173",
		AllowCredentials: true,
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
	}))
	app.Use(logger.New())

	api.SetupRoutes(app)

	log.Println("Server running on :8080")
	log.Fatal(app.Listen(":8080"))
}
