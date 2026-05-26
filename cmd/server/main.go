package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"swimclub/internal/audit"
	"swimclub/internal/auth"
	"swimclub/internal/config"
	"swimclub/internal/db"
	"swimclub/internal/handler"
	"swimclub/internal/migrate"
	"swimclub/internal/notifier"
	"swimclub/internal/seed"
)

func main() {
	cfg := config.Load()

	pg, err := db.Open(cfg.DBURL)
	if err != nil {
		log.Fatalf("db: %v", err)
	}
	defer pg.Close()

	cwd, _ := os.Getwd()
	if err := migrate.RunMigrations(pg, cwd); err != nil {
		log.Fatalf("migrations: %v", err)
	}

	if cfg.SeedOnBoot {
		if err := seed.Run(context.Background(), pg); err != nil {
			log.Printf("seed: %v", err)
		}
	}

	app := fiber.New(fiber.Config{AppName: cfg.AppName})
	app.Use(recover.New())
	app.Use(cors.New())
	app.Use(logger.New())

	app.Use(func(c *fiber.Ctx) error {
		c.Locals("jwt_secret", cfg.JWTSecret)
		c.Locals("jwt_expire", cfg.JWTExpire)
		return c.Next()
	})

	h := &handler.Handler{DB: pg, Audit: audit.New(pg)}

	app.Get("/healthz", func(c *fiber.Ctx) error { return c.JSON(fiber.Map{"ok": true}) })

	api := app.Group("/api")
	api.Post("/auth/login", h.Login)

	authMw := auth.Middleware(cfg.JWTSecret)
	authed := api.Group("", authMw)
	authed.Get("/me", h.Me)
	authed.Get("/audit", auth.RequireRoles("owner", "coach_head", "front_desk"), h.ListAudit)
	authed.Get("/users", auth.RequireRoles("owner"), h.ListUsers)
	authed.Post("/users", auth.RequireRoles("owner"), h.CreateUser)

	authed.Get("/members", h.ListMembers)
	authed.Post("/members", auth.RequireRoles("owner", "front_desk"), h.CreateMember)
	authed.Get("/members/:id", h.GetMember)
	authed.Patch("/members/:id", auth.RequireRoles("owner", "front_desk"), h.PatchMember)

	authed.Get("/leaves", h.ListLeaves)
	authed.Post("/leaves", h.CreateLeave)
	authed.Get("/leaves/:id", h.GetLeave)
	authed.Post("/leaves/:id/approve", auth.RequireRoles("owner", "coach_head"), h.ApproveLeave)
	authed.Post("/leaves/:id/reject", auth.RequireRoles("owner", "coach_head"), h.RejectLeave)
	authed.Post("/leaves/:id/cancel", auth.RequireRoles("owner", "coach_head", "front_desk"), h.CancelLeave)

	authed.Get("/renewals", h.ListRenewals)
	authed.Post("/renewals", auth.RequireRoles("owner", "front_desk"), h.CreateRenewal)
	authed.Get("/renewals/:id", h.GetRenewal)
	authed.Patch("/renewals/:id", h.UpdateRenewal)

	authed.Get("/notes", h.ListNotes)
	authed.Post("/notes", h.CreateNote)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	worker := notifier.New(pg)
	go worker.Run(ctx)

	go func() {
		sig := make(chan os.Signal, 1)
		signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
		<-sig
		cancel()
		_ = app.ShutdownWithTimeout(3 * time.Second)
	}()

	log.Printf("listening on :%s", cfg.Port)
	if err := app.Listen(":" + cfg.Port); err != nil {
		log.Fatalf("listen: %v", err)
	}
}
