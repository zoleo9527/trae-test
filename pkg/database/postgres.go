package database

import (
	"camp-management/internal/model"
	"camp-management/internal/service"
	"camp-management/pkg/config"
	"fmt"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func NewPostgresDB(cfg *config.Config) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(cfg.DSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get sql DB: %w", err)
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	return db, nil
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&model.User{},
		&model.Camp{},
		&model.Room{},
		&model.Camper{},
		&model.Registration{},
		&model.Activity{},
		&model.Attendance{},
		&model.MedicalRecord{},
		&model.SupplyRequest{},
		&model.AuditLog{},
	)
}

func SeedDemoData(db *gorm.DB, authService *service.AuthService) error {
	var count int64
	db.Model(&model.User{}).Count(&count)
	if count > 0 {
		return nil
	}

	err := db.Transaction(func(tx *gorm.DB) error {
		hashedPassword, _ := authService.HashPassword("camp123456")

		users := []model.User{
			{
				Username: "director",
				Password: hashedPassword,
				Name:     "营地主任-张明",
				Role:     model.RoleDirector,
				Phone:    "13800138001",
				Email:    "director@camp.com",
			},
			{
				Username: "teacher1",
				Password: hashedPassword,
				Name:     "班务老师-李芳",
				Role:     model.RoleTeacher,
				Phone:    "13800138002",
				Email:    "teacher1@camp.com",
			},
			{
				Username: "teacher2",
				Password: hashedPassword,
				Name:     "班务老师-王强",
				Role:     model.RoleTeacher,
				Phone:    "13800138003",
				Email:    "teacher2@camp.com",
			},
			{
				Username: "logistics1",
				Password: hashedPassword,
				Name:     "后勤协调-赵伟",
				Role:     model.RoleLogistics,
				Phone:    "13800138004",
				Email:    "logistics@camp.com",
			},
		}

		for i := range users {
			if err := tx.Create(&users[i]).Error; err != nil {
				return err
			}
		}

		camp := model.Camp{
			Name:           "2024夏季探索游学营",
			Theme:          "户外探险与自然科学",
			Description:    "为期7天的户外探索营，包含登山、露营、自然观察等活动",
			Location:       "云南丽江户外基地",
			StartDate:      time.Date(2024, 7, 15, 8, 0, 0, 0, time.UTC),
			EndDate:        time.Date(2024, 7, 21, 18, 0, 0, 0, time.UTC),
			MaxCampers:     40,
			CurrentCampers: 12,
			Fee:            5800,
			Status:         model.CampStatusInProgress,
			CreatedBy:      users[0].ID,
		}
		if err := tx.Create(&camp).Error; err != nil {
			return err
		}

		camp2 := model.Camp{
			Name:           "2024科技创新夏令营",
			Theme:          "机器人编程与AI体验",
			Description:    "学习机器人编程，体验人工智能应用",
			Location:       "深圳科技园",
			StartDate:      time.Date(2024, 8, 1, 8, 0, 0, 0, time.UTC),
			EndDate:        time.Date(2024, 8, 7, 18, 0, 0, 0, time.UTC),
			MaxCampers:     30,
			CurrentCampers: 25,
			Fee:            6800,
			Status:         model.CampStatusOpen,
			CreatedBy:      users[0].ID,
		}
		if err := tx.Create(&camp2).Error; err != nil {
			return err
		}

		rooms := []model.Room{
			{CampID: camp.ID, RoomNumber: "101", Floor: 1, Type: model.RoomTypeStandard, Gender: model.RoomGenderMale, BedCount: 4, OccupiedBeds: 3},
			{CampID: camp.ID, RoomNumber: "102", Floor: 1, Type: model.RoomTypeStandard, Gender: model.RoomGenderMale, BedCount: 4, OccupiedBeds: 2},
			{CampID: camp.ID, RoomNumber: "201", Floor: 2, Type: model.RoomTypeStandard, Gender: model.RoomGenderFemale, BedCount: 4, OccupiedBeds: 4},
			{CampID: camp.ID, RoomNumber: "202", Floor: 2, Type: model.RoomTypeStandard, Gender: model.RoomGenderFemale, BedCount: 4, OccupiedBeds: 1},
			{CampID: camp.ID, RoomNumber: "301", Floor: 3, Type: model.RoomTypePremium, Gender: model.RoomGenderMixed, BedCount: 2, OccupiedBeds: 2},
		}
		for i := range rooms {
			if err := tx.Create(&rooms[i]).Error; err != nil {
				return err
			}
		}

		campers := []model.Camper{
			{
				CampID: camp.ID, Name: "陈小明", Gender: "男",
				BirthDate: time.Date(2012, 5, 10, 0, 0, 0, 0, time.UTC), Age: 12,
				IDCard: "110101201205101234", HealthNotes: "花粉过敏",
				DietaryNeeds: "不吃辣", EmergencyName: "陈建国", EmergencyPhone: "13900139001",
				Relationship: "父亲", Status: model.CamperStatusCheckedIn,
				RoomID: &rooms[0].ID, BedNumber: 1, CreatedBy: users[1].ID,
			},
			{
				CampID: camp.ID, Name: "李小华", Gender: "男",
				BirthDate: time.Date(2012, 8, 15, 0, 0, 0, 0, time.UTC), Age: 12,
				IDCard: "110101201208155678", HealthNotes: "哮喘，需随身携带药物",
				DietaryNeeds: "无", EmergencyName: "李美丽", EmergencyPhone: "13900139002",
				Relationship: "母亲", Status: model.CamperStatusCheckedIn,
				RoomID: &rooms[0].ID, BedNumber: 2, CreatedBy: users[1].ID,
			},
			{
				CampID: camp.ID, Name: "王小刚", Gender: "男",
				BirthDate: time.Date(2011, 3, 20, 0, 0, 0, 0, time.UTC), Age: 13,
				IDCard: "110101201103209012", HealthNotes: "无",
				DietaryNeeds: "素食", EmergencyName: "王建国", EmergencyPhone: "13900139003",
				Relationship: "父亲", Status: model.CamperStatusCheckedIn,
				RoomID: &rooms[0].ID, BedNumber: 3, CreatedBy: users[1].ID,
			},
			{
				CampID: camp.ID, Name: "张小红", Gender: "女",
				BirthDate: time.Date(2012, 11, 5, 0, 0, 0, 0, time.UTC), Age: 11,
				IDCard: "110101201211053456", HealthNotes: "心脏病，不能剧烈运动",
				DietaryNeeds: "无", EmergencyName: "张大明", EmergencyPhone: "13900139004",
				Relationship: "父亲", Status: model.CamperStatusRegistered,
				RoomID: &rooms[2].ID, BedNumber: 1, CreatedBy: users[1].ID,
			},
			{
				CampID: camp.ID, Name: "刘小美", Gender: "女",
				BirthDate: time.Date(2012, 2, 28, 0, 0, 0, 0, time.UTC), Age: 12,
				IDCard: "110101201202287890", HealthNotes: "无",
				DietaryNeeds: "海鲜过敏", EmergencyName: "刘建国", EmergencyPhone: "13900139005",
				Relationship: "父亲", Status: model.CamperStatusRegistered,
				RoomID: nil, CreatedBy: users[1].ID,
			},
			{
				CampID: camp.ID, Name: "赵小强", Gender: "男",
				BirthDate: time.Date(2013, 7, 1, 0, 0, 0, 0, time.UTC), Age: 11,
				IDCard: "110101201307012345", HealthNotes: "无",
				DietaryNeeds: "无", EmergencyName: "赵美丽", EmergencyPhone: "13900139006",
				Relationship: "母亲", Status: model.CamperStatusPending,
				RoomID: nil, CreatedBy: users[1].ID,
			},
		}
		for i := range campers {
			checkInTime := time.Now().AddDate(0, 0, -2)
			if campers[i].Status == model.CamperStatusCheckedIn {
				campers[i].CheckInTime = &checkInTime
			}
			if err := tx.Create(&campers[i]).Error; err != nil {
				return err
			}
		}

		registrations := []model.Registration{
			{
				CamperID: campers[0].ID, CampID: camp.ID,
				RegistrationNo: "REG202407001", Status: model.RegistrationStatusPaid,
				Amount: 5800, PaidAmount: 5800, PaymentMethod: "微信支付",
				PaymentTime: &[]time.Time{time.Now().AddDate(0, 0, -10)}[0],
				CreatedBy: users[1].ID,
			},
			{
				CamperID: campers[1].ID, CampID: camp.ID,
				RegistrationNo: "REG202407002", Status: model.RegistrationStatusPaid,
				Amount: 5800, PaidAmount: 5800, PaymentMethod: "支付宝",
				PaymentTime: &[]time.Time{time.Now().AddDate(0, 0, -8)}[0],
				CreatedBy: users[1].ID,
			},
			{
				CamperID: campers[3].ID, CampID: camp.ID,
				RegistrationNo: "REG202407004", Status: model.RegistrationStatusConfirmed,
				Amount: 5800, PaidAmount: 2900, PaymentMethod: "银行转账",
				CreatedBy: users[1].ID,
			},
			{
				CamperID: campers[4].ID, CampID: camp.ID,
				RegistrationNo: "REG202407005", Status: model.RegistrationStatusPending,
				Amount: 5800, PaidAmount: 0,
				CreatedBy: users[1].ID,
			},
		}
		for i := range registrations {
			if err := tx.Create(&registrations[i]).Error; err != nil {
				return err
			}
		}

		activities := []model.Activity{
			{
				CampID: camp.ID, Name: "开营仪式", Description: "营员报到与开营典礼",
				Location: "营地大礼堂", StartTime: time.Now().AddDate(0, 0, -2).Add(time.Hour*8),
				EndTime: time.Now().AddDate(0, 0, -2).Add(time.Hour*10),
				TeacherID: &users[1].ID, MaxParticipants: 40,
			},
			{
				CampID: camp.ID, Name: "户外登山", Description: "攀登基地附近山峰",
				Location: "玉龙雪山脚下", StartTime: time.Now().AddDate(0, 0, -1).Add(time.Hour*6),
				EndTime: time.Now().AddDate(0, 0, -1).Add(time.Hour*12),
				TeacherID: &users[2].ID, MaxParticipants: 20,
			},
			{
				CampID: camp.ID, Name: "自然观察", Description: "植物识别与标本制作",
				Location: "原始森林保护区", StartTime: time.Now().Add(time.Hour*8),
				EndTime: time.Now().Add(time.Hour*11),
				TeacherID: &users[1].ID, MaxParticipants: 30,
			},
		}
		for i := range activities {
			if err := tx.Create(&activities[i]).Error; err != nil {
				return err
			}
		}

		now := time.Now()
		attendances := []model.Attendance{
			{ActivityID: activities[0].ID, CamperID: campers[0].ID, Status: model.AttendancePresent, CheckedInAt: &now, CheckedBy: users[1].ID},
			{ActivityID: activities[0].ID, CamperID: campers[1].ID, Status: model.AttendancePresent, CheckedInAt: &now, CheckedBy: users[1].ID},
			{ActivityID: activities[0].ID, CamperID: campers[2].ID, Status: model.AttendancePresent, CheckedInAt: &now, CheckedBy: users[1].ID},
			{ActivityID: activities[0].ID, CamperID: campers[3].ID, Status: model.AttendanceLate, CheckedInAt: &now, CheckedBy: users[1].ID, Notes: "身体不适，稍晚到达"},
			{ActivityID: activities[1].ID, CamperID: campers[0].ID, Status: model.AttendancePresent, CheckedInAt: &now, CheckedBy: users[2].ID},
			{ActivityID: activities[1].ID, CamperID: campers[1].ID, Status: model.AttendanceLeave, CheckedBy: users[2].ID, Notes: "哮喘发作，请假休息"},
			{ActivityID: activities[1].ID, CamperID: campers[2].ID, Status: model.AttendancePresent, CheckedInAt: &now, CheckedBy: users[2].ID},
			{ActivityID: activities[1].ID, CamperID: campers[3].ID, Status: model.AttendanceAbsent, CheckedBy: users[2].ID, Notes: "心脏病，不适合剧烈运动"},
		}
		for i := range attendances {
			if err := tx.Create(&attendances[i]).Error; err != nil {
				return err
			}
		}

		medicalRecords := []model.MedicalRecord{
			{
				CamperID: campers[1].ID, ReportTime: time.Now().AddDate(0, 0, -1).Add(time.Hour*7),
				ReportedBy: users[1].ID, Symptoms: "哮喘发作，呼吸困难", Severity: model.MedicalSeverityModerate,
				Temperature: 36.8, Treatment: "使用沙丁胺醇气雾剂，卧床休息",
				Status: model.MedicalStatusResolved, ParentNotified: true,
				NotifyTime: &[]time.Time{time.Now().AddDate(0, 0, -1).Add(time.Hour*7)}[0],
				ResolvedAt: &[]time.Time{time.Now().AddDate(0, 0, -1).Add(time.Hour*9)}[0],
				ResolvedBy: &users[0].ID,
			},
			{
				CamperID: campers[3].ID, ReportTime: time.Now().AddDate(0, 0, -1).Add(time.Hour*14),
				ReportedBy: users[2].ID, Symptoms: "轻微擦伤，膝盖破皮", Severity: model.MedicalSeverityMinor,
				Temperature: 36.5, Treatment: "碘伏消毒，创可贴包扎",
				Status: model.MedicalStatusResolved, ParentNotified: false,
				ResolvedAt: &[]time.Time{time.Now().AddDate(0, 0, -1).Add(time.Hour*14).Add(time.Minute*15)}[0],
				ResolvedBy: &users[2].ID,
			},
			{
				CamperID: campers[2].ID, ReportTime: time.Now().Add(time.Hour * 2),
				ReportedBy: users[1].ID, Symptoms: "腹痛，腹泻", Severity: model.MedicalSeverityModerate,
				Temperature: 37.8, Treatment: "待观察",
				Status: model.MedicalStatusInProgress, ParentNotified: true,
				NotifyTime: &[]time.Time{time.Now().Add(time.Hour * 2)}[0],
			},
		}
		for i := range medicalRecords {
			if err := tx.Create(&medicalRecords[i]).Error; err != nil {
				return err
			}
		}

		supplies := []model.SupplyRequest{
			{
				CamperID: campers[1].ID, RequestedBy: users[1].ID,
				ItemName: "备用哮喘药物", Quantity: 1, Unit: "盒",
				Reason: "营员自带药物已用完", Status: model.SupplyStatusIssued,
				ApprovedBy: &users[3].ID, ApprovedAt: &[]time.Time{time.Now().AddDate(0, 0, -1).Add(time.Hour * 8)}[0],
				IssuedAt: &[]time.Time{time.Now().AddDate(0, 0, -1).Add(time.Hour * 9)}[0],
			},
			{
				CamperID: campers[2].ID, RequestedBy: users[1].ID,
				ItemName: "素食餐盒", Quantity: 3, Unit: "份",
				Reason: "营员为素食主义者", Status: model.SupplyStatusApproved,
				ApprovedBy: &users[3].ID, ApprovedAt: &[]time.Time{time.Now().Add(time.Hour * 10)}[0],
			},
			{
				CamperID: campers[4].ID, RequestedBy: users[2].ID,
				ItemName: "抗过敏药物", Quantity: 1, Unit: "盒",
				Reason: "营员海鲜过敏", Status: model.SupplyStatusPending,
			},
		}
		for i := range supplies {
			if err := tx.Create(&supplies[i]).Error; err != nil {
				return err
			}
		}

		return nil
	})

	return err
}
