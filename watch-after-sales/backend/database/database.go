package database

import (
	"fmt"

	"watch-after-sales/backend/config"
	"watch-after-sales/backend/model"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() error {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		config.AppConfig.DBHost,
		config.AppConfig.DBPort,
		config.AppConfig.DBUser,
		config.AppConfig.DBPassword,
		config.AppConfig.DBName,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	DB = db

	return AutoMigrate()
}

func AutoMigrate() error {
	return DB.AutoMigrate(
		&model.User{},
		&model.Customer{},
		&model.RepairOrder{},
		&model.Part{},
		&model.PartLock{},
		&model.ProgressLog{},
		&model.AuditLog{},
		&model.SatisfactionCallback{},
	)
}
