package main

import (
	"fmt"
	"log"

	"autoparts/internal/config"
	"autoparts/internal/controller"
	"autoparts/internal/middleware"
	"autoparts/internal/model"
	"autoparts/internal/service"
	"autoparts/internal/util"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"gorm.io/gorm"
)

func main() {
	cfg := config.Load()

	db, err := config.InitDB(&cfg.Database)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	if err := config.AutoMigrate(db); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	app := fiber.New(fiber.Config{
		ErrorHandler: customErrorHandler,
	})

	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New())

	authController := controller.NewAuthController()
	enquiryController := controller.NewEnquiryController()
	quoteController := controller.NewQuoteController()
	lockController := controller.NewLockController()
	customerController := controller.NewCustomerController()
	taskController := controller.NewTaskController()

	api := app.Group("/api/v1")

	api.Post("/auth/login", authController.Login)

	auth := api.Group("", middleware.AuthRequired())
	auth.Get("/auth/profile", authController.GetProfile)
	auth.Post("/auth/change-password", authController.ChangePassword)

	salesAndOwner := auth.Group("", middleware.RoleRequired(model.RoleAdmin, model.RoleOwner, model.RoleSales))
	{
		customers := salesAndOwner.Group("/customers")
		customers.Post("", customerController.Create)
		customers.Get("/:id", customerController.GetByID)
		customers.Put("/:id", customerController.Update)
		customers.Delete("/:id", customerController.Delete)
		customers.Post("/list", customerController.List)

		enquiries := salesAndOwner.Group("/enquiries")
		enquiries.Get("/:id", enquiryController.GetByID)
		enquiries.Get("/:id/trace", enquiryController.GetChainTrace)
		enquiries.Post("/list", enquiryController.List)
		enquiries.Post("/export", enquiryController.Export)
	}

	sales := auth.Group("", middleware.RoleRequired(model.RoleAdmin, model.RoleSales))
	{
		enquiries := sales.Group("/enquiries")
		enquiries.Post("", enquiryController.Create)
		enquiries.Put("/:id", enquiryController.Update)
		enquiries.Delete("/:id", enquiryController.Delete)
		enquiries.Post("/:id/cancel", enquiryController.Cancel)

		quotes := sales.Group("/quotes")
		quotes.Post("", quoteController.Create)
		quotes.Get("/:id", quoteController.GetByID)
		quotes.Post("/:id/review", quoteController.Review)
		quotes.Post("/:id/cancel", quoteController.Cancel)
		quotes.Post("/list", quoteController.List)
		quotes.Post("/export", quoteController.Export)
	}

	owner := auth.Group("", middleware.OwnerRequired())
	{
		locks := owner.Group("/locks")
		locks.Get("/:id", lockController.GetByID)
		locks.Post("/list", lockController.List)
		locks.Post("/:lockOrderId/return/:itemId/review", lockController.ReviewReturn)
	}

	warehouse := auth.Group("", middleware.WarehouseRequired())
	{
		locks := warehouse.Group("/locks")
		locks.Post("", lockController.Create)
		locks.Post("/:id/release", lockController.Release)
		locks.Post("/:id/pick", lockController.Pick)
		locks.Post("/:id/return", lockController.RequestReturn)
		locks.Post("/batch-release", lockController.BatchRelease)
		locks.Post("/export", lockController.Export)
	}

	tasks := auth.Group("/tasks")
	tasks.Get("", taskController.List)
	tasks.Get("/:id", taskController.GetByID)

	app.Static("/exports", "./exports")

	worker := service.NewTaskWorker()
	worker.Start()
	defer worker.Stop()

	seedData(db)

	addr := fmt.Sprintf(":%d", cfg.Server.Port)
	log.Printf("Server starting on %s", addr)
	if err := app.Listen(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func customErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	message := "Internal Server Error"

	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
		message = e.Message
	}

	return util.Error(c, code, "INTERNAL_ERROR", message, nil)
}

func seedData(db *gorm.DB) {
	var count int64
	db.Model(&model.User{}).Count(&count)
	if count > 0 {
		return
	}

	log.Println("Seeding initial data...")

	hashedPassword, _ := util.HashPassword("123456")

	users := []model.User{
		{Username: "admin", Password: hashedPassword, Name: "系统管理员", Phone: "13800000000", Role: model.RoleAdmin, IsActive: true},
		{Username: "owner", Password: hashedPassword, Name: "店老板", Phone: "13800000001", Role: model.RoleOwner, IsActive: true},
		{Username: "sales1", Password: hashedPassword, Name: "销售员小张", Phone: "13800000002", Role: model.RoleSales, IsActive: true},
		{Username: "warehouse1", Password: hashedPassword, Name: "库管老李", Phone: "13800000003", Role: model.RoleWarehouse, IsActive: true},
	}

	for i := range users {
		db.Create(&users[i])
	}

	var salesUser model.User
	db.Where("username = ?", "sales1").First(&salesUser)

	customers := []model.Customer{
		{Name: "张三", Phone: "13900000001", LicensePlate: "京A12345", CarModel: "大众帕萨特", IsCredit: true, CreditDays: 30, CreatedByID: salesUser.ID},
		{Name: "李四", Phone: "13900000002", LicensePlate: "京B67890", CarModel: "丰田凯美瑞", IsCredit: false, CreatedByID: salesUser.ID},
		{Name: "王五", Phone: "13900000003", LicensePlate: "京C11111", CarModel: "本田雅阁", IsCredit: true, CreditDays: 15, CreatedByID: salesUser.ID},
		{Name: "赵六", Phone: "13900000004", LicensePlate: "京D22222", CarModel: "奔驰E300", IsCredit: true, CreditDays: 60, CreatedByID: salesUser.ID},
	}

	for _, customer := range customers {
		db.Create(&customer)
	}

	parts := []model.Part{
		{PartNumber: "ENG-001", Name: "发动机总成", Category: model.CategoryEngine, Brand: "大众", Model: "EA888", UnitPrice: 15000, CostPrice: 12000, StockQty: 5, LockedQty: 0, MinStockQty: 2, Location: "A-01-01", IsActive: true},
		{PartNumber: "ENG-002", Name: "机油滤清器", Category: model.CategoryEngine, Brand: "曼牌", Model: "W719/45", UnitPrice: 85, CostPrice: 50, StockQty: 50, LockedQty: 0, MinStockQty: 20, Location: "A-01-02", IsActive: true},
		{PartNumber: "BRA-001", Name: "前刹车片", Category: model.CategoryChassis, Brand: "博世", Model: "0986AB1185", UnitPrice: 320, CostPrice: 220, StockQty: 20, LockedQty: 0, MinStockQty: 10, Location: "B-01-01", IsActive: true},
		{PartNumber: "BRA-002", Name: "刹车盘", Category: model.CategoryChassis, Brand: "博世", Model: "0986AB6852", UnitPrice: 580, CostPrice: 420, StockQty: 15, LockedQty: 0, MinStockQty: 5, Location: "B-01-02", IsActive: true},
		{PartNumber: "ELE-001", Name: "火花塞", Category: model.CategoryElectrics, Brand: "NGK", Model: "BKR6E", UnitPrice: 45, CostPrice: 28, StockQty: 100, LockedQty: 0, MinStockQty: 50, Location: "C-01-01", IsActive: true},
		{PartNumber: "ELE-002", Name: "电瓶", Category: model.CategoryElectrics, Brand: "瓦尔塔", Model: "L2-400", UnitPrice: 650, CostPrice: 480, StockQty: 10, LockedQty: 0, MinStockQty: 5, Location: "C-01-02", IsActive: true},
	}

	for _, part := range parts {
		db.Create(&part)
	}

	log.Println("Data seeding completed")
}
