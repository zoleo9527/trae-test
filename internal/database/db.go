package database

import (
	"camp-system/internal/model"
	"log"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB() error {
	var err error
	DB, err = gorm.Open(sqlite.Open("camp_system.db"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return err
	}

	err = autoMigrate()
	if err != nil {
		return err
	}

	log.Println("数据库初始化成功")
	return nil
}

func autoMigrate() error {
	return DB.AutoMigrate(
		&model.User{},
		&model.UserLoginLog{},
		&model.Camp{},
		&model.Camper{},
		&model.Room{},
		&model.RoomChangeLog{},
		&model.RoomAssignment{},
		&model.Activity{},
		&model.CheckIn{},
		&model.MedicalReport{},
		&model.MaterialItem{},
		&model.MaterialIssue{},
		&model.FollowUp{},
		&model.FollowUpHistory{},
		&model.CheckInMedicalLink{},
		&model.StatusHistory{},
		&model.OperationLog{},
	)
}

func GetDB() *gorm.DB {
	return DB
}

func BeginTransaction() *gorm.DB {
	return DB.Begin()
}
