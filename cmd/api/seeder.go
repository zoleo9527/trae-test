package main

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"water-delivery-service/internal/database"
	"water-delivery-service/internal/models"
	"water-delivery-service/internal/utils"
	"water-delivery-service/pkg/types"
)

func SeedDemoData() error {
	var count int64
	database.DB.Model(&models.User{}).Count(&count)
	if count > 0 {
		fmt.Println("Demo data already exists, skipping seed")
		return nil
	}

	return database.DB.Transaction(func(tx *gorm.DB) error {
		station1ID := uuid.New()
		station2ID := uuid.New()

		stations := []models.WaterStation{
			{
				BaseModel: models.BaseModel{ID: station1ID},
				Name:      "朝阳路水站",
				Address:   "北京市朝阳区朝阳路128号",
				Phone:     "010-88881234",
			},
			{
				BaseModel: models.BaseModel{ID: station2ID},
				Name:      "海淀区水站",
				Address:   "北京市海淀区中关村大街45号",
				Phone:     "010-88885678",
			},
		}
		for _, s := range stations {
			if err := tx.Create(&s).Error; err != nil {
				return err
			}
		}

		adminPwd, _ := utils.HashPassword("admin123")
		masterPwd, _ := utils.HashPassword("master123")
		driverPwd, _ := utils.HashPassword("driver123")
		csPwd, _ := utils.HashPassword("cs123")

		station1MasterID := uuid.New()
		users := []models.User{
			{
				BaseModel:    models.BaseModel{ID: uuid.New()},
				Username:     "admin",
				PasswordHash: adminPwd,
				FullName:     "系统管理员",
				Phone:        "13800000000",
				Role:         types.RoleAdmin,
				IsActive:     true,
			},
			{
				BaseModel:    models.BaseModel{ID: station1MasterID},
				Username:     "master_chaoyang",
				PasswordHash: masterPwd,
				FullName:     "张站长（朝阳路）",
				Phone:        "13800000001",
				Role:         types.RoleStationMaster,
				StationID:    &station1ID,
				IsActive:     true,
			},
			{
				BaseModel:    models.BaseModel{ID: uuid.New()},
				Username:     "master_haidian",
				PasswordHash: masterPwd,
				FullName:     "李站长（海淀）",
				Phone:        "13800000002",
				Role:         types.RoleStationMaster,
				StationID:    &station2ID,
				IsActive:     true,
			},
			{
				BaseModel:    models.BaseModel{ID: uuid.New()},
				Username:     "driver_wang",
				PasswordHash: driverPwd,
				FullName:     "王司机",
				Phone:        "13800000003",
				Role:         types.RoleDriver,
				StationID:    &station1ID,
				IsActive:     true,
			},
			{
				BaseModel:    models.BaseModel{ID: uuid.New()},
				Username:     "driver_liu",
				PasswordHash: driverPwd,
				FullName:     "刘司机",
				Phone:        "13800000004",
				Role:         types.RoleDriver,
				StationID:    &station1ID,
				IsActive:     true,
			},
			{
				BaseModel:    models.BaseModel{ID: uuid.New()},
				Username:     "cs_chen",
				PasswordHash: csPwd,
				FullName:     "陈客服",
				Phone:        "13800000005",
				Role:         types.RoleCustomerService,
				StationID:    &station1ID,
				IsActive:     true,
			},
			{
				BaseModel:    models.BaseModel{ID: uuid.New()},
				Username:     "cs_zhao",
				PasswordHash: csPwd,
				FullName:     "赵客服",
				Phone:        "13800000006",
				Role:         types.RoleCustomerService,
				StationID:    &station1ID,
				IsActive:     true,
			},
		}
		for _, u := range users {
			if err := tx.Create(&u).Error; err != nil {
				return err
			}
		}

		customers := []models.Customer{
			{
				BaseModel:        models.BaseModel{ID: uuid.New()},
				Name:             "北京科技有限公司",
				Phone:            "13900000001",
				Address:          "北京市朝阳区建国路88号A座15层",
				EmptyBuckets:     12,
				TotalDeliveries:  156,
				StationID:        station1ID,
			},
			{
				BaseModel:        models.BaseModel{ID: uuid.New()},
				Name:             "张小明（家庭用户）",
				Phone:            "13900000002",
				Address:          "北京市朝阳区望京西园三区5号楼2单元101",
				EmptyBuckets:     2,
				TotalDeliveries:  24,
				StationID:        station1ID,
			},
			{
				BaseModel:        models.BaseModel{ID: uuid.New()},
				Name:             "阳光幼儿园",
				Phone:            "13900000003",
				Address:          "北京市朝阳区青年路56号",
				EmptyBuckets:     8,
				TotalDeliveries:  89,
				StationID:        station1ID,
			},
			{
				BaseModel:        models.BaseModel{ID: uuid.New()},
				Name:             "新东方培训机构",
				Phone:            "13900000004",
				Address:          "北京市海淀区中关村大街1号",
				EmptyBuckets:     15,
				TotalDeliveries:  234,
				StationID:        station2ID,
			},
		}
		for _, c := range customers {
			if err := tx.Create(&c).Error; err != nil {
				return err
			}
		}

		if err := seedComplaintScenarios(tx, &customers[0], &customers[1], &customers[2], station1ID, station1MasterID, &users[3], &users[5]); err != nil {
			return err
		}

		fmt.Println("Demo data seeded successfully!")
		printDemoAccounts()
		return nil
	})
}

func seedComplaintScenarios(tx *gorm.DB, customer1, customer2, customer3 *models.Customer, stationID, stationMasterID uuid.UUID, driverUser, csUser *models.User) error {
	now := time.Now()

	complaint1ID := uuid.New()
	complaint1 := &models.Complaint{
		BaseModel:       models.BaseModel{ID: complaint1ID, CreatedAt: now.Add(-48 * time.Hour), UpdatedAt: now.Add(-2 * time.Hour)},
		CustomerID:      customer1.ID,
		StationID:       stationID,
		Type:            types.ComplaintTypeMissingDelivery,
		Status:          types.ComplaintStatusResolved,
		Priority:        3,
		Title:           "5月26日配送少送2桶水",
		Description:     "今日上午配送订单显示送了10桶，但实际只收到8桶。库存记录显示应该是10桶，司机说装了10桶。需要核查。",
		EmptyBucketDiff: utils.Ptr(0),
		AssignedTo:      &driverUser.ID,
		ReportedBy:      csUser.ID,
		ResolvedAt:      utils.Ptr(now.Add(-2 * time.Hour)),
	}
	if err := tx.Create(complaint1).Error; err != nil {
		return err
	}

	redelivery1 := &models.Redelivery{
		BaseModel:         models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-24 * time.Hour), UpdatedAt: now.Add(-2 * time.Hour)},
		ComplaintID:       complaint1ID,
		DriverID:          &driverUser.ID,
		StationID:         stationID,
		WaterAmount:       2,
		EmptyBucketAdjust: 0,
		Status:            types.RedeliveryStatusDelivered,
		ScheduledAt:       now.Add(-20 * time.Hour),
		DeliveredAt:       utils.Ptr(now.Add(-2 * time.Hour)),
		PhotoURL:          utils.Ptr("/uploads/demo_delivery1.jpg"),
		Notes:             "补送2桶，客户已签收，空桶数量核对无误",
	}
	if err := tx.Create(redelivery1).Error; err != nil {
		return err
	}

	compensation1 := &models.Compensation{
		BaseModel:   models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-10 * time.Hour), UpdatedAt: now.Add(-8 * time.Hour)},
		ComplaintID: complaint1ID,
		StationID:   stationID,
		Type:        types.CompensationTypeFreeBucket,
		Amount:      0,
		WaterAmount: 1,
		Status:      types.CompensationStatusApproved,
		Description: "作为歉意，额外赠送1桶水",
		ApprovedBy:  &stationMasterID,
		ApprovedAt:  utils.Ptr(now.Add(-9 * time.Hour)),
		PaidAt:      utils.Ptr(now.Add(-8 * time.Hour)),
	}
	if err := tx.Create(compensation1).Error; err != nil {
		return err
	}

	note1 := &models.ComplaintNote{
		BaseModel:   models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-47 * time.Hour)},
		ComplaintID: complaint1ID,
		CreatedBy:   csUser.ID,
		Content:     "客户电话投诉，语气比较着急。已告知会在24小时内补送。",
		IsInternal:  false,
	}
	if err := tx.Create(note1).Error; err != nil {
		return err
	}

	note2 := &models.ComplaintNote{
		BaseModel:   models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-46 * time.Hour)},
		ComplaintID: complaint1ID,
		CreatedBy:   stationMasterID,
		Content:     "已核实：司机出发时装了10桶，但在途中另一家客户临时加单，司机多卸了2桶。已安排补送。",
		IsInternal:  true,
	}
	if err := tx.Create(note2).Error; err != nil {
		return err
	}

	audit1 := &models.AuditLog{
		BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-48 * time.Hour)},
		EntityType: "complaint",
		EntityID:   complaint1ID,
		Action:     types.AuditActionCreate,
		UserID:     csUser.ID,
		Metadata:   utils.Ptr(`{"type":"missing_delivery","title":"5月26日配送少送2桶水"}`),
	}
	if err := tx.Create(audit1).Error; err != nil {
		return err
	}

	audit2 := &models.AuditLog{
		BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-46 * time.Hour)},
		EntityType: "complaint",
		EntityID:   complaint1ID,
		Action:     types.AuditActionAssign,
		UserID:     stationMasterID,
		FieldName:  utils.Ptr("assigned_to"),
		OldValue:   utils.Ptr(""),
		NewValue:   utils.Ptr(driverUser.ID.String()),
	}
	if err := tx.Create(audit2).Error; err != nil {
		return err
	}

	audit3 := &models.AuditLog{
		BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-24 * time.Hour)},
		EntityType: "redelivery",
		EntityID:   redelivery1.ID,
		Action:     types.AuditActionCreate,
		UserID:     stationMasterID,
		Metadata:   utils.Ptr(`{"water_amount":2,"scheduled_at":"2024-05-27T08:00:00Z"}`),
	}
	if err := tx.Create(audit3).Error; err != nil {
		return err
	}

	audit4 := &models.AuditLog{
		BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-2 * time.Hour)},
		EntityType: "redelivery",
		EntityID:   redelivery1.ID,
		Action:     types.AuditActionStatusChange,
		UserID:     driverUser.ID,
		FieldName:  utils.Ptr("status"),
		OldValue:   utils.Ptr("scheduled"),
		NewValue:   utils.Ptr("delivered"),
		Metadata:   utils.Ptr(`{"notes":"客户已签收"}`),
	}
	if err := tx.Create(audit4).Error; err != nil {
		return err
	}

	complaint2ID := uuid.New()
	complaint2 := &models.Complaint{
		BaseModel:       models.BaseModel{ID: complaint2ID, CreatedAt: now.Add(-12 * time.Hour), UpdatedAt: now.Add(-4 * time.Hour)},
		CustomerID:      customer2.ID,
		StationID:       stationID,
		Type:            types.ComplaintTypeEmptyBucketIssue,
		Status:          types.ComplaintStatusProcessing,
		Priority:        2,
		Title:           "空桶数量对不上，差3个",
		Description:     "我家应该有5个空桶，但你们司机说只收回2个。我上周明明叫了5桶水，应该退回5个空桶才对。",
		EmptyBucketDiff: utils.Ptr(-3),
		AssignedTo:      &csUser.ID,
		ReportedBy:      csUser.ID,
	}
	if err := tx.Create(complaint2).Error; err != nil {
		return err
	}

	complaint3ID := uuid.New()
	complaint3 := &models.Complaint{
		BaseModel:       models.BaseModel{ID: complaint3ID, CreatedAt: now.Add(-6 * time.Hour), UpdatedAt: now.Add(-1 * time.Hour)},
		CustomerID:      customer3.ID,
		StationID:       stationID,
		Type:            types.ComplaintTypeDamagedBucket,
		Status:          types.ComplaintStatusPending,
		Priority:        4,
		Title:           "水桶漏水，地面湿了一片",
		Description:     "今天上午送来的水桶有一个在漏水，我们发现时地板已经湿了一大片。幸好没有损坏电器。",
		EmptyBucketDiff: utils.Ptr(1),
		ReportedBy:      csUser.ID,
	}
	if err := tx.Create(complaint3).Error; err != nil {
		return err
	}

	photo1 := &models.ComplaintPhoto{
		BaseModel:   models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-5 * time.Hour)},
		ComplaintID: complaint3ID,
		UploadedBy:  csUser.ID,
		FileURL:     "/uploads/demo_leak1.jpg",
		FileHash:    "a1b2c3d4e5f6g7h8i9j0",
		FileSize:    2456789,
		Description: "漏水的水桶和湿地板照片",
		Verified:    true,
		VerifiedAt:  utils.Ptr(now.Add(-4 * time.Hour)),
	}
	if err := tx.Create(photo1).Error; err != nil {
		return err
	}

	compensation2 := &models.Compensation{
		BaseModel:   models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-2 * time.Hour)},
		ComplaintID: complaint3ID,
		StationID:   stationID,
		Type:        types.CompensationTypeRefund,
		Amount:      75.0,
		WaterAmount: 0,
		Status:      types.CompensationStatusPending,
		Description: "客户要求退款1桶水的费用（25元）+ 清洁费50元",
	}
	if err := tx.Create(compensation2).Error; err != nil {
		return err
	}

	complaint4ID := uuid.New()
	complaint4 := &models.Complaint{
		BaseModel:       models.BaseModel{ID: complaint4ID, CreatedAt: now.Add(-72 * time.Hour), UpdatedAt: now.Add(-70 * time.Hour)},
		CustomerID:      customer1.ID,
		StationID:       stationID,
		Type:            types.ComplaintTypeLateDelivery,
		Status:          types.ComplaintStatusClosed,
		Priority:        2,
		Title:           "配送晚了3小时",
		Description:     "约定上午9点送到，结果12点才到，影响了我们的会议用水。",
		EmptyBucketDiff: utils.Ptr(0),
		AssignedTo:      &driverUser.ID,
		ReportedBy:      csUser.ID,
		ResolvedAt:      utils.Ptr(now.Add(-70 * time.Hour)),
	}
	if err := tx.Create(complaint4).Error; err != nil {
		return err
	}

	compensation3 := &models.Compensation{
		BaseModel:   models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-71 * time.Hour), UpdatedAt: now.Add(-70 * time.Hour)},
		ComplaintID: complaint4ID,
		StationID:   stationID,
		Type:        types.CompensationTypeDiscount,
		Amount:      50.0,
		WaterAmount: 0,
		Status:      types.CompensationStatusPaid,
		Description: "下次订水优惠50元",
		ApprovedBy:  &stationMasterID,
		ApprovedAt:  utils.Ptr(now.Add(-71 * time.Hour)),
		PaidAt:      utils.Ptr(now.Add(-70 * time.Hour)),
	}
	if err := tx.Create(compensation3).Error; err != nil {
		return err
	}

	audit5 := &models.AuditLog{
		BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-71 * time.Hour)},
		EntityType: "compensation",
		EntityID:   compensation3.ID,
		Action:     types.AuditActionApprove,
		UserID:     stationMasterID,
		Metadata:   utils.Ptr(`{"notes":"老客户，适当补偿"}`),
	}
	if err := tx.Create(audit5).Error; err != nil {
		return err
	}

	complaint5ID := uuid.New()
	complaint5 := &models.Complaint{
		BaseModel:       models.BaseModel{ID: complaint5ID, CreatedAt: now.Add(-36 * time.Hour), UpdatedAt: now.Add(-30 * time.Hour)},
		CustomerID:      customer3.ID,
		StationID:       stationID,
		Type:            types.ComplaintTypeWrongProduct,
		Status:          types.ComplaintStatusProcessing,
		Priority:        3,
		Title:           "送错了水的品牌",
		Description:     "我们订的是品牌A，但送过来的是品牌B。虽然水也能喝，但我们有指定品牌的要求。",
		EmptyBucketDiff: utils.Ptr(0),
		AssignedTo:      &driverUser.ID,
		ReportedBy:      csUser.ID,
	}
	if err := tx.Create(complaint5).Error; err != nil {
		return err
	}

	redelivery2 := &models.Redelivery{
		BaseModel:         models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-28 * time.Hour)},
		ComplaintID:       complaint5ID,
		DriverID:          &driverUser.ID,
		StationID:         stationID,
		WaterAmount:       10,
		EmptyBucketAdjust: -10,
		Status:            types.RedeliveryStatusScheduled,
		ScheduledAt:       now.Add(4 * time.Hour),
		Notes:             "换回10桶正确品牌，取回送错的10桶",
	}
	if err := tx.Create(redelivery2).Error; err != nil {
		return err
	}

	return nil
}

func printDemoAccounts() {
	fmt.Println("")
	fmt.Println("=== Demo Accounts ===")
	fmt.Println("管理员: admin / admin123")
	fmt.Println("站长(朝阳路): master_chaoyang / master123")
	fmt.Println("站长(海淀): master_haidian / master123")
	fmt.Println("司机: driver_wang / driver123")
	fmt.Println("司机2: driver_liu / driver123")
	fmt.Println("客服: cs_chen / cs123")
	fmt.Println("客服2: cs_zhao / cs123")
	fmt.Println("=====================")
	fmt.Println("")
}
