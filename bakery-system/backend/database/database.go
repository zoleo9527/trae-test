package database

import (
	"bakery-system/backend/models"
	"fmt"
	"log"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Init() {
	var err error
	DB, err = gorm.Open(sqlite.Open("bakery.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	err = DB.AutoMigrate(
		&models.Member{},
		&models.Recharge{},
		&models.Order{},
		&models.OrderItem{},
		&models.Refund{},
		&models.StatusLog{},
		&models.Product{},
		&models.OperationLog{},
	)
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	seedData()
}

func seedData() {
	var count int64
	DB.Model(&models.Product{}).Count(&count)
	if count > 0 {
		return
	}

	products := []models.Product{
		{Name: "经典牛角包", Category: "面包", Price: 12.00, Cost: 5.00},
		{Name: "法式长棍", Category: "面包", Price: 15.00, Cost: 6.00},
		{Name: "巧克力可颂", Category: "面包", Price: 18.00, Cost: 8.00},
		{Name: "草莓奶油蛋糕", Category: "蛋糕", Price: 128.00, Cost: 45.00},
		{Name: "提拉米苏", Category: "蛋糕", Price: 38.00, Cost: 15.00},
		{Name: "抹茶红豆慕斯", Category: "蛋糕", Price: 42.00, Cost: 18.00},
		{Name: "美式咖啡", Category: "饮品", Price: 22.00, Cost: 5.00},
		{Name: "拿铁咖啡", Category: "饮品", Price: 28.00, Cost: 7.00},
	}
	DB.Create(&products)

	members := []models.Member{
		{Name: "张小明", Phone: "13800138001", Balance: 500.00, TotalRecharge: 500.00},
		{Name: "李小红", Phone: "13800138002", Balance: 200.00, TotalRecharge: 300.00},
		{Name: "王小华", Phone: "13800138003", Balance: 0.00, TotalRecharge: 100.00},
	}
	DB.Create(&members)

	now := time.Now()
	for i := 1; i <= 5; i++ {
		order := models.Order{
			OrderNo:     fmt.Sprintf("ORD%s%03d", now.Format("20060102"), i),
			MemberID:    members[i%3].ID,
			MemberName:  members[i%3].Name,
			MemberPhone: members[i%3].Phone,
			TotalAmount: float64(i * 30),
			PayAmount:   float64(i * 30),
			Status:      []string{"pending", "preparing", "ready", "completed", "pending"}[i-1],
			PickupTime:  now.Add(time.Hour * time.Duration(i+1)),
			Operator:    "门店主理人",
			Remark:      fmt.Sprintf("测试订单%d", i),
		}
		DB.Create(&order)

		item := models.OrderItem{
			OrderID:     order.ID,
			ProductID:   products[i%8].ID,
			ProductName: products[i%8].Name,
			Quantity:    i,
			UnitPrice:   products[i%8].Price,
			Subtotal:    float64(i) * products[i%8].Price,
		}
		DB.Create(&item)
	}

	log.Println("Database seeded with initial data")
}

func AddStatusLog(relatedID, relatedType, fromStatus, toStatus, operator, remark string) {
	log := models.StatusLog{
		RelatedID:   relatedID,
		RelatedType: relatedType,
		FromStatus:  fromStatus,
		ToStatus:    toStatus,
		Operator:    operator,
		Remark:      remark,
	}
	DB.Create(&log)
}
