package seeders

import (
	"gallery-system/database"
	"gallery-system/models"
	"time"
)

func Seed() error {
	if err := seedUsers(); err != nil {
		return err
	}

	if err := seedExhibits(); err != nil {
		return err
	}

	if err := seedActivities(); err != nil {
		return err
	}

	if err := seedTickets(); err != nil {
		return err
	}

	if err := seedRegistrations(); err != nil {
		return err
	}

	return nil
}

func seedUsers() error {
	var count int64
	database.DB.Model(&models.User{}).Count(&count)
	if count > 0 {
		return nil
	}

	users := []models.User{
		{
			Username: "manager",
			Name:     "张经理",
			Email:    "manager@gallery.com",
			Phone:    "13800000001",
			Role:     models.RoleManager,
			Status:   "active",
		},
		{
			Username: "ticketing",
			Name:     "李票务",
			Email:    "ticketing@gallery.com",
			Phone:    "13800000002",
			Role:     models.RoleTicketing,
			Status:   "active",
		},
		{
			Username: "activities",
			Name:     "王活动",
			Email:    "activities@gallery.com",
			Phone:    "13800000003",
			Role:     models.RoleActivities,
			Status:   "active",
		},
		{
			Username: "member001",
			Name:     "会员张三",
			Email:    "zhangsan@email.com",
			Phone:    "13900001111",
			Role:     models.RoleManager,
			Status:   "active",
		},
	}

	for i := range users {
		users[i].HashPassword("123456")
	}

	return database.DB.Create(&users).Error
}

func seedExhibits() error {
	var count int64
	database.DB.Model(&models.Exhibit{}).Count(&count)
	if count > 0 {
		return nil
	}

	exhibits := []models.Exhibit{
		{
			ExhibitNo:   "EXH-2024-0001",
			Name:        "清明上河图（复制品）",
			Category:    "国画",
			Artist:      "张择端",
			Year:        "北宋",
			Material:    "绢本设色",
			Dimensions:  "24.8x528.7cm",
			Location:    "A馆-01区",
			Status:      models.ExhibitOnDisplay,
			Description: "中国十大传世名画之一，生动记录了北宋汴京及汴河两岸的自然风光和繁荣景象。",
			CreatedBy:   1,
		},
		{
			ExhibitNo:   "EXH-2024-0002",
			Name:        "青花瓷瓶",
			Category:    "瓷器",
			Artist:      "佚名",
			Year:        "清代康熙",
			Material:    "瓷",
			Dimensions:  "高35cm",
			Location:    "B馆-03区",
			Status:      models.ExhibitOnDisplay,
			Description: "清代康熙年间典型青花瓷，釉色温润，画工精细。",
			CreatedBy:   1,
		},
		{
			ExhibitNo:   "EXH-2024-0003",
			Name:        "书法作品-兰亭序",
			Category:    "书法",
			Artist:      "王羲之（临摹）",
			Year:        "现代临摹",
			Material:    "纸本墨笔",
			Dimensions:  "68x136cm",
			Location:    "A馆-02区",
			Status:      models.ExhibitInStorage,
			Description: "临摹王羲之兰亭序，笔法流畅，气韵生动。",
			CreatedBy:   1,
		},
		{
			ExhibitNo:   "EXH-2024-0004",
			Name:        "玉雕观音像",
			Category:    "玉器",
			Artist:      "佚名",
			Year:        "明代",
			Material:    "和田白玉",
			Dimensions:  "高18cm",
			Location:    "C馆-库房",
			Status:      models.ExhibitInStorage,
			Description: "明代和田白玉雕观音像，玉质温润，雕工精湛。",
			CreatedBy:   1,
		},
		{
			ExhibitNo:   "EXH-2024-0005",
			Name:        "油画-山水印象",
			Category:    "油画",
			Artist:      "徐悲鸿风格",
			Year:        "2020",
			Material:    "布面油画",
			Dimensions:  "80x100cm",
			Location:    "外借-XX美术馆",
			Status:      models.ExhibitOnLoan,
			Description: "现代印象派山水画作品，色彩丰富，意境深远。",
			CreatedBy:   1,
		},
	}

	for i := range exhibits {
		now := time.Now()
		exhibits[i].CreatedAt = now
		exhibits[i].UpdatedAt = now
	}

	return database.DB.Create(&exhibits).Error
}

func seedActivities() error {
	var count int64
	database.DB.Model(&models.Activity{}).Count(&count)
	if count > 0 {
		return nil
	}

	now := time.Now()
	activities := []models.Activity{
		{
			ActivityNo:        "ACT2024001",
			Title:             "2024春季艺术鉴赏会",
			Type:              "鉴赏会",
			Description:       "邀请专家现场解读馆藏精品，深入了解艺术背后的故事。",
			Location:          "A馆多功能厅",
			StartDate:         now.AddDate(0, 0, 7),
			EndDate:           now.AddDate(0, 0, 7).Add(3 * time.Hour),
			RegistrationStart: now,
			RegistrationEnd:   now.AddDate(0, 0, 5),
			MaxParticipants:   50,
			MinParticipants:   10,
			IsMemberOnly:      false,
			RequiresTicket:    true,
			TicketPrice:       99.00,
			Status:            models.ActivityPublished,
			CheckinStatus:     models.CheckinNotStarted,
			CreatedBy:         1,
			ManagedBy:         &([]uint{3}[0]),
		},
		{
			ActivityNo:        "ACT2024002",
			Title:             "亲子绘画工作坊",
			Type:              "工作坊",
			Description:       "专业美术老师指导，亲子共同完成一幅画作，增进亲子感情。",
			Location:          "B馆教育中心",
			StartDate:         now.AddDate(0, 0, 14),
			EndDate:           now.AddDate(0, 0, 14).Add(2 * time.Hour),
			RegistrationStart: now,
			RegistrationEnd:   now.AddDate(0, 0, 12),
			MaxParticipants:   30,
			MinParticipants:   10,
			IsMemberOnly:      false,
			RequiresTicket:    true,
			TicketPrice:       128.00,
			Status:            models.ActivityPublished,
			CheckinStatus:     models.CheckinNotStarted,
			CreatedBy:         1,
			ManagedBy:         &([]uint{3}[0]),
		},
		{
			ActivityNo:        "ACT2024003",
			Title:             "会员专属：青花瓷制作体验",
			Type:              "体验活动",
			Description:       "会员专享活动，亲手体验青花瓷拉坯、绘画等传统工艺。",
			Location:          "C馆工坊",
			StartDate:         now.AddDate(0, 0, 21),
			EndDate:           now.AddDate(0, 0, 21).Add(4 * time.Hour),
			RegistrationStart: now,
			RegistrationEnd:   now.AddDate(0, 0, 18),
			MaxParticipants:   20,
			MinParticipants:   5,
			IsMemberOnly:      true,
			RequiresTicket:    false,
			TicketPrice:       0,
			Status:            models.ActivityDraft,
			CheckinStatus:     models.CheckinNotStarted,
			CreatedBy:         1,
			ManagedBy:         &([]uint{3}[0]),
		},
		{
			ActivityNo:        "ACT2024004",
			Title:             "书法艺术讲座",
			Type:              "讲座",
			Description:       "邀请知名书法家分享书法艺术的魅力与学习心得。",
			Location:          "A馆报告厅",
			StartDate:         now.AddDate(0, 0, -3),
			EndDate:           now.AddDate(0, 0, -3).Add(2 * time.Hour),
			RegistrationStart: now.AddDate(0, 0, -10),
			RegistrationEnd:   now.AddDate(0, 0, -5),
			MaxParticipants:   100,
			MinParticipants:   20,
			IsMemberOnly:      false,
			RequiresTicket:    false,
			TicketPrice:       0,
			Status:            models.ActivityEnded,
			CheckinStatus:     models.CheckinCompleted,
			CreatedBy:         1,
			ManagedBy:         &([]uint{3}[0]),
		},
	}

	for i := range activities {
		activities[i].CreatedAt = now
		activities[i].UpdatedAt = now
	}

	return database.DB.Create(&activities).Error
}

func seedTickets() error {
	var count int64
	database.DB.Model(&models.Ticket{}).Count(&count)
	if count > 0 {
		return nil
	}

	now := time.Now()
	today := now.Format("2006-01-02")
	todayTime, _ := time.ParseInLocation("2006-01-02", today, time.Local)

	tickets := []models.Ticket{
		{
			TicketNo:      "TK" + time.Now().Format("20060102") + "0001",
			QrCode:        "qr-ticket-normal-001",
			Type:          models.TicketTypeAdult,
			Price:         80.00,
			OriginalPrice: 80.00,
			VisitorName:   "张三",
			VisitorPhone:  "13800138001",
			VisitorIDCard: "110101199001010001",
			VisitDate:     todayTime,
			ValidFrom:     todayTime,
			ValidTo:       todayTime.Add(24 * time.Hour),
			Status:        models.TicketStatusIssued,
			Channel:       "onsite",
			IssuedBy:      2,
			IssuedAt:      now,
		},
		{
			TicketNo:      "TK" + time.Now().Format("20060102") + "0002",
			QrCode:        "qr-ticket-normal-002",
			Type:          models.TicketTypeStudent,
			Price:         40.00,
			OriginalPrice: 80.00,
			VisitorName:   "李四",
			VisitorPhone:  "13800138002",
			VisitorIDCard: "110101199505050002",
			VisitDate:     todayTime,
			ValidFrom:     todayTime,
			ValidTo:       todayTime.Add(24 * time.Hour),
			Status:        models.TicketStatusVerified,
			Channel:       "online",
			IssuedBy:      2,
			IssuedAt:      now.Add(-2 * time.Hour),
			VerifiedBy:    &([]uint{2}[0]),
			VerifiedAt:    &([]time.Time{now.Add(-1 * time.Hour)}[0]),
			VerifyStation: "入口A",
		},
		{
			TicketNo:      "TK" + time.Now().Format("20060102") + "0003",
			QrCode:        "qr-ticket-expired-003",
			Type:          models.TicketTypeAdult,
			Price:         80.00,
			OriginalPrice: 80.00,
			VisitorName:   "王五",
			VisitorPhone:  "13800138003",
			VisitorIDCard: "110101198803030003",
			VisitDate:     now.AddDate(0, 0, -7),
			ValidFrom:     now.AddDate(0, 0, -7),
			ValidTo:       now.AddDate(0, 0, -6),
			Status:        models.TicketStatusExpired,
			Channel:       "online",
			IssuedBy:      2,
			IssuedAt:      now.AddDate(0, 0, -10),
		},
		{
			TicketNo:      "TK" + time.Now().Format("20060102") + "0004",
			QrCode:        "qr-ticket-refunded-004",
			Type:          models.TicketTypeGroup,
			Price:         400.00,
			OriginalPrice: 400.00,
			VisitorName:   "某公司团建",
			VisitorPhone:  "13800138004",
			VisitDate:     todayTime,
			ValidFrom:     todayTime,
			ValidTo:       todayTime.Add(24 * time.Hour),
			Status:        models.TicketStatusRefunded,
			Channel:       "corporate",
			OrderNo:       "ORD202405200001",
			IssuedBy:      2,
			IssuedAt:      now.AddDate(0, 0, -5),
		},
		{
			TicketNo:      "TK" + time.Now().Format("20060102") + "0005",
			QrCode:        "qr-ticket-member-005",
			Type:          models.TicketTypeMember,
			Price:         0.00,
			OriginalPrice: 80.00,
			VisitorName:   "会员张三",
			VisitorPhone:  "13900001111",
			VisitDate:     todayTime,
			ValidFrom:     todayTime,
			ValidTo:       todayTime.Add(24 * time.Hour),
			Status:        models.TicketStatusIssued,
			Channel:       "member",
			MemberID:      &([]uint{4}[0]),
			IssuedBy:      2,
			IssuedAt:      now,
		},
		{
			TicketNo:      "TK" + time.Now().Format("20060102") + "0006",
			QrCode:        "qr-ticket-senior-006",
			Type:          models.TicketTypeSenior,
			Price:         0.00,
			OriginalPrice: 80.00,
			VisitorName:   "陈爷爷",
			VisitorPhone:  "13800138006",
			VisitorIDCard: "110101195010100006",
			VisitDate:     todayTime,
			ValidFrom:     todayTime,
			ValidTo:       todayTime.Add(24 * time.Hour),
			Status:        models.TicketStatusVerified,
			Channel:       "onsite",
			IssuedBy:      2,
			IssuedAt:      now.Add(-3 * time.Hour),
			VerifiedBy:    &([]uint{2}[0]),
			VerifiedAt:    &([]time.Time{now.Add(-2 * time.Hour)}[0]),
			VerifyStation: "入口B",
		},
		{
			TicketNo:      "TK" + time.Now().Format("20060102") + "0007",
			QrCode:        "qr-ticket-activity-007",
			Type:          models.TicketTypeAdult,
			Price:         99.00,
			OriginalPrice: 99.00,
			VisitorName:   "活动参与者A",
			VisitorPhone:  "13800138007",
			VisitDate:     now.AddDate(0, 0, 7),
			ValidFrom:     now.AddDate(0, 0, 7),
			ValidTo:       now.AddDate(0, 0, 7).Add(24 * time.Hour),
			Status:        models.TicketStatusIssued,
			Channel:       "activity",
			ActivityID:    &([]uint{1}[0]),
			IssuedBy:      2,
			IssuedAt:      now,
		},
	}

	for i := range tickets {
		tickets[i].CreatedAt = now
		tickets[i].UpdatedAt = now
	}

	return database.DB.Create(&tickets).Error
}

func seedRegistrations() error {
	var count int64
	database.DB.Model(&models.ActivityRegistration{}).Count(&count)
	if count > 0 {
		return nil
	}

	now := time.Now()

	registrations := []models.ActivityRegistration{
		{
			RegistrationNo: "REG" + time.Now().Format("20060102") + "001",
			ActivityID:     1,
			MemberName:     "张三",
			MemberPhone:    "13900002222",
			MemberEmail:    "zhangsan@example.com",
			Participants:   2,
			Status:         models.RegistrationConfirmed,
			RegisteredBy:   3,
			RegisteredAt:   now.AddDate(0, 0, -1),
			ConfirmedBy:    &([]uint{3}[0]),
			ConfirmedAt:    &([]time.Time{now.AddDate(0, 0, -1)}[0]),
		},
		{
			RegistrationNo: "REG" + time.Now().Format("20060102") + "002",
			ActivityID:     1,
			MemberName:     "李四",
			MemberPhone:    "13900003333",
			MemberEmail:    "lisi@example.com",
			Participants:   1,
			Status:         models.RegistrationPending,
			RegisteredBy:   3,
			RegisteredAt:   now,
		},
		{
			RegistrationNo: "REG" + time.Now().Format("20060102") + "003",
			ActivityID:     1,
			MemberName:     "王五",
			MemberPhone:    "13900004444",
			MemberEmail:    "wangwu@example.com",
			Participants:   3,
			Status:         models.RegistrationWaitlist,
			RegisteredBy:   3,
			RegisteredAt:   now,
		},
		{
			RegistrationNo: "REG" + time.Now().Format("20060102") + "004",
			ActivityID:     2,
			MemberName:     "赵六家庭",
			MemberPhone:    "13900005555",
			MemberEmail:    "zhaoliu@example.com",
			Participants:   2,
			Status:         models.RegistrationConfirmed,
			RegisteredBy:   3,
			RegisteredAt:   now.AddDate(0, 0, -2),
			ConfirmedBy:    &([]uint{3}[0]),
			ConfirmedAt:    &([]time.Time{now.AddDate(0, 0, -2)}[0]),
		},
		{
			RegistrationNo: "REG" + time.Now().Format("20060102") + "005",
			ActivityID:     4,
			MemberName:     "孙七",
			MemberPhone:    "13900006666",
			MemberEmail:    "sunqi@example.com",
			Participants:   1,
			Status:         models.RegistrationConfirmed,
			RegisteredBy:   3,
			RegisteredAt:   now.AddDate(0, 0, -8),
			ConfirmedBy:    &([]uint{3}[0]),
			ConfirmedAt:    &([]time.Time{now.AddDate(0, 0, -8)}[0]),
			CheckinTime:    &([]time.Time{now.AddDate(0, 0, -3)}[0]),
			CheckinBy:      &([]uint{3}[0]),
		},
		{
			RegistrationNo: "REG" + time.Now().Format("20060102") + "006",
			ActivityID:     4,
			MemberName:     "周八",
			MemberPhone:    "13900007777",
			MemberEmail:    "zhouba@example.com",
			Participants:   2,
			Status:         models.RegistrationCancelled,
			RegisteredBy:   3,
			RegisteredAt:   now.AddDate(0, 0, -9),
			ConfirmedBy:    &([]uint{3}[0]),
			ConfirmedAt:    &([]time.Time{now.AddDate(0, 0, -9)}[0]),
		},
	}

	for i := range registrations {
		registrations[i].CreatedAt = now
		registrations[i].UpdatedAt = now
	}

	return database.DB.Create(&registrations).Error
}
