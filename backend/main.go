package main

import (
	"gallery-system/config"
	"gallery-system/database"
	"gallery-system/routes"
	"gallery-system/seeders"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("加载配置失败: %v", err)
	}

	if err := database.Connect(cfg); err != nil {
		log.Fatalf("数据库连接失败: %v", err)
	}

	if err := database.Migrate(); err != nil {
		log.Fatalf("数据库迁移失败: %v", err)
	}

	if err := seeders.Seed(); err != nil {
		log.Printf("种子数据初始化: %v", err)
	}

	app := fiber.New(fiber.Config{
		AppName:      "美术馆运营系统 v1.0",
		ServerHeader: "Gallery-System",
	})

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders: "Origin,Content-Type,Accept,Authorization",
	}))

	app.Use(logger.New(logger.Config{
		Format:     "[${time}] ${status} - ${method} ${path}\n",
		TimeFormat: "2006-01-02 15:04:05",
	}))

	app.Use(recover.New())

	routes.SetupRoutes(app, cfg)

	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"success": true,
			"message": "美术馆运营系统 API",
			"version": "1.0.0",
			"docs":    "/api/v1/health",
		})
	})

	log.Printf("服务器启动在 %s:%s", cfg.ServerHost, cfg.ServerPort)
	log.Fatal(app.Listen(cfg.ServerHost + ":" + cfg.ServerPort))
}
