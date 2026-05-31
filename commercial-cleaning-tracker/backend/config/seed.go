package config

import (
	"time"

	"github.com/cleaning-tracker/backend/models"
	"golang.org/x/crypto/bcrypt"
)

func hashPassword(password string) string {
	hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(hash)
}

func SeedDemoData() {
	var userCount int64
	DB.Model(&models.User{}).Count(&userCount)
	if userCount > 0 {
		return
	}

	users := []models.User{
		{Username: "manager", Password: hashPassword("123456"), Name: "张经理", Role: models.RoleManager, Phone: "13800000001"},
		{Username: "scheduler", Password: hashPassword("123456"), Name: "李排班", Role: models.RoleScheduler, Phone: "13800000002"},
		{Username: "inspector", Password: hashPassword("123456"), Name: "王质检", Role: models.RoleInspector, Phone: "13800000003"},
		{Username: "worker1", Password: hashPassword("123456"), Name: "陈清洁", Role: models.RoleWorker, Phone: "13800000011"},
		{Username: "worker2", Password: hashPassword("123456"), Name: "刘保洁", Role: models.RoleWorker, Phone: "13800000012"},
		{Username: "worker3", Password: hashPassword("123456"), Name: "赵阿姨", Role: models.RoleWorker, Phone: "13800000013"},
		{Username: "worker4", Password: hashPassword("123456"), Name: "孙大姐", Role: models.RoleWorker, Phone: "13800000014"},
	}
	DB.Create(&users)

	projects := []models.Project{
		{Name: "金融中心A座", Address: "北京市朝阳区建国路88号", CustomerName: "金融中心物业", CustomerPhone: "010-88888881",
			ContractStart: time.Date(2026, 1, 1, 0, 0, 0, 0, time.Local),
			ContractEnd:   time.Date(2026, 12, 31, 0, 0, 0, 0, time.Local),
			Status:        "active", ManagerID: 1},
		{Name: "科技园B区", Address: "北京市海淀区中关村大街1号", CustomerName: "科技园管理处", CustomerPhone: "010-88888882",
			ContractStart: time.Date(2026, 3, 1, 0, 0, 0, 0, time.Local),
			ContractEnd:   time.Date(2027, 2, 28, 0, 0, 0, 0, time.Local),
			Status:        "active", ManagerID: 1},
		{Name: "购物中心", Address: "北京市西城区西单北大街100号", CustomerName: "购物中心运营部", CustomerPhone: "010-88888883",
			ContractStart: time.Date(2025, 6, 1, 0, 0, 0, 0, time.Local),
			ContractEnd:   time.Date(2026, 5, 31, 0, 0, 0, 0, time.Local),
			Status:        "expiring", ManagerID: 1},
	}
	DB.Create(&projects)

	now := time.Now()
	weekStart := now.AddDate(0, 0, -int(now.Weekday())+1)
	weekStart = time.Date(weekStart.Year(), weekStart.Month(), weekStart.Day(), 0, 0, 0, 0, time.Local)

	schedules := []models.Schedule{
		{ProjectID: 1, WeekStart: weekStart, WeekEnd: weekStart.AddDate(0, 0, 6), Status: models.SchedulePublished, CreatedBy: 2},
		{ProjectID: 2, WeekStart: weekStart, WeekEnd: weekStart.AddDate(0, 0, 6), Status: models.SchedulePublished, CreatedBy: 2},
		{ProjectID: 3, WeekStart: weekStart, WeekEnd: weekStart.AddDate(0, 0, 6), Status: models.SchedulePublished, CreatedBy: 2},
	}
	DB.Create(&schedules)

	shifts := []models.Shift{
		{ScheduleID: 1, WorkerID: 4, Date: weekStart, ShiftType: models.ShiftMorning, StartTime: "08:00", EndTime: "12:00", Area: "1-5层办公区", Tasks: "地面清洁、垃圾桶清运、玻璃擦拭"},
		{ScheduleID: 1, WorkerID: 5, Date: weekStart, ShiftType: models.ShiftAfternoon, StartTime: "13:00", EndTime: "17:00", Area: "6-10层办公区", Tasks: "地面清洁、卫生间消毒、电梯间维护"},
		{ScheduleID: 1, WorkerID: 4, Date: weekStart.AddDate(0, 0, 1), ShiftType: models.ShiftMorning, StartTime: "08:00", EndTime: "12:00", Area: "1-5层办公区", Tasks: "地面清洁、垃圾桶清运、玻璃擦拭"},
		{ScheduleID: 1, WorkerID: 6, Date: weekStart.AddDate(0, 0, 1), ShiftType: models.ShiftNight, StartTime: "22:00", EndTime: "06:00", Area: "地下室停车场", Tasks: "地面清洗、垃圾桶清运、消毒"},
		{ScheduleID: 2, WorkerID: 7, Date: weekStart, ShiftType: models.ShiftFull, StartTime: "09:00", EndTime: "18:00", Area: "研发楼A栋", Tasks: "全面清洁、会议室布置、垃圾清运"},
		{ScheduleID: 2, WorkerID: 6, Date: weekStart.AddDate(0, 0, 1), ShiftType: models.ShiftMorning, StartTime: "07:00", EndTime: "15:00", Area: "研发楼B栋", Tasks: "地面清洁、卫生间消毒、窗户清洁"},
		{ScheduleID: 3, WorkerID: 5, Date: weekStart, ShiftType: models.ShiftMorning, StartTime: "06:00", EndTime: "14:00", Area: "1-3层商场", Tasks: "地面抛光、垃圾桶清运、扶梯清洁"},
		{ScheduleID: 3, WorkerID: 7, Date: weekStart.AddDate(0, 0, 1), ShiftType: models.ShiftAfternoon, StartTime: "14:00", EndTime: "22:00", Area: "4-5层餐饮区", Tasks: "油污清理、地面清洗、垃圾清运"},
	}
	DB.Create(&shifts)

	checkIns := []models.CheckIn{
		{ShiftID: 1, WorkerID: 4, CheckInTime: &[]time.Time{weekStart.Add(time.Hour * 8)}[0], CheckOutTime: &[]time.Time{weekStart.Add(time.Hour * 12)}[0], Status: models.CheckInNormal, Location: "金融中心A座1层"},
		{ShiftID: 2, WorkerID: 5, CheckInTime: &[]time.Time{weekStart.Add(time.Hour * 13).Add(time.Minute * 15)}[0], CheckOutTime: nil, Status: models.CheckInLate, Location: "金融中心A座6层", Remark: "公交晚点"},
		{ShiftID: 5, WorkerID: 7, CheckInTime: nil, CheckOutTime: nil, Status: models.CheckInMissing, Remark: ""},
		{ShiftID: 7, WorkerID: 5, CheckInTime: &[]time.Time{weekStart.Add(time.Hour * 5).Add(time.Minute * 45)}[0], CheckOutTime: &[]time.Time{weekStart.Add(time.Hour * 14).Add(time.Minute * 10)}[0], Status: models.CheckInException, Location: "购物中心1层", Remark: "设备故障，提前10分钟到检查"},
	}
	DB.Create(&checkIns)

	inspections := []models.Inspection{
		{ShiftID: 1, InspectorID: 3, InspectTime: weekStart.Add(time.Hour * 10), Result: models.InspectionPass, Score: 92, Items: "地面清洁,玻璃擦拭,垃圾桶", Remark: "整体良好"},
		{ShiftID: 2, InspectorID: 3, InspectTime: weekStart.Add(time.Hour * 15), Result: models.InspectionFail, Score: 65, Items: "卫生间,电梯间,地面", Problems: "卫生间有异味,电梯间有灰尘,地面有水渍", PhotoURLs: "/images/inspect_fail_1.jpg"},
		{ShiftID: 7, InspectorID: 3, InspectTime: weekStart.Add(time.Hour * 10), Result: models.InspectionFail, Score: 58, Items: "地面抛光,扶梯清洁", Problems: "地面有明显污渍,扶梯扶手有油污", PhotoURLs: "/images/inspect_fail_2.jpg"},
	}
	DB.Create(&inspections)

	rectifications := []models.Rectification{
		{InspectionID: 2, AssigneeID: 5, Deadline: weekStart.AddDate(0, 0, 2), Status: models.RectAssigned, Description: "卫生间异味处理、电梯间清洁、地面水渍清理", Actions: "更换空气清新剂、增加清洁频次、放置防滑垫"},
		{InspectionID: 3, AssigneeID: 7, Deadline: weekStart.AddDate(0, 0, 1), Status: models.RectDone, Description: "地面污渍深度清洁、扶梯扶手油污清理", Actions: "使用强力清洁剂、增加清洁人员", CompletedTime: &[]time.Time{weekStart.AddDate(0, 0, 1).Add(time.Hour * 12)}[0], CompletedNote: "已完成全部整改"},
	}
	DB.Create(&rectifications)

	materials := []models.MaterialRequisition{
		{ShiftID: 1, RequesterID: 4, Items: `[{"name":"洗洁精","qty":2,"unit":"瓶"},{"name":"垃圾袋","qty":5,"unit":"包"}]`, TotalQty: 7, Status: models.MaterialApproved, RequestTime: weekStart.Add(time.Hour * 7), ApprovedBy: &[]uint{2}[0], ApproveTime: &[]time.Time{weekStart.Add(time.Hour * 7).Add(time.Minute * 30)}[0]},
		{ShiftID: 2, RequesterID: 5, Items: `[{"name":"空气清新剂","qty":3,"unit":"瓶"},{"name":"洁厕灵","qty":2,"unit":"瓶"}]`, TotalQty: 5, Status: models.MaterialPending, RequestTime: weekStart.Add(time.Hour * 14)},
		{ShiftID: 7, RequesterID: 5, Items: `[{"name":"强力清洁剂","qty":4,"unit":"瓶"},{"name":"钢丝球","qty":10,"unit":"个"}]`, TotalQty: 14, Status: models.MaterialRejected, RequestTime: weekStart.Add(time.Hour * 8), ApprovedBy: &[]uint{2}[0], Remark: "强力清洁剂库存不足，已通知采购"},
	}
	DB.Create(&materials)

	followUps := []models.FollowUp{
		{RectificationID: &[]uint{1}[0], Type: models.FollowUpRect, Title: "金融中心A座6层整改追踪", Content: "检查整改完成情况，确认异味消除", AssigneeID: 3, DueDate: weekStart.AddDate(0, 0, 3), Status: models.FollowUpPending, CreatedBy: 1},
		{ProjectID: &[]uint{3}[0], Type: models.FollowUpRenewal, Title: "购物中心合同续约", Content: "联系购物中心运营部，商讨合同续约事宜", AssigneeID: 1, DueDate: time.Date(2026, 5, 20, 0, 0, 0, 0, time.Local), Status: models.FollowUpPending, CreatedBy: 1},
		{RectificationID: &[]uint{2}[0], Type: models.FollowUpRect, Title: "购物中心整改验证", Content: "验证地面和扶梯整改效果，抽检清洁质量", AssigneeID: 3, DueDate: weekStart.AddDate(0, 0, 2), Status: models.FollowUpDone, Result: "整改合格，污渍已清除，客户满意", CompletedTime: &[]time.Time{weekStart.AddDate(0, 0, 2)}[0], CreatedBy: 1},
	}
	DB.Create(&followUps)
}
