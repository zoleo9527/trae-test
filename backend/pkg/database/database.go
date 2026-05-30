package database

import (
	"log"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"golf-range/pkg/models"
)

var DB *gorm.DB

func InitDB() {
	var err error
	DB, err = gorm.Open(sqlite.Open("golf_range.db"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	err = DB.AutoMigrate(
		&models.User{},
		&models.Member{},
		&models.Wallet{},
		&models.WalletRecord{},
		&models.Bay{},
		&models.Booking{},
		&models.CoachSchedule{},
		&models.Equipment{},
		&models.EquipmentRental{},
		&models.Exception{},
		&models.ExceptionFollowUp{},
		&models.AuditLog{},
	)
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	log.Println("Database initialized successfully")
}
