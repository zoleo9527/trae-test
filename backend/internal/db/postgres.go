package db

import (
	"log"
	"tea-distribution/internal/config"
	"tea-distribution/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect() error {
	var err error
	DB, err = gorm.Open(postgres.Open(config.AppConfig.GetDSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return err
	}

	log.Println("Database connected successfully")
	return nil
}

func AutoMigrate() error {
	err := DB.AutoMigrate(
		&models.User{},
		&models.Product{},
		&models.Batch{},
		&models.Inventory{},
		&models.Warehouse{},
		&models.Store{},
		&models.Order{},
		&models.OrderItem{},
		&models.Allocation{},
		&models.AllocationItem{},
		&models.Shipment{},
		&models.ShipmentItem{},
		&models.ShipmentReview{},
		&models.AuditLog{},
		&models.AsyncTask{},
		&models.PriceApproval{},
	)
	if err != nil {
		return err
	}
	log.Println("Database migration completed")
	return nil
}
