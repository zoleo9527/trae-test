package database

import (
	"fmt"
	"log"
	"exhibition-system/internal/config"
	"exhibition-system/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect() error {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		config.AppConfig.DB.Host,
		config.AppConfig.DB.Port,
		config.AppConfig.DB.User,
		config.AppConfig.DB.Password,
		config.AppConfig.DB.Name,
		config.AppConfig.DB.SSLMode,
	)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	log.Println("Database connected successfully")
	return nil
}

func Migrate() error {
	err := DB.AutoMigrate(
		&models.User{},
		&models.Project{},
		&models.ProjectUser{},
		&models.ProjectSupplier{},
		&models.Certificate{},
		&models.Material{},
		&models.VersionLog{},
		&models.Inspection{},
		&models.InspectionItem{},
		&models.TeardownReview{},
		&models.TeardownIssue{},
		&models.Supplier{},
		&models.AuditLog{},
		&models.Task{},
		&models.AsyncJob{},
	)
	if err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	log.Println("Database migration completed successfully")
	return nil
}

func Seed() error {
	var count int64
	DB.Model(&models.User{}).Where("role = ?", models.RoleAdmin).Count(&count)
	if count > 0 {
		log.Println("Seed data already exists, skipping...")
		return nil
	}

	admin := &models.User{
		Username: "admin",
		Password: "admin123",
		Name:     "系统管理员",
		Email:    "admin@example.com",
		Role:     models.RoleAdmin,
		Active:   true,
	}
	if err := admin.HashPassword(); err != nil {
		return err
	}
	if err := DB.Create(admin).Error; err != nil {
		return err
	}

	manager := &models.User{
		Username: "manager",
		Password: "manager123",
		Name:     "项目经理",
		Email:    "manager@example.com",
		Role:     models.RoleManager,
		Active:   true,
	}
	if err := manager.HashPassword(); err != nil {
		return err
	}
	if err := DB.Create(manager).Error; err != nil {
		return err
	}

	supervisor := &models.User{
		Username: "supervisor",
		Password: "super123",
		Name:     "现场主管",
		Email:    "supervisor@example.com",
		Role:     models.RoleSupervisor,
		Active:   true,
	}
	if err := supervisor.HashPassword(); err != nil {
		return err
	}
	if err := DB.Create(supervisor).Error; err != nil {
		return err
	}

	worker := &models.User{
		Username: "worker",
		Password: "worker123",
		Name:     "施工人员",
		Email:    "worker@example.com",
		Role:     models.RoleWorker,
		Active:   true,
	}
	if err := worker.HashPassword(); err != nil {
		return err
	}
	if err := DB.Create(worker).Error; err != nil {
		return err
	}

	supplier := &models.User{
		Username: "supplier",
		Password: "supply123",
		Name:     "供应商用户",
		Email:    "supplier@example.com",
		Role:     models.RoleSupplier,
		Active:   true,
	}
	if err := supplier.HashPassword(); err != nil {
		return err
	}
	if err := DB.Create(supplier).Error; err != nil {
		return err
	}

	supplierData := &models.Supplier{
		Name:    "示例供应商",
		Code:    "SUP001",
		Contact: "张三",
		Phone:   "13800138000",
		Email:   "contact@supplier.com",
		Status:  models.StatusApproved,
	}
	if err := DB.Create(supplierData).Error; err != nil {
		return err
	}

	log.Println("Seed data created successfully")
	log.Println("Demo accounts created:")
	log.Println("  - admin / admin123 (系统管理员)")
	log.Println("  - manager / manager123 (项目经理)")
	log.Println("  - supervisor / super123 (现场主管)")
	log.Println("  - worker / worker123 (施工人员)")
	log.Println("  - supplier / supply123 (供应商)")

	return nil
}
