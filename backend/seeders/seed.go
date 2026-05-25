package seeders

import (
	"errors"
	"fmt"
	"gallery-system/database"
	"gallery-system/models"
	"time"

	"gorm.io/gorm"
)

func Seed() error {
	if err := seedUsers(); err != nil {
		return fmt.Errorf("seedUsers failed: %w", err)
	}

	if err := seedExhibits(); err != nil {
		return fmt.Errorf("seedExhibits failed: %w", err)
	}

	if err := seedActivities(); err != nil {
		return fmt.Errorf("seedActivities failed: %w", err)
	}

	if err := seedTickets(); err != nil {
		return fmt.Errorf("seedTickets failed: %w", err)
	}

	if err := seedRegistrations(); err != nil {
		return fmt.Errorf("seedRegistrations failed: %w", err)
	}

	return nil
}

func seedUsers() error {
	now := time.Now()
	nextYear := now.AddDate(1, 0, 0)

	users := []struct {
		username string
		user     models.User
	}{
		{
			username: "manager",
			user: models.User{
				Username: "manager",
				Name:     "张经理",
				Email:    "manager@gallery.com",
				Phone:    "13800000001",
				Role:     models.RoleManager,
				Status:   "active",
				IsMember: false,
				MemberNo: "NON-MEMBER-001",
			},
		},
		{
			username: "ticketing",
			user: models.User{
				Username: "ticketing",
				Name:     "李票务",
				Email:    "ticketing@gallery.com",
				Phone:    "13800000002",
				Role:     models.RoleTicketing,
				Status:   "active",
				IsMember: false,
				MemberNo: "NON-MEMBER-002",
			},
		},
		{
			username: "activities",
			user: models.User{
				Username: "activities",
				Name:     "王活动",
				Email:    "activities@gallery.com",
				Phone:    "13800000003",
				Role:     models.RoleActivities,
				Status:   "active",
				IsMember: false,
				MemberNo: "NON-MEMBER-003",
			},
		},
		{
			username: "member001",
			user: models.User{
				Username:     "member001",
				Name:         "会员张三",
				Email:        "zhangsan@email.com",
				Phone:        "13900001111",
				Role:         models.RoleManager,
				Status:       "active",
				IsMember:     true,
				MemberNo:     "MEM20240001",
				MemberLevel:  models.MemberLevelGold,
				MemberSince:  &now,
				MemberExpire: &nextYear,
			},
		},
		{
			username: "member002",
			user: models.User{
				Username:     "member002",
				Name:         "会员李四",
				Email:        "lisi@email.com",
				Phone:        "13900002222",
				Role:         models.RoleManager,
				Status:       "active",
				IsMember:     true,
				MemberNo:     "MEM20240002",
				MemberLevel:  models.MemberLevelSilver,
				MemberSince:  &now,
				MemberExpire: &nextYear,
			},
		},
		{
			username: "member003",
			user: models.User{
				Username:     "member003",
				Name:         "会员王五",
				Email:        "wangwu@email.com",
				Phone:        "13900003333",
				Role:         models.RoleManager,
				Status:       "active",
				IsMember:     true,
				MemberNo:     "MEM20240003",
				MemberLevel:  models.MemberLevelPlatinum,
				MemberSince:  &now,
				MemberExpire: &nextYear,
			},
		},
		{
			username: "nonmember01",
			user: models.User{
				Username: "nonmember01",
				Name:     "非会员赵六",
				Email:    "zhaoliu@email.com",
				Phone:    "13900004444",
				Role:     models.RoleManager,
				Status:   "active",
				IsMember: false,
				MemberNo: "NON-MEMBER-004",
			},
		},
	}

	for _, item := range users {
		var existing models.User
		result := database.DB.Where("username = ?", item.username).First(&existing)
		if result.Error != nil {
			if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
				return fmt.Errorf("query user %s failed: %w", item.username, result.Error)
			}
			item.user.HashPassword("123456")
			if err := database.DB.Create(&item.user).Error; err != nil {
				return fmt.Errorf("create user %s failed: %w", item.username, err)
			}
		} else {
			updates := map[string]interface{}{
				"name":       item.user.Name,
				"email":      item.user.Email,
				"phone":      item.user.Phone,
				"role":       item.user.Role,
				"status":     item.user.Status,
				"is_member":  item.user.IsMember,
				"member_no":  item.user.MemberNo,
			}
			if item.user.IsMember {
				updates["member_level"] = item.user.MemberLevel
				updates["member_since"] = item.user.MemberSince
				updates["member_expire"] = item.user.MemberExpire
			}
			if err := database.DB.Model(&existing).Updates(updates).Error; err != nil {
				return fmt.Errorf("update user %s failed: %w", item.username, err)
			}
		}
	}

	return nil
}

func seedExhibits() error {
	exhibits := []struct {
		exhibitNo string
		exhibit   models.Exhibit
	}{
		{
			exhibitNo: "EXH-2024-0001",
			exhibit: models.Exhibit{
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
		},
		{
			exhibitNo: "EXH-2024-0002",
			exhibit: models.Exhibit{
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
		},
		{
			exhibitNo: "EXH-2024-0003",
			exhibit: models.Exhibit{
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
		},
		{
			exhibitNo: "EXH-2024-0004",
			exhibit: models.Exhibit{
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
		},
		{
			exhibitNo: "EXH-2024-0005",
			exhibit: models.Exhibit{
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
		},
	}

	for _, item := range exhibits {
		var existing models.Exhibit
		result := database.DB.Where("exhibit_no = ?", item.exhibitNo).First(&existing)
		if result.Error != nil {
			if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
				return fmt.Errorf("query exhibit %s failed: %w", item.exhibitNo, result.Error)
			}
			if err := database.DB.Create(&item.exhibit).Error; err != nil {
				return fmt.Errorf("create exhibit %s failed: %w", item.exhibitNo, err)
			}
		} else {
			if err := database.DB.Model(&existing).Updates(models.Exhibit{
				Name:        item.exhibit.Name,
				Category:    item.exhibit.Category,
				Artist:      item.exhibit.Artist,
				Year:        item.exhibit.Year,
				Material:    item.exhibit.Material,
				Dimensions:  item.exhibit.Dimensions,
				Location:    item.exhibit.Location,
				Status:      item.exhibit.Status,
				Description: item.exhibit.Description,
			}).Error; err != nil {
				return fmt.Errorf("update exhibit %s failed: %w", item.exhibitNo, err)
			}
		}
	}

	return nil
}

func seedActivities() error {
	now := time.Now()

	activities := []struct {
		activityNo string
		activity   models.Activity
	}{
		{
			activityNo: "ACT2024001",
			activity: models.Activity{
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
		},
		{
			activityNo: "ACT2024002",
			activity: models.Activity{
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
		},
		{
			activityNo: "ACT2024003",
			activity: models.Activity{
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
		},
		{
			activityNo: "ACT2024004",
			activity: models.Activity{
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
		},
		{
			activityNo: "ACT2024005",
			activity: models.Activity{
				ActivityNo:        "ACT2024005",
				Title:             "【会员专属+需票】VIP馆藏鉴赏之夜",
				Type:              "VIP鉴赏",
				Description:       "白金会员专享：馆长亲自导览，观赏不对外开放的馆藏珍品，含专属纪念品。",
				Location:          "A馆VIP展厅",
				StartDate:         now.AddDate(0, 0, 10),
				EndDate:           now.AddDate(0, 0, 10).Add(2 * time.Hour),
				RegistrationStart: now,
				RegistrationEnd:   now.AddDate(0, 0, 8),
				MaxParticipants:   15,
				MinParticipants:   5,
				IsMemberOnly:      true,
				RequiresTicket:    true,
				TicketPrice:       299.00,
				Status:            models.ActivityPublished,
				CheckinStatus:     models.CheckinNotStarted,
				CreatedBy:         1,
				ManagedBy:         &([]uint{3}[0]),
			},
		},
		{
			activityNo: "ACT2024006",
			activity: models.Activity{
				ActivityNo:        "ACT2024006",
				Title:             "【会员专属+需票】大师书法工作坊",
				Type:              "大师工作坊",
				Description:       "邀请国家级书法大师亲临指导，会员专属深度体验，含作品装裱服务。",
				Location:          "B馆艺术教室",
				StartDate:         now.AddDate(0, 0, 17),
				EndDate:           now.AddDate(0, 0, 17).Add(3 * time.Hour),
				RegistrationStart: now,
				RegistrationEnd:   now.AddDate(0, 0, 15),
				MaxParticipants:   12,
				MinParticipants:   6,
				IsMemberOnly:      true,
				RequiresTicket:    true,
				TicketPrice:       199.00,
				Status:            models.ActivityPublished,
				CheckinStatus:     models.CheckinInProgress,
				CreatedBy:         1,
				ManagedBy:         &([]uint{3}[0]),
			},
		},
	}

	for _, item := range activities {
		var existing models.Activity
		result := database.DB.Where("activity_no = ?", item.activityNo).First(&existing)
		if result.Error != nil {
			if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
				return fmt.Errorf("query activity %s failed: %w", item.activityNo, result.Error)
			}
			if err := database.DB.Create(&item.activity).Error; err != nil {
				return fmt.Errorf("create activity %s failed: %w", item.activityNo, err)
			}
		} else {
			if err := database.DB.Model(&existing).Updates(models.Activity{
				Title:             item.activity.Title,
				Type:              item.activity.Type,
				Description:       item.activity.Description,
				Location:          item.activity.Location,
				StartDate:         item.activity.StartDate,
				EndDate:           item.activity.EndDate,
				RegistrationStart: item.activity.RegistrationStart,
				RegistrationEnd:   item.activity.RegistrationEnd,
				MaxParticipants:   item.activity.MaxParticipants,
				MinParticipants:   item.activity.MinParticipants,
				IsMemberOnly:      item.activity.IsMemberOnly,
				RequiresTicket:    item.activity.RequiresTicket,
				TicketPrice:       item.activity.TicketPrice,
				Status:            item.activity.Status,
				CheckinStatus:     item.activity.CheckinStatus,
				ManagedBy:         item.activity.ManagedBy,
			}).Error; err != nil {
				return fmt.Errorf("update activity %s failed: %w", item.activityNo, err)
			}
		}
	}

	return nil
}

func getUserIDByUsername(username string) (uint, error) {
	var user models.User
	if err := database.DB.Where("username = ?", username).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return 0, fmt.Errorf("user %s not found", username)
		}
		return 0, fmt.Errorf("query user %s failed: %w", username, err)
	}
	return user.ID, nil
}

func getActivityIDByNo(activityNo string) (uint, error) {
	var activity models.Activity
	if err := database.DB.Where("activity_no = ?", activityNo).First(&activity).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return 0, fmt.Errorf("activity %s not found", activityNo)
		}
		return 0, fmt.Errorf("query activity %s failed: %w", activityNo, err)
	}
	return activity.ID, nil
}

func getTicketIDByNo(ticketNo string) (uint, error) {
	var ticket models.Ticket
	if err := database.DB.Where("ticket_no = ?", ticketNo).First(&ticket).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return 0, fmt.Errorf("ticket %s not found", ticketNo)
		}
		return 0, fmt.Errorf("query ticket %s failed: %w", ticketNo, err)
	}
	return ticket.ID, nil
}

func seedTickets() error {
	now := time.Now()
	today := now.Format("2006-01-02")
	todayTime, _ := time.ParseInLocation("2006-01-02", today, time.Local)

	member1ID, err := getUserIDByUsername("member001")
	if err != nil {
		return err
	}
	member2ID, err := getUserIDByUsername("member002")
	if err != nil {
		return err
	}
	member3ID, err := getUserIDByUsername("member003")
	if err != nil {
		return err
	}
	activity1ID, err := getActivityIDByNo("ACT2024001")
	if err != nil {
		return err
	}
	activity5ID, err := getActivityIDByNo("ACT2024005")
	if err != nil {
		return err
	}
	activity6ID, err := getActivityIDByNo("ACT2024006")
	if err != nil {
		return err
	}

	tickets := []struct {
		ticketNo string
		ticket   models.Ticket
	}{
		{
			ticketNo: "TK-SEED-0001",
			ticket: models.Ticket{
				TicketNo:      "TK-SEED-0001",
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
		},
		{
			ticketNo: "TK-SEED-0002",
			ticket: models.Ticket{
				TicketNo:      "TK-SEED-0002",
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
		},
		{
			ticketNo: "TK-SEED-0003",
			ticket: models.Ticket{
				TicketNo:      "TK-SEED-0003",
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
		},
		{
			ticketNo: "TK-SEED-0004",
			ticket: models.Ticket{
				TicketNo:      "TK-SEED-0004",
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
		},
		{
			ticketNo: "TK-SEED-0005",
			ticket: models.Ticket{
				TicketNo:      "TK-SEED-0005",
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
				MemberID:      &member1ID,
				IssuedBy:      2,
				IssuedAt:      now,
			},
		},
		{
			ticketNo: "TK-SEED-0006",
			ticket: models.Ticket{
				TicketNo:      "TK-SEED-0006",
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
		},
		{
			ticketNo: "TK-SEED-0007",
			ticket: models.Ticket{
				TicketNo:      "TK-SEED-0007",
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
				ActivityID:    &activity1ID,
				IssuedBy:      2,
				IssuedAt:      now,
			},
		},
		{
			ticketNo: "TK-SEED-0008",
			ticket: models.Ticket{
				TicketNo:      "TK-SEED-0008",
				QrCode:        "qr-member-vip-008",
				Type:          models.TicketTypeMember,
				Price:         299.00,
				OriginalPrice: 299.00,
				VisitorName:   "会员张三",
				VisitorPhone:  "13900001111",
				VisitDate:     now.AddDate(0, 0, 10),
				ValidFrom:     now.AddDate(0, 0, 10),
				ValidTo:       now.AddDate(0, 0, 10).Add(24 * time.Hour),
				Status:        models.TicketStatusIssued,
				Channel:       "member-vip",
				MemberID:      &member1ID,
				ActivityID:    &activity5ID,
				IssuedBy:      2,
				IssuedAt:      now,
			},
		},
		{
			ticketNo: "TK-SEED-0009",
			ticket: models.Ticket{
				TicketNo:      "TK-SEED-0009",
				QrCode:        "qr-member-vip-009",
				Type:          models.TicketTypeMember,
				Price:         299.00,
				OriginalPrice: 299.00,
				VisitorName:   "会员李四",
				VisitorPhone:  "13900002222",
				VisitDate:     now.AddDate(0, 0, 10),
				ValidFrom:     now.AddDate(0, 0, 10),
				ValidTo:       now.AddDate(0, 0, 10).Add(24 * time.Hour),
				Status:        models.TicketStatusVerified,
				Channel:       "member-vip",
				MemberID:      &member2ID,
				ActivityID:    &activity5ID,
				IssuedBy:      2,
				IssuedAt:      now.Add(-1 * time.Hour),
				VerifiedBy:    &([]uint{3}[0]),
				VerifiedAt:    &([]time.Time{now.Add(-30 * time.Minute)}[0]),
				VerifyStation: "activity-registration",
			},
		},
		{
			ticketNo: "TK-SEED-0010",
			ticket: models.Ticket{
				TicketNo:      "TK-SEED-0010",
				QrCode:        "qr-member-workshop-010",
				Type:          models.TicketTypeMember,
				Price:         199.00,
				OriginalPrice: 199.00,
				VisitorName:   "会员王五",
				VisitorPhone:  "13900003333",
				VisitDate:     now.AddDate(0, 0, 17),
				ValidFrom:     now.AddDate(0, 0, 17),
				ValidTo:       now.AddDate(0, 0, 17).Add(24 * time.Hour),
				Status:        models.TicketStatusVerified,
				Channel:       "member-workshop",
				MemberID:      &member3ID,
				ActivityID:    &activity6ID,
				IssuedBy:      2,
				IssuedAt:      now.Add(-2 * time.Hour),
				VerifiedBy:    &([]uint{3}[0]),
				VerifiedAt:    &([]time.Time{now.Add(-1 * time.Hour)}[0]),
				VerifyStation: "activity-registration",
			},
		},
	}

	for _, item := range tickets {
		var existing models.Ticket
		result := database.DB.Where("ticket_no = ?", item.ticketNo).First(&existing)
		if result.Error != nil {
			if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
				return fmt.Errorf("query ticket %s failed: %w", item.ticketNo, result.Error)
			}
			if err := database.DB.Create(&item.ticket).Error; err != nil {
				return fmt.Errorf("create ticket %s failed: %w", item.ticketNo, err)
			}
		} else {
			updates := map[string]interface{}{
				"type":           item.ticket.Type,
				"price":          item.ticket.Price,
				"original_price": item.ticket.OriginalPrice,
				"visitor_name":   item.ticket.VisitorName,
				"visitor_phone":  item.ticket.VisitorPhone,
				"visit_date":     item.ticket.VisitDate,
				"valid_from":     item.ticket.ValidFrom,
				"valid_to":       item.ticket.ValidTo,
				"status":         item.ticket.Status,
				"channel":        item.ticket.Channel,
				"qr_code":        item.ticket.QrCode,
			}
			if item.ticket.MemberID != nil {
				updates["member_id"] = item.ticket.MemberID
			}
			if item.ticket.ActivityID != nil {
				updates["activity_id"] = item.ticket.ActivityID
			}
			if item.ticket.VisitorIDCard != "" {
				updates["visitor_id_card"] = item.ticket.VisitorIDCard
			}
			if item.ticket.OrderNo != "" {
				updates["order_no"] = item.ticket.OrderNo
			}
			if err := database.DB.Model(&existing).Updates(updates).Error; err != nil {
				return fmt.Errorf("update ticket %s failed: %w", item.ticketNo, err)
			}
		}
	}

	return nil
}

func seedRegistrations() error {
	now := time.Now()

	member1ID, err := getUserIDByUsername("member001")
	if err != nil {
		return err
	}
	member2ID, err := getUserIDByUsername("member002")
	if err != nil {
		return err
	}
	member3ID, err := getUserIDByUsername("member003")
	if err != nil {
		return err
	}
	activity1ID, err := getActivityIDByNo("ACT2024001")
	if err != nil {
		return err
	}
	activity2ID, err := getActivityIDByNo("ACT2024002")
	if err != nil {
		return err
	}
	activity4ID, err := getActivityIDByNo("ACT2024004")
	if err != nil {
		return err
	}
	activity5ID, err := getActivityIDByNo("ACT2024005")
	if err != nil {
		return err
	}
	activity6ID, err := getActivityIDByNo("ACT2024006")
	if err != nil {
		return err
	}
	ticket8ID, err := getTicketIDByNo("TK-SEED-0008")
	if err != nil {
		return err
	}
	ticket9ID, err := getTicketIDByNo("TK-SEED-0009")
	if err != nil {
		return err
	}
	ticket10ID, err := getTicketIDByNo("TK-SEED-0010")
	if err != nil {
		return err
	}

	registrations := []struct {
		registrationNo string
		registration   models.ActivityRegistration
	}{
		{
			registrationNo: "REG-SEED-001",
			registration: models.ActivityRegistration{
				RegistrationNo: "REG-SEED-001",
				ActivityID:     activity1ID,
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
		},
		{
			registrationNo: "REG-SEED-002",
			registration: models.ActivityRegistration{
				RegistrationNo: "REG-SEED-002",
				ActivityID:     activity1ID,
				MemberName:     "李四",
				MemberPhone:    "13900003333",
				MemberEmail:    "lisi@example.com",
				Participants:   1,
				Status:         models.RegistrationPending,
				RegisteredBy:   3,
				RegisteredAt:   now,
			},
		},
		{
			registrationNo: "REG-SEED-003",
			registration: models.ActivityRegistration{
				RegistrationNo: "REG-SEED-003",
				ActivityID:     activity1ID,
				MemberName:     "王五",
				MemberPhone:    "13900004444",
				MemberEmail:    "wangwu@example.com",
				Participants:   3,
				Status:         models.RegistrationWaitlist,
				RegisteredBy:   3,
				RegisteredAt:   now,
			},
		},
		{
			registrationNo: "REG-SEED-004",
			registration: models.ActivityRegistration{
				RegistrationNo: "REG-SEED-004",
				ActivityID:     activity2ID,
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
		},
		{
			registrationNo: "REG-SEED-005",
			registration: models.ActivityRegistration{
				RegistrationNo: "REG-SEED-005",
				ActivityID:     activity4ID,
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
		},
		{
			registrationNo: "REG-SEED-006",
			registration: models.ActivityRegistration{
				RegistrationNo: "REG-SEED-006",
				ActivityID:     activity4ID,
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
		},
		{
			registrationNo: "REG-SEED-007",
			registration: models.ActivityRegistration{
				RegistrationNo: "REG-SEED-007",
				ActivityID:     activity5ID,
				MemberID:       &member1ID,
				MemberName:     "会员张三",
				MemberPhone:    "13900001111",
				MemberEmail:    "zhangsan@email.com",
				Participants:   1,
				Status:         models.RegistrationPending,
				TicketID:       &ticket8ID,
				RegisteredBy:   3,
				RegisteredAt:   now,
			},
		},
		{
			registrationNo: "REG-SEED-008",
			registration: models.ActivityRegistration{
				RegistrationNo: "REG-SEED-008",
				ActivityID:     activity5ID,
				MemberID:       &member2ID,
				MemberName:     "会员李四",
				MemberPhone:    "13900002222",
				MemberEmail:    "lisi@email.com",
				Participants:   1,
				Status:         models.RegistrationConfirmed,
				TicketID:       &ticket9ID,
				RegisteredBy:   3,
				RegisteredAt:   now.Add(-1 * time.Hour),
				ConfirmedBy:    &([]uint{3}[0]),
				ConfirmedAt:    &([]time.Time{now.Add(-30 * time.Minute)}[0]),
			},
		},
		{
			registrationNo: "REG-SEED-009",
			registration: models.ActivityRegistration{
				RegistrationNo: "REG-SEED-009",
				ActivityID:     activity6ID,
				MemberID:       &member3ID,
				MemberName:     "会员王五",
				MemberPhone:    "13900003333",
				MemberEmail:    "wangwu@email.com",
				Participants:   1,
				Status:         models.RegistrationConfirmed,
				TicketID:       &ticket10ID,
				RegisteredBy:   3,
				RegisteredAt:   now.Add(-2 * time.Hour),
				ConfirmedBy:    &([]uint{3}[0]),
				ConfirmedAt:    &([]time.Time{now.Add(-1 * time.Hour)}[0]),
				CheckinTime:    &([]time.Time{now.Add(-15 * time.Minute)}[0]),
				CheckinBy:      &([]uint{3}[0]),
			},
		},
	}

	for _, item := range registrations {
		var existing models.ActivityRegistration
		result := database.DB.Where("registration_no = ?", item.registrationNo).First(&existing)
		if result.Error != nil {
			if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
				return fmt.Errorf("query registration %s failed: %w", item.registrationNo, result.Error)
			}
			if err := database.DB.Create(&item.registration).Error; err != nil {
				return fmt.Errorf("create registration %s failed: %w", item.registrationNo, err)
			}
		} else {
			updates := map[string]interface{}{
				"activity_id":  item.registration.ActivityID,
				"member_name":  item.registration.MemberName,
				"member_phone": item.registration.MemberPhone,
				"member_email": item.registration.MemberEmail,
				"participants": item.registration.Participants,
				"status":       item.registration.Status,
			}
			if item.registration.MemberID != nil {
				updates["member_id"] = item.registration.MemberID
			}
			if item.registration.TicketID != nil {
				updates["ticket_id"] = item.registration.TicketID
			}
			if item.registration.ConfirmedBy != nil {
				updates["confirmed_by"] = item.registration.ConfirmedBy
				updates["confirmed_at"] = item.registration.ConfirmedAt
			}
			if item.registration.CheckinBy != nil {
				updates["checkin_by"] = item.registration.CheckinBy
				updates["checkin_time"] = item.registration.CheckinTime
			}
			if err := database.DB.Model(&existing).Updates(updates).Error; err != nil {
				return fmt.Errorf("update registration %s failed: %w", item.registrationNo, err)
			}
		}
	}

	return nil
}
