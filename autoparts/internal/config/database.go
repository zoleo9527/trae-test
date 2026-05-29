package config

import (
	"fmt"
	"log"

	"autoparts/internal/model"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB(cfg *DatabaseConfig) (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s TimeZone=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName, cfg.SSLMode, cfg.TimeZone,
	)

	logLevel := logger.Info
	if AppConfigInstance.App.Env == "production" {
		logLevel = logger.Warn
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get sql DB: %w", err)
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)

	DB = db
	log.Println("Database connected successfully")
	return db, nil
}

func AutoMigrate(db *gorm.DB) error {
	err := db.AutoMigrate(
		&model.User{},
		&model.Customer{},
		&model.Part{},
		&model.Enquiry{},
		&model.EnquiryItem{},
		&model.Quote{},
		&model.QuoteItem{},
		&model.LockOrder{},
		&model.LockItem{},
		&model.AuditLog{},
		&model.AsyncTask{},
	)
	if err != nil {
		return fmt.Errorf("failed to migrate: %w", err)
	}
	log.Println("Database migration completed")
	return nil
}
