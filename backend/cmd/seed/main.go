package main

import (
	"fmt"
	"log"
	"time"
	"wedding-photo-backend/internal/models"
	"wedding-photo-backend/pkg/config"
	"wedding-photo-backend/pkg/database"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func main() {
	cfg := config.Load()

	if err := database.Connect(cfg); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	if err := database.AutoMigrate(); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	fmt.Println("开始初始化种子数据...")

	seedUsers()
	seedCustomers()
	seedCostumes()
	seedSchedules()
	seedNormalFlow()
	seedProblemFlow()

	fmt.Println("种子数据初始化完成！")
}

func hashPassword(password string) string {
	hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(hash)
}

func seedUsers() {
	users := []models.User{
		{Name: "张店长", Phone: "13800138001", Password: hashPassword("123456"), Role: models.RoleStoreManager},
		{Name: "李选片师", Phone: "13800138002", Password: hashPassword("123456"), Role: models.RoleSelector},
		{Name: "王管家", Phone: "13800138003", Password: hashPassword("123456"), Role: models.RoleButler},
		{Name: "陈摄影师", Phone: "13800138004", Password: hashPassword("123456"), Role: models.RolePhotographer},
	}

	for _, user := range users {
		var existing models.User
		if database.DB.Where("phone = ?", user.Phone).First(&existing).Error == gorm.ErrRecordNotFound {
			database.DB.Create(&user)
			fmt.Printf("创建用户: %s (%s)\n", user.Name, user.Role)
		}
	}
}

func seedCustomers() {
	customers := []models.Customer{
		{Name: "刘小姐", Phone: "13900139001"},
		{Name: "陈先生", Phone: "13900139002"},
		{Name: "周女士", Phone: "13900139003"},
		{Name: "吴先生", Phone: "13900139004"},
		{Name: "郑小姐", Phone: "13900139005"},
	}

	for _, c := range customers {
		var existing models.Customer
		if database.DB.Where("phone = ?", c.Phone).First(&existing).Error == gorm.ErrRecordNotFound {
			database.DB.Create(&c)
			fmt.Printf("创建客户: %s\n", c.Name)
		}
	}
}

func seedCostumes() {
	costumes := []models.Costume{
		{Name: "经典抹胸白纱", Category: "婚纱", Style: "经典", Size: "M", Color: "白色", Brand: "VERA WANG", PurchasePrice: 8000, RentalPrice: 1200, Status: models.CostumeStatusAvailable},
		{Name: "鱼尾拖尾款", Category: "婚纱", Style: "性感", Size: "S", Color: "象牙白", Brand: "PRONOVIAS", PurchasePrice: 12000, RentalPrice: 1800, Status: models.CostumeStatusAvailable},
		{Name: "中式龙凤褂", Category: "中式礼服", Style: "传统", Size: "M", Color: "红色", Brand: "褂皇", PurchasePrice: 15000, RentalPrice: 2000, Status: models.CostumeStatusAvailable},
		{Name: "黑色西装套装", Category: "男装", Style: "商务", Size: "L", Color: "黑色", Brand: "ARMANI", PurchasePrice: 6000, RentalPrice: 800, Status: models.CostumeStatusAvailable},
		{Name: "晚礼服长裙", Category: "晚礼服", Style: "优雅", Size: "M", Color: "酒红", Brand: "DIOR", PurchasePrice: 5000, RentalPrice: 600, Status: models.CostumeStatusAvailable},
		{Name: "齐地公主款", Category: "婚纱", Style: "甜美", Size: "S", Color: "白色", Brand: "JLM COUTURE", PurchasePrice: 9000, RentalPrice: 1500, Status: models.CostumeStatusAvailable},
		{Name: "秀禾服", Category: "中式礼服", Style: "传统", Size: "M", Color: "金色", Brand: "潮褂", PurchasePrice: 8000, RentalPrice: 1200, Status: models.CostumeStatusAvailable},
		{Name: "深V透视款", Category: "婚纱", Style: "性感", Size: "M", Color: "白色", Brand: "GALIA LAHAV", PurchasePrice: 18000, RentalPrice: 2500, Status: models.CostumeStatusAvailable},
	}

	for _, c := range costumes {
		var existing models.Costume
		if database.DB.Where("name = ?", c.Name).First(&existing).Error == gorm.ErrRecordNotFound {
			database.DB.Create(&c)
			fmt.Printf("创建服装: %s\n", c.Name)
		}
	}
}

func seedSchedules() {
	var customers []models.Customer
	database.DB.Find(&customers)

	var butlers []models.User
	database.DB.Where("role = ?", models.RoleButler).Find(&butlers)

	var selectors []models.User
	database.DB.Where("role = ?", models.RoleSelector).Find(&selectors)

	if len(customers) > 0 && len(butlers) > 0 && len(selectors) > 0 {
		schedules := []models.Schedule{
			{
				CustomerID:    customers[0].ID,
				ScheduleDate:  time.Now().AddDate(0, 0, 3),
				TimeSlot:      "09:00-12:00",
				Type:          "内景拍摄",
				Status:        models.ScheduleStatusConfirmed,
				ButlerID:      &butlers[0].ID,
				SelectorID:    &selectors[0].ID,
				DepositAmount: 1000,
				TotalAmount:   5999,
				Remark:        "客户特别要求拍海景",
			},
			{
				CustomerID:    customers[1].ID,
				ScheduleDate:  time.Now().AddDate(0, 0, 5),
				TimeSlot:      "14:00-18:00",
				Type:          "外景拍摄",
				Status:        models.ScheduleStatusPending,
				ButlerID:      &butlers[0].ID,
				DepositAmount: 500,
				TotalAmount:   6999,
			},
		}

		for _, s := range schedules {
			var existing models.Schedule
			if database.DB.Where("customer_id = ? AND schedule_date = ?", s.CustomerID, s.ScheduleDate).First(&existing).Error == gorm.ErrRecordNotFound {
				database.DB.Create(&s)
				fmt.Printf("创建档期: 客户ID=%d, 日期=%s\n", s.CustomerID, s.ScheduleDate.Format("2006-01-02"))
			}
		}
	}
}

func seedNormalFlow() {
	fmt.Println("\n=== 创建正常流程样例 ===")

	var customer models.Customer
	database.DB.First(&customer, "name = ?", "刘小姐")

	var costume models.Costume
	database.DB.First(&costume, "name = ?", "经典抹胸白纱")

	var schedule models.Schedule
	database.DB.Where("customer_id = ?", customer.ID).First(&schedule)

	var butler models.User
	database.DB.Where("role = ?", models.RoleButler).First(&butler)

	dispatch := models.CostumeDispatch{
		ScheduleID:  schedule.ID,
		CustomerID:  customer.ID,
		CostumeID:   costume.ID,
		Status:      models.DispatchStatusReturned,
		Accessories: "头纱、手套、项链三件套",
		Remark:      "正常流程样例",
	}

	now := time.Now().AddDate(0, 0, -7)
	pickupTime := now.AddDate(0, 0, -2)
	returnTime := now.AddDate(0, 0, -1)

	dispatch.ActualPickupAt = &pickupTime
	dispatch.ActualReturnAt = &returnTime
	dispatch.PickedUpByID = &butler.ID
	dispatch.ReturnedByID = &butler.ID
	dispatch.ExpectedPickupAt = &pickupTime
	dispatch.ExpectedReturnAt = &returnTime

	database.DB.Create(&dispatch)
	fmt.Println("创建已归还的调度记录")

	maintenance := models.MaintenanceRecord{
		CostumeID:         costume.ID,
		CostumeDispatchID: &dispatch.ID,
		Type:              models.MaintenanceCleaning,
		Status:            models.MaintenanceStatusDone,
		Description:       "归还后常规清洁",
		Cost:              50,
		StartedAt:         &returnTime,
		CompletedAt:       &now,
		HandledByID:       &butler.ID,
	}
	database.DB.Create(&maintenance)
	fmt.Println("创建已完成的清洁保养记录")

	database.DB.Model(&costume).Update("status", models.CostumeStatusAvailable)
}

func seedProblemFlow() {
	fmt.Println("\n=== 创建问题流程样例 ===")

	var customer models.Customer
	database.DB.First(&customer, "name = ?", "陈先生")

	var costume models.Costume
	database.DB.First(&costume, "name = ?", "鱼尾拖尾款")

	var butler models.User
	database.DB.Where("role = ?", models.RoleButler).First(&butler)

	dispatch := models.CostumeDispatch{
		CustomerID:   customer.ID,
		CostumeID:    costume.ID,
		Status:       models.DispatchStatusReturned,
		Accessories:  "头纱",
		DamageRemark: "裙摆处有3cm撕裂，珍珠装饰脱落5颗",
		Remark:       "问题流程样例：服装损坏",
	}

	now := time.Now()
	pickupTime := now.AddDate(0, 0, -5)
	returnTime := now.AddDate(0, 0, -1)

	dispatch.ActualPickupAt = &pickupTime
	dispatch.ActualReturnAt = &returnTime
	dispatch.PickedUpByID = &butler.ID
	dispatch.ReturnedByID = &butler.ID

	database.DB.Create(&dispatch)
	fmt.Println("创建损坏归还的调度记录")

	maintenance := models.MaintenanceRecord{
		CostumeID:         costume.ID,
		CostumeDispatchID: &dispatch.ID,
		Type:              models.MaintenanceRepair,
		Status:            models.MaintenanceStatusDoing,
		Description:       "裙摆撕裂修复 + 珍珠装饰重新缝制",
		Cost:              580,
		StartedAt:         &returnTime,
		HandledByID:       &butler.ID,
		Remark:            "需要联系厂家调配件，预计3天完成",
	}
	database.DB.Create(&maintenance)
	fmt.Println("创建进行中的维修保养记录")

	database.DB.Model(&costume).Updates(map[string]interface{}{
		"status":           models.CostumeStatusRepairing,
		"total_use_count":  gorm.Expr("total_use_count + 1"),
	})
	fmt.Println("更新服装状态为维修中")
}
