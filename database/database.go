package database

import (
	"fmt"
	"jewelry-store-system/config"
	"jewelry-store-system/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Connect(cfg *config.Config) (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	return db, nil
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&models.User{},
		&models.Customer{},
		&models.Product{},
		&models.Quotation{},
		&models.ApprovalRecord{},
		&models.Maintenance{},
		&models.AuditLog{},
		&models.StatusHistory{},
	)
}
