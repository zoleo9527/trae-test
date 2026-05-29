package main

import (
	"fmt"
	"log"
	"time"

	"autoparts/internal/config"
	"autoparts/internal/model"
	"autoparts/internal/util"
)

func main() {
	cfg := config.Load()

	db, err := config.InitDB(&cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect database: %v", err)
	}

	log.Println("Seeding demo data with edge cases...")

	hashedPassword, _ := util.HashPassword("123456")

	var users []model.User
	db.Where("username IN ?", []string{"admin", "owner", "sales1", "sales2", "warehouse1", "warehouse2"}).Find(&users)
	if len(users) == 0 {
		users = []model.User{
			{Username: "admin", Password: hashedPassword, Name: "系统管理员", Phone: "13800000000", Role: model.RoleAdmin, IsActive: true},
			{Username: "owner", Password: hashedPassword, Name: "店老板-王总", Phone: "13800000001", Role: model.RoleOwner, IsActive: true},
			{Username: "sales1", Password: hashedPassword, Name: "销售员-小张", Phone: "13800000002", Role: model.RoleSales, IsActive: true},
			{Username: "sales2", Password: hashedPassword, Name: "销售员-小李", Phone: "13800000007", Role: model.RoleSales, IsActive: true},
			{Username: "warehouse1", Password: hashedPassword, Name: "库管-老李", Phone: "13800000003", Role: model.RoleWarehouse, IsActive: true},
			{Username: "warehouse2", Password: hashedPassword, Name: "库管-小王", Phone: "13800000008", Role: model.RoleWarehouse, IsActive: true},
		}
		for i := range users {
			db.Create(&users[i])
		}
	}

	var salesUser model.User
	db.Where("username = ?", "sales1").First(&salesUser)
	var warehouseUser model.User
	db.Where("username = ?", "warehouse1").First(&warehouseUser)

	var customers []model.Customer
	db.Where("name IN ?", []string{"张三-信用客户", "李四-现金客户", "王五-高风险账期", "赵六-高端客户", "孙七-退货大户"}).Find(&customers)
	if len(customers) == 0 {
		customers = []model.Customer{
			{Name: "张三-信用客户", Phone: "13900000001", LicensePlate: "京A12345", CarModel: "大众帕萨特 2019", IsCredit: true, CreditDays: 30, CreatedByID: salesUser.ID, Remark: "老客户，信用良好"},
			{Name: "李四-现金客户", Phone: "13900000002", LicensePlate: "京B67890", CarModel: "丰田凯美瑞 2020", IsCredit: false, CreatedByID: salesUser.ID, Remark: "只收现金"},
			{Name: "王五-高风险账期", Phone: "13900000003", LicensePlate: "京C11111", CarModel: "本田雅阁 2018", IsCredit: true, CreditDays: 60, CreatedByID: salesUser.ID, Remark: "账期经常逾期，注意风险"},
			{Name: "赵六-高端客户", Phone: "13900000004", LicensePlate: "京D22222", CarModel: "奔驰E300L 2021", IsCredit: true, CreditDays: 15, CreatedByID: salesUser.ID, Remark: "高端车，配件要正厂"},
			{Name: "孙七-退货大户", Phone: "13900000005", LicensePlate: "京E33333", CarModel: "宝马5系 2020", IsCredit: true, CreditDays: 30, CreatedByID: salesUser.ID, Remark: "经常退货，注意核对型号"},
		}
		for i := range customers {
			db.Create(&customers[i])
		}
	}

	var parts []model.Part
	db.Where("part_number IN ?", []string{"ENG-001", "ENG-002", "BRA-001", "BRA-002", "ELE-001", "ELE-002", "OIL-001", "FIL-001"}).Find(&parts)
	if len(parts) == 0 {
		parts = []model.Part{
			{PartNumber: "ENG-001", Name: "发动机总成-大众EA888", Category: model.CategoryEngine, Brand: "大众原厂", Model: "EA888 Gen3", UnitPrice: 15800, CostPrice: 12500, StockQty: 2, LockedQty: 0, MinStockQty: 1, Location: "A-01-01", IsActive: true},
			{PartNumber: "ENG-002", Name: "机油滤清器", Category: model.CategoryEngine, Brand: "曼牌", Model: "W719/45", UnitPrice: 85, CostPrice: 50, StockQty: 0, LockedQty: 0, MinStockQty: 20, Location: "A-01-02", IsActive: true},
			{PartNumber: "BRA-001", Name: "前刹车片-博世", Category: model.CategoryChassis, Brand: "博世", Model: "0986AB1185", UnitPrice: 320, CostPrice: 220, StockQty: 15, LockedQty: 0, MinStockQty: 10, Location: "B-01-01", IsActive: true},
			{PartNumber: "BRA-002", Name: "刹车盘-后", Category: model.CategoryChassis, Brand: "博世", Model: "0986AB6852", UnitPrice: 580, CostPrice: 420, StockQty: 8, LockedQty: 0, MinStockQty: 5, Location: "B-01-02", IsActive: true},
			{PartNumber: "ELE-001", Name: "火花塞-NGK", Category: model.CategoryElectrics, Brand: "NGK", Model: "BKR6EIX", UnitPrice: 45, CostPrice: 28, StockQty: 200, LockedQty: 0, MinStockQty: 50, Location: "C-01-01", IsActive: true},
			{PartNumber: "ELE-002", Name: "电瓶-瓦尔塔", Category: model.CategoryElectrics, Brand: "瓦尔塔", Model: "L2-400 60AH", UnitPrice: 650, CostPrice: 480, StockQty: 5, LockedQty: 0, MinStockQty: 3, Location: "C-01-02", IsActive: true},
			{PartNumber: "OIL-001", Name: "全合成机油5W-40", Category: model.CategoryEngine, Brand: "美孚", Model: "金装1号", UnitPrice: 450, CostPrice: 320, StockQty: 50, LockedQty: 0, MinStockQty: 20, Location: "A-02-01", IsActive: true},
			{PartNumber: "FIL-001", Name: "空调滤清器", Category: model.CategoryEngine, Brand: "曼牌", Model: "CU2939", UnitPrice: 120, CostPrice: 75, StockQty: 3, LockedQty: 0, MinStockQty: 10, Location: "A-02-02", IsActive: true},
		}
		for i := range parts {
			db.Create(&parts[i])
		}
	}

	log.Println("Creating demo enquiries with various statuses...")

	enquiries := []model.Enquiry{}

	for i, customer := range customers {
		partIdx := i % len(parts)
		nextPartIdx := (i + 1) % len(parts)

		enquiryNo := util.GenerateEnquiryNo()
		statuses := []model.EnquiryStatus{
			model.EnquiryStatusPending,
			model.EnquiryStatusQuoted,
			model.EnquiryStatusConfirmed,
			model.EnquiryStatusLocked,
			model.EnquiryStatusCancelled,
		}
		status := statuses[i%len(statuses)]

		enquiry := model.Enquiry{
			EnquiryNo:    enquiryNo,
			CustomerID:   customer.ID,
			CustomerName: customer.Name,
			LicensePlate: customer.LicensePlate,
			CarModel:     customer.CarModel,
			Status:       status,
			IsUrgent:     i == 2,
			Priority:     5 - i,
			CreatedByID:  salesUser.ID,
			Remark:       fmt.Sprintf("演示询价单-%d: %s", i+1, customer.Name),
		}
		db.Create(&enquiry)

		item1 := model.EnquiryItem{
			EnquiryID:  enquiry.ID,
			PartID:     &parts[partIdx].ID,
			PartNumber: parts[partIdx].PartNumber,
			PartName:   parts[partIdx].Name,
			Brand:      parts[partIdx].Brand,
			Quantity:   i + 1,
			UnitPrice:  parts[partIdx].UnitPrice,
			Amount:     parts[partIdx].UnitPrice * float64(i+1),
			Remark:     "主配件",
		}
		db.Create(&item1)

		item2 := model.EnquiryItem{
			EnquiryID:  enquiry.ID,
			PartID:     &parts[nextPartIdx].ID,
			PartNumber: parts[nextPartIdx].PartNumber,
			PartName:   parts[nextPartIdx].Name,
			Brand:      parts[nextPartIdx].Brand,
			Quantity:   (i+1)*2,
			UnitPrice:  parts[nextPartIdx].UnitPrice,
			Amount:     parts[nextPartIdx].UnitPrice * float64((i+1)*2),
			Remark:     "配套配件",
		}
		db.Create(&item2)

		enquiries = append(enquiries, enquiry)
	}

	log.Println("Creating demo quotes...")

	for i, enquiry := range enquiries {
		if enquiry.Status == model.EnquiryStatusPending || enquiry.Status == model.EnquiryStatusCancelled {
			continue
		}

		quoteNo := util.GenerateQuoteNo()

		var enquiryItems []model.EnquiryItem
		db.Where("enquiry_id = ?", enquiry.ID).Find(&enquiryItems)

		totalAmount := 0.0
		var quoteItems []model.QuoteItem

		for _, eItem := range enquiryItems {
			quotePrice := eItem.UnitPrice * 1.1
			amount := quotePrice * float64(eItem.Quantity)
			totalAmount += amount

			quoteItem := model.QuoteItem{
				EnquiryItemID: eItem.ID,
				PartID:        eItem.PartID,
				PartNumber:    eItem.PartNumber,
				PartName:      eItem.PartName,
				Brand:         eItem.Brand,
				Quantity:      eItem.Quantity,
				CostPrice:     eItem.UnitPrice * 0.8,
				QuotePrice:    quotePrice,
				Amount:        amount,
				IsStock:       eItem.Quantity <= 5,
				StockQty:      eItem.Quantity + 10,
			}
			quoteItems = append(quoteItems, quoteItem)
		}

		discount := 0.0
		if i == 2 {
			discount = 100
		}

		quoteStatuses := []model.QuoteStatus{
			model.QuoteStatusPending,
			model.QuoteStatusAccepted,
			model.QuoteStatusRejected,
			model.QuoteStatusAccepted,
		}
		quoteStatus := quoteStatuses[i%len(quoteStatuses)]

		quote := model.Quote{
			QuoteNo:      quoteNo,
			EnquiryID:    enquiry.ID,
			CustomerID:   enquiry.CustomerID,
			CustomerName: enquiry.CustomerName,
			Status:       quoteStatus,
			TotalAmount:  totalAmount,
			Discount:     discount,
			FinalAmount:  totalAmount - discount,
			ValidDays:    7,
			ExpireAt:     time.Now().AddDate(0, 0, 7),
			CreatedByID:  salesUser.ID,
			Remark:       fmt.Sprintf("演示报价单-%d", i+1),
		}

		if quoteStatus == model.QuoteStatusRejected {
			now := time.Now()
			quote.ReviewedAt = &now
			quote.ReviewedByID = &salesUser.ID
			quote.RejectReason = "价格过高，客户选择其他供应商"
		}

		db.Create(&quote)

		for j := range quoteItems {
			quoteItems[j].QuoteID = quote.ID
		}
		db.Create(&quoteItems)
	}

	log.Println("Creating demo lock orders...")

	var acceptedQuotes []model.Quote
	db.Where("status = ?", model.QuoteStatusAccepted).Preload("Items").Find(&acceptedQuotes)

	for i, quote := range acceptedQuotes {
		if i >= 2 {
			break
		}

		lockNo := util.GenerateLockNo()
		lockStatuses := []model.LockStatus{model.LockStatusLocked, model.LockStatusPicked}
		lockStatus := lockStatuses[i]

		totalAmount := 0.0
		var lockItems []model.LockItem

		for _, qItem := range quote.Items {
			if qItem.PartID == nil {
				continue
			}

			var part model.Part
			db.First(&part, *qItem.PartID)

			amount := part.UnitPrice * float64(qItem.Quantity)
			totalAmount += amount

			lockItem := model.LockItem{
				QuoteItemID: qItem.ID,
				PartID:      *qItem.PartID,
				PartNumber:  part.PartNumber,
				PartName:    part.Name,
				Brand:       part.Brand,
				Quantity:    qItem.Quantity,
				LockedQty:   qItem.Quantity,
				PickedQty:   0,
				UnitPrice:   part.UnitPrice,
				Amount:      amount,
				Location:    part.Location,
			}

			if lockStatus == model.LockStatusPicked {
				lockItem.PickedQty = qItem.Quantity
			}

			lockItems = append(lockItems, lockItem)
		}

		returnStatus := model.ReturnStatusNone
		if i == 1 {
			returnStatus = model.ReturnStatusPending
		}

		lockOrder := model.LockOrder{
			LockNo:       lockNo,
			EnquiryID:    quote.EnquiryID,
			QuoteID:      &quote.ID,
			CustomerID:   quote.CustomerID,
			CustomerName: quote.CustomerName,
			Status:       lockStatus,
			TotalAmount:  totalAmount,
			ExpireAt:     time.Now().AddDate(0, 0, 3),
			CreatedByID:  warehouseUser.ID,
			ReturnStatus: returnStatus,
			Remark:       fmt.Sprintf("演示锁库单-%d", i+1),
		}

		if lockStatus == model.LockStatusPicked {
			now := time.Now()
			lockOrder.PickedAt = &now
			lockOrder.PickedByID = &warehouseUser.ID
		}

		db.Create(&lockOrder)

		for j := range lockItems {
			lockItems[j].LockOrderID = lockOrder.ID
		}
		db.Create(&lockItems)
	}

	log.Println("Creating edge case data for testing error handling...")

	edgeEnquiry := model.Enquiry{
		EnquiryNo:    util.GenerateEnquiryNo(),
		CustomerID:   customers[2].ID,
		CustomerName: customers[2].Name,
		LicensePlate: customers[2].LicensePlate,
		CarModel:     customers[2].CarModel,
		Status:       model.EnquiryStatusCompleted,
		IsUrgent:     true,
		Priority:     1,
		CreatedByID:  salesUser.ID,
		Remark:       "测试用：已完成状态，尝试修改会触发状态冲突",
	}
	db.Create(&edgeEnquiry)

	edgeItem := model.EnquiryItem{
		EnquiryID: edgeEnquiry.ID,
		PartName:  "测试配件-无库存",
		Brand:     "测试品牌",
		Quantity:  100,
		Remark:    "测试用：库存不足场景",
	}
	db.Create(&edgeItem)

	expiredQuote := model.Quote{
		QuoteNo:      util.GenerateQuoteNo(),
		EnquiryID:    enquiries[0].ID,
		CustomerID:   customers[0].ID,
		CustomerName: customers[0].Name,
		Status:       model.QuoteStatusExpired,
		TotalAmount:  1000,
		FinalAmount:  1000,
		ValidDays:    1,
		ExpireAt:     time.Now().AddDate(0, 0, -10),
		CreatedByID:  salesUser.ID,
		Remark:       "测试用：已过期的报价单",
	}
	db.Create(&expiredQuote)

	log.Println("Demo data seeding completed!")
	log.Println("")
	log.Println("=== Test Scenarios for Demo ===")
	log.Println("1. Status Conflict: Try to update enquiry with status 'completed' (ID:", edgeEnquiry.ID, ")")
	log.Println("2. Stock Insufficient: Try to lock part ENG-002 with quantity > 0 (stock is 0)")
	log.Println("3. Permission Denied: Try warehouse user to create enquiry (should be denied)")
	log.Println("4. Permission Denied: Try sales user to pick stock (should be denied)")
	log.Println("5. Expired Quote: Try to review quote with status 'expired' (ID:", expiredQuote.ID, ")")
	log.Println("6. Validation Error: Create enquiry without customer_id or items")
	log.Println("7. Credit Risk: Customer 王五-高风险账期 has 60 days credit (check remarks)")
	log.Println("8. Return Edge Case: Lock order with pending return status for testing return flow")
}
