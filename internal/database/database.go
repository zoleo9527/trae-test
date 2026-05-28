package database

import (
	"fmt"
	"log"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"water-delivery-service/internal/config"
	"water-delivery-service/internal/models"
)

var DB *gorm.DB

func Connect() error {
	dsn := config.AppConfig.GetDSN()

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
		NowFunc: func() time.Time {
			return time.Now().Local()
		},
	})

	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get database instance: %w", err)
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	log.Println("Database connection established successfully")
	return nil
}

func AutoMigrate() error {
	err := DB.AutoMigrate(
		&models.WaterStation{},
		&models.User{},
		&models.Customer{},
		&models.DeliveryOrder{},
		&models.Complaint{},
		&models.Redelivery{},
		&models.Compensation{},
		&models.ComplaintPhoto{},
		&models.ComplaintNote{},
		&models.AuditLog{},
		&models.AsyncTask{},
	)

	if err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	log.Println("Database migration completed successfully")
	return nil
}
