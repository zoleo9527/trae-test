package seed

import (
	"tea-distribution/internal/db"
	"tea-distribution/internal/models"
	"tea-distribution/internal/services"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func SeedDemoData() error {
	return db.DB.Transaction(func(tx *gorm.DB) error {
		if err := seedUsers(tx); err != nil {
			return err
		}

		if err := seedProducts(tx); err != nil {
			return err
		}

		if err := seedWarehouses(tx); err != nil {
			return err
		}

		if err := seedStores(tx); err != nil {
			return err
		}

		if err := seedBatches(tx); err != nil {
			return err
		}

		if err := seedInventory(tx); err != nil {
			return err
		}

		if err := seedOrders(tx); err != nil {
			return err
		}

		return nil
	})
}

func seedUsers(tx *gorm.DB) error {
	userService := services.NewUserService()

	users := []struct {
		username string
		password string
		name     string
		role     string
		phone    string
	}{
		{"manager", "manager123", "张经理", models.RoleManager, "13800000001"},
		{"sales1", "sales123", "李销售", models.RoleSales, "13800000002"},
		{"sales2", "sales123", "王销售", models.RoleSales, "13800000003"},
		{"warehouse1", "warehouse123", "赵仓管", models.RoleWarehouse, "13800000004"},
		{"warehouse2", "warehouse123", "陈仓管", models.RoleWarehouse, "13800000005"},
	}

	for _, u := range users {
		var count int64
		tx.Model(&models.User{}).Where("username = ?", u.username).Count(&count)
		if count > 0 {
			continue
		}

		passwordHash, _ := userService.HashPassword(u.password)
		user := &models.User{
			Username: u.username,
			Password: passwordHash,
			Name:     u.name,
			Role:     u.role,
				Phone:    u.phone,
			Status:   "active",
		}
		if err := tx.Create(user).Error; err != nil {
			return err
		}
	}

	return nil
}

func seedProducts(tx *gorm.DB) error {
	products := []models.Product{
		{Code: "LC001", Name: "西湖龙井", Category: "绿茶", Spec: "250g/罐", Unit: "罐", StandardPrice: 298.00, Status: "active"},
		{Code: "LC002", Name: "碧螺春", Category: "绿茶", Spec: "200g/罐", Unit: "罐", StandardPrice: 198.00, Status: "active"},
		{Code: "HC001", Name: "正山小种", Category: "红茶", Spec: "300g/罐", Unit: "罐", StandardPrice: 258.00, Status: "active"},
		{Code: "HC002", Name: "祁门红茶", Category: "红茶", Spec: "250g/罐", Unit: "罐", StandardPrice: 188.00, Status: "active"},
		{Code: "OL001", Name: "铁观音", Category: "乌龙茶", Spec: "500g/盒", Unit: "盒", StandardPrice: 368.00, Status: "active"},
		{Code: "OL002", Name: "大红袍", Category: "乌龙茶", Spec: "200g/盒", Unit: "盒", StandardPrice: 588.00, Status: "active"},
		{Code: "JC001", Name: "白毫银针", Category: "白茶", Spec: "150g/罐", Unit: "罐", StandardPrice: 428.00, Status: "active"},
		{Code: "HL001", Name: "云南普洱", Category: "黑茶", Spec: "357g/饼", Unit: "饼", StandardPrice: 168.00, Status: "active"},
	}

	for _, p := range products {
		var count int64
		tx.Model(&models.Product{}).Where("code = ?", p.Code).Count(&count)
		if count > 0 {
			continue
		}
		if err := tx.Create(&p).Error; err != nil {
			return err
		}
	}
	return nil
}

func seedWarehouses(tx *gorm.DB) error {
	warehouses := []models.Warehouse{
		{Code: "WH001", Name: "杭州中心仓", Address: "杭州市余杭区茶科路88号", Manager: "赵仓管", Phone: "13800000004", Status: "active"},
		{Code: "WH002", Name: "厦门分仓", Address: "厦门市思明区茶叶工业园A区", Manager: "陈仓管", Phone: "13800000005", Status: "active"},
		{Code: "WH003", Name: "成都分仓", Address: "成都市武侯区西南茶城", Manager: "陈仓管", Phone: "13800000005", Status: "active"},
	}

	for _, w := range warehouses {
		var count int64
		tx.Model(&models.Warehouse{}).Where("code = ?", w.Code).Count(&count)
		if count > 0 {
			continue
		}
		if err := tx.Create(&w).Error; err != nil {
			return err
		}
	}
	return nil
}

func seedStores(tx *gorm.DB) error {
	stores := []models.Store{
		{Code: "ST001", Name: "杭州旗舰店", Address: "杭州市西湖区龙井路168号", Contact: "王店长", Phone: "0571-88888888", Region: "华东", Status: "active"},
		{Code: "ST002", Name: "上海南京路店", Address: "上海市黄浦区南京东路200号", Contact: "李店长", Phone: "021-66666666", Region: "华东", Status: "active"},
		{Code: "ST003", Name: "北京王府井店", Address: "北京市东城区王府井大街100号", Contact: "张店长", Phone: "010-55555555", Region: "华北", Status: "active"},
		{Code: "ST004", Name: "广州天河城店", Address: "广州市天河区天河路208号", Contact: "刘店长", Phone: "020-33333333", Region: "华南", Status: "active"},
		{Code: "ST005", Name: "成都春熙路店", Address: "成都市锦江区春熙路步行街", Contact: "陈店长", Phone: "028-22222222", Region: "西南", Status: "active"},
	}

	for _, s := range stores {
		var count int64
		tx.Model(&models.Store{}).Where("code = ?", s.Code).Count(&count)
		if count > 0 {
			continue
		}
		if err := tx.Create(&s).Error; err != nil {
			return err
		}
	}
	return nil
}

func seedBatches(tx *gorm.DB) error {
	var products []models.Product
	tx.Find(&products)

	var productMap = make(map[string]uuid.UUID)
	for _, p := range products {
		productMap[p.Code] = p.ID
	}

	batches := []models.Batch{
		{ProductID: productMap["LC001"], BatchNo: "B-LC001-202401", ProductionDate: time.Date(2024, 1, 15, 0, 0, 0, 0, time.UTC), ExpiryDate: time.Date(2026, 1, 15, 0, 0, 0, 0, time.UTC), Supplier: "西湖龙井合作社", TotalQty: 500, RemainingQty: 500, CostPrice: 150.00, Status: "active"},
		{ProductID: productMap["LC001"], BatchNo: "B-LC001-202403", ProductionDate: time.Date(2024, 3, 20, 0, 0, 0, 0, time.UTC), ExpiryDate: time.Date(2026, 3, 20, 0, 0, 0, 0, time.UTC), Supplier: "西湖龙井合作社", TotalQty: 800, RemainingQty: 800, CostPrice: 165.00, Status: "active"},
		{ProductID: productMap["LC002"], BatchNo: "B-LC002-202402", ProductionDate: time.Date(2024, 2, 10, 0, 0, 0, 0, time.UTC), ExpiryDate: time.Date(2026, 2, 10, 0, 0, 0, 0, time.UTC), Supplier: "苏州碧螺春茶厂", TotalQty: 600, RemainingQty: 600, CostPrice: 95.00, Status: "active"},
		{ProductID: productMap["HC001"], BatchNo: "B-HC001-202401", ProductionDate: time.Date(2024, 1, 20, 0, 0, 0, 0, time.UTC), ExpiryDate: time.Date(2027, 1, 20, 0, 0, 0, 0, time.UTC), Supplier: "武夷山正山茶业", TotalQty: 400, RemainingQty: 400, CostPrice: 128.00, Status: "active"},
		{ProductID: productMap["HC002"], BatchNo: "B-HC002-202402", ProductionDate: time.Date(2024, 2, 25, 0, 0, 0, 0, time.UTC), ExpiryDate: time.Date(2027, 2, 25, 0, 0, 0, 0, time.UTC), Supplier: "祁门红茶集团", TotalQty: 700, RemainingQty: 700, CostPrice: 88.00, Status: "active"},
		{ProductID: productMap["OL001"], BatchNo: "B-OL001-202312", ProductionDate: time.Date(2023, 12, 15, 0, 0, 0, 0, time.UTC), ExpiryDate: time.Date(2025, 12, 15, 0, 0, 0, 0, time.UTC), Supplier: "安溪铁观音集团", TotalQty: 300, RemainingQty: 300, CostPrice: 188.00, Status: "active"},
		{ProductID: productMap["OL002"], BatchNo: "B-OL002-202401", ProductionDate: time.Date(2024, 1, 10, 0, 0, 0, 0, time.UTC), ExpiryDate: time.Date(2026, 1, 10, 0, 0, 0, 0, time.UTC), Supplier: "武夷山岩茶厂", TotalQty: 200, RemainingQty: 200, CostPrice: 298.00, Status: "active"},
		{ProductID: productMap["JC001"], BatchNo: "B-JC001-202311", ProductionDate: time.Date(2023, 11, 5, 0, 0, 0, 0, time.UTC), ExpiryDate: time.Date(2028, 11, 5, 0, 0, 0, 0, time.UTC), Supplier: "福鼎白茶合作社", TotalQty: 250, RemainingQty: 250, CostPrice: 218.00, Status: "active"},
		{ProductID: productMap["HL001"], BatchNo: "B-HL001-202310", ProductionDate: time.Date(2023, 10, 20, 0, 0, 0, 0, time.UTC), ExpiryDate: time.Date(2033, 10, 20, 0, 0, 0, 0, time.UTC), Supplier: "云南普洱集团", TotalQty: 1000, RemainingQty: 1000, CostPrice: 78.00, Status: "active"},
		{ProductID: productMap["LC001"], BatchNo: "B-LC001-202306", ProductionDate: time.Date(2023, 6, 15, 0, 0, 0, 0, time.UTC), ExpiryDate: time.Date(2025, 6, 15, 0, 0, 0, 0, time.UTC), Supplier: "西湖龙井合作社", TotalQty: 300, RemainingQty: 300, CostPrice: 140.00, Status: "active"},
	}

	for _, b := range batches {
		var count int64
		tx.Model(&models.Batch{}).Where("batch_no = ?", b.BatchNo).Count(&count)
		if count > 0 {
			continue
		}
		if err := tx.Create(&b).Error; err != nil {
			return err
		}
	}
	return nil
}

func seedInventory(tx *gorm.DB) error {
	var warehouses []models.Warehouse
	tx.Find(&warehouses)

	var batches []models.Batch
	tx.Find(&batches)

	var warehouseMap = make(map[string]uuid.UUID)
	for _, w := range warehouses {
		warehouseMap[w.Code] = w.ID
	}

	var batchMap = make(map[string]uuid.UUID)
	for _, b := range batches {
		batchMap[b.BatchNo] = b.ID
	}

	inventories := []models.Inventory{
		{WarehouseID: warehouseMap["WH001"], BatchID: batchMap["B-LC001-202401"], Quantity: 200, LockedQty: 0, AvailableQty: 200},
		{WarehouseID: warehouseMap["WH001"], BatchID: batchMap["B-LC001-202403"], Quantity: 300, LockedQty: 0, AvailableQty: 300},
		{WarehouseID: warehouseMap["WH001"], BatchID: batchMap["B-LC002-202402"], Quantity: 250, LockedQty: 0, AvailableQty: 250},
		{WarehouseID: warehouseMap["WH001"], BatchID: batchMap["B-HC001-202401"], Quantity: 150, LockedQty: 0, AvailableQty: 150},
		{WarehouseID: warehouseMap["WH001"], BatchID: batchMap["B-OL001-202312"], Quantity: 100, LockedQty: 0, AvailableQty: 100},
		{WarehouseID: warehouseMap["WH001"], BatchID: batchMap["B-HL001-202310"], Quantity: 400, LockedQty: 0, AvailableQty: 400},
		{WarehouseID: warehouseMap["WH001"], BatchID: batchMap["B-LC001-202306"], Quantity: 100, LockedQty: 0, AvailableQty: 100},

		{WarehouseID: warehouseMap["WH002"], BatchID: batchMap["B-LC001-202401"], Quantity: 150, LockedQty: 0, AvailableQty: 150},
		{WarehouseID: warehouseMap["WH002"], BatchID: batchMap["B-HC002-202402"], Quantity: 300, LockedQty: 0, AvailableQty: 300},
		{WarehouseID: warehouseMap["WH002"], BatchID: batchMap["B-OL002-202401"], Quantity: 80, LockedQty: 0, AvailableQty: 80},
		{WarehouseID: warehouseMap["WH002"], BatchID: batchMap["B-JC001-202311"], Quantity: 120, LockedQty: 0, AvailableQty: 120},

		{WarehouseID: warehouseMap["WH003"], BatchID: batchMap["B-LC002-202402"], Quantity: 200, LockedQty: 0, AvailableQty: 200},
		{WarehouseID: warehouseMap["WH003"], BatchID: batchMap["B-HC001-202401"], Quantity: 200, LockedQty: 0, AvailableQty: 200},
		{WarehouseID: warehouseMap["WH003"], BatchID: batchMap["B-HL001-202310"], Quantity: 500, LockedQty: 0, AvailableQty: 500},
		{WarehouseID: warehouseMap["WH003"], BatchID: batchMap["B-LC001-202306"], Quantity: 150, LockedQty: 0, AvailableQty: 150},
	}

	for _, inv := range inventories {
		var count int64
		tx.Model(&models.Inventory{}).Where("warehouse_id = ? AND batch_id = ?", inv.WarehouseID, inv.BatchID).Count(&count)
		if count > 0 {
			continue
		}
		if err := tx.Create(&inv).Error; err != nil {
			return err
		}
	}
	return nil
}

func seedOrders(tx *gorm.DB) error {
	var users []models.User
	tx.Find(&users)

	var stores []models.Store
	tx.Find(&stores)

	var products []models.Product
	tx.Find(&products)

	var userMap = make(map[string]uuid.UUID)
	for _, u := range users {
		userMap[u.Username] = u.ID
	}

	var storeMap = make(map[string]uuid.UUID)
	for _, s := range stores {
		storeMap[s.Code] = s.ID
	}

	var productMap = make(map[string]uuid.UUID)
	for _, p := range products {
		productMap[p.Code] = p.ID
	}

	now := time.Now()

	seedNormalOrders(tx, userMap, storeMap, productMap, now)
	seedPendingApprovalOrders(tx, userMap, storeMap, productMap, now)
	seedAllocatedOrders(tx, userMap, storeMap, productMap, now)
	seedShippedOrders(tx, userMap, storeMap, productMap, now)
	seedExceptionOrders(tx, userMap, storeMap, productMap, now)

	return nil
}

func seedNormalOrders(tx *gorm.DB, userMap, storeMap, productMap map[string]uuid.UUID, now time.Time) {
	orders := []models.Order{
		{
			OrderNo:      "ORD202405200001",
			StoreID:      storeMap["ST001"],
			SalesID:      userMap["sales1"],
			Status:       models.OrderStatusDraft,
			TotalAmount:  2580.00,
			DiscountAmount: 0,
			FinalAmount:  2580.00,
			Remark:       "常规补货",
			IsActivity:   false,
			ExpectedDate: now.AddDate(0, 0, 7),
		},
	}

	for i := range orders {
		order := &orders[i]
		tx.Create(order)

		orderItems := []models.OrderItem{
			{OrderID: order.ID, ProductID: productMap["LC001"], Quantity: 5, UnitPrice: 298.00, OriginalPrice: 298.00, DiscountRate: 0, Subtotal: 1490.00},
			{OrderID: order.ID, ProductID: productMap["HC001"], Quantity: 3, UnitPrice: 258.00, OriginalPrice: 258.00, DiscountRate: 0, Subtotal: 774.00},
			{OrderID: order.ID, ProductID: productMap["HL001"], Quantity: 2, UnitPrice: 158.00, OriginalPrice: 168.00, DiscountRate: 5.95, Subtotal: 316.00},
		}
		tx.Create(&orderItems)
	}
}

func seedPendingApprovalOrders(tx *gorm.DB, userMap, storeMap, productMap map[string]uuid.UUID, now time.Time) {
	orders := []models.Order{
		{
			OrderNo:      "ORD202405200002",
			StoreID:      storeMap["ST002"],
			SalesID:      userMap["sales1"],
			Status:       models.OrderStatusPending,
			TotalAmount:  8940.00,
			DiscountAmount: 1788.00,
			FinalAmount:  7152.00,
			Remark:       "618活动提前备货，申请折扣",
			IsActivity:   true,
			ActivityName: "618大促",
			ExpectedDate: now.AddDate(0, 0, 14),
		},
	}

	for i := range orders {
		order := &orders[i]
		tx.Create(order)

		orderItems := []models.OrderItem{
			{OrderID: order.ID, ProductID: productMap["LC001"], Quantity: 20, UnitPrice: 238.40, OriginalPrice: 298.00, DiscountRate: 20, Subtotal: 4768.00, Remark: "活动价8折"},
			{OrderID: order.ID, ProductID: productMap["OL001"], Quantity: 10, UnitPrice: 294.40, OriginalPrice: 368.00, DiscountRate: 20, Subtotal: 2944.00, Remark: "活动价8折"},
			{OrderID: order.ID, ProductID: productMap["JC001"], Quantity: 5, UnitPrice: 288.00, OriginalPrice: 428.00, DiscountRate: 32.71, Subtotal: 1440.00, Remark: "活动价"},
		}
		tx.Create(&orderItems)
	}
}

func seedAllocatedOrders(tx *gorm.DB, userMap, storeMap, productMap map[string]uuid.UUID, now time.Time) {
	var warehouses []models.Warehouse
	tx.Find(&warehouses)
	var warehouseMap = make(map[string]uuid.UUID)
	for _, w := range warehouses {
		warehouseMap[w.Code] = w.ID
	}

	var batches []models.Batch
	tx.Find(&batches)
	var batchMap = make(map[string]uuid.UUID)
	for _, b := range batches {
		batchMap[b.BatchNo] = b.ID
	}

	managerID := userMap["manager"]
	order := &models.Order{
		OrderNo:      "ORD202405200003",
		StoreID:      storeMap["ST003"],
		SalesID:      userMap["sales2"],
		Status:       models.OrderStatusAllocated,
		TotalAmount:  3492.00,
		DiscountAmount: 0,
		FinalAmount:  3492.00,
		Remark:       "北京门店补货",
		IsActivity:   false,
		ExpectedDate: now.AddDate(0, 0, 3),
		ApprovedAt:   &now,
		ApprovedBy:   &managerID,
	}
	tx.Create(order)

	orderItems := []models.OrderItem{
		{OrderID: order.ID, ProductID: productMap["LC001"], Quantity: 8, UnitPrice: 298.00, OriginalPrice: 298.00, DiscountRate: 0, Subtotal: 2384.00},
		{OrderID: order.ID, ProductID: productMap["LC002"], Quantity: 6, UnitPrice: 188.00, OriginalPrice: 198.00, DiscountRate: 5.05, Subtotal: 1108.00},
	}
	for i := range orderItems {
		tx.Create(&orderItems[i])
	}

	allocation := &models.Allocation{
		AllocationNo: "ALC202405200001",
		OrderID:      order.ID,
		WarehouseID:  warehouseMap["WH001"],
		Status:       models.AllocationStatusPicking,
		OperatorID:   userMap["warehouse1"],
		TotalQty:     14,
		Remark:       "杭州仓发货，注意批次",
	}
	tx.Create(allocation)

	allocationItems := []models.AllocationItem{
		{AllocationID: allocation.ID, OrderItemID: orderItems[0].ID, ProductID: productMap["LC001"], BatchID: batchMap["B-LC001-202401"], Quantity: 5, PickedQty: 3, IsMixedBatch: true, Remark: "批次混发"},
		{AllocationID: allocation.ID, OrderItemID: orderItems[0].ID, ProductID: productMap["LC001"], BatchID: batchMap["B-LC001-202306"], Quantity: 3, PickedQty: 3, IsMixedBatch: true, Remark: "临期批次，需要提醒门店"},
		{AllocationID: allocation.ID, OrderItemID: orderItems[1].ID, ProductID: productMap["LC002"], BatchID: batchMap["B-LC002-202402"], Quantity: 6, PickedQty: 6, IsMixedBatch: false},
	}
	tx.Create(&allocationItems)
}

func seedShippedOrders(tx *gorm.DB, userMap, storeMap, productMap map[string]uuid.UUID, now time.Time) {
	var warehouses []models.Warehouse
	tx.Find(&warehouses)
	var warehouseMap = make(map[string]uuid.UUID)
	for _, w := range warehouses {
		warehouseMap[w.Code] = w.ID
	}

	var batches []models.Batch
	tx.Find(&batches)
	var batchMap = make(map[string]uuid.UUID)
	for _, b := range batches {
		batchMap[b.BatchNo] = b.ID
	}

	managerID2 := userMap["manager"]
	approvedAt2 := now.AddDate(0, 0, -5)
	order := &models.Order{
		OrderNo:      "ORD202405200004",
		StoreID:      storeMap["ST005"],
		SalesID:      userMap["sales2"],
		Status:       models.OrderStatusShipped,
		TotalAmount:  5772.00,
		DiscountAmount: 576.00,
		FinalAmount:  5196.00,
		Remark:       "成都门店补货",
		IsActivity:   false,
		ExpectedDate: now.AddDate(0, 0, -2),
		ApprovedAt:   &approvedAt2,
		ApprovedBy:   &managerID2,
	}
	tx.Create(order)

	orderItems := []models.OrderItem{
		{OrderID: order.ID, ProductID: productMap["HC001"], Quantity: 10, UnitPrice: 248.00, OriginalPrice: 258.00, DiscountRate: 3.88, Subtotal: 2480.00},
		{OrderID: order.ID, ProductID: productMap["HL001"], Quantity: 15, UnitPrice: 168.00, OriginalPrice: 168.00, DiscountRate: 0, Subtotal: 2520.00},
		{OrderID: order.ID, ProductID: productMap["HC002"], Quantity: 4, UnitPrice: 193.00, OriginalPrice: 188.00, DiscountRate: 0, Subtotal: 772.00, Remark: "价格有误，待确认"},
	}
	for i := range orderItems {
		tx.Create(&orderItems[i])
	}

	allocation := &models.Allocation{
		AllocationNo: "ALC202405200002",
		OrderID:      order.ID,
		WarehouseID:  warehouseMap["WH003"],
		Status:       models.AllocationStatusShipped,
		OperatorID:   userMap["warehouse2"],
		TotalQty:     29,
	}
	tx.Create(allocation)

	allocationItems := []models.AllocationItem{
		{AllocationID: allocation.ID, OrderItemID: orderItems[0].ID, ProductID: productMap["HC001"], BatchID: batchMap["B-HC001-202401"], Quantity: 10, PickedQty: 10},
		{AllocationID: allocation.ID, OrderItemID: orderItems[1].ID, ProductID: productMap["HL001"], BatchID: batchMap["B-HL001-202310"], Quantity: 15, PickedQty: 15},
		{AllocationID: allocation.ID, OrderItemID: orderItems[2].ID, ProductID: productMap["HC002"], BatchID: batchMap["B-HC002-202402"], Quantity: 4, PickedQty: 4},
	}
	tx.Create(&allocationItems)

	shipment := &models.Shipment{
		ShipmentNo:   "SHP202405200001",
		AllocationID: allocation.ID,
		Status:       models.ShipmentStatusReviewing,
		TotalQty:     29,
		Shipper:      "顺丰速运",
		TrackingNo:   "SF1234567890123",
		ShippedAt:    &[]time.Time{now.AddDate(0, 0, -3)}[0],
		Remark:       "成都本地配送，预计次日达",
	}
	tx.Create(shipment)

	shipmentItems := []models.ShipmentItem{
		{ShipmentID: shipment.ID, ProductID: productMap["HC001"], BatchID: batchMap["B-HC001-202401"], ExpectedQty: 10, ActualQty: 9, LossQty: 1, LossReason: "运输破损", IsAbnormal: true, AbnormalRemark: "外包装破损，丢失1罐"},
		{ShipmentID: shipment.ID, ProductID: productMap["HL001"], BatchID: batchMap["B-HL001-202310"], ExpectedQty: 15, ActualQty: 15},
		{ShipmentID: shipment.ID, ProductID: productMap["HC002"], BatchID: batchMap["B-HC002-202402"], ExpectedQty: 4, ActualQty: 4},
	}
	tx.Create(&shipmentItems)
}

func seedExceptionOrders(tx *gorm.DB, userMap, storeMap, productMap map[string]uuid.UUID, now time.Time) {
	var warehouses []models.Warehouse
	tx.Find(&warehouses)
	var warehouseMap = make(map[string]uuid.UUID)
	for _, w := range warehouses {
		warehouseMap[w.Code] = w.ID
	}

	var batches []models.Batch
	tx.Find(&batches)
	var batchMap = make(map[string]uuid.UUID)
	for _, b := range batches {
		batchMap[b.BatchNo] = b.ID
	}

	managerID3 := userMap["manager"]
	approvedAt3 := now.AddDate(0, 0, -2)
	order := &models.Order{
		OrderNo:      "ORD202405200005",
		StoreID:      storeMap["ST004"],
		SalesID:      userMap["sales1"],
		Status:       models.OrderStatusAllocated,
		TotalAmount:  4424.00,
		DiscountAmount: 0,
		FinalAmount:  4424.00,
		Remark:       "广州门店补货",
		IsActivity:   false,
		ExpectedDate: now.AddDate(0, 0, 1),
		ApprovedAt:   &approvedAt3,
		ApprovedBy:   &managerID3,
	}
	tx.Create(order)

	orderItems := []models.OrderItem{
		{OrderID: order.ID, ProductID: productMap["OL002"], Quantity: 5, UnitPrice: 588.00, OriginalPrice: 588.00, DiscountRate: 0, Subtotal: 2940.00},
		{OrderID: order.ID, ProductID: productMap["JC001"], Quantity: 4, UnitPrice: 371.00, OriginalPrice: 428.00, DiscountRate: 13.32, Subtotal: 1484.00, Remark: "VIP客户折扣"},
	}
	for i := range orderItems {
		tx.Create(&orderItems[i])
	}

	allocation := &models.Allocation{
		AllocationNo: "ALC202405200003",
		OrderID:      order.ID,
		WarehouseID:  warehouseMap["WH002"],
		Status:       models.AllocationStatusException,
		OperatorID:   userMap["warehouse2"],
		TotalQty:     9,
		ExceptionMsg: "大红袍库存不足，实际只有3盒，需要调货或与门店沟通",
	}
	tx.Create(allocation)

	allocationItems := []models.AllocationItem{
		{AllocationID: allocation.ID, OrderItemID: orderItems[0].ID, ProductID: productMap["OL002"], BatchID: batchMap["B-OL002-202401"], Quantity: 5, PickedQty: 3, Remark: "库存不足"},
		{AllocationID: allocation.ID, OrderItemID: orderItems[1].ID, ProductID: productMap["JC001"], BatchID: batchMap["B-JC001-202311"], Quantity: 4, PickedQty: 4},
	}
	tx.Create(&allocationItems)
}
