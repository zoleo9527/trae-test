package database

import (
	"log"
	"time"

	"github.com/google/uuid"
	"golf-range/pkg/models"
)

func SeedData() {
	var count int64
	DB.Model(&models.User{}).Count(&count)
	if count > 0 {
		log.Println("Data already seeded, skipping...")
		return
	}

	reception := models.User{
		Username: "reception",
		Password: "123456",
		Name:     "林晓雅",
		Role:     models.RoleReception,
	}
	DB.Create(&reception)

	coachManager := models.User{
		Username: "coach_manager",
		Password: "123456",
		Name:     "陈志强",
		Role:     models.RoleCoachManager,
	}
	DB.Create(&coachManager)

	venueManager := models.User{
		Username: "venue_manager",
		Password: "123456",
		Name:     "王美玲",
		Role:     models.RoleVenueManager,
	}
	DB.Create(&venueManager)

	coach1 := models.User{
		Username: "coach_zhang",
		Password: "123456",
		Name:     "张教练",
		Role:     models.RoleCoach,
	}
	DB.Create(&coach1)

	coach2 := models.User{
		Username: "coach_li",
		Password: "123456",
		Name:     "李教练",
		Role:     models.RoleCoach,
	}
	DB.Create(&coach2)

	member1 := models.Member{
		Name:        "刘建国",
		Phone:       "13800138001",
		Level:       "钻石会员",
		JoinDate:    time.Now().AddDate(-2, 0, 0),
		TotalSpent:  58600,
		TotalVisits: 128,
	}
	DB.Create(&member1)
	wallet1 := models.Wallet{
		MemberID:      member1.ID,
		Balance:       12580,
		TotalRecharged: 60000,
	}
	DB.Create(&wallet1)

	member2 := models.Member{
		Name:        "赵雪梅",
		Phone:       "13800138002",
		Level:       "金卡会员",
		JoinDate:    time.Now().AddDate(-1, 0, 0),
		TotalSpent:  18600,
		TotalVisits: 45,
	}
	DB.Create(&member2)
	wallet2 := models.Wallet{
		MemberID:      member2.ID,
		Balance:       2100,
		TotalRecharged: 20000,
	}
	DB.Create(&wallet2)

	member3 := models.Member{
		Name:        "孙大鹏",
		Phone:       "13800138003",
		Level:       "银卡会员",
		JoinDate:    time.Now().AddDate(0, -6, 0),
		TotalSpent:  6800,
		TotalVisits: 22,
	}
	DB.Create(&member3)
	wallet3 := models.Wallet{
		MemberID:      member3.ID,
		Balance:       150,
		TotalRecharged: 7000,
	}
	DB.Create(&wallet3)

	member4 := models.Member{
		Name:        "周文静",
		Phone:       "13800138004",
		Level:       "普通会员",
		JoinDate:    time.Now().AddDate(0, -1, 0),
		TotalSpent:  1200,
		TotalVisits: 5,
	}
	DB.Create(&member4)
	wallet4 := models.Wallet{
		MemberID:      member4.ID,
		Balance:       80,
		TotalRecharged: 1200,
	}
	DB.Create(&wallet4)

	bays := []models.Bay{
		{BayNumber: "A01", Type: "标准打位", Floor: 1, Status: "available", HourlyRate: 80},
		{BayNumber: "A02", Type: "标准打位", Floor: 1, Status: "available", HourlyRate: 80},
		{BayNumber: "A03", Type: "标准打位", Floor: 1, Status: "maintenance", HourlyRate: 80},
		{BayNumber: "B01", Type: "VIP打位", Floor: 2, Status: "available", HourlyRate: 180},
		{BayNumber: "B02", Type: "VIP打位", Floor: 2, Status: "available", HourlyRate: 180},
		{BayNumber: "C01", Type: "教学打位", Floor: 1, Status: "available", HourlyRate: 120},
		{BayNumber: "C02", Type: "教学打位", Floor: 1, Status: "available", HourlyRate: 120},
	}
	for i := range bays {
		DB.Create(&bays[i])
	}

	equipment := []models.Equipment{
		{Name: "泰勒梅一号木", Category: "球杆", Brand: "TaylorMade", SerialNumber: "TM-2024-001", Status: "available", Condition: "good", DailyRate: 50},
		{Name: "泰勒梅一号木", Category: "球杆", Brand: "TaylorMade", SerialNumber: "TM-2024-002", Status: "available", Condition: "good", DailyRate: 50},
		{Name: "Titleist 铁杆组", Category: "球杆", Brand: "Titleist", SerialNumber: "TS-2024-001", Status: "available", Condition: "good", DailyRate: 80},
		{Name: "Callaway 球包", Category: "球包", Brand: "Callaway", SerialNumber: "CW-2024-001", Status: "available", Condition: "fair", DailyRate: 30},
		{Name: "Titleist 球包", Category: "球包", Brand: "Titleist", SerialNumber: "TW-2024-001", Status: "in_use", Condition: "good", DailyRate: 35},
		{Name: "FootJoy 球鞋 42码", Category: "球鞋", Brand: "FootJoy", SerialNumber: "FJ-2024-001", Status: "available", Condition: "good", DailyRate: 20},
		{Name: "FootJoy 球鞋 41码", Category: "球鞋", Brand: "FootJoy", SerialNumber: "FJ-2024-002", Status: "available", Condition: "good", DailyRate: 20},
		{Name: "练习球桶(100球)", Category: "练习球", Brand: "Range", SerialNumber: "RB-2024-001", Status: "available", Condition: "new", DailyRate: 0},
	}
	for i := range equipment {
		DB.Create(&equipment[i])
	}

	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	schedules := []models.CoachSchedule{
		{
			CoachID: coach1.ID, CoachName: coach1.Name,
			Date: today, StartAt: today.Add(time.Hour * 9), EndAt: today.Add(time.Hour * 12),
			Type: "团体课", Status: "published", Capacity: 6, BookedCount: 4,
		},
		{
			CoachID: coach1.ID, CoachName: coach1.Name,
			Date: today, StartAt: today.Add(time.Hour * 14), EndAt: today.Add(time.Hour * 17),
			Type: "一对一", Status: "published", Capacity: 3, BookedCount: 2,
		},
		{
			CoachID: coach2.ID, CoachName: coach2.Name,
			Date: today, StartAt: today.Add(time.Hour * 10), EndAt: today.Add(time.Hour * 13),
			Type: "一对一", Status: "published", Capacity: 3, BookedCount: 3,
		},
		{
			CoachID: coach2.ID, CoachName: coach2.Name,
			Date: today.AddDate(0, 0, 1), StartAt: today.AddDate(0, 0, 1).Add(time.Hour * 9), EndAt: today.AddDate(0, 0, 1).Add(time.Hour * 12),
			Type: "新手入门", Status: "published", Capacity: 8, BookedCount: 2,
		},
	}
	for i := range schedules {
		DB.Create(&schedules[i])
	}

	booking1 := models.Booking{
		MemberID: member1.ID, BayID: bays[3].ID, CoachID: &coach1.ID, ScheduleID: &schedules[1].ID,
		MemberName: member1.Name, MemberPhone: member1.Phone, BayNumber: bays[3].BayNumber, CoachName: coach1.Name,
		StartAt: today.Add(time.Hour * 14), EndAt: today.Add(time.Hour * 16), DurationHours: 2,
		Status: models.BookingStatusCheckedIn, TotalAmount: 520, PaidAmount: 520, PaymentMethod: "wallet",
		GuestCount: 2, IncludeCoaching: true, OperatorID: reception.ID, OperatorName: reception.Name,
	}
	checkInTime := today.Add(time.Hour * 14).Add(time.Minute * 5)
	booking1.CheckInTime = &checkInTime
	DB.Create(&booking1)

	walletRecord1 := models.WalletRecord{
		WalletID: wallet1.ID, MemberID: member1.ID, BookingID: &booking1.ID,
		Type: "消费", Amount: -520, BalanceBefore: 13100, BalanceAfter: 12580,
		OperatorID: reception.ID, Remark: "VIP打位B01 + 张教练一对一教学 2小时",
	}
	DB.Create(&walletRecord1)

	rental1 := models.EquipmentRental{
		BookingID: booking1.ID, EquipmentID: equipment[1].ID, MemberID: member1.ID,
		EquipmentName: equipment[1].Name, RentedAt: today.Add(time.Hour * 14).Add(time.Minute * 10),
		ConditionOut: "good", Fee: 50, OperatorID: reception.ID,
	}
	DB.Create(&rental1)

	booking2 := models.Booking{
		MemberID: member2.ID, BayID: bays[0].ID,
		MemberName: member2.Name, MemberPhone: member2.Phone, BayNumber: bays[0].BayNumber,
		StartAt: today.Add(time.Hour * 10), EndAt: today.Add(time.Hour * 12), DurationHours: 2,
		Status: models.BookingStatusCompleted, TotalAmount: 160, PaidAmount: 160, PaymentMethod: "wallet",
		GuestCount: 1, IncludeCoaching: false, OperatorID: reception.ID, OperatorName: reception.Name,
	}
	checkIn2 := today.Add(time.Hour * 10).Add(time.Minute * -2)
	checkOut2 := today.Add(time.Hour * 12).Add(time.Minute * 30)
	booking2.CheckInTime = &checkIn2
	booking2.CheckOutTime = &checkOut2
	DB.Create(&booking2)

	walletRecord2 := models.WalletRecord{
		WalletID: wallet2.ID, MemberID: member2.ID, BookingID: &booking2.ID,
		Type: "消费", Amount: -160, BalanceBefore: 2260, BalanceAfter: 2100,
		OperatorID: reception.ID, Remark: "标准打位A01 2小时",
	}
	DB.Create(&walletRecord2)

	exception1 := models.Exception{
		BookingID: booking2.ID, ReportedByID: reception.ID, ReportedByName: reception.Name,
		Type: models.ExceptionTypeOverstay, Severity: models.SeverityLow, Status: models.ExceptionStatusOpen,
		Title: "超时停留30分钟未结算", Description: "客人赵雪梅预约10:00-12:00使用A01打位，12:30仍未离开也未续费。前台已提醒，客人表示再打一会儿但未办理续时。",
		CreatedAt: checkOut2, UpdatedAt: checkOut2,
	}
	DB.Create(&exception1)

	followUp1 := models.ExceptionFollowUp{
		ExceptionID: exception1.ID, OperatorID: reception.ID, OperatorName: reception.Name,
		Note: "12:35 第一次提醒客人超时，客人说再打10分钟就走", CreatedAt: checkOut2.Add(time.Minute * 5),
	}
	DB.Create(&followUp1)

	followUp2 := models.ExceptionFollowUp{
		ExceptionID: exception1.ID, OperatorID: reception.ID, OperatorName: reception.Name,
		Note: "12:50 第二次提醒，客人开始收拾东西", CreatedAt: checkOut2.Add(time.Minute * 20),
	}
	DB.Create(&followUp2)

	auditLog1 := models.AuditLog{
		BookingID: &booking2.ID, MemberID: &member2.ID,
		UserID: reception.ID, UserName: reception.Name,
		Action: "创建异常单", EntityType: "exception", EntityID: exception1.ID,
		OldValue: "无", NewValue: "超时停留30分钟",
	}
	DB.Create(&auditLog1)

	booking3 := models.Booking{
		MemberID: member3.ID, BayID: bays[1].ID,
		MemberName: member3.Name, MemberPhone: member3.Phone, BayNumber: bays[1].BayNumber,
		StartAt: today.Add(time.Hour * 9), EndAt: today.Add(time.Hour * 11), DurationHours: 2,
		Status: models.BookingStatusNoShow, TotalAmount: 160, PaidAmount: 0, PaymentMethod: "pending",
		GuestCount: 3, IncludeCoaching: false, OperatorID: reception.ID, OperatorName: reception.Name,
	}
	DB.Create(&booking3)

	exception2 := models.Exception{
		BookingID: booking3.ID, ReportedByID: reception.ID, ReportedByName: reception.Name,
		Type: models.ExceptionTypeNoShow, Severity: models.SeverityMedium, Status: models.ExceptionStatusInvestigating,
		Title: "预约未到且电话无法接通", Description: "客人孙大鹏预约9:00-11:00使用A02打位，9:30仍未到店。拨打预留电话13800138003三次均无法接通。已保留打位至10:00，如仍未到将按规定扣除违约金。",
		CreatedAt: today.Add(time.Hour * 9).Add(time.Minute * 30),
		UpdatedAt: today.Add(time.Hour * 9).Add(time.Minute * 30),
	}
	DB.Create(&exception2)

	followUp3 := models.ExceptionFollowUp{
		ExceptionID: exception2.ID, OperatorID: reception.ID, OperatorName: reception.Name,
		Note: "9:30 拨打会员电话，无人接听", CreatedAt: today.Add(time.Hour * 9).Add(time.Minute * 30),
	}
	DB.Create(&followUp3)

	followUp4 := models.ExceptionFollowUp{
		ExceptionID: exception2.ID, OperatorID: reception.ID, OperatorName: reception.Name,
		Note: "9:45 第二次拨打，仍无人接听，发送短信提醒", CreatedAt: today.Add(time.Hour * 9).Add(time.Minute * 45),
	}
	DB.Create(&followUp4)

	booking4 := models.Booking{
		MemberID: member4.ID, BayID: bays[5].ID, CoachID: &coach2.ID, ScheduleID: &schedules[2].ID,
		MemberName: member4.Name, MemberPhone: member4.Phone, BayNumber: bays[5].BayNumber, CoachName: coach2.Name,
		StartAt: today.Add(time.Hour * 11), EndAt: today.Add(time.Hour * 12), DurationHours: 1,
		Status: models.BookingStatusException, TotalAmount: 320, PaidAmount: 80, PaymentMethod: "wallet",
		GuestCount: 1, IncludeCoaching: true, OperatorID: reception.ID, OperatorName: reception.Name,
	}
	checkIn4 := today.Add(time.Hour * 11)
	checkOut4 := today.Add(time.Hour * 12)
	booking4.CheckInTime = &checkIn4
	booking4.CheckOutTime = &checkOut4
	DB.Create(&booking4)

	walletRecord3 := models.WalletRecord{
		WalletID: wallet4.ID, MemberID: member4.ID, BookingID: &booking4.ID,
		Type: "消费", Amount: -80, BalanceBefore: 160, BalanceAfter: 80,
		OperatorID: reception.ID, Remark: "教学打位C01 + 李教练教学 1小时（部分支付）",
	}
	DB.Create(&walletRecord3)

	exception3 := models.Exception{
		BookingID: booking4.ID, ReportedByID: coach2.ID, ReportedByName: coach2.Name,
		Type: models.ExceptionTypePaymentIssue, Severity: models.SeverityHigh, Status: models.ExceptionStatusOpen,
		Title: "储值余额不足，剩余240元未支付", Description: "客人周文静预约11:00-12:00教学打位C01含教练教学，总费用320元。储值卡扣款时发现余额仅有160元，扣除80元后剩余80元。客人表示今天没带够钱，剩下的240元下次来再付。已暂扣客人球包作为抵押。",
		CreatedAt: checkOut4, UpdatedAt: checkOut4, RefundAmount: 0, PenaltyAmount: 240,
	}
	DB.Create(&exception3)

	rental2 := models.EquipmentRental{
		BookingID: booking4.ID, EquipmentID: equipment[4].ID, MemberID: member4.ID,
		EquipmentName: equipment[4].Name, RentedAt: checkIn4, ReturnedAt: &checkOut4,
		ConditionOut: "good", ConditionIn: "damaged", DamageReported: true,
		DamageNote: "球包底部磨损严重，有一处5cm长的撕裂口", Fee: 35, OperatorID: reception.ID,
	}
	DB.Create(&rental2)

	exception4 := models.Exception{
		BookingID: booking4.ID, ReportedByID: reception.ID, ReportedByName: reception.Name,
		Type: models.ExceptionTypeEquipmentDamage, Severity: models.SeverityMedium, Status: models.ExceptionStatusOpen,
		Title: "租赁球包归还时发现破损", Description: "客人周文静归还租赁的Titleist球包时，前台检查发现球包底部有5cm长的新撕裂口。客人不承认是她造成的，说是租的时候就有。已调出租赁时的照片存档，需要进一步核实。",
		CreatedAt: checkOut4.Add(time.Minute * 5), UpdatedAt: checkOut4.Add(time.Minute * 5), PenaltyAmount: 300,
	}
	DB.Create(&exception4)

	followUp5 := models.ExceptionFollowUp{
		ExceptionID: exception4.ID, OperatorID: reception.ID, OperatorName: reception.Name,
		Note: "已调取租赁时的照片，照片显示球包底部完好，无撕裂口", CreatedAt: checkOut4.Add(time.Minute * 15),
	}
	DB.Create(&followUp5)

	booking5 := models.Booking{
		MemberID: member1.ID, BayID: bays[1].ID, CoachID: &coach2.ID, ScheduleID: &schedules[2].ID,
		MemberName: member1.Name, MemberPhone: member1.Phone, BayNumber: bays[1].BayNumber, CoachName: coach2.Name,
		StartAt: today.Add(time.Hour * 11), EndAt: today.Add(time.Hour * 12), DurationHours: 1,
		Status: models.BookingStatusException, TotalAmount: 280, PaidAmount: 280, PaymentMethod: "wallet",
		GuestCount: 1, IncludeCoaching: true, OperatorID: reception.ID, OperatorName: reception.Name,
	}
	DB.Create(&booking5)

	exception5 := models.Exception{
		BookingID: booking5.ID, ReportedByID: venueManager.ID, ReportedByName: venueManager.Name,
		Type: models.ExceptionTypeScheduleConflict, Severity: models.SeverityCritical, Status: models.ExceptionStatusResolved,
		Title: "教练排班冲突，钻石会员投诉", Description: "钻石会员刘建国先生11:00预约了李教练的一对一课程，到店后发现李教练正在给另一位客人上课。经核实，前台在录入时误将李教练已排满的时段再次开放预约。刘先生非常不满，要求立即安排其他教练并赔偿损失。",
		Resolution: "已紧急协调张教练代替李教练上课，并赠送刘先生2小时免费VIP打位券和一盒Titleist球作为补偿。已向客人诚恳道歉，客人表示接受。后续需要加强预约系统的时段冲突检查。",
		RefundAmount: 280, PenaltyAmount: 0, ResolvedByID: &venueManager.ID, ResolvedByName: venueManager.Name,
		CreatedAt: today.Add(time.Hour * 11).Add(time.Minute * 5), UpdatedAt: today.Add(time.Hour * 11).Add(time.Minute * 20),
	}
	resolvedAt := today.Add(time.Hour * 11).Add(time.Minute * 20)
	exception5.ResolvedAt = &resolvedAt
	DB.Create(&exception5)

	walletRecord4 := models.WalletRecord{
		WalletID: wallet1.ID, MemberID: member1.ID, BookingID: &booking5.ID,
		Type: "退款", Amount: 280, BalanceBefore: 12580, BalanceAfter: 12860,
		OperatorID: venueManager.ID, Remark: "教练排班冲突全额退款",
	}
	DB.Create(&walletRecord4)

	walletRecord5 := models.WalletRecord{
		WalletID: wallet1.ID, MemberID: member1.ID,
		Type: "补偿", Amount: 360, BalanceBefore: 12860, BalanceAfter: 13220,
		OperatorID: venueManager.ID, Remark: "教练排班冲突补偿：2小时VIP打位券(360元)",
	}
	DB.Create(&walletRecord5)

	booking6 := models.Booking{
		MemberID: member2.ID, BayID: bays[4].ID,
		MemberName: member2.Name, MemberPhone: member2.Phone, BayNumber: bays[4].BayNumber,
		StartAt: today.Add(time.Hour * 16), EndAt: today.Add(time.Hour * 18), DurationHours: 2,
		Status: models.BookingStatusConfirmed, TotalAmount: 360, PaidAmount: 0, PaymentMethod: "pending",
		GuestCount: 4, IncludeCoaching: false, OperatorID: reception.ID, OperatorName: reception.Name,
	}
	DB.Create(&booking6)

	exception6 := models.Exception{
		BookingID: booking1.ID, ReportedByID: reception.ID, ReportedByName: reception.Name,
		Type: models.ExceptionTypeComplaint, Severity: models.SeverityHigh, Status: models.ExceptionStatusInvestigating,
		Title: "VIP打位旁边有人大声喧哗，影响教学体验", Description: "正在VIP打位B01上课的刘建国先生投诉，隔壁B02打位的几位客人大声说笑，严重影响教学。刘先生是钻石会员，对练习场环境要求很高，已明确表示如果处理不好将考虑退卡。",
		CreatedAt: today.Add(time.Hour * 15).Add(time.Minute * 10), UpdatedAt: today.Add(time.Hour * 15).Add(time.Minute * 10),
	}
	DB.Create(&exception6)

	followUp6 := models.ExceptionFollowUp{
		ExceptionID: exception6.ID, OperatorID: coachManager.ID, OperatorName: coachManager.Name,
		Note: "15:15 已到B02打位礼貌提醒客人保持安静，客人表示抱歉并配合", CreatedAt: today.Add(time.Hour * 15).Add(time.Minute * 15),
	}
	DB.Create(&followUp6)

	followUp7 := models.ExceptionFollowUp{
		ExceptionID: exception6.ID, OperatorID: coachManager.ID, OperatorName: coachManager.Name,
		Note: "15:20 已向刘先生致歉，询问是否需要调换到更安静的位置，刘先生表示先观察看看", CreatedAt: today.Add(time.Hour * 15).Add(time.Minute * 20),
	}
	DB.Create(&followUp7)

	auditLog2 := models.AuditLog{
		BookingID: &booking1.ID, MemberID: &member1.ID,
		UserID: coachManager.ID, UserName: coachManager.Name,
		Action: "跟进投诉", EntityType: "exception", EntityID: exception6.ID,
		OldValue: "open", NewValue: "investigating",
	}
	DB.Create(&auditLog2)

	booking7 := models.Booking{
		MemberID: member3.ID, BayID: bays[2].ID,
		MemberName: member3.Name, MemberPhone: member3.Phone, BayNumber: bays[2].BayNumber,
		StartAt: today.AddDate(0, 0, 1).Add(time.Hour * 10), EndAt: today.AddDate(0, 0, 1).Add(time.Hour * 12), DurationHours: 2,
		Status: models.BookingStatusPending, TotalAmount: 160, PaidAmount: 0, PaymentMethod: "pending",
		GuestCount: 2, IncludeCoaching: false, OperatorID: reception.ID, OperatorName: reception.Name,
		Remark: "会员备注：A03打位的自动出球机上周就坏了，这次一定要修好",
	}
	DB.Create(&booking7)

	exception7 := models.Exception{
		BookingID: booking7.ID, ReportedByID: reception.ID, ReportedByName: reception.Name,
		Type: models.ExceptionTypeBayIssue, Severity: models.SeverityMedium, Status: models.ExceptionStatusOpen,
		Title: "A03打位自动出球机故障未修复", Description: "A03打位的自动出球机上周二就报过故障，工程部说三天内修好，但今天检查发现仍未修复。明天有会员预约了这个打位，需要尽快处理，否则可能引起投诉。",
		CreatedAt: now, UpdatedAt: now,
	}
	DB.Create(&exception7)

	log.Println("Seed data created successfully")
	log.Println("Test accounts:")
	log.Println("  前台: reception / 123456 (林晓雅)")
	log.Println("  教练主管: coach_manager / 123456 (陈志强)")
	log.Println("  场馆经理: venue_manager / 123456 (王美玲)")
	log.Println("  教练: coach_zhang / 123456 (张教练)")
}
