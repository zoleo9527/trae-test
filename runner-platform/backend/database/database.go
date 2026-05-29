package database

import (
	"log"
	"runner-platform/backend/models"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	var err error
	DB, err = gorm.Open(sqlite.Open("runner_platform.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	err = DB.AutoMigrate(
		&models.User{},
		&models.Order{},
		&models.Appeal{},
		&models.Subsidy{},
		&models.TimelineEvent{},
	)
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	seedData()
}

func seedData() {
	var count int64
	DB.Model(&models.User{}).Count(&count)
	if count > 0 {
		return
	}

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("123456"), bcrypt.DefaultCost)

	users := []models.User{
		{Username: "admin", Password: string(hashedPassword), Name: "系统管理员", Role: "manager", Phone: "13800000001"},
		{Username: "dispatch_zhang", Password: string(hashedPassword), Name: "张调度", Role: "dispatcher", Phone: "13800000002"},
		{Username: "cs_li", Password: string(hashedPassword), Name: "李客服", Role: "customer_service", Phone: "13800000003"},
		{Username: "runner_wang", Password: string(hashedPassword), Name: "王骑手", Role: "runner", Phone: "13800000004"},
		{Username: "runner_chen", Password: string(hashedPassword), Name: "陈骑手", Role: "runner", Phone: "13800000005"},
	}

	for _, user := range users {
		DB.Create(&user)
	}

	runnerID4 := uint(4)
	runnerID5 := uint(5)

	orders := []models.Order{
		{
			OrderNo:       "DD202405290001",
			CustomerName:  "张三",
			CustomerPhone: "13900000001",
			MerchantName:  "肯德基(朝阳店)",
			PickupAddress: "北京市朝阳区建国路88号",
			DeliveryAddress: "北京市朝阳区望京SOHO T1",
			GoodsAmount:  58.5,
			DeliveryFee:  8.0,
			Distance:     3.2,
			Status:       "delivered",
			RunnerID:     &runnerID4,
		},
		{
			OrderNo:       "DD202405290002",
			CustomerName:  "李四",
			CustomerPhone: "13900000002",
			MerchantName:  "麦当劳(三里屯店)",
			PickupAddress: "北京市朝阳区三里屯太古里",
			DeliveryAddress: "北京市朝阳区工体北路甲2号",
			GoodsAmount:  45.0,
			DeliveryFee:  6.5,
			Distance:     2.1,
			Status:       "timeout",
			RunnerID:     &runnerID4,
		},
		{
			OrderNo:       "DD202405290003",
			CustomerName:  "王五",
			CustomerPhone: "13900000003",
			MerchantName:  "星巴克(国贸店)",
			PickupAddress: "北京市朝阳区国贸商城B1层",
			DeliveryAddress: "北京市朝阳区光华路SOHO",
			GoodsAmount:  72.0,
			DeliveryFee:  9.0,
			Distance:     4.5,
			Status:       "delivering",
			RunnerID:     &runnerID5,
		},
		{
			OrderNo:       "DD202405290004",
			CustomerName:  "赵六",
			CustomerPhone: "13900000004",
			MerchantName:  "喜茶(合生汇店)",
			PickupAddress: "北京市朝阳区合生汇购物中心B2层",
			DeliveryAddress: "北京市朝阳区大望路SOHO现代城",
			GoodsAmount:  36.0,
			DeliveryFee:  7.0,
			Distance:     1.8,
			Status:       "pending",
		},
		{
			OrderNo:       "DD202405290005",
			CustomerName:  "孙七",
			CustomerPhone: "13900000005",
			MerchantName:  "海底捞火锅(望京店)",
			PickupAddress: "北京市朝阳区望京街9号",
			DeliveryAddress: "北京市朝阳区阜通东大街6号",
			GoodsAmount:  268.0,
			DeliveryFee:  12.0,
			Distance:     2.8,
			Status:       "appealing",
			RunnerID:     &runnerID5,
		},
	}

	for _, order := range orders {
		DB.Create(&order)
	}

	appeals := []models.Appeal{
		{
			OrderID:     2,
			RunnerID:    4,
			Type:        "timeout",
			Reason:      "商家出餐慢，排队等待了25分钟，导致配送超时",
			EvidenceURL: "https://example.com/evidence1.jpg",
			Status:      "pending",
		},
		{
			OrderID:     5,
			RunnerID:    5,
			Type:        "merchant_error",
			Reason:      "商家少装了一份调料包，用户要求补发",
			EvidenceURL: "https://example.com/evidence2.jpg",
			Status:      "approved",
		},
	}

	for _, appeal := range appeals {
		DB.Create(&appeal)
	}

	appealID2 := uint(2)

	subsidies := []models.Subsidy{
		{
			AppealID: &appealID2,
			OrderID:  5,
			RunnerID: 5,
			Amount:   15.0,
			Reason:   "商家出餐错误导致二次配送补贴",
			Status:   "paid",
		},
	}

	for _, subsidy := range subsidies {
		DB.Create(&subsidy)
	}

	timelineEvents := []models.TimelineEvent{
		{OrderID: 1, Type: "created", Content: "订单创建成功"},
		{OrderID: 1, Type: "assigned", Content: "订单已分配给王骑手"},
		{OrderID: 1, Type: "picked_up", Content: "骑手已取餐"},
		{OrderID: 1, Type: "delivered", Content: "订单已送达"},

		{OrderID: 2, Type: "created", Content: "订单创建成功"},
		{OrderID: 2, Type: "assigned", Content: "订单已分配给王骑手"},
		{OrderID: 2, Type: "timeout", Content: "订单配送超时"},
		{OrderID: 2, Type: "appeal_created", Content: "骑手提交申诉"},

		{OrderID: 5, Type: "created", Content: "订单创建成功"},
		{OrderID: 5, Type: "assigned", Content: "订单已分配给陈骑手"},
		{OrderID: 5, Type: "appeal_created", Content: "骑手提交申诉"},
		{OrderID: 5, Type: "appeal_approved", Content: "申诉已通过，补贴已发放"},
	}

	for _, event := range timelineEvents {
		DB.Create(&event)
	}

	log.Println("Seed data created successfully")
}
