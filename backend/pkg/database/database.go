package database

import (
	"camp-management/internal/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func Init(dbPath string) (*gorm.DB, error) {
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	err = db.AutoMigrate(
		&models.User{},
		&models.Room{},
		&models.Camper{},
		&models.Attendance{},
		&models.MedicalRecord{},
		&models.MedicalFollowUp{},
		&models.Supply{},
		&models.Feedback{},
		&models.TimelineEvent{},
	)
	if err != nil {
		return nil, err
	}

	return db, nil
}
