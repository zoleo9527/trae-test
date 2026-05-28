package seed

import (
	"camp-server/internal/models"
	"fmt"
	"log"
	"math/rand"
	"time"

	"github.com/google/uuid"
)

var (
	managerID    = uuid.MustParse("00000000-0000-0000-0000-000000000001")
	plannerID    = uuid.MustParse("00000000-0000-0000-0000-000000000002")
	warehouseID  = uuid.MustParse("00000000-0000-0000-0000-000000000003")
)

func Seed() {
	seedUsers()
	seedStores()
	seedProducts()
	seedInventory()
	seedOrders()
	seedInspections()
	seedExceptions()
	log.Println("Seed data created successfully")
}

func seedUsers() {
	users := []models.User{
		{ID: managerID, Username: "manager", Name: "张店长", Role: models.RoleManager, Avatar: "👨‍💼"},
		{ID: plannerID, Username: "planner", Name: "李企划", Role: models.RolePlanner, Avatar: "👩‍🎨"},
		{ID: warehouseID, Username: "warehouse", Name: "王仓管", Role: models.RoleWarehouse, Avatar: "👨‍🔧"},
	}

	for _, u := range users {
		if err := models.DB.FirstOrCreate(&u, models.User{Username: u.Username}).Error; err != nil {
			log.Printf("Error seeding user %s: %v", u.Username, err)
		}
	}
}

var storeIDs = []uuid.UUID{
	uuid.MustParse("10000000-0000-0000-0000-000000000001"),
	uuid.MustParse("10000000-0000-0000-0000-000000000002"),
	uuid.MustParse("10000000-0000-0000-0000-000000000003"),
	uuid.MustParse("10000000-0000-0000-0000-000000000004"),
	uuid.MustParse("10000000-0000-0000-0000-000000000005"),
}

func seedStores() {
	stores := []models.Store{
		{ID: storeIDs[0], Code: "SH001", Name: "上海旗舰店", Region: "华东", Manager: "陈经理", Phone: "13800138001", Address: "上海市浦东新区陆家嘴环路1000号"},
		{ID: storeIDs[1], Code: "BJ001", Name: "北京王府井店", Region: "华北", Manager: "刘店长", Phone: "13800138002", Address: "北京市东城区王府井大街138号"},
		{ID: storeIDs[2], Code: "GZ001", Name: "广州天河城店", Region: "华南", Manager: "黄主管", Phone: "13800138003", Address: "广州市天河区天河路208号"},
		{ID: storeIDs[3], Code: "SZ001", Name: "深圳万象城店", Region: "华南", Manager: "林店长", Phone: "13800138004", Address: "深圳市罗湖区宝安南路1881号"},
		{ID: storeIDs[4], Code: "CD001", Name: "成都太古里店", Region: "西南", Manager: "周经理", Phone: "13800138005", Address: "成都市锦江区中纱帽街8号"},
	}

	for _, s := range stores {
		if err := models.DB.FirstOrCreate(&s, models.Store{Code: s.Code}).Error; err != nil {
			log.Printf("Error seeding store %s: %v", s.Code, err)
		}
	}
}

var productIDs = []uuid.UUID{
	uuid.MustParse("20000000-0000-0000-0000-000000000001"),
	uuid.MustParse("20000000-0000-0000-0000-000000000002"),
	uuid.MustParse("20000000-0000-0000-0000-000000000003"),
	uuid.MustParse("20000000-0000-0000-0000-000000000004"),
	uuid.MustParse("20000000-0000-0000-0000-000000000005"),
}

func seedProducts() {
	now := time.Now()
	products := []models.CollabProduct{
		{
			ID: productIDs[0], SKU: "COLLAB-001", Name: "故宫联名文创笔记本",
			BrandPartner: "故宫博物院", Category: "文具",
			RetailPrice: 128.00, CostPrice: 45.00,
			Description: "故宫联名款，精选宣纸材质，收录故宫珍贵书画图案",
			ImageURL: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400",
			Status: models.ProductStatusOnShelf,
			PlanOnShelfDate: now.AddDate(0, 0, -30), PlanOffShelfDate: now.AddDate(0, 0, 60),
			ActualOnShelfDate: &[]time.Time{now.AddDate(0, 0, -28)}[0],
			TargetStores: []string{"SH001", "BJ001", "GZ001", "SZ001", "CD001"},
			CreatedBy: plannerID, CreatedByName: "李企划",
			ApprovedBy: &managerID, ApprovedByName: "张店长",
			TotalSales: 856, TotalRevenue: 109568.00,
		},
		{
			ID: productIDs[1], SKU: "COLLAB-002", Name: "敦煌艺术联名丝巾",
			BrandPartner: "敦煌研究院", Category: "配饰",
			RetailPrice: 298.00, CostPrice: 98.00,
			Description: "敦煌壁画图案，真丝材质，手工卷边",
			ImageURL: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400",
			Status: models.ProductStatusOnShelf,
			PlanOnShelfDate: now.AddDate(0, 0, -20), PlanOffShelfDate: now.AddDate(0, 0, 70),
			ActualOnShelfDate: &[]time.Time{now.AddDate(0, 0, -18)}[0],
			TargetStores: []string{"SH001", "BJ001", "SZ001"},
			CreatedBy: plannerID, CreatedByName: "李企划",
			ApprovedBy: &managerID, ApprovedByName: "张店长",
			TotalSales: 423, TotalRevenue: 126054.00,
		},
		{
			ID: productIDs[2], SKU: "COLLAB-003", Name: "三星堆联名青铜摆件",
			BrandPartner: "三星堆博物馆", Category: "摆件",
			RetailPrice: 588.00, CostPrice: 220.00,
			Description: "按比例缩小复刻青铜面具，收藏级品质",
			ImageURL: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
			Status: models.ProductStatusPending,
			PlanOnShelfDate: now.AddDate(0, 0, 5), PlanOffShelfDate: now.AddDate(0, 0, 95),
			TargetStores: []string{"SH001", "BJ001", "GZ001", "SZ001", "CD001"},
			CreatedBy: plannerID, CreatedByName: "李企划",
		},
		{
			ID: productIDs[3], SKU: "COLLAB-004", Name: "颐和园联名茶具套装",
			BrandPartner: "颐和园", Category: "茶具",
			RetailPrice: 888.00, CostPrice: 350.00,
			Description: "颐和园长廊彩绘图案，青瓷材质，一壶四杯",
			ImageURL: "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=400",
			Status: models.ProductStatusRejected,
			PlanOnShelfDate: now.AddDate(0, 0, -10), PlanOffShelfDate: now.AddDate(0, 0, 80),
			TargetStores: []string{"SH001", "BJ001"},
			CreatedBy: plannerID, CreatedByName: "李企划",
			RejectReason: "定价偏高，目标客群匹配度需要重新评估，建议调整价格策略后再提交",
		},
		{
			ID: productIDs[4], SKU: "COLLAB-005", Name: "兵马俑联名秦俑手办",
			BrandPartner: "秦始皇兵马俑博物馆", Category: "潮玩",
			RetailPrice: 198.00, CostPrice: 68.00,
			Description: "Q版兵马俑造型，PVC环保材质，收藏盲盒系列",
			ImageURL: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
			Status: models.ProductStatusReviewing,
			PlanOnShelfDate: now.AddDate(0, 0, -90), PlanOffShelfDate: now.AddDate(0, 0, -5),
			ActualOnShelfDate: &[]time.Time{now.AddDate(0, 0, -88)}[0],
			ActualOffShelfDate: &[]time.Time{now.AddDate(0, 0, -3)}[0],
			TargetStores: []string{"SH001", "BJ001", "GZ001", "SZ001", "CD001"},
			CreatedBy: plannerID, CreatedByName: "李企划",
			ApprovedBy: &managerID, ApprovedByName: "张店长",
			TotalSales: 2340, TotalRevenue: 463320.00,
		},
	}

	for _, p := range products {
		if err := models.DB.FirstOrCreate(&p, models.CollabProduct{SKU: p.SKU}).Error; err != nil {
			log.Printf("Error seeding product %s: %v", p.SKU, err)
		}
	}
}

func seedInventory() {
	for _, productID := range productIDs {
		for i, storeID := range storeIDs {
			var product models.CollabProduct
			models.DB.First(&product, "id = ?", productID)
			var store models.Store
			models.DB.First(&store, "id = ?", storeID)

			qty := rand.Intn(100) + 20
			reserved := rand.Intn(10)

			inventory := models.Inventory{
				ID:           uuid.New(),
				ProductID:    productID,
				StoreID:      storeID,
				StoreCode:    store.Code,
				Quantity:     qty,
				ReservedQty:  reserved,
				AvailableQty: qty - reserved,
				LastCountDate: &[]time.Time{time.Now().AddDate(0, 0, -(i + 1) * 3)}[0],
				LastCountQty: qty + rand.Intn(10) - 5,
				DeviationQty: rand.Intn(6) - 3,
			}
			if err := models.DB.FirstOrCreate(&inventory, models.Inventory{ProductID: productID, StoreID: storeID}).Error; err != nil {
				log.Printf("Error seeding inventory: %v", err)
			}
		}
	}
}

func seedOrders() {
	orderTypes := []models.OrderType{models.OrderTypeRestock, models.OrderTypeTransfer, models.OrderTypeExchange}
	statuses := []models.OrderStatus{models.OrderStatusPending, models.OrderStatusApproved, models.OrderStatusShipped, models.OrderStatusCompleted, models.OrderStatusRejected}

	for i := 0; i < 12; i++ {
		productIdx := i % 3
		storeIdx := rand.Intn(len(storeIDs))
		orderType := orderTypes[i%3]
		status := statuses[i%5]

		var product models.CollabProduct
		models.DB.First(&product, "id = ?", productIDs[productIdx])
		var store models.Store
		models.DB.First(&store, "id = ?", storeIDs[storeIdx])

		var fromStore *models.Store
		var fromStoreCode string
		if orderType == models.OrderTypeTransfer {
			fromStoreIdx := (storeIdx + 1) % len(storeIDs)
			models.DB.First(&fromStore, "id = ?", storeIDs[fromStoreIdx])
			fromStoreCode = fromStore.Code
		}

		var createdBy uuid.UUID
		var createdByName string
		if storeIdx%2 == 0 {
			createdBy = managerID
			createdByName = "张店长"
		} else {
			createdBy = plannerID
			createdByName = "李企划"
		}

		order := models.Order{
			ID:            uuid.New(),
			OrderNo:       fmt.Sprintf("ORD-%s-%04d", time.Now().Format("200601"), i+1),
			Type:          orderType,
			Status:        status,
			ProductID:     product.ID,
			ProductSKU:    product.SKU,
			ProductName:   product.Name,
			ToStoreID:     store.ID,
			ToStoreCode:   store.Code,
			Quantity:      rand.Intn(50) + 10,
			CreatedBy:     createdBy,
			CreatedByName: createdByName,
			Remark:        fmt.Sprintf("订单备注 %d", i+1),
		}

		if orderType == models.OrderTypeTransfer && fromStore != nil {
			order.FromStoreID = &fromStore.ID
			order.FromStoreCode = fromStoreCode
		}

		if orderType == models.OrderTypeExchange {
			order.MemberPhone = fmt.Sprintf("13800%06d", i+100)
			order.MemberName = fmt.Sprintf("会员%d", i+1)
			order.ExchangePoints = 5000 + i*100
		}

		if status == models.OrderStatusApproved || status == models.OrderStatusShipped || status == models.OrderStatusCompleted {
			order.ApprovedBy = &managerID
			order.ApprovedByName = "张店长"
		}

		if status == models.OrderStatusRejected {
			order.RejectReason = "库存不足，无法满足订单需求"
		}

		if status == models.OrderStatusShipped || status == models.OrderStatusCompleted {
			t := time.Now().AddDate(0, 0, -i)
			order.ShippedAt = &t
		}

		if status == models.OrderStatusCompleted {
			t := time.Now().AddDate(0, 0, -i+1)
			order.ReceivedAt = &t
		}

		if err := models.DB.Create(&order).Error; err != nil {
			log.Printf("Error seeding order: %v", err)
		}
	}
}

func seedInspections() {
	statuses := []models.InspectionStatus{
		models.InspectionStatusPending,
		models.InspectionStatusPassed,
		models.InspectionStatusException,
		models.InspectionStatusClosed,
	}

	for i := 0; i < 8; i++ {
		productIdx := i % 3
		storeIdx := i % len(storeIDs)
		status := statuses[i%4]

		var product models.CollabProduct
		models.DB.First(&product, "id = ?", productIDs[productIdx])
		var store models.Store
		models.DB.First(&store, "id = ?", storeIDs[storeIdx])

		expectedQty := rand.Intn(50) + 30
		actualQty := expectedQty + rand.Intn(10) - 5

		inspection := models.Inspection{
			ID:             uuid.New(),
			ProductID:      product.ID,
			ProductSKU:     product.SKU,
			ProductName:    product.Name,
			StoreID:        store.ID,
			StoreCode:      store.Code,
			StoreName:      store.Name,
			Status:         status,
			DisplayCorrect: status != models.InspectionStatusException,
			DisplayPosition: "主入口堆头",
			PhotoURLs: []string{
				"https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300",
				"https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300",
			},
			InventoryCheck: true,
			ExpectedQty:    expectedQty,
			ActualQty:      actualQty,
			DeviationQty:   actualQty - expectedQty,
			InspectorID:    managerID,
			InspectorName:  "张店长",
			Remark:         fmt.Sprintf("巡店记录 %d", i+1),
		}

		if status == models.InspectionStatusException {
			inspection.Issues = []string{"陈列位置错误", "库存数量不符", "POP海报缺失"}
			inspection.FollowUpBy = &warehouseID
			inspection.FollowUpByName = "王仓管"
			inspection.FollowUpNote = "请尽快调整陈列并核对库存"
		}

		if status == models.InspectionStatusClosed {
			t := time.Now().AddDate(0, 0, -i)
			inspection.ClosedAt = &t
		}

		if err := models.DB.Create(&inspection).Error; err != nil {
			log.Printf("Error seeding inspection: %v", err)
		}
	}
}

func seedExceptions() {
	exceptionTypes := []models.ExceptionType{
		models.ExceptionTypeInventory,
		models.ExceptionTypeDisplay,
		models.ExceptionTypeTiming,
		models.ExceptionTypeOrder,
	}
	severities := []string{"high", "medium", "low"}
	statuses := []models.ExceptionStatus{
		models.ExceptionStatusOpen,
		models.ExceptionStatusHandling,
		models.ExceptionStatusResolved,
		models.ExceptionStatusReview,
	}

	titles := []string{
		"上海店库存偏差超过10件",
		"北京店联名商品陈列位置错误",
		"COLLAB-003上架延迟2天",
		"补货单审批超时",
		"深圳店实际库存与系统相差15件",
		"广州店POP海报缺失",
	}

	descriptions := []string{
		"系统显示库存50件，实际盘点仅38件，偏差超过20%，需要彻查原因",
		"联名丝巾未放置在主入口堆头位置，而是放在了角落里，影响销售",
		"原计划5月20日上架，实际5月22日才完成上架，延误2天",
		"补货单ORD-202605-0003提交超过48小时未审批",
		"深圳万象城店盘点发现COLLAB-001库存系统显示80件，实际仅65件",
		"广州天河城店巡店发现联名商品区未张贴活动海报",
	}

	for i := 0; i < 6; i++ {
		productIdx := i % 3
		storeIdx := i % len(storeIDs)
		exType := exceptionTypes[i%4]
		severity := severities[i%3]
		status := statuses[i%4]

		var product models.CollabProduct
		models.DB.First(&product, "id = ?", productIDs[productIdx])
		var store models.Store
		models.DB.First(&store, "id = ?", storeIDs[storeIdx])

		exception := models.ExceptionRecord{
			ID:             uuid.New(),
			Type:           exType,
			Title:          titles[i],
			Description:    descriptions[i],
			Status:         status,
			Severity:       severity,
			ProductID:      &product.ID,
			ProductSKU:     product.SKU,
			ProductName:    product.Name,
			StoreID:        &store.ID,
			StoreCode:      store.Code,
			StoreName:      store.Name,
			ReportedBy:     managerID,
			ReportedByName: "张店长",
			AssignedTo:     &warehouseID,
			AssignedToName: "王仓管",
		}

		if status == models.ExceptionStatusHandling || status == models.ExceptionStatusResolved {
			exception.ResolutionNote = "正在处理中，已安排人员调整"
		}

		if status == models.ExceptionStatusResolved {
			t := time.Now().AddDate(0, 0, -i)
			exception.ResolvedAt = &t
			exception.NeedReview = true
		}

		if status == models.ExceptionStatusReview {
			t := time.Now().AddDate(0, 0, -i+1)
			exception.ResolvedAt = &t
			exception.NeedReview = true
			exception.ReviewNote = "处理结果符合预期，问题已解决"
			exception.ReviewedBy = &managerID
			exception.ReviewedByName = "张店长"
			exception.ReviewedAt = &t
		}

		if err := models.DB.Create(&exception).Error; err != nil {
			log.Printf("Error seeding exception: %v", err)
		}
	}

	seedOperationLogs()
	seedReviewRecords()
}

func seedOperationLogs() {
	var product models.CollabProduct
	models.DB.First(&product, "id = ?", productIDs[0])

	actions := []string{"create", "update", "approve", "on_shelf", "exception"}
	remarks := []string{"创建联名商品", "更新商品信息", "店长审批通过", "商品上架", "发现异常"}

	for i, action := range actions {
		var operatorID uuid.UUID
		var operatorName string
		var operatorRole models.Role
		if i%2 == 0 {
			operatorID = plannerID
			operatorName = "李企划"
			operatorRole = models.RolePlanner
		} else {
			operatorID = managerID
			operatorName = "张店长"
			operatorRole = models.RoleManager
		}
		models.LogOperation(
			"product",
			productIDs[0],
			action,
			nil,
			map[string]interface{}{"status": "on_shelf"},
			remarks[i],
			operatorID,
			operatorName,
			operatorRole,
		)
	}
}

func seedReviewRecords() {
	now := time.Now()
	reviews := []models.ReviewRecord{
		{
			ID:            uuid.New(),
			ProductID:     productIDs[4],
			ProductSKU:    "COLLAB-005",
			ProductName:   "兵马俑联名秦俑手办",
			ReviewType:    "overall",
			TotalQuantity: 2500,
			TotalSales:    2340,
			TotalRevenue:  463320.00,
			InventoryLeft: 160,
			DisplayScore:  8,
			TimingScore:   9,
			SalesScore:    9,
			OverallScore:  9,
			Problems:      []string{"部分门店补货不及时", "周末高峰时段库存不足"},
			Lessons:       []string{"热门SKU需提前备货30%", "周末需要安排专人负责联名区"},
			Improvements:  []string{"建立补货预警机制", "增加大店安全库存"},
			ReviewedBy:    managerID,
			ReviewedByName: "张店长",
			ReviewedAt:    now,
		},
		{
			ID:            uuid.New(),
			ProductID:     productIDs[0],
			ProductSKU:    "COLLAB-001",
			ProductName:   "故宫联名文创笔记本",
			ReviewType:    "overall",
			TotalQuantity: 1500,
			TotalSales:    856,
			TotalRevenue:  109568.00,
			InventoryLeft: 644,
			DisplayScore:  7,
			TimingScore:   8,
			SalesScore:    6,
			OverallScore:  7,
			Problems:      []string{"定价偏高影响销量", "部分门店陈列位置不佳"},
			Lessons:       []string{"文创类产品价格需更亲民", "陈列位置直接影响转化率"},
			Improvements:  []string{"调整价格策略", "优化门店陈列指引"},
			ReviewedBy:    managerID,
			ReviewedByName: "张店长",
			ReviewedAt:    now.AddDate(0, 0, -7),
		},
	}

	for _, review := range reviews {
		if err := models.DB.FirstOrCreate(&review, models.ReviewRecord{ID: review.ID}).Error; err != nil {
			log.Printf("Error seeding review record: %v", err)
		}
	}
}
