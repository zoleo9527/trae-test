package database

import (
	"jewelry-store-system/middleware"
	"jewelry-store-system/models"
	"time"

	"gorm.io/gorm"
)

func SeedDemoData(db *gorm.DB) error {
	var count int64
	db.Model(&models.User{}).Count(&count)
	if count > 0 {
		return nil
	}

	hashedPassword, _ := middleware.HashPassword("123456")

	users := []models.User{
		{
			Username: "manager",
			Password: hashedPassword,
			Name:     "张店长",
			Phone:    "13800138001",
			Role:     models.RoleManager,
		},
		{
			Username: "sales1",
			Password: hashedPassword,
			Name:     "李导购",
			Phone:    "13800138002",
			Role:     models.RoleSalesperson,
		},
		{
			Username: "sales2",
			Password: hashedPassword,
			Name:     "王导购",
			Phone:    "13800138003",
			Role:     models.RoleSalesperson,
		},
		{
			Username: "aftersales",
			Password: hashedPassword,
			Name:     "赵售后",
			Phone:    "13800138004",
			Role:     models.RoleAfterSales,
		},
	}

	for _, user := range users {
		if err := db.Create(&user).Error; err != nil {
			return err
		}
	}

	customers := []models.Customer{
		{
			Name:     "陈女士",
			Phone:    "13900139001",
			WechatID: "chen_lady",
			Level:    "vip",
			Remark:   "老客户，喜欢钻石饰品",
		},
		{
			Name:     "刘先生",
			Phone:    "13900139002",
			WechatID: "liu_mr",
			Level:    "normal",
			Remark:   "准备结婚，对戒定制",
		},
		{
			Name:     "周女士",
			Phone:    "13900139003",
			WechatID: "zhou_lady",
			Level:    "gold",
			Remark:   "高净值客户，消费能力强",
		},
	}

	for _, customer := range customers {
		if err := db.Create(&customer).Error; err != nil {
			return err
		}
	}

	products := []models.Product{
		{
			SKU:         "DIA-001",
			Name:        "经典六爪钻戒",
			Category:    "ring",
			Material:    "18K白金",
			Weight:      3.5,
			Price:       28800,
			Cost:        18000,
			Stock:       5,
			Description: "经典六爪镶嵌，1克拉钻石，VVS净度",
		},
		{
			SKU:         "NEC-001",
			Name:        "珍珠项链",
			Category:    "necklace",
			Material:    "925银",
			Weight:      15.2,
			Price:       3580,
			Cost:        1800,
			Stock:       20,
			Description: "淡水珍珠，正圆无暇",
		},
		{
			SKU:         "BRA-001",
			Name:        "黄金手镯",
			Category:    "bracelet",
			Material:    "足金999",
			Weight:      35.8,
			Price:       18800,
			Cost:        15000,
			Stock:       3,
			Description: "古法工艺，传承系列",
		},
	}

	for _, product := range products {
		if err := db.Create(&product).Error; err != nil {
			return err
		}
	}

	managerID := uint(1)
	sales1ID := uint(2)
	sales2ID := uint(3)
	afterSalesID := uint(4)

	customer1ID := uint(1)
	customer2ID := uint(2)
	customer3ID := uint(3)

	now := time.Now()

	quotations := []models.Quotation{
		{
			QuotationNo:    "Q202401010001",
			Type:           models.QuotationTypeCustom,
			Status:         models.QuotationStatusCompleted,
			CustomerID:     customer1ID,
			ProductName:    "定制钻戒 - 50分",
			Description:    "客户定制50分钻戒，H色，VS净度，六爪镶嵌",
			Material:       "PT950铂金",
			Weight:         4.2,
			EstimatedPrice: 15800,
			Cost:           9800,
			Discount:       500,
			FinalPrice:     15300,
			Deposit:        5000,
			DeliveryDays:   15,
			SalespersonID:  sales1ID,
			Remark:         "客户要求刻字",
			CreatedAt:      now.AddDate(0, 0, -30),
			UpdatedAt:      now.AddDate(0, 0, -15),
		},
		{
			QuotationNo:    "Q202401150002",
			Type:           models.QuotationTypeRepair,
			Status:         models.QuotationStatusApproved,
			CustomerID:     customer2ID,
			ProductID:      nil,
			ProductName:    "项链维修 - 断链焊接",
			Description:    "白金项链断裂，需要焊接加固",
			Material:       "18K白金",
			Weight:         0,
			EstimatedPrice: 380,
			Cost:           100,
			Discount:       0,
			FinalPrice:     380,
			Deposit:        100,
			DeliveryDays:   3,
			SalespersonID:  sales2ID,
			CurrentApprover: &managerID,
			Remark:         "老客户，优先处理",
			CreatedAt:      now.AddDate(0, 0, -5),
			UpdatedAt:      now.AddDate(0, 0, -3),
		},
		{
			QuotationNo:    "Q202401200003",
			Type:           models.QuotationTypeCustom,
			Status:         models.QuotationStatusPending,
			CustomerID:     customer3ID,
			ProductName:    "情侣对戒定制",
			Description:    "客户定制一对婚戒，简约风格，内圈刻字",
			Material:       "18K玫瑰金",
			Weight:         6.5,
			EstimatedPrice: 12800,
			Cost:           7500,
			Discount:       800,
			FinalPrice:     12000,
			Deposit:        4000,
			DeliveryDays:   20,
			SalespersonID:  sales1ID,
			CurrentApprover: &managerID,
			Remark:         "本月结婚旺季促销价",
			CreatedAt:      now.AddDate(0, 0, -2),
			UpdatedAt:      now.AddDate(0, 0, -2),
		},
		{
			QuotationNo:    "Q202401220004",
			Type:           models.QuotationTypeTransfer,
			Status:         models.QuotationStatusRevising,
			CustomerID:     customer1ID,
			ProductID:      nil,
			ProductName:    "调货 - 翡翠吊坠",
			Description:    "客户需要冰种翡翠吊坠，从总店调货",
			Material:       "翡翠+18K金",
			Weight:         12.5,
			EstimatedPrice: 28000,
			Cost:           20000,
			Discount:       0,
			FinalPrice:     28000,
			Deposit:        10000,
			DeliveryDays:   7,
			SalespersonID:  sales2ID,
			Remark:         "价格需要再确认",
			CreatedAt:      now.AddDate(0, 0, -1),
			UpdatedAt:      now.AddDate(0, 0, -1),
		},
		{
			QuotationNo:    "Q202401230005",
			Type:           models.QuotationTypeCustom,
			Status:         models.QuotationStatusDraft,
			CustomerID:     customer2ID,
			ProductName:    "耳环定制",
			Description:    "钻石耳环，一对",
			Material:       "铂金",
			Weight:         2.8,
			EstimatedPrice: 8800,
			Cost:           5000,
			Discount:       0,
			FinalPrice:     8800,
			Deposit:        3000,
			DeliveryDays:   10,
			SalespersonID:  sales1ID,
			Remark:         "还在跟客户确认款式",
			CreatedAt:      now,
			UpdatedAt:      now,
		},
	}

	for _, q := range quotations {
		if err := db.Create(&q).Error; err != nil {
			return err
		}
	}

	approvalRecords := []models.ApprovalRecord{
		{
			QuotationID: 1,
			ApproverID:  managerID,
			Action:      "approve",
			OldStatus:   models.QuotationStatusPending,
			NewStatus:   models.QuotationStatusApproved,
			Comment:     "价格合理，同意",
			CreatedAt:   now.AddDate(0, 0, -25),
		},
		{
			QuotationID: 2,
			ApproverID:  managerID,
			Action:      "approve",
			OldStatus:   models.QuotationStatusPending,
			NewStatus:   models.QuotationStatusApproved,
			Comment:     "老客户，没问题",
			CreatedAt:   now.AddDate(0, 0, -3),
		},
		{
			QuotationID: 4,
			ApproverID:  managerID,
			Action:      "revise",
			OldStatus:   models.QuotationStatusPending,
			NewStatus:   models.QuotationStatusRevising,
			Comment:     "价格需要再跟总店确认后重新提交",
			CreatedAt:   now.AddDate(0, 0, -1),
		},
	}

	for _, record := range approvalRecords {
		if err := db.Create(&record).Error; err != nil {
			return err
		}
	}

	maintenances := []models.Maintenance{
		{
			MaintenanceNo:   "M202401010001",
			Type:            models.MaintenanceTypeCleaning,
			Status:          models.MaintenanceStatusCompleted,
			CustomerID:      customer1ID,
			ProductName:     "钻戒清洗保养",
			Description:     "日常清洗保养",
			Issues:          "有些灰尘",
			EstimatedPrice:  0,
			ActualPrice:     0,
			SalespersonID:   sales1ID,
			HandlerID:       &afterSalesID,
			QuotationID:     nil,
			Remark:          "VIP免费清洗",
			CreatedAt:       now.AddDate(0, 0, -20),
			UpdatedAt:       now.AddDate(0, 0, -19),
		},
		{
			MaintenanceNo:   "M202401100002",
			Type:            models.MaintenanceTypeRepair,
			Status:          models.MaintenanceStatusInProgress,
			CustomerID:      customer2ID,
			ProductName:     "项链维修",
			Description:     "项链断裂焊接",
			Issues:          "扣子处断裂",
			EstimatedPrice:  280,
			ActualPrice:     280,
			SalespersonID:   sales2ID,
			HandlerID:       &afterSalesID,
			Remark:          "需要返厂",
			CreatedAt:       now.AddDate(0, 0, -5),
			UpdatedAt:       now.AddDate(0, 0, -4),
		},
		{
			MaintenanceNo:   "M202401150003",
			Type:            models.MaintenanceTypeResize,
			Status:          models.MaintenanceStatusPickedUp,
			CustomerID:      customer3ID,
			ProductName:     "戒指改圈",
			Description:     "戒指圈口改大2号",
			Issues:          "圈口太小",
			EstimatedPrice:  380,
			ActualPrice:     380,
			SalespersonID:   sales1ID,
			HandlerID:       &afterSalesID,
			Remark:          "",
			CreatedAt:       now.AddDate(0, 0, -12),
			UpdatedAt:       now.AddDate(0, 0, -8),
		},
		{
			MaintenanceNo:   "M202401200004",
			Type:            models.MaintenanceTypePolishing,
			Status:          models.MaintenanceStatusPending,
			CustomerID:      customer1ID,
			ProductName:     "手镯抛光翻新",
			Description:     "黄金手镯抛光保养",
			Issues:          "表面有划痕",
			EstimatedPrice:  180,
			ActualPrice:     0,
			SalespersonID:   sales2ID,
			Remark:          "VIP客户免费",
			CreatedAt:       now.AddDate(0, 0, -2),
			UpdatedAt:       now.AddDate(0, 0, -2),
		},
		{
			MaintenanceNo:   "M202401220005",
			Type:            models.MaintenanceTypeStoneReset,
			Status:          models.MaintenanceStatusConfirmed,
			CustomerID:      customer2ID,
			ProductName:     "钻石加固",
			Description:     "主石松动需要加固",
			Issues:          "钻石松动",
			EstimatedPrice:  580,
			ActualPrice:     580,
			SalespersonID:   sales1ID,
			HandlerID:       &afterSalesID,
			Remark:          "高价值货品，注意留痕",
			CreatedAt:       now.AddDate(0, 0, -1),
			UpdatedAt:       now.AddDate(0, 0, -1),
		},
	}

	for _, m := range maintenances {
		if err := db.Create(&m).Error; err != nil {
			return err
		}
	}

	statusHistories := []models.StatusHistory{
		{
			Module:       "quotation",
			RecordID:     1,
			OldStatus:    "draft",
			NewStatus:    "pending",
			OperatorID:   sales1ID,
			OperatorName: "李导购",
			Comment:      "提交审批",
			CreatedAt:    now.AddDate(0, 0, -28),
		},
		{
			Module:       "quotation",
			RecordID:     1,
			OldStatus:    "pending",
			NewStatus:    "approved",
			OperatorID:   managerID,
			OperatorName: "张店长",
			Comment:      "价格合理，同意",
			CreatedAt:    now.AddDate(0, 0, -25),
		},
		{
			Module:       "quotation",
			RecordID:     1,
			OldStatus:    "approved",
			NewStatus:    "completed",
			OperatorID:   sales1ID,
			OperatorName: "李导购",
			Comment:      "客户已取货",
			CreatedAt:    now.AddDate(0, 0, -15),
		},
		{
			Module:       "quotation",
			RecordID:     4,
			OldStatus:    "draft",
			NewStatus:    "pending",
			OperatorID:   sales2ID,
			OperatorName: "王导购",
			Comment:      "提交审批",
			CreatedAt:    now.AddDate(0, 0, -2),
		},
		{
			Module:       "quotation",
			RecordID:     4,
			OldStatus:    "pending",
			NewStatus:    "revising",
			OperatorID:   managerID,
			OperatorName: "张店长",
			Comment:      "价格需要再跟总店确认后重新提交",
			CreatedAt:    now.AddDate(0, 0, -1),
		},
		{
			Module:       "maintenance",
			RecordID:     2,
			OldStatus:    "pending",
			NewStatus:    "confirmed",
			OperatorID:   afterSalesID,
			OperatorName: "赵售后",
			Comment:      "已确认，可以处理",
			CreatedAt:    now.AddDate(0, 0, -5),
		},
		{
			Module:       "maintenance",
			RecordID:     2,
			OldStatus:    "confirmed",
			NewStatus:    "in_progress",
			OperatorID:   afterSalesID,
			OperatorName: "赵售后",
			Comment:      "已返厂维修",
			CreatedAt:    now.AddDate(0, 0, -4),
		},
		{
			Module:       "maintenance",
			RecordID:     5,
			OldStatus:    "pending",
			NewStatus:    "confirmed",
			OperatorID:   afterSalesID,
			OperatorName: "赵售后",
			Comment:      "已安排师傅处理",
			CreatedAt:    now.AddDate(0, 0, -1),
		},
	}

	for _, h := range statusHistories {
		if err := db.Create(&h).Error; err != nil {
			return err
		}
	}

	return nil
}
