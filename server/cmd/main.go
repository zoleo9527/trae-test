package main

import (
	"log"
	"weddingsys/internal/handler"
	"weddingsys/internal/repository"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	store := repository.New()
	h := handler.New(store)

	app := fiber.New()
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:5173,http://127.0.0.1:5173",
		AllowHeaders:     "Origin,Content-Type,X-Auth-Token",
		AllowCredentials: true,
	}))

	api := app.Group("/api")
	api.Post("/login", h.Login)
	api.Get("/me", h.Me)
	api.Get("/orders", h.ListOrders)
	api.Get("/orders/:id", h.GetOrder)
	api.Post("/orders/:id/slots", h.AddSlot)
	api.Put("/orders/:id/slots/:slotId", h.RescheduleSlot)
	api.Post("/orders/:id/selections", h.AddSelection)
	api.Put("/orders/:id/selections/:selId/confirm", h.ConfirmSelection)
	api.Post("/orders/:id/payments/:payId/pay", h.PayPayment)
	api.Post("/orders/:id/exceptions", h.CreateException)
	api.Post("/orders/:id/exceptions/:excId/close", h.CloseException)

	log.Fatal(app.Listen(":8787"))
}
