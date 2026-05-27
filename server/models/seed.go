package models

import (
	"math/rand"
	"time"

	"golang.org/x/crypto/bcrypt"
)

func SeedData() {
	seedUsers()
	seedSites()
	seedDevices()
	seedPackages()
	seedMembers()
	seedMembershipOrders()
	seedRepairOrders()
	seedRefundRequests()
	seedActivities()
	seedActivityPushes()
}

func hashPassword(password string) string {
	hashed, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(hashed)
}

func seedUsers() {
	var count int64
	DB.Model(&User{}).Count(&count)
	if count > 0 {
		return
	}

	users := []User{
		{Username: "admin", Password: hashPassword("123456"), Role: "admin", Name: "张主管", Avatar: ""},
		{Username: "inspector", Password: hashPassword("123456"), Role: "inspector", Name: "李巡检", Avatar: ""},
		{Username: "service", Password: hashPassword("123456"), Role: "service", Name: "王客服", Avatar: ""},
	}
	DB.Create(&users)
}

func seedSites() {
	var count int64
	DB.Model(&Site{}).Count(&count)
	if count > 0 {
		return
	}

	sites := []Site{
		{Name: "朝阳路洗车点", Address: "朝阳区朝阳路100号", City: "北京", Status: "active", DeviceCount: 4, Manager: "赵经理", Phone: "13800138001"},
		{Name: "海淀中关村店", Address: "海淀区中关村大街50号", City: "北京", Status: "active", DeviceCount: 6, Manager: "钱经理", Phone: "13800138002"},
		{Name: "浦东张江店", Address: "浦东新区张江路200号", City: "上海", Status: "active", DeviceCount: 5, Manager: "孙经理", Phone: "13800138003"},
		{Name: "南山科技园店", Address: "南山区科技园路80号", City: "深圳", Status: "maintenance", DeviceCount: 3, Manager: "周经理", Phone: "13800138004"},
	}
	DB.Create(&sites)
}

func seedDevices() {
	var count int64
	DB.Model(&Device{}).Count(&count)
	if count > 0 {
		return
	}

	deviceTypes := []string{"high_pressure", "foam", "vacuum", "dryer"}
	statuses := []string{"normal", "normal", "normal", "warning", "fault"}
	names := map[string]string{
		"high_pressure": "高压水枪",
		"foam":          "泡沫机",
		"vacuum":        "吸尘器",
		"dryer":         "吹干机",
	}

	for siteID := 1; siteID <= 4; siteID++ {
		for i := 1; i <= 4; i++ {
			dtype := deviceTypes[rand.Intn(len(deviceTypes))]
			DB.Create(&Device{
				SiteID:          uint(siteID),
				DeviceNo:        string(rune(64+siteID)) + "-" + string(rune(48+i)),
				Name:            names[dtype],
				Type:            dtype,
				Status:          statuses[rand.Intn(len(statuses))],
				LastMaintenance: time.Now().AddDate(0, 0, -rand.Intn(30)),
				Location:        string(rune(65+i)) + "区",
			})
		}
	}
}

func seedPackages() {
	var count int64
	DB.Model(&MembershipPackage{}).Count(&count)
	if count > 0 {
		return
	}

	packages := []MembershipPackage{
		{Name: "月度会员", Duration: 30, Price: 99, OriginalPrice: 129, Description: "30天无限次基础洗车", Status: "active", SortOrder: 1},
		{Name: "季度会员", Duration: 90, Price: 249, OriginalPrice: 387, Description: "90天无限次基础洗车，赠3次精洗", Status: "active", SortOrder: 2},
		{Name: "年度会员", Duration: 365, Price: 899, OriginalPrice: 1548, Description: "365天无限次洗车，赠12次精洗+全车镀膜1次", Status: "active", SortOrder: 3},
		{Name: "终身会员", Duration: 36500, Price: 4999, OriginalPrice: 9999, Description: "终身免费洗车，所有项目8折", Status: "active", SortOrder: 4},
	}
	DB.Create(&packages)
}

func seedMembers() {
	var count int64
	DB.Model(&Member{}).Count(&count)
	if count > 0 {
		return
	}

	levels := []string{"normal", "silver", "gold", "platinum"}
	statuses := []string{"active", "active", "active", "expired", "frozen"}
	tagsOptions := []string{"新用户", "高消费", "经常退款", "设备敏感", "节假日活跃", "周末用户", "月卡老用户", "潜在流失"}

	names := []string{"张三", "李四", "王五", "赵六", "钱七", "孙八", "周九", "吴十",
		"郑十一", "王十二", "冯十三", "陈十四", "褚十五", "卫十六", "蒋十七", "沈十八"}

	for i := 1; i <= 50; i++ {
		level := levels[rand.Intn(len(levels))]
		tags := tagsOptions[rand.Intn(len(tagsOptions))] + "," + tagsOptions[rand.Intn(len(tagsOptions))]

		expireDays := rand.Intn(180) - 30
		if level == "platinum" {
			expireDays = rand.Intn(365) + 180
		}

		member := Member{
			Phone:              "138" + padZero(i, 8),
			Name:               names[rand.Intn(len(names))],
			Level:              level,
			Points:             rand.Intn(5000),
			Balance:            float64(rand.Intn(20000)) / 100,
			MembershipExpireAt: time.Now().AddDate(0, 0, expireDays),
			Tags:               tags,
			Status:             statuses[rand.Intn(len(statuses))],
			TotalOrders:        rand.Intn(100),
			TotalAmount:        float64(rand.Intn(500000)) / 100,
		}
		DB.Create(&member)
	}
}

func padZero(num, length int) string {
	result := string(rune(48 + num/10000000))
	for i := length - 2; i >= 0; i-- {
		result += string(rune(48 + (num/intPow(10, i))%10))
	}
	return result
}

func intPow(base, exp int) int {
	result := 1
	for i := 0; i < exp; i++ {
		result *= base
	}
	return result
}

func seedMembershipOrders() {
	var count int64
	DB.Model(&MembershipOrder{}).Count(&count)
	if count > 0 {
		return
	}

	statuses := []string{"pending", "paid", "paid", "paid", "refunded", "cancelled"}
	payments := []string{"wechat", "alipay", "card", "balance"}

	for i := 1; i <= 80; i++ {
		memberID := rand.Intn(50) + 1
		packageID := rand.Intn(4) + 1
		status := statuses[rand.Intn(len(statuses))]

		var pkg MembershipPackage
		DB.First(&pkg, packageID)

		order := MembershipOrder{
			MemberID:       uint(memberID),
			PackageID:      uint(packageID),
			OrderNo:        "ME" + time.Now().Format("20060102") + padZero(i, 6),
			Amount:         pkg.Price,
			PaymentMethod:  payments[rand.Intn(len(payments))],
			Status:         status,
			ExtendDuration: pkg.Duration,
			OperatorID:     1,
			Remark:         "系统自动续费",
		}
		if status == "paid" {
			t := time.Now().AddDate(0, 0, -rand.Intn(30))
			order.PaymentTime = &t
		}
		DB.Create(&order)
	}
}

func seedRepairOrders() {
	var count int64
	DB.Model(&RepairOrder{}).Count(&count)
	if count > 0 {
		return
	}

	statuses := []string{"pending", "processing", "processing", "resolved", "resolved", "rejected", "escalated"}
	priorities := []string{"low", "medium", "high", "urgent"}
	titles := []string{"高压水枪压力不足", "泡沫机不出泡沫", "吸尘器吸力不够", "吹干机不工作", "设备异响", "显示屏故障", "刷卡无反应", "水管漏水"}

	for i := 1; i <= 30; i++ {
		deviceID := rand.Intn(16) + 1
		status := statuses[rand.Intn(len(statuses))]
		handlerID := uint(2)

		order := RepairOrder{
			DeviceID:    uint(deviceID),
			ReporterID:  3,
			HandlerID:   &handlerID,
			Title:       titles[rand.Intn(len(titles))],
			Description: "客户反馈设备使用时出现异常，需要尽快处理。",
			Photos:      "[]",
			Priority:    priorities[rand.Intn(len(priorities))],
			Status:      status,
			Level:       rand.Intn(3) + 1,
			Remark:      "",
		}
		DB.Create(&order)

		DB.Create(&TicketLog{
			TicketType: "repair",
			TicketID:   uint(i),
			Action:     "create",
			OperatorID: 3,
			Remark:     "客服创建报修单",
			OldStatus:  "",
			NewStatus:  "pending",
		})

		if status != "pending" {
			DB.Create(&TicketLog{
				TicketType: "repair",
				TicketID:   uint(i),
				Action:     "process",
				OperatorID: 2,
				Remark:     "巡检员开始处理",
				OldStatus:  "pending",
				NewStatus:  "processing",
			})
		}
	}
}

func seedRefundRequests() {
	var count int64
	DB.Model(&RefundRequest{}).Count(&count)
	if count > 0 {
		return
	}

	statuses := []string{"pending", "pending", "approved", "approved", "rejected"}
	reasons := []string{"设备故障无法使用", "洗不干净要求退款", "多扣费", "服务态度差", "重复扣费"}

	for i := 1; i <= 20; i++ {
		memberID := rand.Intn(50) + 1
		status := statuses[rand.Intn(len(statuses))]
		reviewerID := uint(1)

		req := RefundRequest{
			MemberID:    uint(memberID),
			OrderNo:     "ME" + time.Now().Format("20060102") + padZero(i+100, 6),
			Amount:      float64(rand.Intn(5000))/100 + 10,
			Reason:      reasons[rand.Intn(len(reasons))],
			Evidence:    "[]",
			ApplicantID: 3,
			ReviewerID:  &reviewerID,
			Status:      status,
		}
		if status == "approved" {
			t := time.Now().AddDate(0, 0, -rand.Intn(10))
			req.RefundTime = &t
			req.ReviewOpinion = "情况属实，同意退款"
		} else if status == "rejected" {
			req.ReviewOpinion = "证据不足，驳回申请"
		}
		DB.Create(&req)
	}
}

func seedActivities() {
	var count int64
	DB.Model(&Activity{}).Count(&count)
	if count > 0 {
		return
	}

	activities := []Activity{
		{
			Name:         "新用户首充优惠",
			Type:         "coupon",
			Description:  "新用户首次充值满100送50优惠券",
			StartTime:    time.Now().AddDate(0, 0, -10),
			EndTime:      time.Now().AddDate(0, 1, 0),
			TargetTags:   "新用户",
			MinLevel:     "normal",
			CouponAmount: 50,
			Status:       "active",
			CreatorID:    1,
		},
		{
			Name:        "老会员续费8折",
			Type:        "discount",
			Description: "会员到期前7天续费享8折优惠",
			StartTime:   time.Now().AddDate(0, 0, -5),
			EndTime:     time.Now().AddDate(0, 0, 25),
			TargetTags:  "月卡老用户",
			MinLevel:    "silver",
			Discount:    0.8,
			Status:      "active",
			CreatorID:   1,
		},
		{
			Name:         "周末洗车特惠",
			Type:         "coupon",
			Description:  "周末到店洗车立减10元",
			StartTime:    time.Now().AddDate(0, 0, -3),
			EndTime:      time.Now().AddDate(0, 0, 30),
			TargetTags:   "周末用户",
			MinLevel:     "normal",
			CouponAmount: 10,
			Status:       "active",
			CreatorID:    1,
		},
		{
			Name:         "流失用户召回",
			Type:         "coupon",
			Description:  "30天未消费用户回归即送20元优惠券",
			StartTime:    time.Now().AddDate(0, 0, -1),
			EndTime:      time.Now().AddDate(0, 2, 0),
			TargetTags:   "潜在流失",
			MinLevel:     "normal",
			CouponAmount: 20,
			Status:       "pending",
			CreatorID:    1,
		},
	}
	DB.Create(&activities)
}

func seedActivityPushes() {
	var count int64
	DB.Model(&ActivityPush{}).Count(&count)
	if count > 0 {
		return
	}

	channels := []string{"sms", "push", "wechat"}
	readStatuses := []string{"unread", "unread", "read", "read", "read"}

	for i := 1; i <= 100; i++ {
		activityID := rand.Intn(4) + 1
		memberID := rand.Intn(50) + 1
		readStatus := readStatuses[rand.Intn(len(readStatuses))]

		push := ActivityPush{
			ActivityID: uint(activityID),
			MemberID:   uint(memberID),
			PushTime:   time.Now().AddDate(0, 0, -rand.Intn(15)),
			ReadStatus: readStatus,
			Channel:    channels[rand.Intn(len(channels))],
		}
		if readStatus == "read" {
			t := push.PushTime.Add(time.Duration(rand.Intn(72)) * time.Hour)
			push.ReadTime = &t
		}
		DB.Create(&push)
	}
}
