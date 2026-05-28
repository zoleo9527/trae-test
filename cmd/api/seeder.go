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

		adminPwd, _ := utils.HashPassword("123456")
		masterPwd, _ := utils.HashPassword("123456")
		driverPwd, _ := utils.HashPassword("123456")
		csPwd, _ := utils.HashPassword("123456")

		station1MasterID := uuid.New()
		driver1ID := uuid.New()
		driver2ID := uuid.New()
		cs1ID := uuid.New()
		cs2ID := uuid.New()
		adminID := uuid.New()

		users := []models.User{
			{
				BaseModel:    models.BaseModel{ID: adminID},
				Username:     "admin",
				PasswordHash: adminPwd,
				FullName:     "系统管理员",
				Phone:        "13800000000",
				Role:         types.RoleAdmin,
				IsActive:     true,
			},
			{
				BaseModel:    models.BaseModel{ID: station1MasterID},
				Username:     "station_master_1",
				PasswordHash: masterPwd,
				FullName:     "张站长（朝阳路）",
				Phone:        "13800000001",
				Role:         types.RoleStationMaster,
				StationID:    &station1ID,
				IsActive:     true,
			},
			{
				BaseModel:    models.BaseModel{ID: uuid.New()},
				Username:     "station_master_2",
				PasswordHash: masterPwd,
				FullName:     "李站长（海淀）",
				Phone:        "13800000002",
				Role:         types.RoleStationMaster,
				StationID:    &station2ID,
				IsActive:     true,
			},
			{
				BaseModel:    models.BaseModel{ID: driver1ID},
				Username:     "driver_1",
				PasswordHash: driverPwd,
				FullName:     "王师傅",
				Phone:        "13800000003",
				Role:         types.RoleDriver,
				StationID:    &station1ID,
				IsActive:     true,
			},
			{
				BaseModel:    models.BaseModel{ID: driver2ID},
				Username:     "driver_2",
				PasswordHash: driverPwd,
				FullName:     "刘师傅",
				Phone:        "13800000004",
				Role:         types.RoleDriver,
				StationID:    &station1ID,
				IsActive:     true,
			},
			{
				BaseModel:    models.BaseModel{ID: cs1ID},
				Username:     "cs_1",
				PasswordHash: csPwd,
				FullName:     "陈客服",
				Phone:        "13800000005",
				Role:         types.RoleCustomerService,
				StationID:    &station1ID,
				IsActive:     true,
			},
			{
				BaseModel:    models.BaseModel{ID: cs2ID},
				Username:     "cs_2",
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

		customer1ID := uuid.New()
		customer2ID := uuid.New()
		customer3ID := uuid.New()
		customer4ID := uuid.New()

		customers := []models.Customer{
			{
				BaseModel:       models.BaseModel{ID: customer1ID},
				Name:            "北京科技有限公司",
				Phone:           "13900000001",
				Address:         "北京市朝阳区建国路88号A座15层",
				EmptyBuckets:    12,
				TotalDeliveries: 156,
				StationID:       station1ID,
			},
			{
				BaseModel:       models.BaseModel{ID: customer2ID},
				Name:            "张小明（家庭用户）",
				Phone:           "13900000002",
				Address:         "北京市朝阳区望京西园三区5号楼2单元101",
				EmptyBuckets:    2,
				TotalDeliveries: 24,
				StationID:       station1ID,
			},
			{
				BaseModel:       models.BaseModel{ID: customer3ID},
				Name:            "阳光幼儿园",
				Phone:           "13900000003",
				Address:         "北京市朝阳区青年路56号",
				EmptyBuckets:    8,
				TotalDeliveries: 89,
				StationID:       station1ID,
			},
			{
				BaseModel:       models.BaseModel{ID: customer4ID},
				Name:            "新东方培训机构",
				Phone:           "13900000004",
				Address:         "北京市海淀区中关村大街1号",
				EmptyBuckets:    15,
				TotalDeliveries: 234,
				StationID:       station2ID,
			},
		}
		for _, c := range customers {
			if err := tx.Create(&c).Error; err != nil {
				return err
			}
		}

		if err := seedScenario1(tx, customer1ID, station1ID, station1MasterID, driver1ID, cs1ID); err != nil {
			return err
		}

		if err := seedScenario2(tx, customer2ID, station1ID, station1MasterID, driver1ID, cs1ID, cs2ID); err != nil {
			return err
		}

		if err := seedScenario3(tx, customer3ID, station1ID, station1MasterID, driver1ID, cs1ID); err != nil {
			return err
		}

		if err := seedScenario4(tx, customer1ID, station1ID, station1MasterID, driver1ID, cs1ID); err != nil {
			return err
		}

		if err := seedScenario5(tx, customer3ID, station1ID, station1MasterID, driver2ID, cs1ID); err != nil {
			return err
		}

		fmt.Println("Demo data seeded successfully!")
		printDemoAccounts()
		return nil
	})
}

func seedScenario1(tx *gorm.DB, customerID, stationID, stationMasterID, driverID, csID uuid.UUID) error {
	now := time.Now()

	complaintID := uuid.New()
	complaint := &models.Complaint{
		BaseModel:       models.BaseModel{ID: complaintID, CreatedAt: now.Add(-48 * time.Hour), UpdatedAt: now.Add(-2 * time.Hour)},
		CustomerID:      customerID,
		StationID:       stationID,
		Type:            types.ComplaintTypeMissingDelivery,
		Status:          types.ComplaintStatusResolved,
		Priority:        3,
		Title:           "5月26日配送少送2桶水",
		Description:     "今日上午配送订单显示送了10桶，但实际只收到8桶。库存记录显示应该是10桶，司机说装了10桶。需要核查。",
		EmptyBucketDiff: utils.Ptr(0),
		AssignedTo:      &driverID,
		ReportedBy:      csID,
		ResolvedAt:      utils.Ptr(now.Add(-2 * time.Hour)),
	}
	if err := tx.Create(complaint).Error; err != nil {
		return err
	}

	redeliveryID := uuid.New()
	redelivery := &models.Redelivery{
		BaseModel:         models.BaseModel{ID: redeliveryID, CreatedAt: now.Add(-24 * time.Hour), UpdatedAt: now.Add(-2 * time.Hour)},
		ComplaintID:       complaintID,
		DriverID:          &driverID,
		StationID:         stationID,
		WaterAmount:       2,
		EmptyBucketAdjust: 0,
		Status:            types.RedeliveryStatusDelivered,
		ScheduledAt:       now.Add(-20 * time.Hour),
		DeliveredAt:       utils.Ptr(now.Add(-2 * time.Hour)),
		PhotoURL:          utils.Ptr("/uploads/demo_delivery1.jpg"),
		Notes:             "补送2桶，客户已签收，空桶数量核对无误",
	}
	if err := tx.Create(redelivery).Error; err != nil {
		return err
	}

	compensationID := uuid.New()
	compensation := &models.Compensation{
		BaseModel:   models.BaseModel{ID: compensationID, CreatedAt: now.Add(-10 * time.Hour), UpdatedAt: now.Add(-8 * time.Hour)},
		ComplaintID: complaintID,
		StationID:   stationID,
		Type:        types.CompensationTypeFreeBucket,
		Amount:      0,
		WaterAmount: 1,
		Status:      types.CompensationStatusPaid,
		Description: "作为歉意，额外赠送1桶水",
		ApprovedBy:  &stationMasterID,
		ApprovedAt:  utils.Ptr(now.Add(-9 * time.Hour)),
		PaidAt:      utils.Ptr(now.Add(-8 * time.Hour)),
	}
	if err := tx.Create(compensation).Error; err != nil {
		return err
	}

	note1ID := uuid.New()
	note2ID := uuid.New()
	note3ID := uuid.New()
	note4ID := uuid.New()

	notes := []models.ComplaintNote{
		{
			BaseModel:   models.BaseModel{ID: note1ID, CreatedAt: now.Add(-47 * time.Hour)},
			ComplaintID: complaintID,
			CreatedBy:   csID,
			Content:     "客户电话投诉，语气比较着急。已告知会在24小时内补送。",
			IsInternal:  false,
		},
		{
			BaseModel:   models.BaseModel{ID: note2ID, CreatedAt: now.Add(-46 * time.Hour)},
			ComplaintID: complaintID,
			CreatedBy:   stationMasterID,
			Content:     "已核实：司机出发时装了10桶，但在途中另一家客户临时加单，司机多卸了2桶。已安排补送。",
			IsInternal:  true,
		},
		{
			BaseModel:   models.BaseModel{ID: note3ID, CreatedAt: now.Add(-25 * time.Hour)},
			ComplaintID: complaintID,
			CreatedBy:   stationMasterID,
			Content:     "已安排王师傅今天上午补送2桶水，同时作为补偿额外赠送1桶。",
			IsInternal:  false,
		},
		{
			BaseModel:   models.BaseModel{ID: note4ID, CreatedAt: now.Add(-3 * time.Hour)},
			ComplaintID: complaintID,
			CreatedBy:   driverID,
			Content:     "补送完成，客户签收照片已上传。空桶数量：收回8个，与记录一致。",
			IsInternal:  true,
		},
	}
	for _, n := range notes {
		if err := tx.Create(&n).Error; err != nil {
			return err
		}
	}

	auditLogs := []models.AuditLog{
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-48 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionCreate,
			UserID:     csID,
			FieldName:  utils.Ptr("status"),
			OldValue:   utils.Ptr(""),
			NewValue:   utils.Ptr("pending"),
			Metadata:   utils.Ptr(`{"type":"missing_delivery","title":"5月26日配送少送2桶水"}`),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-47 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionCreateNote,
			UserID:     csID,
			Metadata:   utils.Ptr(fmt.Sprintf(`{"note_id":"%s","is_internal":false}`, note1ID.String())),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-46 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionCreateNote,
			UserID:     stationMasterID,
			Metadata:   utils.Ptr(fmt.Sprintf(`{"note_id":"%s","is_internal":true}`, note2ID.String())),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-46 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionAssign,
			UserID:     stationMasterID,
			FieldName:  utils.Ptr("assigned_to"),
			OldValue:   utils.Ptr(""),
			NewValue:   utils.Ptr(driverID.String()),
			Metadata:   utils.Ptr(`{"assignee":"王师傅"}`),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-46 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionStatusChange,
			UserID:     stationMasterID,
			FieldName:  utils.Ptr("status"),
			OldValue:   utils.Ptr("pending"),
			NewValue:   utils.Ptr("processing"),
			Metadata:   utils.Ptr(`{"reason":"Auto-processing on assignment"}`),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-25 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionCreateNote,
			UserID:     stationMasterID,
			Metadata:   utils.Ptr(fmt.Sprintf(`{"note_id":"%s","is_internal":false}`, note3ID.String())),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-24 * time.Hour)},
			EntityType: "redelivery",
			EntityID:   redeliveryID,
			Action:     types.AuditActionCreate,
			UserID:     stationMasterID,
			FieldName:  utils.Ptr("status"),
			OldValue:   utils.Ptr(""),
			NewValue:   utils.Ptr("scheduled"),
			Metadata:   utils.Ptr(`{"water_amount":2,"driver":"王师傅","scheduled_at":"2024-05-27T08:00:00Z"}`),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-10 * time.Hour)},
			EntityType: "compensation",
			EntityID:   compensationID,
			Action:     types.AuditActionCreate,
			UserID:     stationMasterID,
			FieldName:  utils.Ptr("status"),
			OldValue:   utils.Ptr(""),
			NewValue:   utils.Ptr("approved"),
			Metadata:   utils.Ptr(`{"type":"free_bucket","water_amount":1,"auto_approved":true}`),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-10 * time.Hour)},
			EntityType: "compensation",
			EntityID:   compensationID,
			Action:     types.AuditActionApprove,
			UserID:     stationMasterID,
			FieldName:  utils.Ptr("status"),
			OldValue:   utils.Ptr("pending"),
			NewValue:   utils.Ptr("approved"),
			Metadata:   utils.Ptr(`{"notes":"Auto-approved by role"}`),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-3 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionCreateNote,
			UserID:     driverID,
			Metadata:   utils.Ptr(fmt.Sprintf(`{"note_id":"%s","is_internal":true}`, note4ID.String())),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-2 * time.Hour)},
			EntityType: "redelivery",
			EntityID:   redeliveryID,
			Action:     types.AuditActionStatusChange,
			UserID:     driverID,
			FieldName:  utils.Ptr("status"),
			OldValue:   utils.Ptr("scheduled"),
			NewValue:   utils.Ptr("delivered"),
			Metadata:   utils.Ptr(`{"notes":"客户已签收","photo_url":"/uploads/demo_delivery1.jpg"}`),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-2 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionStatusChange,
			UserID:     driverID,
			FieldName:  utils.Ptr("status"),
			OldValue:   utils.Ptr("processing"),
			NewValue:   utils.Ptr("resolved"),
			Metadata:   utils.Ptr(`{"reason":"All redeliveries and compensations completed"}`),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-8 * time.Hour)},
			EntityType: "compensation",
			EntityID:   compensationID,
			Action:     types.AuditActionStatusChange,
			UserID:     stationMasterID,
			FieldName:  utils.Ptr("status"),
			OldValue:   utils.Ptr("approved"),
			NewValue:   utils.Ptr("paid"),
			Metadata:   utils.Ptr(`{"notes":"已记录到客户账户"}`),
		},
	}
	for _, a := range auditLogs {
		if err := tx.Create(&a).Error; err != nil {
			return err
		}
	}

	return nil
}

func seedScenario2(tx *gorm.DB, customerID, stationID, stationMasterID, driverID, cs1ID, cs2ID uuid.UUID) error {
	now := time.Now()

	complaintID := uuid.New()
	complaint := &models.Complaint{
		BaseModel:       models.BaseModel{ID: complaintID, CreatedAt: now.Add(-12 * time.Hour), UpdatedAt: now.Add(-1 * time.Hour)},
		CustomerID:      customerID,
		StationID:       stationID,
		Type:            types.ComplaintTypeEmptyBucketIssue,
		Status:          types.ComplaintStatusProcessing,
		Priority:        2,
		Title:           "空桶数量对不上，差3个",
		Description:     "我家应该有5个空桶，但你们司机说只收回2个。我上周明明叫了5桶水，应该退回5个空桶才对。",
		EmptyBucketDiff: utils.Ptr(-3),
		AssignedTo:      &cs2ID,
		ReportedBy:      cs1ID,
	}
	if err := tx.Create(complaint).Error; err != nil {
		return err
	}

	note1ID := uuid.New()
	note2ID := uuid.New()
	note3ID := uuid.New()
	note4ID := uuid.New()
	note5ID := uuid.New()

	notes := []models.ComplaintNote{
		{
			BaseModel:   models.BaseModel{ID: note1ID, CreatedAt: now.Add(-11 * time.Hour)},
			ComplaintID: complaintID,
			CreatedBy:   cs1ID,
			Content:     "客户坚持说有5个空桶，但司机记录只收回2个。需要调取配送记录核实。",
			IsInternal:  true,
		},
		{
			BaseModel:   models.BaseModel{ID: note2ID, CreatedAt: now.Add(-10 * time.Hour)},
			ComplaintID: complaintID,
			CreatedBy:   cs1ID,
			Content:     "正在核实中，我们会在24小时内给您答复。",
			IsInternal:  false,
		},
		{
			BaseModel:   models.BaseModel{ID: note3ID, CreatedAt: now.Add(-8 * time.Hour)},
			ComplaintID: complaintID,
			CreatedBy:   stationMasterID,
			Content:     "已调取5月20日配送记录：配送5桶，签收照片显示客户门口有5个空桶。司机可能漏收了。",
			IsInternal:  true,
		},
		{
			BaseModel:   models.BaseModel{ID: note4ID, CreatedAt: now.Add(-6 * time.Hour)},
			ComplaintID: complaintID,
			CreatedBy:   cs2ID,
			Content:     "已核实清楚，是我们司机漏收了3个空桶。已在系统中修正记录。给您带来不便非常抱歉！",
			IsInternal:  false,
		},
		{
			BaseModel:   models.BaseModel{ID: note5ID, CreatedAt: now.Add(-2 * time.Hour)},
			ComplaintID: complaintID,
			CreatedBy:   cs2ID,
			Content:     "客户接受了解释，但是要求下次送水时多带3个桶套作为补偿。已记录。",
			IsInternal:  true,
		},
	}
	for _, n := range notes {
		if err := tx.Create(&n).Error; err != nil {
			return err
		}
	}

	auditLogs := []models.AuditLog{
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-12 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionCreate,
			UserID:     cs1ID,
			FieldName:  utils.Ptr("status"),
			OldValue:   utils.Ptr(""),
			NewValue:   utils.Ptr("pending"),
			Metadata:   utils.Ptr(`{"type":"empty_bucket_issue","title":"空桶数量对不上，差3个","empty_bucket_diff":-3}`),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-11 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionAssign,
			UserID:     stationMasterID,
			FieldName:  utils.Ptr("assigned_to"),
			OldValue:   utils.Ptr(""),
			NewValue:   utils.Ptr(cs2ID.String()),
			Metadata:   utils.Ptr(`{"assignee":"赵客服"}`),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-11 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionStatusChange,
			UserID:     stationMasterID,
			FieldName:  utils.Ptr("status"),
			OldValue:   utils.Ptr("pending"),
			NewValue:   utils.Ptr("processing"),
			Metadata:   utils.Ptr(`{"reason":"Auto-processing on assignment"}`),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-11 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionCreateNote,
			UserID:     cs1ID,
			Metadata:   utils.Ptr(fmt.Sprintf(`{"note_id":"%s","is_internal":true}`, note1ID.String())),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-10 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionCreateNote,
			UserID:     cs1ID,
			Metadata:   utils.Ptr(fmt.Sprintf(`{"note_id":"%s","is_internal":false}`, note2ID.String())),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-8 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionCreateNote,
			UserID:     stationMasterID,
			Metadata:   utils.Ptr(fmt.Sprintf(`{"note_id":"%s","is_internal":true}`, note3ID.String())),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-6 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionCreateNote,
			UserID:     cs2ID,
			Metadata:   utils.Ptr(fmt.Sprintf(`{"note_id":"%s","is_internal":false}`, note4ID.String())),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-2 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionCreateNote,
			UserID:     cs2ID,
			Metadata:   utils.Ptr(fmt.Sprintf(`{"note_id":"%s","is_internal":true}`, note5ID.String())),
		},
	}
	for _, a := range auditLogs {
		if err := tx.Create(&a).Error; err != nil {
			return err
		}
	}

	return nil
}

func seedScenario3(tx *gorm.DB, customerID, stationID, stationMasterID, driverID, csID uuid.UUID) error {
	now := time.Now()

	complaintID := uuid.New()
	complaint := &models.Complaint{
		BaseModel:       models.BaseModel{ID: complaintID, CreatedAt: now.Add(-6 * time.Hour), UpdatedAt: now.Add(-30 * time.Minute)},
		CustomerID:      customerID,
		StationID:       stationID,
		Type:            types.ComplaintTypeDamagedBucket,
		Status:          types.ComplaintStatusResolved,
		Priority:        4,
		Title:           "水桶漏水，地面湿了一片",
		Description:     "今天上午送来的水桶有一个在漏水，我们发现时地板已经湿了一大片。幸好没有损坏电器。",
		EmptyBucketDiff: utils.Ptr(1),
		AssignedTo:      &driverID,
		ReportedBy:      csID,
		ResolvedAt:      utils.Ptr(now.Add(-30 * time.Minute)),
	}
	if err := tx.Create(complaint).Error; err != nil {
		return err
	}

	photoID := uuid.New()
	photo := &models.ComplaintPhoto{
		BaseModel:   models.BaseModel{ID: photoID, CreatedAt: now.Add(-5 * time.Hour)},
		ComplaintID: complaintID,
		UploadedBy:  csID,
		FileURL:     "/uploads/demo_leak1.jpg",
		FileHash:    "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
		FileSize:    2456789,
		Description: "漏水的水桶和湿地板照片",
		Verified:    true,
		VerifiedAt:  utils.Ptr(now.Add(-4 * time.Hour)),
	}
	if err := tx.Create(photo).Error; err != nil {
		return err
	}

	compensationID := uuid.New()
	compensation := &models.Compensation{
		BaseModel:   models.BaseModel{ID: compensationID, CreatedAt: now.Add(-2 * time.Hour), UpdatedAt: now.Add(-1 * time.Hour)},
		ComplaintID: complaintID,
		StationID:   stationID,
		Type:        types.CompensationTypeRefund,
		Amount:      75.0,
		WaterAmount: 0,
		Status:      types.CompensationStatusApproved,
		Description: "客户要求退款1桶水的费用（25元）+ 清洁费50元",
		ApprovedBy:  &stationMasterID,
		ApprovedAt:  utils.Ptr(now.Add(-1 * time.Hour)),
	}
	if err := tx.Create(compensation).Error; err != nil {
		return err
	}

	redeliveryID := uuid.New()
	redelivery := &models.Redelivery{
		BaseModel:         models.BaseModel{ID: redeliveryID, CreatedAt: now.Add(-4 * time.Hour), UpdatedAt: now.Add(-1 * time.Hour)},
		ComplaintID:       complaintID,
		DriverID:          &driverID,
		StationID:         stationID,
		WaterAmount:       1,
		EmptyBucketAdjust: 1,
		Status:            types.RedeliveryStatusDelivered,
		ScheduledAt:       now.Add(-3 * time.Hour),
		DeliveredAt:       utils.Ptr(now.Add(-2 * time.Hour)),
		PhotoURL:          utils.Ptr("/uploads/demo_redelivery1.jpg"),
		Notes:             "更换漏水桶，收回破损桶1个",
	}
	if err := tx.Create(redelivery).Error; err != nil {
		return err
	}

	note1ID := uuid.New()
	note2ID := uuid.New()
	note3ID := uuid.New()
	note4ID := uuid.New()
	note5ID := uuid.New()

	notes := []models.ComplaintNote{
		{
			BaseModel:   models.BaseModel{ID: note1ID, CreatedAt: now.Add(-6 * time.Hour)},
			ComplaintID: complaintID,
			CreatedBy:   csID,
			Content:     "客户很着急，说地板湿了一大片。已告知立即安排处理。",
			IsInternal:  true,
		},
		{
			BaseModel:   models.BaseModel{ID: note2ID, CreatedAt: now.Add(-6 * time.Hour)},
			ComplaintID: complaintID,
			CreatedBy:   csID,
			Content:     "非常抱歉给您带来麻烦！我们立即安排师傅更换水桶并处理后续事宜。",
			IsInternal:  false,
		},
		{
			BaseModel:   models.BaseModel{ID: note3ID, CreatedAt: now.Add(-5 * time.Hour)},
			ComplaintID: complaintID,
			CreatedBy:   csID,
			Content:     "客户已上传漏水照片，情况属实。",
			IsInternal:  true,
		},
		{
			BaseModel:   models.BaseModel{ID: note4ID, CreatedAt: now.Add(-4 * time.Hour)},
			ComplaintID: complaintID,
			CreatedBy:   stationMasterID,
			Content:     "已安排王师傅立即去更换漏水的水桶，并收回破损桶。",
			IsInternal:  true,
		},
		{
			BaseModel:   models.BaseModel{ID: note5ID, CreatedAt: now.Add(-2 * time.Hour)},
			ComplaintID: complaintID,
			CreatedBy:   driverID,
			Content:     "已更换新桶，收回破损桶1个。客户要求赔偿清洁费50元。",
			IsInternal:  true,
		},
	}
	for _, n := range notes {
		if err := tx.Create(&n).Error; err != nil {
			return err
		}
	}

	auditLogs := []models.AuditLog{
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-6 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionCreate,
			UserID:     csID,
			FieldName:  utils.Ptr("status"),
			OldValue:   utils.Ptr(""),
			NewValue:   utils.Ptr("pending"),
			Metadata:   utils.Ptr(`{"type":"damaged_bucket","title":"水桶漏水，地面湿了一片","priority":4}`),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-6 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionCreateNote,
			UserID:     csID,
			Metadata:   utils.Ptr(fmt.Sprintf(`{"note_id":"%s","is_internal":true}`, note1ID.String())),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-6 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionCreateNote,
			UserID:     csID,
			Metadata:   utils.Ptr(fmt.Sprintf(`{"note_id":"%s","is_internal":false}`, note2ID.String())),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-5*time.Hour + 30*time.Minute)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionAssign,
			UserID:     stationMasterID,
			FieldName:  utils.Ptr("assigned_to"),
			OldValue:   utils.Ptr(""),
			NewValue:   utils.Ptr(driverID.String()),
			Metadata:   utils.Ptr(`{"assignee":"王师傅"}`),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-5*time.Hour + 30*time.Minute)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionStatusChange,
			UserID:     stationMasterID,
			FieldName:  utils.Ptr("status"),
			OldValue:   utils.Ptr("pending"),
			NewValue:   utils.Ptr("processing"),
			Metadata:   utils.Ptr(`{"reason":"Auto-processing on assignment"}`),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-5 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionCreateNote,
			UserID:     csID,
			Metadata:   utils.Ptr(fmt.Sprintf(`{"note_id":"%s","is_internal":true}`, note3ID.String())),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-5 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionUpload,
			UserID:     csID,
			FieldName:  utils.Ptr("photo"),
			OldValue:   utils.Ptr(""),
			NewValue:   utils.Ptr("/uploads/demo_leak1.jpg"),
			Metadata:   utils.Ptr(`{"file_hash":"a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6","description":"漏水的水桶和湿地板照片"}`),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-4 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionCreateNote,
			UserID:     stationMasterID,
			Metadata:   utils.Ptr(fmt.Sprintf(`{"note_id":"%s","is_internal":true}`, note4ID.String())),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-4 * time.Hour)},
			EntityType: "redelivery",
			EntityID:   redeliveryID,
			Action:     types.AuditActionCreate,
			UserID:     stationMasterID,
			FieldName:  utils.Ptr("status"),
			OldValue:   utils.Ptr(""),
			NewValue:   utils.Ptr("scheduled"),
			Metadata:   utils.Ptr(`{"water_amount":1,"empty_bucket_adjust":1,"driver":"王师傅"}`),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-2 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionCreateNote,
			UserID:     driverID,
			Metadata:   utils.Ptr(fmt.Sprintf(`{"note_id":"%s","is_internal":true}`, note5ID.String())),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-2 * time.Hour)},
			EntityType: "redelivery",
			EntityID:   redeliveryID,
			Action:     types.AuditActionStatusChange,
			UserID:     driverID,
			FieldName:  utils.Ptr("status"),
			OldValue:   utils.Ptr("scheduled"),
			NewValue:   utils.Ptr("delivered"),
			Metadata:   utils.Ptr(`{"notes":"更换漏水桶"}`),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-2 * time.Hour)},
			EntityType: "compensation",
			EntityID:   compensationID,
			Action:     types.AuditActionCreate,
			UserID:     stationMasterID,
			FieldName:  utils.Ptr("status"),
			OldValue:   utils.Ptr(""),
			NewValue:   utils.Ptr("approved"),
			Metadata:   utils.Ptr(`{"type":"refund","amount":75,"auto_approved":true}`),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-2 * time.Hour)},
			EntityType: "compensation",
			EntityID:   compensationID,
			Action:     types.AuditActionApprove,
			UserID:     stationMasterID,
			FieldName:  utils.Ptr("status"),
			OldValue:   utils.Ptr("pending"),
			NewValue:   utils.Ptr("approved"),
			Metadata:   utils.Ptr(`{"notes":"Auto-approved by role"}`),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-30 * time.Minute)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionStatusChange,
			UserID:     stationMasterID,
			FieldName:  utils.Ptr("status"),
			OldValue:   utils.Ptr("processing"),
			NewValue:   utils.Ptr("resolved"),
			Metadata:   utils.Ptr(`{"reason":"All redeliveries and compensations completed"}`),
		},
	}
	for _, a := range auditLogs {
		if err := tx.Create(&a).Error; err != nil {
			return err
		}
	}

	return nil
}

func seedScenario4(tx *gorm.DB, customerID, stationID, stationMasterID, driverID, csID uuid.UUID) error {
	now := time.Now()

	complaintID := uuid.New()
	complaint := &models.Complaint{
		BaseModel:       models.BaseModel{ID: complaintID, CreatedAt: now.Add(-72 * time.Hour), UpdatedAt: now.Add(-68 * time.Hour)},
		CustomerID:      customerID,
		StationID:       stationID,
		Type:            types.ComplaintTypeLateDelivery,
		Status:          types.ComplaintStatusClosed,
		Priority:        2,
		Title:           "配送晚了3小时",
		Description:     "约定上午9点送到，结果12点才到，影响了我们的会议用水。",
		EmptyBucketDiff: utils.Ptr(0),
		AssignedTo:      &driverID,
		ReportedBy:      csID,
		ResolvedAt:      utils.Ptr(now.Add(-70 * time.Hour)),
	}
	if err := tx.Create(complaint).Error; err != nil {
		return err
	}

	compensationID := uuid.New()
	compensation := &models.Compensation{
		BaseModel:   models.BaseModel{ID: compensationID, CreatedAt: now.Add(-71 * time.Hour), UpdatedAt: now.Add(-68 * time.Hour)},
		ComplaintID: complaintID,
		StationID:   stationID,
		Type:        types.CompensationTypeDiscount,
		Amount:      50.0,
		WaterAmount: 0,
		Status:      types.CompensationStatusPaid,
		Description: "下次订水优惠50元",
		ApprovedBy:  &stationMasterID,
		ApprovedAt:  utils.Ptr(now.Add(-71 * time.Hour)),
		PaidAt:      utils.Ptr(now.Add(-68 * time.Hour)),
	}
	if err := tx.Create(compensation).Error; err != nil {
		return err
	}

	note1ID := uuid.New()
	note2ID := uuid.New()
	note3ID := uuid.New()
	note4ID := uuid.New()

	notes := []models.ComplaintNote{
		{
			BaseModel:   models.BaseModel{ID: note1ID, CreatedAt: now.Add(-72 * time.Hour)},
			ComplaintID: complaintID,
			CreatedBy:   csID,
			Content:     "客户投诉配送迟到，影响会议。已致歉并告知会有补偿。",
			IsInternal:  true,
		},
		{
			BaseModel:   models.BaseModel{ID: note2ID, CreatedAt: now.Add(-72 * time.Hour)},
			ComplaintID: complaintID,
			CreatedBy:   csID,
			Content:     "非常抱歉给您的会议带来影响！作为补偿，您下次订水可享受50元优惠。",
			IsInternal:  false,
		},
		{
			BaseModel:   models.BaseModel{ID: note3ID, CreatedAt: now.Add(-71 * time.Hour)},
			ComplaintID: complaintID,
			CreatedBy:   stationMasterID,
			Content:     "司机反馈：途中遇到交通事故堵车，已对司机进行教育。",
			IsInternal:  true,
		},
		{
			BaseModel:   models.BaseModel{ID: note4ID, CreatedAt: now.Add(-69 * time.Hour)},
			ComplaintID: complaintID,
			CreatedBy:   csID,
			Content:     "客户接受补偿方案，对处理速度满意。",
			IsInternal:  true,
		},
	}
	for _, n := range notes {
		if err := tx.Create(&n).Error; err != nil {
			return err
		}
	}

	auditLogs := []models.AuditLog{
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-72 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionCreate,
			UserID:     csID,
			FieldName:  utils.Ptr("status"),
			OldValue:   utils.Ptr(""),
			NewValue:   utils.Ptr("pending"),
			Metadata:   utils.Ptr(`{"type":"late_delivery","title":"配送晚了3小时","priority":2}`),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-72 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionCreateNote,
			UserID:     csID,
			Metadata:   utils.Ptr(fmt.Sprintf(`{"note_id":"%s","is_internal":true}`, note1ID.String())),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-72 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionCreateNote,
			UserID:     csID,
			Metadata:   utils.Ptr(fmt.Sprintf(`{"note_id":"%s","is_internal":false}`, note2ID.String())),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-71*time.Hour + 30*time.Minute)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionAssign,
			UserID:     stationMasterID,
			FieldName:  utils.Ptr("assigned_to"),
			OldValue:   utils.Ptr(""),
			NewValue:   utils.Ptr(driverID.String()),
			Metadata:   utils.Ptr(`{"assignee":"王师傅"}`),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-71*time.Hour + 30*time.Minute)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionStatusChange,
			UserID:     stationMasterID,
			FieldName:  utils.Ptr("status"),
			OldValue:   utils.Ptr("pending"),
			NewValue:   utils.Ptr("processing"),
			Metadata:   utils.Ptr(`{"reason":"Auto-processing on assignment"}`),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-71 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionCreateNote,
			UserID:     stationMasterID,
			Metadata:   utils.Ptr(fmt.Sprintf(`{"note_id":"%s","is_internal":true}`, note3ID.String())),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-71 * time.Hour)},
			EntityType: "compensation",
			EntityID:   compensationID,
			Action:     types.AuditActionCreate,
			UserID:     stationMasterID,
			FieldName:  utils.Ptr("status"),
			OldValue:   utils.Ptr(""),
			NewValue:   utils.Ptr("approved"),
			Metadata:   utils.Ptr(`{"type":"discount","amount":50,"auto_approved":true}`),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-71 * time.Hour)},
			EntityType: "compensation",
			EntityID:   compensationID,
			Action:     types.AuditActionApprove,
			UserID:     stationMasterID,
			FieldName:  utils.Ptr("status"),
			OldValue:   utils.Ptr("pending"),
			NewValue:   utils.Ptr("approved"),
			Metadata:   utils.Ptr(`{"notes":"老客户，适当补偿"}`),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-70 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionStatusChange,
			UserID:     stationMasterID,
			FieldName:  utils.Ptr("status"),
			OldValue:   utils.Ptr("processing"),
			NewValue:   utils.Ptr("resolved"),
			Metadata:   utils.Ptr(`{"reason":"All redeliveries and compensations completed"}`),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-69 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionCreateNote,
			UserID:     csID,
			Metadata:   utils.Ptr(fmt.Sprintf(`{"note_id":"%s","is_internal":true}`, note4ID.String())),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-68 * time.Hour)},
			EntityType: "compensation",
			EntityID:   compensationID,
			Action:     types.AuditActionStatusChange,
			UserID:     stationMasterID,
			FieldName:  utils.Ptr("status"),
			OldValue:   utils.Ptr("approved"),
			NewValue:   utils.Ptr("paid"),
			Metadata:   utils.Ptr(`{"notes":"优惠码已发放"}`),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-68 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionStatusChange,
			UserID:     stationMasterID,
			FieldName:  utils.Ptr("status"),
			OldValue:   utils.Ptr("resolved"),
			NewValue:   utils.Ptr("closed"),
			Metadata:   utils.Ptr(`{"notes":"客户确认满意"}`),
		},
	}
	for _, a := range auditLogs {
		if err := tx.Create(&a).Error; err != nil {
			return err
		}
	}

	return nil
}

func seedScenario5(tx *gorm.DB, customerID, stationID, stationMasterID, driverID, csID uuid.UUID) error {
	now := time.Now()

	complaintID := uuid.New()
	complaint := &models.Complaint{
		BaseModel:       models.BaseModel{ID: complaintID, CreatedAt: now.Add(-36 * time.Hour), UpdatedAt: now.Add(-4 * time.Hour)},
		CustomerID:      customerID,
		StationID:       stationID,
		Type:            types.ComplaintTypeWrongProduct,
		Status:          types.ComplaintStatusProcessing,
		Priority:        3,
		Title:           "送错了水的品牌",
		Description:     "我们订的是品牌A，但送过来的是品牌B。虽然水也能喝，但我们有指定品牌的要求。",
		EmptyBucketDiff: utils.Ptr(0),
		AssignedTo:      &driverID,
		ReportedBy:      csID,
	}
	if err := tx.Create(complaint).Error; err != nil {
		return err
	}

	redeliveryID := uuid.New()
	redelivery := &models.Redelivery{
		BaseModel:         models.BaseModel{ID: redeliveryID, CreatedAt: now.Add(-28 * time.Hour)},
		ComplaintID:       complaintID,
		DriverID:          &driverID,
		StationID:         stationID,
		WaterAmount:       10,
		EmptyBucketAdjust: -10,
		Status:            types.RedeliveryStatusInTransit,
		ScheduledAt:       now.Add(4 * time.Hour),
		Notes:             "换回10桶正确品牌，取回送错的10桶",
	}
	if err := tx.Create(redelivery).Error; err != nil {
		return err
	}

	note1ID := uuid.New()
	note2ID := uuid.New()
	note3ID := uuid.New()
	note4ID := uuid.New()

	notes := []models.ComplaintNote{
		{
			BaseModel:   models.BaseModel{ID: note1ID, CreatedAt: now.Add(-36 * time.Hour)},
			ComplaintID: complaintID,
			CreatedBy:   csID,
			Content:     "客户发现送错品牌，要求换货。库存有品牌A，可以安排更换。",
			IsInternal:  true,
		},
		{
			BaseModel:   models.BaseModel{ID: note2ID, CreatedAt: now.Add(-36 * time.Hour)},
			ComplaintID: complaintID,
			CreatedBy:   csID,
			Content:     "非常抱歉！我们今天下午安排师傅来为您更换成正确品牌的水。",
			IsInternal:  false,
		},
		{
			BaseModel:   models.BaseModel{ID: note3ID, CreatedAt: now.Add(-30 * time.Hour)},
			ComplaintID: complaintID,
			CreatedBy:   stationMasterID,
			Content:     "已安排刘师傅下午3点去换货，同时提醒司机注意核对品牌。",
			IsInternal:  true,
		},
		{
			BaseModel:   models.BaseModel{ID: note4ID, CreatedAt: now.Add(-28 * time.Hour)},
			ComplaintID: complaintID,
			CreatedBy:   stationMasterID,
			Content:     "已为您安排今天下午3-5点换货，司机会带上10桶品牌A并取回送错的10桶。",
			IsInternal:  false,
		},
	}
	for _, n := range notes {
		if err := tx.Create(&n).Error; err != nil {
			return err
		}
	}

	auditLogs := []models.AuditLog{
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-36 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionCreate,
			UserID:     csID,
			FieldName:  utils.Ptr("status"),
			OldValue:   utils.Ptr(""),
			NewValue:   utils.Ptr("pending"),
			Metadata:   utils.Ptr(`{"type":"wrong_product","title":"送错了水的品牌","priority":3}`),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-36 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionCreateNote,
			UserID:     csID,
			Metadata:   utils.Ptr(fmt.Sprintf(`{"note_id":"%s","is_internal":true}`, note1ID.String())),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-36 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionCreateNote,
			UserID:     csID,
			Metadata:   utils.Ptr(fmt.Sprintf(`{"note_id":"%s","is_internal":false}`, note2ID.String())),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-32 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionAssign,
			UserID:     stationMasterID,
			FieldName:  utils.Ptr("assigned_to"),
			OldValue:   utils.Ptr(""),
			NewValue:   utils.Ptr(driverID.String()),
			Metadata:   utils.Ptr(`{"assignee":"刘师傅"}`),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-32 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionStatusChange,
			UserID:     stationMasterID,
			FieldName:  utils.Ptr("status"),
			OldValue:   utils.Ptr("pending"),
			NewValue:   utils.Ptr("processing"),
			Metadata:   utils.Ptr(`{"reason":"Auto-processing on assignment"}`),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-30 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionCreateNote,
			UserID:     stationMasterID,
			Metadata:   utils.Ptr(fmt.Sprintf(`{"note_id":"%s","is_internal":true}`, note3ID.String())),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-28 * time.Hour)},
			EntityType: "complaint",
			EntityID:   complaintID,
			Action:     types.AuditActionCreateNote,
			UserID:     stationMasterID,
			Metadata:   utils.Ptr(fmt.Sprintf(`{"note_id":"%s","is_internal":false}`, note4ID.String())),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-28 * time.Hour)},
			EntityType: "redelivery",
			EntityID:   redeliveryID,
			Action:     types.AuditActionCreate,
			UserID:     stationMasterID,
			FieldName:  utils.Ptr("status"),
			OldValue:   utils.Ptr(""),
			NewValue:   utils.Ptr("scheduled"),
			Metadata:   utils.Ptr(`{"water_amount":10,"empty_bucket_adjust":-10,"driver":"刘师傅"}`),
		},
		{
			BaseModel:  models.BaseModel{ID: uuid.New(), CreatedAt: now.Add(-4 * time.Hour)},
			EntityType: "redelivery",
			EntityID:   redeliveryID,
			Action:     types.AuditActionStatusChange,
			UserID:     driverID,
			FieldName:  utils.Ptr("status"),
			OldValue:   utils.Ptr("scheduled"),
			NewValue:   utils.Ptr("in_transit"),
			Metadata:   utils.Ptr(`{"notes":"已出发前往客户处"}`),
		},
	}
	for _, a := range auditLogs {
		if err := tx.Create(&a).Error; err != nil {
			return err
		}
	}

	return nil
}

func printDemoAccounts() {
	fmt.Println("")
	fmt.Println("=== Demo Accounts (Password: 123456) ===")
	fmt.Println("管理员: admin")
	fmt.Println("站长(朝阳路): station_master_1")
	fmt.Println("站长(海淀): station_master_2")
	fmt.Println("司机1: driver_1 (王师傅)")
	fmt.Println("司机2: driver_2 (刘师傅)")
	fmt.Println("客服1: cs_1 (陈客服)")
	fmt.Println("客服2: cs_2 (赵客服)")
	fmt.Println("========================================")
	fmt.Println("")
}
