package database

import (
	"gallery-system/config"
	"gallery-system/models"
	"log"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect(cfg *config.Config) error {
	var err error
	DB, err = gorm.Open(postgres.Open(cfg.GetDSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
		NowFunc: func() time.Time {
			return time.Now().Local()
		},
	})
	if err != nil {
		return err
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	log.Println("Database connected successfully")
	return nil
}

func Migrate() error {
	err := DB.AutoMigrate(
		&models.User{},
		&models.Exhibit{},
		&models.ExhibitTransfer{},
		&models.Ticket{},
		&models.TicketVerifyLog{},
		&models.Activity{},
		&models.ActivityRegistration{},
		&models.ActivityAuditLog{},
		&models.AsyncTask{},
		&models.Notification{},
		&models.AuditLog{},
		&models.SystemLog{},
	)
	if err != nil {
		return err
	}
	log.Println("Database migration completed")
	return nil
}

func GetDB() *gorm.DB {
	return DB
}
