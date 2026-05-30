package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"golf-range/pkg/database"
	"golf-range/pkg/handlers"
	"golf-range/pkg/middleware"
)

func main() {
	database.InitDB()
	database.SeedData()

	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.ErrorHandler,
	})

	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:5173",
		AllowCredentials: true,
		AllowHeaders:     "Content-Type, Authorization",
	}))

	app.Get("/api/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	auth := app.Group("/api/auth")
	auth.Post("/login", handlers.Login)

	api := app.Group("/api")
	api.Use(middleware.AuthRequired)

	api.Get("/auth/me", handlers.GetCurrentUser)

	users := api.Group("/users")
	users.Get("/", handlers.ListUsers)

	bookings := api.Group("/bookings")
	bookings.Get("/", handlers.ListBookings)
	bookings.Get("/:id", handlers.GetBooking)
	bookings.Post("/", handlers.CreateBooking)
	bookings.Put("/:id/checkin", handlers.CheckInBooking)
	bookings.Put("/:id/checkout", handlers.CheckOutBooking)
	bookings.Post("/:id/exception", handlers.CreateException)
	bookings.Get("/:id/exceptions", handlers.ListBookingExceptions)
	bookings.Put("/exceptions/:exceptionId/resolve", handlers.ResolveException)
	bookings.Post("/exceptions/:exceptionId/followup", handlers.AddExceptionFollowUp)

	coaches := api.Group("/coaches")
	coaches.Get("/", handlers.ListCoaches)
	coaches.Get("/schedules", handlers.ListSchedules)
	coaches.Post("/schedules", handlers.CreateSchedule)
	coaches.Put("/schedules/:id", handlers.UpdateSchedule)

	equipment := api.Group("/equipment")
	equipment.Get("/", handlers.ListEquipment)
	equipment.Post("/:id/borrow", handlers.BorrowEquipment)
	equipment.Post("/:id/return", handlers.ReturnEquipment)
	equipment.Get("/rentals", handlers.ListRentals)

	wallets := api.Group("/wallets")
	wallets.Get("/:memberId", handlers.GetWallet)
	wallets.Post("/:memberId/recharge", handlers.RechargeWallet)
	wallets.Get("/:memberId/records", handlers.ListWalletRecords)

	members := api.Group("/members")
	members.Get("/", handlers.ListMembers)

	api.Get("/exceptions", handlers.ListAllExceptions)

	log.Println("Server starting on :3000")
	log.Fatal(app.Listen(":3000"))
}
