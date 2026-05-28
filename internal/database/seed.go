package database

import (
	"camp-system/internal/model"
	"log"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var (
	CampID         = uuid.New().String()
	DirectorID     = uuid.New().String()
	Teacher1ID     = uuid.New().String()
	Teacher2ID     = uuid.New().String()
	LogisticsID    = uuid.New().String()
	MedicalID      = uuid.New().String()
	AdminID        = uuid.New().String()
	Activity1ID    = uuid.New().String()
	Activity2ID    = uuid.New().String()
	Activity3ID    = uuid.New().String()
	Room1ID        = uuid.New().String()
	Room2ID        = uuid.New().String()
	Room3ID        = uuid.New().String()
	Room4ID        = uuid.New().String()
	Camper1ID      = uuid.New().String()
	Camper2ID      = uuid.New().String()
	Camper3ID      = uuid.New().String()
	Camper4ID      = uuid.New().String()
	Camper5ID      = uuid.New().String()
	Camper6ID      = uuid.New().String()
	Medical1ID     = uuid.New().String()
	Medical2ID     = uuid.New().String()
	FollowUp1ID    = uuid.New().String()
	FollowUp2ID    = uuid.New().String()
	Material1ID    = uuid.New().String()
	Material2ID    = uuid.New().String()
	Material3ID    = uuid.New().String()
	Material4ID    = uuid.New().String()
	CheckIn1ID     = uuid.New().String()
	CheckInAbnormalID = uuid.New().String()
)

func SeedData() error {
	log.Println("开始初始化演示数据...")

	DB.Exec("DELETE FROM operation_logs")
	DB.Exec("DELETE FROM status_histories")
	DB.Exec("DELETE FROM check_in_medical_links")
	DB.Exec("DELETE FROM follow_up_histories")
	DB.Exec("DELETE FROM follow_ups")
	DB.Exec("DELETE FROM material_issues")
	DB.Exec("DELETE FROM material_items")
	DB.Exec("DELETE FROM medical_reports")
	DB.Exec("DELETE FROM check_ins")
	DB.Exec("DELETE FROM activities")
	DB.Exec("DELETE FROM room_change_logs")
	DB.Exec("DELETE FROM room_assignments")
	DB.Exec("DELETE FROM campers")
	DB.Exec("DELETE FROM rooms")
	DB.Exec("DELETE FROM camps")
	DB.Exec("DELETE FROM user_login_logs")
	DB.Exec("DELETE FROM users")

	if err := seedUsers(); err != nil {
		return err
	}

	if err := seedCamp(); err != nil {
		return err
	}

	if err := seedRooms(); err != nil {
		return err
	}

	if err := seedCampers(); err != nil {
		return err
	}

	if err := seedActivities(); err != nil {
		return err
	}

	if err := seedCheckIns(); err != nil {
		return err
	}

	if err := seedMedicalReports(); err != nil {
		return err
	}

	if err := seedFollowUps(); err != nil {
		return err
	}

	if err := seedRoomChangeLogs(); err != nil {
		return err
	}

	if err := seedMaterials(); err != nil {
		return err
	}

	if err := seedStatusHistories(); err != nil {
		return err
	}

	if err := seedOperationLogs(); err != nil {
		return err
	}

	log.Println("演示数据初始化完成！")
	return nil
}

func hashPassword(password string) string {
	hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(hash)
}

func seedUsers() error {
	users := []model.User{
		{
			BaseModel:    model.BaseModel{ID: DirectorID},
			Username:     "director",
			PasswordHash: hashPassword("123456"),
			Name:         "张明",
			Role:         model.RoleDirector,
			Phone:        "13800000001",
			Email:        "director@camp.com",
			Status:       "active",
			CampIDs:      []string{CampID},
		},
		{
			BaseModel:    model.BaseModel{ID: Teacher1ID},
			Username:     "teacher1",
			PasswordHash: hashPassword("123456"),
			Name:         "李红",
			Role:         model.RoleTeacher,
			Phone:        "13800000002",
			Email:        "teacher1@camp.com",
			Status:       "active",
			CampIDs:      []string{CampID},
		},
		{
			BaseModel:    model.BaseModel{ID: Teacher2ID},
			Username:     "teacher2",
			PasswordHash: hashPassword("123456"),
			Name:         "王芳",
			Role:         model.RoleTeacher,
			Phone:        "13800000003",
			Email:        "teacher2@camp.com",
			Status:       "active",
			CampIDs:      []string{CampID},
		},
		{
			BaseModel:    model.BaseModel{ID: LogisticsID},
			Username:     "logistics",
			PasswordHash: hashPassword("123456"),
			Name:         "赵强",
			Role:         model.RoleLogistics,
			Phone:        "13800000004",
			Email:        "logistics@camp.com",
			Status:       "active",
			CampIDs:      []string{CampID},
		},
		{
			BaseModel:    model.BaseModel{ID: MedicalID},
			Username:     "medical",
			PasswordHash: hashPassword("123456"),
			Name:         "陈医生",
			Role:         model.RoleMedical,
			Phone:        "13800000005",
			Email:        "medical@camp.com",
			Status:       "active",
			CampIDs:      []string{CampID},
		},
		{
			BaseModel:    model.BaseModel{ID: AdminID},
			Username:     "admin",
			PasswordHash: hashPassword("123456"),
			Name:         "系统管理员",
			Role:         model.RoleAdmin,
			Phone:        "13800000000",
			Email:        "admin@camp.com",
			Status:       "active",
			CampIDs:      []string{CampID},
		},
	}

	for _, user := range users {
		user.CreatedBy = AdminID
		user.UpdatedBy = AdminID
		if err := DB.FirstOrCreate(&user, "id = ?", user.ID).Error; err != nil {
			return err
		}
	}
	return nil
}

func seedCamp() error {
	camp := &model.Camp{
		BaseModel:  model.BaseModel{ID: CampID},
		Name:       "2024暑期探索夏令营",
		Theme:      "科技与自然",
		Location:   "青山营地",
		StartDate:  time.Date(2024, 7, 15, 0, 0, 0, 0, time.Local),
		EndDate:    time.Date(2024, 7, 29, 0, 0, 0, 0, time.Local),
		MaxCampers: 50,
		Status:     model.CampStatusActive,
		Description: "为期两周的夏令营活动，包含科技探索、户外拓展、自然观察等多种活动。培养孩子的团队协作能力和探索精神。",
		DirectorID:  DirectorID,
	}
	camp.CreatedBy = AdminID
	camp.UpdatedBy = AdminID

	return DB.FirstOrCreate(camp, "id = ?", camp.ID).Error
}

func seedRooms() error {
	rooms := []model.Room{
		{
			BaseModel:  model.BaseModel{ID: Room1ID},
			CampID:     CampID,
			Floor:      2,
			Building:   "A栋",
			RoomNumber: "201",
			BedCount:   4,
			UsedBeds:   2,
			GenderType: model.GenderTypeMale,
			Status:     model.RoomStatusPartial,
			TeacherID:  Teacher1ID,
			Beds: []model.Bed{
				{Number: 1, Occupied: true, CamperID: Camper1ID},
				{Number: 2, Occupied: true, CamperID: Camper2ID},
				{Number: 3, Occupied: false},
				{Number: 4, Occupied: false},
			},
			Remark: "男生宿舍，靠近楼梯",
		},
		{
			BaseModel:  model.BaseModel{ID: Room2ID},
			CampID:     CampID,
			Floor:      2,
			Building:   "A栋",
			RoomNumber: "202",
			BedCount:   4,
			UsedBeds:   3,
			GenderType: model.GenderTypeFemale,
			Status:     model.RoomStatusPartial,
			TeacherID:  Teacher2ID,
			Beds: []model.Bed{
				{Number: 1, Occupied: true, CamperID: Camper4ID},
				{Number: 2, Occupied: true, CamperID: Camper5ID},
				{Number: 3, Occupied: true, CamperID: Camper3ID},
				{Number: 4, Occupied: false},
			},
			Remark: "女生宿舍，含1名调房男生",
		},
		{
			BaseModel:  model.BaseModel{ID: Room3ID},
			CampID:     CampID,
			Floor:      2,
			Building:   "A栋",
			RoomNumber: "203",
			BedCount:   4,
			UsedBeds:   0,
			GenderType: model.GenderTypeMixed,
			Status:     model.RoomStatusAvailable,
			TeacherID:  Teacher1ID,
			Beds: []model.Bed{
				{Number: 1, Occupied: false},
				{Number: 2, Occupied: false},
				{Number: 3, Occupied: false},
				{Number: 4, Occupied: false},
			},
			Remark: "混合宿舍，原住客已转隔离房",
		},
		{
			BaseModel:  model.BaseModel{ID: Room4ID},
			CampID:     CampID,
			Floor:      3,
			Building:   "A栋",
			RoomNumber: "301",
			BedCount:   4,
			UsedBeds:   1,
			GenderType: model.GenderTypeMixed,
			Status:     model.RoomStatusPartial,
			Beds: []model.Bed{
				{Number: 1, Occupied: true, CamperID: Camper6ID},
				{Number: 2, Occupied: false},
				{Number: 3, Occupied: false},
				{Number: 4, Occupied: false},
			},
			Remark: "临时隔离房间",
		},
	}

	for _, room := range rooms {
		room.CreatedBy = LogisticsID
		room.UpdatedBy = LogisticsID
		if err := DB.FirstOrCreate(&room, "id = ?", room.ID).Error; err != nil {
			return err
		}
	}
	return nil
}

func seedCampers() error {
	campers := []model.Camper{
		{
			BaseModel:        model.BaseModel{ID: Camper1ID},
			CampID:           CampID,
			Status:           model.CamperStatusCheckedIn,
			Name:             "周小宇",
			EnglishName:      "Tom",
			Gender:           model.GenderMale,
			BirthDate:        time.Date(2012, 5, 10, 0, 0, 0, 0, time.Local),
			IdCard:           "310101201205101234",
			Nationality:      "中国",
			Phone:            "13900000001",
			School:           "上海市第一小学",
			Grade:            "五年级",
			RoomID:           Room1ID,
			BedNumber:        1,
			CheckInTime:      &[]time.Time{time.Date(2024, 7, 15, 9, 0, 0, 0, time.Local)}[0],
			Tags:             []string{"优秀", "体育特长"},
			TeacherID:        Teacher1ID,
			ParentName:       "周建国",
			ParentPhone:      "13900000011",
			ParentEmail:      "zhou@example.com",
			ParentRelation:   "父亲",
			EmergencyName:    "李阿姨",
			EmergencyPhone:   "13900000012",
			EmergencyRelation: "邻居",
			Allergies:        "无",
			Medications:      "无",
			MedicalHistory:   "无",
			Dietary:          "无特殊要求",
			SpecialNeeds:     "无",
			InsuranceCompany: "平安保险",
			InsuranceNumber:  "PA202400012345",
			RegFormFilled:    true,
			Paid:             true,
			Amount:           5800,
			PaidAt:           &[]time.Time{time.Date(2024, 6, 1, 0, 0, 0, 0, time.Local)}[0],
			Remark:           "性格开朗，善于沟通",
		},
		{
			BaseModel:        model.BaseModel{ID: Camper2ID},
			CampID:           CampID,
			Status:           model.CamperStatusCheckedIn,
			Name:             "陈浩",
			EnglishName:      "Leo",
			Gender:           model.GenderMale,
			BirthDate:        time.Date(2013, 3, 15, 0, 0, 0, 0, time.Local),
			IdCard:           "310101201303152345",
			Nationality:      "中国",
			School:           "上海市第二小学",
			Grade:            "四年级",
			RoomID:           Room1ID,
			BedNumber:        2,
			CheckInTime:      &[]time.Time{time.Date(2024, 7, 15, 9, 15, 0, 0, time.Local)}[0],
			Tags:             []string{"安静", "爱阅读"},
			TeacherID:        Teacher1ID,
			ParentName:       "陈大明",
			ParentPhone:      "13900000021",
			ParentEmail:      "chen@example.com",
			ParentRelation:   "父亲",
			EmergencyName:    "王女士",
			EmergencyPhone:   "13900000022",
			EmergencyRelation: "母亲",
			Allergies:        "青霉素过敏",
			Medications:      "无",
			MedicalHistory:   "哮喘史（已控制）",
			Dietary:          "海鲜过敏",
			SpecialNeeds:     "需随身携带哮喘喷雾",
			InsuranceCompany: "太平洋保险",
			InsuranceNumber:  "CP202400023456",
			RegFormFilled:    true,
			Paid:             true,
			Amount:           5800,
			PaidAt:           &[]time.Time{time.Date(2024, 6, 5, 0, 0, 0, 0, time.Local)}[0],
			Remark:           "有哮喘史，需特别注意",
		},
		{
			BaseModel:        model.BaseModel{ID: Camper3ID},
			CampID:           CampID,
			Status:           model.CamperStatusCheckedIn,
			Name:             "吴小杰",
			EnglishName:      "Jack",
			Gender:           model.GenderMale,
			BirthDate:        time.Date(2012, 8, 20, 0, 0, 0, 0, time.Local),
			IdCard:           "310101201208203456",
			Nationality:      "中国",
			School:           "上海市第三小学",
			Grade:            "五年级",
			RoomID:           Room2ID,
			BedNumber:        3,
			CheckInTime:      &[]time.Time{time.Date(2024, 7, 15, 9, 30, 0, 0, time.Local)}[0],
			Tags:             []string{"调皮", "动手能力强"},
			TeacherID:        Teacher1ID,
			ParentName:       "吴大伟",
			ParentPhone:      "13900000031",
			ParentEmail:      "wu@example.com",
			ParentRelation:   "父亲",
			EmergencyName:    "刘女士",
			EmergencyPhone:   "13900000032",
			EmergencyRelation: "母亲",
			Allergies:        "无",
			Medications:      "无",
			MedicalHistory:   "2023年阑尾炎手术",
			Dietary:          "无特殊要求",
			SpecialNeeds:     "无",
			InsuranceCompany: "中国人寿",
			InsuranceNumber:  "CL202400034567",
			RegFormFilled:    true,
			Paid:             true,
			Amount:           5800,
			PaidAt:           &[]time.Time{time.Date(2024, 6, 10, 0, 0, 0, 0, time.Local)}[0],
			Remark:           "",
		},
		{
			BaseModel:        model.BaseModel{ID: Camper4ID},
			CampID:           CampID,
			Status:           model.CamperStatusCheckedIn,
			Name:             "林小雨",
			EnglishName:      "Lily",
			Gender:           model.GenderFemale,
			BirthDate:        time.Date(2012, 11, 5, 0, 0, 0, 0, time.Local),
			IdCard:           "310101201211054567",
			Nationality:      "中国",
			School:           "上海市第一小学",
			Grade:            "五年级",
			RoomID:           Room2ID,
			BedNumber:        1,
			CheckInTime:      &[]time.Time{time.Date(2024, 7, 15, 10, 0, 0, 0, time.Local)}[0],
			Tags:             []string{"文艺", "舞蹈"},
			TeacherID:        Teacher2ID,
			ParentName:       "林先生",
			ParentPhone:      "13900000041",
			ParentEmail:      "lin@example.com",
			ParentRelation:   "父亲",
			EmergencyName:    "张女士",
			EmergencyPhone:   "13900000042",
			EmergencyRelation: "母亲",
			Allergies:        "花粉过敏",
			Medications:      "抗过敏药",
			MedicalHistory:   "过敏性鼻炎",
			Dietary:          "素食",
			SpecialNeeds:     "花粉季节需注意",
			InsuranceCompany: "平安保险",
			InsuranceNumber:  "PA202400045678",
			RegFormFilled:    true,
			Paid:             true,
			Amount:           5800,
			PaidAt:           &[]time.Time{time.Date(2024, 6, 15, 0, 0, 0, 0, time.Local)}[0],
			Remark:           "文艺骨干",
		},
		{
			BaseModel:        model.BaseModel{ID: Camper5ID},
			CampID:           CampID,
			Status:           model.CamperStatusCheckedIn,
			Name:             "郑小琪",
			EnglishName:      "Alice",
			Gender:           model.GenderFemale,
			BirthDate:        time.Date(2013, 1, 25, 0, 0, 0, 0, time.Local),
			IdCard:           "310101201301255678",
			Nationality:      "中国",
			School:           "上海市第二小学",
			Grade:            "四年级",
			RoomID:           Room2ID,
			BedNumber:        2,
			CheckInTime:      &[]time.Time{time.Date(2024, 7, 15, 10, 15, 0, 0, time.Local)}[0],
			Tags:             []string{"学习好", "数学特长"},
			TeacherID:        Teacher2ID,
			ParentName:       "郑先生",
			ParentPhone:      "13900000051",
			ParentEmail:      "zheng@example.com",
			ParentRelation:   "父亲",
			EmergencyName:    "王女士",
			EmergencyPhone:   "13900000052",
			EmergencyRelation: "母亲",
			Allergies:        "无",
			Medications:      "无",
			MedicalHistory:   "无",
			Dietary:          "无特殊要求",
			SpecialNeeds:     "无",
			InsuranceCompany: "太平洋保险",
			InsuranceNumber:  "CP202400056789",
			RegFormFilled:    true,
			Paid:             true,
			Amount:           5800,
			PaidAt:           &[]time.Time{time.Date(2024, 6, 20, 0, 0, 0, 0, time.Local)}[0],
			Remark:           "数学成绩优秀",
		},
		{
			BaseModel:        model.BaseModel{ID: Camper6ID},
			CampID:           CampID,
			Status:           model.CamperStatusCheckedIn,
			Name:             "孙小乐",
			EnglishName:      "Joy",
			Gender:           model.GenderFemale,
			BirthDate:        time.Date(2012, 6, 18, 0, 0, 0, 0, time.Local),
			IdCard:           "310101201206186789",
			Nationality:      "中国",
			School:           "上海市第四小学",
			Grade:            "五年级",
			RoomID:           Room4ID,
			BedNumber:        1,
			CheckInTime:      &[]time.Time{time.Date(2024, 7, 15, 10, 30, 0, 0, time.Local)}[0],
			Tags:             []string{"活泼", "体育好"},
			TeacherID:        Teacher1ID,
			ParentName:       "孙女士",
			ParentPhone:      "13900000061",
			ParentEmail:      "sun@example.com",
			ParentRelation:   "母亲",
			EmergencyName:    "李先生",
			EmergencyPhone:   "13900000062",
			EmergencyRelation: "父亲",
			Allergies:        "芒果过敏",
			Medications:      "无",
			MedicalHistory:   "2023年骨折",
			Dietary:          "芒果过敏",
			SpecialNeeds:     "无",
			InsuranceCompany: "中国人寿",
			InsuranceNumber:  "CL202400067890",
			RegFormFilled:    true,
			Paid:             true,
			Amount:           5800,
			PaidAt:           &[]time.Time{time.Date(2024, 6, 25, 0, 0, 0, 0, time.Local)}[0],
			Remark:           "芒果过敏，需注意饮食",
		},
	}

	for _, camper := range campers {
		camper.CreatedBy = DirectorID
		camper.UpdatedBy = DirectorID
		if err := DB.FirstOrCreate(&camper, "id = ?", camper.ID).Error; err != nil {
			return err
		}
	}
	return nil
}

func seedActivities() error {
	activities := []model.Activity{
		{
			BaseModel:       model.BaseModel{ID: Activity1ID},
			CampID:          CampID,
			Name:            "晨间晨练",
			Description:     "每日早晨7:00-7:45进行晨练活动，包括跑步、拉伸等",
			Location:        "操场",
			StartTime:       time.Date(2024, 7, 16, 7, 0, 0, 0, time.Local),
			EndTime:         time.Date(2024, 7, 16, 7, 45, 0, 0, time.Local),
			Status:          model.ActivityStatusCompleted,
			TeacherID:       Teacher1ID,
			MaxParticipants: 50,
			NeedEquipment:   false,
			Remark:          "每日例行活动",
		},
		{
			BaseModel:       model.BaseModel{ID: Activity2ID},
			CampID:          CampID,
			Name:            "户外徒步",
			Description:     "前往附近山区进行徒步活动，全程约5公里",
			Location:        "青山步道",
			StartTime:       time.Date(2024, 7, 17, 8, 30, 0, 0, time.Local),
			EndTime:         time.Date(2024, 7, 17, 12, 0, 0, 0, time.Local),
			Status:          model.ActivityStatusCompleted,
			TeacherID:       Teacher1ID,
			MaxParticipants: 30,
			NeedEquipment:   true,
			EquipmentList:   []string{"登山鞋", "水壶", "遮阳帽"},
			Remark:          "注意防晒，需穿运动鞋",
		},
		{
			BaseModel:       model.BaseModel{ID: Activity3ID},
			CampID:          CampID,
			Name:            "科技工坊",
			Description:     "学习机器人编程和3D打印基础",
			Location:        "科技教室",
			StartTime:       time.Date(2024, 7, 18, 14, 0, 0, 0, time.Local),
			EndTime:         time.Date(2024, 7, 18, 17, 0, 0, 0, time.Local),
			Status:          model.ActivityStatusOngoing,
			TeacherID:       Teacher2ID,
			MaxParticipants: 20,
			NeedEquipment:   true,
			EquipmentList:   []string{"笔记本电脑", "机器人套件"},
			Remark:          "请提前安装编程软件",
		},
	}

	for _, activity := range activities {
		activity.CreatedBy = DirectorID
		activity.UpdatedBy = DirectorID
		if err := DB.FirstOrCreate(&activity, "id = ?", activity.ID).Error; err != nil {
			return err
		}
	}
	return nil
}

func seedCheckIns() error {
	now := time.Now()
	checkIns := []model.CheckIn{
		{
			BaseModel:    model.BaseModel{ID: CheckIn1ID},
			ActivityID:   Activity1ID,
			CamperID:     Camper1ID,
			Status:       model.CheckInStatusPresent,
			CheckInTime:  &[]time.Time{time.Date(2024, 7, 16, 7, 0, 0, 0, time.Local)}[0],
			CheckedBy:    Teacher1ID,
			Temperature:  36.5,
			HasSymptoms:  false,
			Remark:       "正常",
		},
		{
			BaseModel:    model.BaseModel{ID: uuid.New().String()},
			ActivityID:   Activity1ID,
			CamperID:     Camper2ID,
			Status:       model.CheckInStatusPresent,
			CheckInTime:  &[]time.Time{time.Date(2024, 7, 16, 7, 2, 0, 0, time.Local)}[0],
			CheckedBy:    Teacher1ID,
			Temperature:  36.8,
			HasSymptoms:  false,
			Remark:       "正常",
		},
		{
			BaseModel:    model.BaseModel{ID: uuid.New().String()},
			ActivityID:   Activity1ID,
			CamperID:     Camper3ID,
			Status:       model.CheckInStatusLate,
			CheckInTime:  &[]time.Time{time.Date(2024, 7, 16, 7, 15, 0, 0, time.Local)}[0],
			CheckedBy:    Teacher1ID,
			Temperature:  36.6,
			HasSymptoms:  false,
			Remark:       "起晚了",
		},
		{
			BaseModel:    model.BaseModel{ID: uuid.New().String()},
			ActivityID:   Activity1ID,
			CamperID:     Camper4ID,
			Status:       model.CheckInStatusPresent,
			CheckInTime:  &[]time.Time{time.Date(2024, 7, 16, 7, 1, 0, 0, time.Local)}[0],
			CheckedBy:    Teacher1ID,
			Temperature:  36.7,
			HasSymptoms:  false,
			Remark:       "正常",
		},
		{
			BaseModel:    model.BaseModel{ID: uuid.New().String()},
			ActivityID:   Activity1ID,
			CamperID:     Camper5ID,
			Status:       model.CheckInStatusPresent,
			CheckInTime:  &[]time.Time{time.Date(2024, 7, 16, 7, 3, 0, 0, time.Local)}[0],
			CheckedBy:    Teacher1ID,
			Temperature:  36.4,
			HasSymptoms:  false,
			Remark:       "正常",
		},
		{
			BaseModel:    model.BaseModel{ID: uuid.New().String()},
			ActivityID:   Activity2ID,
			CamperID:     Camper1ID,
			Status:       model.CheckInStatusPresent,
			CheckInTime:  &[]time.Time{time.Date(2024, 7, 17, 8, 30, 0, 0, time.Local)}[0],
			CheckedBy:    Teacher1ID,
			Temperature:  36.5,
			HasSymptoms:  false,
			Remark:       "装备齐全",
		},
		{
			BaseModel:    model.BaseModel{ID: CheckInAbnormalID},
			ActivityID:   Activity2ID,
			CamperID:     Camper2ID,
			Status:       model.CheckInStatusPresent,
			CheckInTime:  &[]time.Time{time.Date(2024, 7, 17, 8, 32, 0, 0, time.Local)}[0],
			CheckedBy:    Teacher1ID,
			Temperature:  37.6,
			HasSymptoms:  true,
			Symptoms:     "体温偏高，自述有点头晕",
			Remark:       "需要关注",
		},
		{
			BaseModel:    model.BaseModel{ID: uuid.New().String()},
			ActivityID:   Activity2ID,
			CamperID:     Camper3ID,
			Status:       model.CheckInStatusPresent,
			CheckInTime:  &[]time.Time{time.Date(2024, 7, 17, 8, 35, 0, 0, time.Local)}[0],
			CheckedBy:    Teacher1ID,
			Temperature:  36.6,
			HasSymptoms:  false,
			Remark:       "正常",
		},
		{
			BaseModel:    model.BaseModel{ID: uuid.New().String()},
			ActivityID:   Activity2ID,
			CamperID:     Camper4ID,
			Status:       model.CheckInStatusPresent,
			CheckInTime:  &[]time.Time{time.Date(2024, 7, 17, 8, 28, 0, 0, time.Local)}[0],
			CheckedBy:    Teacher1ID,
			Temperature:  36.4,
			HasSymptoms:  false,
			Remark:       "正常",
		},
		{
			BaseModel:    model.BaseModel{ID: uuid.New().String()},
			ActivityID:   Activity2ID,
			CamperID:     Camper5ID,
			Status:       model.CheckInStatusPresent,
			CheckInTime:  &[]time.Time{time.Date(2024, 7, 17, 8, 30, 0, 0, time.Local)}[0],
			CheckedBy:    Teacher1ID,
			Temperature:  36.7,
			HasSymptoms:  false,
			Remark:       "正常",
		},
		{
			BaseModel:    model.BaseModel{ID: uuid.New().String()},
			ActivityID:   Activity2ID,
			CamperID:     Camper6ID,
			Status:       model.CheckInStatusAbsent,
			CheckedBy:    Teacher1ID,
			Remark:       "身体不适请假",
		},
		{
			BaseModel:    model.BaseModel{ID: uuid.New().String()},
			ActivityID:   Activity3ID,
			CamperID:     Camper1ID,
			Status:       model.CheckInStatusPending,
			Remark:       "待签到",
		},
		{
			BaseModel:    model.BaseModel{ID: uuid.New().String()},
			ActivityID:   Activity3ID,
			CamperID:     Camper2ID,
			Status:       model.CheckInStatusPending,
			Remark:       "待签到",
		},
		{
			BaseModel:    model.BaseModel{ID: uuid.New().String()},
			ActivityID:   Activity3ID,
			CamperID:     Camper3ID,
			Status:       model.CheckInStatusPending,
			Remark:       "待签到",
		},
		{
			BaseModel:    model.BaseModel{ID: uuid.New().String()},
			ActivityID:   Activity3ID,
			CamperID:     Camper4ID,
			Status:       model.CheckInStatusPending,
			Remark:       "待签到",
		},
		{
			BaseModel:    model.BaseModel{ID: uuid.New().String()},
			ActivityID:   Activity3ID,
			CamperID:     Camper5ID,
			Status:       model.CheckInStatusPending,
			Remark:       "待签到",
		},
		{
			BaseModel:    model.BaseModel{ID: uuid.New().String()},
			ActivityID:   Activity3ID,
			CamperID:     Camper6ID,
			Status:       model.CheckInStatusPending,
			Remark:       "待签到",
		},
	}

	for _, checkIn := range checkIns {
		checkIn.CreatedBy = Teacher1ID
		checkIn.UpdatedBy = Teacher1ID
		if checkIn.CheckedBy == "" {
			checkIn.CheckedBy = Teacher1ID
		}
		if err := DB.FirstOrCreate(&checkIn, "activity_id = ? AND camper_id = ?", checkIn.ActivityID, checkIn.CamperID).Error; err != nil {
			return err
		}
	}

	_ = now
	return nil
}

func seedMedicalReports() error {
	reportTime1 := time.Date(2024, 7, 17, 9, 0, 0, 0, time.Local)
	resolvedAt1 := time.Date(2024, 7, 17, 11, 0, 0, 0, time.Local)
	notifyTime1 := time.Date(2024, 7, 17, 9, 30, 0, 0, time.Local)

	reports := []model.MedicalReport{
		{
			BaseModel:        model.BaseModel{ID: Medical1ID},
			CamperID:         Camper2ID,
			ReporterID:       Teacher1ID,
			ReportTime:       reportTime1,
			Severity:         model.MedicalSeverityMild,
			Status:           model.MedicalStatusResolved,
			Symptoms:         "体温37.6度，轻微头晕，精神不振",
			Description:      "徒步活动前检查发现体温偏高，自述昨晚没睡好，有点头晕",
			Temperature:      37.6,
			InitialTreatment: "休息观察，多喝水，物理降温",
			TreatmentBy:      MedicalID,
			Medications:      []string{"物理降温贴"},
			NeedFollowUp:     true,
			FollowUpTime:     &[]time.Time{time.Date(2024, 7, 17, 12, 0, 0, 0, time.Local)}[0],
			ParentNotified:   true,
			ParentNotifyTime: &notifyTime1,
			ParentNotifyBy:   Teacher1ID,
			Remark:           "徒步活动签到时发现异常",
			Resolution:       "休息2小时后体温恢复正常36.8度，精神状态良好，可参与下午活动",
			ResolvedAt:       &resolvedAt1,
			ResolvedBy:       MedicalID,
		},
		{
			BaseModel:        model.BaseModel{ID: Medical2ID},
			CamperID:         Camper6ID,
			ReporterID:       Teacher2ID,
			ReportTime:       time.Date(2024, 7, 16, 22, 30, 0, 0, time.Local),
			Severity:         model.MedicalSeverityModerate,
			Status:           model.MedicalStatusFollowUp,
			Symptoms:         "咳嗽，喉咙痛，体温37.8度",
			Description:      "晚上查寝时发现营员咳嗽，自述喉咙痛，测量体温37.8度",
			Temperature:      37.8,
			BloodPressure:    "110/70",
			Pulse:            90,
			InitialTreatment: "服用感冒药，多喝温水，单间隔离观察",
			TreatmentBy:      MedicalID,
			Medications:      []string{"感冒药", "润喉糖"},
			NeedFollowUp:     true,
			FollowUpTime:     &[]time.Time{time.Date(2024, 7, 18, 8, 0, 0, 0, time.Local)}[0],
			IsolationNeeded:  true,
			ParentNotified:   true,
			ParentNotifyTime: &[]time.Time{time.Date(2024, 7, 16, 23, 0, 0, 0, time.Local)}[0],
			ParentNotifyBy:   MedicalID,
			Remark:           "已安排单独房间休息，每2小时测温一次",
		},
	}

	for _, report := range reports {
		report.CreatedBy = report.ReporterID
		report.UpdatedBy = report.ReporterID
		if err := DB.FirstOrCreate(&report, "id = ?", report.ID).Error; err != nil {
			return err
		}
	}

	link := &model.CheckInMedicalLink{
		BaseModel:       model.BaseModel{ID: uuid.New().String()},
		CheckInID:       CheckInAbnormalID,
		MedicalReportID: Medical1ID,
		LinkedBy:        Teacher1ID,
		LinkReason:      "徒步活动签到时体温异常后上报",
	}
	link.CreatedBy = Teacher1ID
	link.UpdatedBy = Teacher1ID
	DB.FirstOrCreate(link, "check_in_id = ? AND medical_report_id = ?", link.CheckInID, link.MedicalReportID)

	return nil
}

func seedFollowUps() error {
	dueTime := time.Date(2024, 7, 18, 8, 0, 0, 0, time.Local)
	scheduledTime := time.Date(2024, 7, 18, 8, 0, 0, 0, time.Local)

	followUps := []model.FollowUp{
		{
			BaseModel:        model.BaseModel{ID: FollowUp1ID},
			CamperID:         Camper6ID,
			Type:             model.FollowUpTypeMedical,
			Status:           model.FollowUpStatusScheduled,
			Priority:         model.FollowUpPriorityHigh,
			Title:            "感冒随访",
			Description:      "昨晚出现咳嗽、喉咙痛、发热症状，需要今早复查体温和症状",
			RelatedMedicalID: Medical2ID,
			AssignedTo:       MedicalID,
			ScheduledTime:    &scheduledTime,
			DueTime:          &dueTime,
			ParentNotified:   true,
			ParentNotifyTime: &[]time.Time{time.Date(2024, 7, 16, 23, 0, 0, 0, time.Local)}[0],
			NotifyMethod:     "电话",
			NotifyContent:    "告知家长营员出现感冒症状，已服药隔离，明天复查",
			NotifyBy:         MedicalID,
			Remark:           "每2小时测温一次",
		},
		{
			BaseModel:      model.BaseModel{ID: FollowUp2ID},
			CamperID:       Camper2ID,
			Type:           model.FollowUpTypeParent,
			Status:         model.FollowUpStatusCompleted,
			Priority:       model.FollowUpPriorityMedium,
			Title:          "家长回访 - 体温异常",
			Description:    "今天上午徒步前发现体温偏高，已处理恢复，需要电话回访家长说明情况",
			RelatedMedicalID: Medical1ID,
			AssignedTo:     Teacher1ID,
			CompletedTime:  &[]time.Time{time.Date(2024, 7, 17, 14, 0, 0, 0, time.Local)}[0],
			CompletedBy:    Teacher1ID,
			Result:         "已电话联系家长，说明情况，家长表示理解，感谢老师关心",
			NextStep:       "继续观察，有情况随时联系",
			ParentNotified: true,
			Remark:         "家长很满意处理方式",
		},
	}

	for _, fu := range followUps {
		fu.CreatedBy = fu.AssignedTo
		fu.UpdatedBy = fu.AssignedTo
		if err := DB.FirstOrCreate(&fu, "id = ?", fu.ID).Error; err != nil {
			return err
		}
	}

	history := &model.FollowUpHistory{
		BaseModel:     model.BaseModel{ID: uuid.New().String()},
		FollowUpID:    FollowUp1ID,
		OldStatus:     model.FollowUpStatusPending,
		NewStatus:     model.FollowUpStatusScheduled,
		NewAssignedTo: MedicalID,
		ChangedBy:     MedicalID,
		ChangeReason:  "安排今早8点随访检查",
	}
	history.CreatedBy = MedicalID
	history.UpdatedBy = MedicalID
	DB.FirstOrCreate(history, "follow_up_id = ?", history.FollowUpID)

	return nil
}

func seedMaterials() error {
	materials := []model.MaterialItem{
		{
			BaseModel:   model.BaseModel{ID: Material1ID},
			Name:        "感冒药",
			Category:    model.MaterialCategoryMedicine,
			Spec:        "12片/盒",
			Unit:        "盒",
			TotalStock:  50,
			UsedStock:   5,
			WarningLine: 10,
			Remark:      "感冒灵颗粒",
		},
		{
			BaseModel:   model.BaseModel{ID: Material2ID},
			Name:        "退烧药",
			Category:    model.MaterialCategoryMedicine,
			Spec:        "10片/盒",
			Unit:        "盒",
			TotalStock:  30,
			UsedStock:   28,
			WarningLine: 10,
			Remark:      "布洛芬，库存预警",
		},
		{
			BaseModel:   model.BaseModel{ID: Material3ID},
			Name:        "一次性口罩",
			Category:    model.MaterialCategoryDailyUse,
			Spec:        "50只/盒",
			Unit:        "盒",
			TotalStock:  100,
			UsedStock:   45,
			WarningLine: 20,
			Remark:      "医用外科口罩",
		},
		{
			BaseModel:   model.BaseModel{ID: Material4ID},
			Name:        "登山杖",
			Category:    model.MaterialCategoryEquipment,
			Spec:        "伸缩款",
			Unit:        "根",
			TotalStock:  30,
			UsedStock:   12,
			WarningLine: 5,
			Remark:      "户外徒步使用",
		},
	}

	for _, m := range materials {
		m.CreatedBy = LogisticsID
		m.UpdatedBy = LogisticsID
		if err := DB.FirstOrCreate(&m, "id = ?", m.ID).Error; err != nil {
			return err
		}
	}

	issue1 := &model.MaterialIssue{
		BaseModel:   model.BaseModel{ID: uuid.New().String()},
		CamperID:    Camper6ID,
		ItemID:      Material1ID,
		RequesterID: MedicalID,
		Quantity:    1,
		Status:      model.MaterialStatusIssued,
		RequestTime: time.Date(2024, 7, 16, 22, 35, 0, 0, time.Local),
		Reason:      "感冒咳嗽，需要感冒药",
		ApproverID:  LogisticsID,
		ApproveTime: &[]time.Time{time.Date(2024, 7, 16, 22, 36, 0, 0, time.Local)}[0],
		IssuerID:    LogisticsID,
		IssueTime:   &[]time.Time{time.Date(2024, 7, 16, 22, 40, 0, 0, time.Local)}[0],
	}
	issue1.CreatedBy = MedicalID
	issue1.UpdatedBy = MedicalID
	DB.FirstOrCreate(issue1, "camper_id = ? AND item_id = ? AND request_time = ?", issue1.CamperID, issue1.ItemID, issue1.RequestTime)

	issue2 := &model.MaterialIssue{
		BaseModel:   model.BaseModel{ID: uuid.New().String()},
		CamperID:    Camper2ID,
		ItemID:      Material4ID,
		RequesterID: Teacher1ID,
		Quantity:    1,
		Status:      model.MaterialStatusApproved,
		RequestTime: time.Date(2024, 7, 17, 8, 0, 0, 0, time.Local),
		Reason:      "徒步活动使用",
		ApproverID:  LogisticsID,
		ApproveTime: &[]time.Time{time.Date(2024, 7, 17, 8, 5, 0, 0, time.Local)}[0],
	}
	issue2.CreatedBy = Teacher1ID
	issue2.UpdatedBy = Teacher1ID
	DB.FirstOrCreate(issue2, "camper_id = ? AND item_id = ? AND request_time = ?", issue2.CamperID, issue2.ItemID, issue2.RequestTime)

	return nil
}

func seedStatusHistories() error {
	histories := []model.StatusHistory{
		{
			ID:         uuid.New().String(),
			EntityType: "medical",
			EntityID:   Medical1ID,
			OldStatus:  "",
			NewStatus:  string(model.MedicalStatusReported),
			ChangedBy:  Teacher1ID,
			ChangedAt:  time.Date(2024, 7, 17, 9, 0, 0, 0, time.Local),
			Remark:     "创建医疗上报",
		},
		{
			ID:         uuid.New().String(),
			EntityType: "medical",
			EntityID:   Medical1ID,
			OldStatus:  string(model.MedicalStatusReported),
			NewStatus:  string(model.MedicalStatusProcessing),
			ChangedBy:  MedicalID,
			ChangedAt:  time.Date(2024, 7, 17, 9, 10, 0, 0, time.Local),
			Remark:     "陈医生开始处理，安排休息观察",
		},
		{
			ID:         uuid.New().String(),
			EntityType: "medical",
			EntityID:   Medical1ID,
			OldStatus:  string(model.MedicalStatusProcessing),
			NewStatus:  string(model.MedicalStatusResolved),
			ChangedBy:  MedicalID,
			ChangedAt:  time.Date(2024, 7, 17, 11, 0, 0, 0, time.Local),
			Remark:     "体温恢复正常，症状缓解",
		},
		{
			ID:         uuid.New().String(),
			EntityType: "medical",
			EntityID:   Medical2ID,
			OldStatus:  "",
			NewStatus:  string(model.MedicalStatusReported),
			ChangedBy:  Teacher2ID,
			ChangedAt:  time.Date(2024, 7, 16, 22, 30, 0, 0, time.Local),
			Remark:     "晚查寝发现感冒症状",
		},
		{
			ID:         uuid.New().String(),
			EntityType: "medical",
			EntityID:   Medical2ID,
			OldStatus:  string(model.MedicalStatusReported),
			NewStatus:  string(model.MedicalStatusFollowUp),
			ChangedBy:  MedicalID,
			ChangedAt:  time.Date(2024, 7, 16, 23, 0, 0, 0, time.Local),
			Remark:     "已服药隔离，需要持续观察",
		},
		{
			ID:         uuid.New().String(),
			EntityType: "followup",
			EntityID:   FollowUp1ID,
			OldStatus:  "",
			NewStatus:  string(model.FollowUpStatusPending),
			ChangedBy:  MedicalID,
			ChangedAt:  time.Date(2024, 7, 16, 23, 10, 0, 0, time.Local),
			Remark:     "创建随访任务",
		},
		{
			ID:         uuid.New().String(),
			EntityType: "followup",
			EntityID:   FollowUp1ID,
			OldStatus:  string(model.FollowUpStatusPending),
			NewStatus:  string(model.FollowUpStatusScheduled),
			ChangedBy:  MedicalID,
			ChangedAt:  time.Date(2024, 7, 16, 23, 15, 0, 0, time.Local),
			Remark:     "安排明早8点检查",
		},
	}

	for _, h := range histories {
		if err := DB.FirstOrCreate(&h, "id = ?", h.ID).Error; err != nil {
			return err
		}
	}
	return nil
}

func seedOperationLogs() error {
	logs := []model.OperationLog{
		{
			ID:         uuid.New().String(),
			UserID:     Teacher1ID,
			UserName:   "李红",
			UserRole:   string(model.RoleTeacher),
			Action:     "checkin_update",
			EntityType: "checkin",
			EntityID:   CheckIn1ID,
			OldValue:   `{"status":"pending"}`,
			NewValue:   `{"status":"present","temperature":36.5}`,
			CreatedAt:  time.Date(2024, 7, 16, 7, 0, 0, 0, time.Local),
		},
		{
			ID:         uuid.New().String(),
			UserID:     Teacher1ID,
			UserName:   "李红",
			UserRole:   string(model.RoleTeacher),
			Action:     "medical_create",
			EntityType: "medical",
			EntityID:   Medical1ID,
			NewValue:   `{"symptoms":"体温37.6度，轻微头晕"}`,
			CreatedAt:  time.Date(2024, 7, 17, 9, 0, 0, 0, time.Local),
		},
		{
			ID:         uuid.New().String(),
			UserID:     MedicalID,
			UserName:   "陈医生",
			UserRole:   string(model.RoleMedical),
			Action:     "medical_update",
			EntityType: "medical",
			EntityID:   Medical1ID,
			OldValue:   `{"status":"reported"}`,
			NewValue:   `{"status":"processing","treatment":"休息观察，多喝水"}`,
			CreatedAt:  time.Date(2024, 7, 17, 9, 10, 0, 0, time.Local),
		},
		{
			ID:         uuid.New().String(),
			UserID:     MedicalID,
			UserName:   "陈医生",
			UserRole:   string(model.RoleMedical),
			Action:     "medical_update",
			EntityType: "medical",
			EntityID:   Medical1ID,
			OldValue:   `{"status":"processing"}`,
			NewValue:   `{"status":"resolved","resolution":"体温恢复正常"}`,
			CreatedAt:  time.Date(2024, 7, 17, 11, 0, 0, 0, time.Local),
		},
		{
			ID:         uuid.New().String(),
			UserID:     Teacher1ID,
			UserName:   "李红",
			UserRole:   string(model.RoleTeacher),
			Action:     "medical_notify_parent",
			EntityType: "medical",
			EntityID:   Medical1ID,
			OldValue:   `{"parent_notified":false}`,
			NewValue:   `{"parent_notified":true,"method":"电话"}`,
			CreatedAt:  time.Date(2024, 7, 17, 9, 30, 0, 0, time.Local),
		},
		{
			ID:         uuid.New().String(),
			UserID:     Teacher2ID,
			UserName:   "王芳",
			UserRole:   string(model.RoleTeacher),
			Action:     "medical_create",
			EntityType: "medical",
			EntityID:   Medical2ID,
			NewValue:   `{"symptoms":"咳嗽，喉咙痛，体温37.8度"}`,
			CreatedAt:  time.Date(2024, 7, 16, 22, 30, 0, 0, time.Local),
		},
		{
			ID:         uuid.New().String(),
			UserID:     MedicalID,
			UserName:   "陈医生",
			UserRole:   string(model.RoleMedical),
			Action:     "material_request",
			EntityType: "material_issue",
			EntityID:   Material1ID,
			NewValue:   `{"item":"感冒药","quantity":1,"reason":"感冒咳嗽"}`,
			CreatedAt:  time.Date(2024, 7, 16, 22, 35, 0, 0, time.Local),
		},
		{
			ID:         uuid.New().String(),
			UserID:     LogisticsID,
			UserName:   "赵强",
			UserRole:   string(model.RoleLogistics),
			Action:     "material_issue",
			EntityType: "material_issue",
			EntityID:   Material1ID,
			OldValue:   `{"status":"approved"}`,
			NewValue:   `{"status":"issued"}`,
			CreatedAt:  time.Date(2024, 7, 16, 22, 40, 0, 0, time.Local),
		},
		{
			ID:         uuid.New().String(),
			UserID:     Teacher1ID,
			UserName:   "李红",
			UserRole:   string(model.RoleTeacher),
			Action:     "followup_update",
			EntityType: "followup",
			EntityID:   FollowUp2ID,
			OldValue:   `{"status":"pending"}`,
			NewValue:   `{"status":"completed","result":"家长表示满意"}`,
			CreatedAt:  time.Date(2024, 7, 17, 14, 0, 0, 0, time.Local),
		},
	}

	for _, log := range logs {
		if err := DB.FirstOrCreate(&log, "id = ?", log.ID).Error; err != nil {
			return err
		}
	}
	return nil
}

func seedRoomChangeLogs() error {
	changeLogs := []model.RoomChangeLog{
		{
			BaseModel:    model.BaseModel{ID: uuid.New().String()},
			CamperID:     Camper6ID,
			OldRoomID:    Room3ID,
			NewRoomID:    Room4ID,
			OldBedNumber: 2,
			NewBedNumber: 1,
			ChangedBy:    LogisticsID,
			ChangeTime:   time.Date(2024, 7, 16, 23, 10, 0, 0, time.Local),
			Reason:       "感冒需要隔离观察",
			Remark:       "因营员出现咳嗽发热症状，安排单独房间隔离，避免传染其他营员",
			ApprovedBy:   DirectorID,
			ApprovedAt:   &[]time.Time{time.Date(2024, 7, 16, 23, 5, 0, 0, time.Local)}[0],
			ApprovalRemark: "同意，确保每2小时测温一次，有情况及时上报",
		},
		{
			BaseModel:    model.BaseModel{ID: uuid.New().String()},
			CamperID:     Camper3ID,
			OldRoomID:    Room1ID,
			NewRoomID:    Room2ID,
			OldBedNumber: 3,
			NewBedNumber: 3,
			ChangedBy:    LogisticsID,
			ChangeTime:   time.Date(2024, 7, 15, 15, 0, 0, 0, time.Local),
			Reason:       "调整室友组合",
			Remark:       "营员家长要求调整到熟人房间",
			ApprovedBy:   DirectorID,
			ApprovedAt:   &[]time.Time{time.Date(2024, 7, 15, 14, 30, 0, 0, time.Local)}[0],
			ApprovalRemark: "同意，已与双方家长沟通确认",
		},
	}

	for _, changeLog := range changeLogs {
		changeLog.CreatedBy = LogisticsID
		changeLog.UpdatedBy = LogisticsID
		if err := DB.FirstOrCreate(&changeLog, "id = ?", changeLog.ID).Error; err != nil {
			return err
		}
	}

	return nil
}
