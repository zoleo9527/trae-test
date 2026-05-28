package main

import (
	"camp-system/internal/config"
	"camp-system/internal/database"
	"camp-system/internal/router"
	"log"
)

func main() {
	log.Println("正在启动游学营地管理系统...")

	cfg := config.LoadConfig()

	if err := database.InitDB(); err != nil {
		log.Fatalf("数据库初始化失败: %v", err)
	}

	if err := database.SeedData(); err != nil {
		log.Fatalf("演示数据初始化失败: %v", err)
	}

	r := router.SetupRouter()

	log.Println("========================================")
	log.Println("游学营地管理系统启动成功!")
	log.Println("服务地址: http://localhost:" + cfg.Server.Port)
	log.Println("========================================")
	log.Println("演示账号:")
	log.Println("  营地主任: director / 123456")
	log.Println("  班务老师: teacher1 / 123456")
	log.Println("  班务老师: teacher2 / 123456")
	log.Println("  后勤协调: logistics / 123456")
	log.Println("  医护人员: medical / 123456")
	log.Println("  系统管理员: admin / 123456")
	log.Println("========================================")

	if err := r.Run(":" + cfg.Server.Port); err != nil {
		log.Fatalf("服务启动失败: %v", err)
	}
}
