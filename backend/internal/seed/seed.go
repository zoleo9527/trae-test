package seed

import (
	"fmt"
	"time"

	"camp-management/internal/models"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func Run(db *gorm.DB) error {
	var userCount int64
	db.Model(&models.User{}).Count(&userCount)
	if userCount > 0 {
		return nil
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	director := models.User{
		Username:     "director1",
		PasswordHash: string(passwordHash),
		DisplayName:  "营地主任",
		Role:         "director",
	}
	if err := db.Create(&director).Error; err != nil {
		return err
	}

	teacher := models.User{
		Username:     "teacher1",
		PasswordHash: string(passwordHash),
		DisplayName:  "班务老师",
		Role:         "teacher",
	}
	if err := db.Create(&teacher).Error; err != nil {
		return err
	}

	logistics := models.User{
		Username:     "logistics1",
		PasswordHash: string(passwordHash),
		DisplayName:  "后勤协调",
		Role:         "logistics",
	}
	if err := db.Create(&logistics).Error; err != nil {
		return err
	}

	rooms := []models.Room{
		{Name: "A-101", Building: "A栋", Capacity: 4},
		{Name: "A-102", Building: "A栋", Capacity: 4},
		{Name: "A-103", Building: "A栋", Capacity: 4},
		{Name: "B-101", Building: "B栋", Capacity: 4},
		{Name: "B-102", Building: "B栋", Capacity: 4},
		{Name: "B-103", Building: "B栋", Capacity: 4},
	}
	for i := range rooms {
		if err := db.Create(&rooms[i]).Error; err != nil {
			return err
		}
	}

	campers := []models.Camper{
		{Name: "张三", Gender: "男", Age: 10, GroupName: "第一组", EmergencyContact: "张父", EmergencyPhone: "13800000001", HealthNotes: "", RoomID: &rooms[0].ID, Status: "active"},
		{Name: "李四", Gender: "男", Age: 11, GroupName: "第一组", EmergencyContact: "李母", EmergencyPhone: "13800000002", HealthNotes: "花粉过敏", RoomID: &rooms[0].ID, Status: "active"},
		{Name: "王五", Gender: "女", Age: 10, GroupName: "第一组", EmergencyContact: "王父", EmergencyPhone: "13800000003", HealthNotes: "", RoomID: &rooms[1].ID, Status: "active"},
		{Name: "赵六", Gender: "女", Age: 9, GroupName: "第一组", EmergencyContact: "赵母", EmergencyPhone: "13800000004", HealthNotes: "", RoomID: &rooms[1].ID, Status: "active"},
		{Name: "孙七", Gender: "男", Age: 11, GroupName: "第二组", EmergencyContact: "孙父", EmergencyPhone: "13800000005", HealthNotes: "", RoomID: &rooms[2].ID, Status: "active"},
		{Name: "周八", Gender: "男", Age: 10, GroupName: "第二组", EmergencyContact: "周母", EmergencyPhone: "13800000006", HealthNotes: "哮喘", RoomID: &rooms[2].ID, Status: "active"},
		{Name: "吴九", Gender: "女", Age: 12, GroupName: "第二组", EmergencyContact: "吴父", EmergencyPhone: "13800000007", HealthNotes: "", RoomID: nil, Status: "active"},
		{Name: "郑十", Gender: "女", Age: 10, GroupName: "第二组", EmergencyContact: "郑母", EmergencyPhone: "13800000008", HealthNotes: "", RoomID: nil, Status: "active"},
		{Name: "冯一", Gender: "男", Age: 9, GroupName: "第三组", EmergencyContact: "冯父", EmergencyPhone: "13800000009", HealthNotes: "", RoomID: &rooms[3].ID, Status: "active"},
		{Name: "陈二", Gender: "男", Age: 11, GroupName: "第三组", EmergencyContact: "陈母", EmergencyPhone: "13800000010", HealthNotes: "", RoomID: &rooms[3].ID, Status: "active"},
		{Name: "褚三", Gender: "女", Age: 10, GroupName: "第三组", EmergencyContact: "褚父", EmergencyPhone: "13800000011", HealthNotes: "对花生过敏", RoomID: nil, Status: "active"},
		{Name: "卫四", Gender: "女", Age: 11, GroupName: "第三组", EmergencyContact: "卫母", EmergencyPhone: "13800000012", HealthNotes: "", RoomID: nil, Status: "inactive"},
	}
	for i := range campers {
		if err := db.Create(&campers[i]).Error; err != nil {
			return err
		}
	}

	today := time.Now().Format("2006-01-02")
	attendances := []models.Attendance{
		{CamperID: campers[0].ID, Date: today, Session: "上午", Status: "present", Remark: "", ApprovalStatus: "pending", SubmittedBy: teacher.ID},
		{CamperID: campers[1].ID, Date: today, Session: "上午", Status: "absent", Remark: "请假", ApprovalStatus: "pending", SubmittedBy: teacher.ID},
		{CamperID: campers[4].ID, Date: today, Session: "上午", Status: "present", Remark: "", ApprovalStatus: "approved", SubmittedBy: teacher.ID, ReviewedBy: &director.ID},
		{CamperID: campers[5].ID, Date: today, Session: "上午", Status: "late", Remark: "迟到10分钟", ApprovalStatus: "pending", SubmittedBy: teacher.ID},
	}
	for i := range attendances {
		if err := db.Create(&attendances[i]).Error; err != nil {
			return err
		}
	}

	medicalRecords := []models.MedicalRecord{
		{CamperID: campers[1].ID, Type: "过敏", Description: "花粉过敏发作", Severity: "medium", Treatment: "服用抗过敏药物", Status: "pending", ReportedBy: teacher.ID},
		{CamperID: campers[5].ID, Type: "哮喘", Description: "运动后哮喘发作", Severity: "high", Treatment: "使用吸入器", Status: "in_progress", ReportedBy: teacher.ID},
	}
	for i := range medicalRecords {
		if err := db.Create(&medicalRecords[i]).Error; err != nil {
			return err
		}
	}

	supplies := []models.Supply{
		{CamperID: campers[2].ID, ItemName: "毛巾", Quantity: 2, Reason: "毛巾丢失需要更换", Status: "pending", RequestedBy: teacher.ID},
		{CamperID: campers[8].ID, ItemName: "文具套装", Quantity: 1, Reason: "文具用完", Status: "pending", RequestedBy: teacher.ID},
	}
	for i := range supplies {
		if err := db.Create(&supplies[i]).Error; err != nil {
			return err
		}
	}

	feedbacks := []models.Feedback{
		{CamperID: campers[0].ID, Type: "家长投诉", Content: "宿舍卫生条件需要改善", ParentResponse: "已与家长沟通", Status: "pending", AssigneeID: &director.ID},
		{CamperID: campers[6].ID, Type: "建议", Content: "希望增加户外活动时间", ParentResponse: "", Status: "pending", AssigneeID: nil},
	}
	for i := range feedbacks {
		if err := db.Create(&feedbacks[i]).Error; err != nil {
			return err
		}
	}

	for i := range campers {
		db.Create(&models.TimelineEvent{
			CamperID:         campers[i].ID,
			EventType:        "camper_created",
			EventTitle:       "营员登记",
			EventDescription: fmt.Sprintf("登记营员: %s", campers[i].Name),
			OperatorID:       director.ID,
		})
	}

	return nil
}
