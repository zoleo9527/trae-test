package database

import (
	"fmt"
	"log"
	"runner-platform/internal/config"
	"runner-platform/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Init() {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		config.AppConfig.Database.Host,
		config.AppConfig.Database.Port,
		config.AppConfig.Database.User,
		config.AppConfig.Database.Password,
		config.AppConfig.Database.Name,
		config.AppConfig.Database.SSLMode,
	)

	logLevel := logger.Info
	if config.AppConfig.Environment == "production" {
		logLevel = logger.Warn
	}

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Database connected successfully")
}

func AutoMigrate() {
	err := DB.AutoMigrate(
		&models.User{},
		&models.Order{},
		&models.Refund{},
		&models.Appeal{},
		&models.Subsidy{},
		&models.Remark{},
		&models.OperationLog{},
		&models.Assignment{},
		&models.TaskQueue{},
	)
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}
	log.Println("Database migrated successfully")
}
