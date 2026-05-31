package seed

import (
	"fmt"
	"log"
	"time"

	"watch-after-sales/backend/model"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func Seed(db *gorm.DB) {
	var count int64
	db.Model(&model.User{}).Count(&count)
	if count > 0 {
		log.Println("[Seed] Data already exists, skipping seed")
		return
	}

	log.Println("[Seed] Seeding database...")

	users := seedUsers(db)
	customers := seedCustomers(db)
	parts := seedParts(db)
	orders := seedRepairOrders(db, users, customers, users["technician"])
	seedPartLocks(db, orders, parts, users)
	seedProgressLogs(db, orders, users)
	seedCallbacks(db, orders, users)
	seedAuditLogs(db, users, orders)

	log.Println("[Seed] Seeding completed!")
}

func seedUsers(db *gorm.DB) map[string]model.User {
	users := []struct {
		username    string
		password    string
		role        model.Role
		displayName string
	}{
		{"manager", "admin123", model.RoleManager, "张经理"},
		{"consultant", "cons123", model.RoleConsultant, "李顾问"},
		{"technician", "tech123", model.RoleTechnician, "王技师"},
	}

	result := make(map[string]model.User)
	for _, u := range users {
		hash, _ := bcrypt.GenerateFromPassword([]byte(u.password), bcrypt.DefaultCost)
		user := model.User{
			Username:     u.username,
			PasswordHash: string(hash),
			Role:         u.role,
			DisplayName:  u.displayName,
		}
		db.Create(&user)
		result[u.username] = user
	}
	return result
}

func seedCustomers(db *gorm.DB) []model.Customer {
	customers := []model.Customer{
		{Name: "陈明远", Phone: "13800138001", Email: "chenmy@example.com", Address: "北京市朝阳区建国路88号"},
		{Name: "刘思琪", Phone: "13900139002", Email: "liusq@example.com", Address: "上海市浦东新区陆家嘴路100号"},
		{Name: "赵志强", Phone: "13700137003", Email: "zhaozq@example.com", Address: "广州市天河区天河路200号"},
		{Name: "孙雅婷", Phone: "13600136004", Email: "sunyt@example.com", Address: "深圳市南山区科技园路50号"},
		{Name: "周建国", Phone: "13500135005", Email: "zhoujg@example.com", Address: "成都市锦江区春熙路66号"},
		{Name: "吴丽华", Phone: "13400134006", Email: "wulh@example.com", Address: "杭州市西湖区文三路120号"},
		{Name: "郑伟民", Phone: "13300133007", Email: "zhengwm@example.com", Address: "南京市鼓楼区中山路88号"},
		{Name: "黄秀英", Phone: "13200132008", Email: "huangxy@example.com", Address: "武汉市江汉区解放大道180号"},
	}

	for i := range customers {
		db.Create(&customers[i])
	}
	return customers
}

func seedParts(db *gorm.DB) []model.Part {
	parts := []model.Part{
		{Name: "表盘", Sku: "DIAL-001", Quantity: 20, MinQuantity: 5, UnitPrice: 350.00},
		{Name: "表壳", Sku: "CASE-001", Quantity: 15, MinQuantity: 3, UnitPrice: 580.00},
		{Name: "表带", Sku: "STRP-001", Quantity: 30, MinQuantity: 8, UnitPrice: 120.00},
		{Name: "机芯", Sku: "MVMT-001", Quantity: 10, MinQuantity: 2, UnitPrice: 2800.00},
		{Name: "表冠", Sku: "CRWN-001", Quantity: 25, MinQuantity: 5, UnitPrice: 85.00},
		{Name: "表镜", Sku: "GLSS-001", Quantity: 18, MinQuantity: 4, UnitPrice: 450.00},
		{Name: "防水圈", Sku: "SEAL-001", Quantity: 50, MinQuantity: 10, UnitPrice: 25.00},
		{Name: "游丝", Sku: "HSPR-001", Quantity: 8, MinQuantity: 3, UnitPrice: 680.00},
		{Name: "摆轮", Sku: "BLNC-001", Quantity: 12, MinQuantity: 3, UnitPrice: 520.00},
		{Name: "发条", Sku: "MSPR-001", Quantity: 10, MinQuantity: 3, UnitPrice: 380.00},
		{Name: "齿轮组", Sku: "GEAR-001", Quantity: 5, LockedQuantity: 5, MinQuantity: 2, UnitPrice: 960.00},
		{Name: "表扣", Sku: "CLKP-001", Quantity: 35, MinQuantity: 8, UnitPrice: 65.00},
	}

	for i := range parts {
		db.Create(&parts[i])
	}
	return parts
}

func seedRepairOrders(db *gorm.DB, users map[string]model.User, customers []model.Customer, tech model.User) []model.RepairOrder {
	orders := []model.RepairOrder{
		{CustomerID: customers[0].ID, WatchBrand: "劳力士", WatchModel: "Submariner 116610LN", WatchSerial: "ROLEX-20240001", IssueDescription: "走时不准，每天慢3分钟", Status: model.StatusDiagnosing, AssignedTechnicianID: &tech.ID, CreatedBy: users["consultant"].ID},
		{CustomerID: customers[1].ID, WatchBrand: "欧米茄", WatchModel: "Speedmaster 3861", WatchSerial: "OMEGA-20240002", IssueDescription: "表镜有划痕需要更换", Status: model.StatusQuoted, AssignedTechnicianID: &tech.ID, CreatedBy: users["consultant"].ID},
		{CustomerID: customers[2].ID, WatchBrand: "百达翡丽", WatchModel: "Calatrava 5227G", WatchSerial: "PATEK-20240003", IssueDescription: "机芯需要保养清洗", Status: model.StatusConfirmed, AssignedTechnicianID: &tech.ID, CreatedBy: users["manager"].ID},
		{CustomerID: customers[3].ID, WatchBrand: "浪琴", WatchModel: "Master L2.793.4", WatchSerial: "LONG-20240004", IssueDescription: "防水圈老化，进水雾气", Status: model.StatusRepairing, AssignedTechnicianID: &tech.ID, CreatedBy: users["consultant"].ID},
		{CustomerID: customers[4].ID, WatchBrand: "天梭", WatchModel: "PRX T137.410", WatchSerial: "TISS-20240005", IssueDescription: "表带断裂需要更换", Status: model.StatusCompleted, AssignedTechnicianID: &tech.ID, CreatedBy: users["consultant"].ID},
		{CustomerID: customers[5].ID, WatchBrand: "卡地亚", WatchModel: "Santos WSSA0018", WatchSerial: "CART-20240006", IssueDescription: "表冠松动无法上弦", Status: model.StatusPickedUp, AssignedTechnicianID: &tech.ID, CreatedBy: users["manager"].ID},
		{CustomerID: customers[6].ID, WatchBrand: "万国", WatchModel: "Pilot IW326801", WatchSerial: "IWC-20240007", IssueDescription: "游丝断裂需要更换", Status: model.StatusRegistered, CreatedBy: users["consultant"].ID},
		{CustomerID: customers[7].ID, WatchBrand: "积家", WatchModel: "Reverso Q2508620", WatchSerial: "JLC-20240008", IssueDescription: "摆轮异响，需要校准", Status: model.StatusRegistered, AssignedTechnicianID: &tech.ID, CreatedBy: users["consultant"].ID},
		{CustomerID: customers[0].ID, WatchBrand: "帝舵", WatchModel: "Black Bay M79230N", WatchSerial: "TUDOR-20240009", IssueDescription: "发条盒故障，动力储备不足", Status: model.StatusDiagnosing, AssignedTechnicianID: &tech.ID, CreatedBy: users["consultant"].ID},
		{CustomerID: customers[1].ID, WatchBrand: "真力时", WatchModel: "El Primero 03.3200", WatchSerial: "ZENITH-20240010", IssueDescription: "齿轮组磨损严重需要更换", Status: model.StatusQuoted, AssignedTechnicianID: &tech.ID, CreatedBy: users["manager"].ID},
		{CustomerID: customers[2].ID, WatchBrand: "沛纳海", WatchModel: "Luminor PAM00916", WatchSerial: "PANA-20240011", IssueDescription: "表壳有凹陷需要修复", Status: model.StatusConfirmed, AssignedTechnicianID: &tech.ID, CreatedBy: users["consultant"].ID},
		{CustomerID: customers[3].ID, WatchBrand: "百年灵", WatchModel: "Navitimer AB0127", WatchSerial: "BREIT-20240012", IssueDescription: "计时功能失灵", Status: model.StatusRepairing, AssignedTechnicianID: &tech.ID, CreatedBy: users["consultant"].ID},
		{CustomerID: customers[4].ID, WatchBrand: "爱彼", WatchModel: "Royal Oak 15500ST", WatchSerial: "AP-20240013", IssueDescription: "表扣松动需要调整", Status: model.StatusCompleted, AssignedTechnicianID: &tech.ID, CreatedBy: users["manager"].ID},
		{CustomerID: customers[5].ID, WatchBrand: "宝珀", WatchModel: "Fifty Fathoms 5015", WatchSerial: "BLANCP-20240014", IssueDescription: "表盘指针脱落", Status: model.StatusPickedUp, AssignedTechnicianID: &tech.ID, CreatedBy: users["consultant"].ID},
		{CustomerID: customers[6].ID, WatchBrand: "江诗丹顿", WatchModel: "Overseas 4500V", WatchSerial: "VC-20240015", IssueDescription: "自动陀卡顿，上链效率低", Status: model.StatusRegistered, CreatedBy: users["consultant"].ID},
	}

	now := time.Now()
	for i := range orders {
		switch orders[i].Status {
		case model.StatusPickedUp:
			past := now.Add(-72 * time.Hour)
			orders[i].CompletedAt = &past
			pickedUp := now.Add(-24 * time.Hour)
			orders[i].PickedUpAt = &pickedUp
		case model.StatusCompleted:
			past := now.Add(-48 * time.Hour)
			orders[i].CompletedAt = &past
			est := now.Add(-24 * time.Hour)
			orders[i].EstimatedCompletion = &est
		case model.StatusRepairing:
			est := now.Add(48 * time.Hour)
			orders[i].EstimatedCompletion = &est
		case model.StatusConfirmed:
			est := now.Add(72 * time.Hour)
			orders[i].EstimatedCompletion = &est
		case model.StatusQuoted:
			price1 := 450.00
			note1 := "更换表镜费用含人工"
			orders[i].QuotationPrice = &price1
			orders[i].QuotationNote = &note1
		}

		price2 := 960.00
		note2 := "更换齿轮组费用含人工"
		if orders[i].OrderNo == "" && orders[i].WatchSerial == "ZENITH-20240010" {
			orders[i].QuotationPrice = &price2
			orders[i].QuotationNote = &note2
		}

		db.Create(&orders[i])
	}

	return orders
}

func seedPartLocks(db *gorm.DB, orders []model.RepairOrder, parts []model.Part, users map[string]model.User) {
	locks := []model.PartLock{
		{RepairOrderID: orders[3].ID, PartID: parts[6].ID, Quantity: 2, LockedBy: users["technician"].ID, LockedAt: time.Now().Add(-24 * time.Hour)},
		{RepairOrderID: orders[3].ID, PartID: parts[5].ID, Quantity: 1, LockedBy: users["technician"].ID, LockedAt: time.Now().Add(-24 * time.Hour)},
		{RepairOrderID: orders[4].ID, PartID: parts[2].ID, Quantity: 1, LockedBy: users["technician"].ID, LockedAt: time.Now().Add(-72 * time.Hour), ReleasedAt: func() *time.Time { t := time.Now().Add(-48 * time.Hour); return &t }()},
		{RepairOrderID: orders[9].ID, PartID: parts[10].ID, Quantity: 5, LockedBy: users["technician"].ID, LockedAt: time.Now().Add(-12 * time.Hour)},
	}

	for i := range locks {
		db.Create(&locks[i])
	}

	db.Model(&model.Part{}).Where("id = ?", parts[6].ID).Update("locked_quantity", 2)
	db.Model(&model.Part{}).Where("id = ?", parts[5].ID).Update("locked_quantity", 1)
	db.Model(&model.Part{}).Where("id = ?", parts[10].ID).Update("locked_quantity", 5)

	conflictLock1 := model.PartLock{
		RepairOrderID: orders[11].ID,
		PartID:        parts[3].ID,
		Quantity:      15,
		LockedBy:      users["technician"].ID,
		LockedAt:      time.Now().Add(-6 * time.Hour),
	}
	db.Create(&conflictLock1)
	db.Model(&model.Part{}).Where("id = ?", parts[3].ID).Update("locked_quantity", 15)

	conflictLock2 := model.PartLock{
		RepairOrderID: orders[8].ID,
		PartID:        parts[7].ID,
		Quantity:      10,
		LockedBy:      users["technician"].ID,
		LockedAt:      time.Now().Add(-3 * time.Hour),
	}
	db.Create(&conflictLock2)
	db.Model(&model.Part{}).Where("id = ?", parts[7].ID).Update("locked_quantity", 10)
}

func seedProgressLogs(db *gorm.DB, orders []model.RepairOrder, users map[string]model.User) {
	logs := []model.ProgressLog{
		{RepairOrderID: orders[0].ID, StatusFrom: string(model.StatusRegistered), StatusTo: string(model.StatusDiagnosing), Note: "开始检测走时问题", OperatorID: users["technician"].ID},
		{RepairOrderID: orders[1].ID, StatusFrom: string(model.StatusRegistered), StatusTo: string(model.StatusDiagnosing), Note: "检测表镜损伤程度", OperatorID: users["technician"].ID},
		{RepairOrderID: orders[1].ID, StatusFrom: string(model.StatusDiagnosing), StatusTo: string(model.StatusQuoted), Note: "报价更换原装表镜", OperatorID: users["consultant"].ID},
		{RepairOrderID: orders[2].ID, StatusFrom: string(model.StatusRegistered), StatusTo: string(model.StatusDiagnosing), Note: "机芯拆解检测中", OperatorID: users["technician"].ID},
		{RepairOrderID: orders[2].ID, StatusFrom: string(model.StatusDiagnosing), StatusTo: string(model.StatusQuoted), Note: "保养费用报价", OperatorID: users["manager"].ID},
		{RepairOrderID: orders[2].ID, StatusFrom: string(model.StatusQuoted), StatusTo: string(model.StatusConfirmed), Note: "客户确认保养", OperatorID: users["consultant"].ID},
		{RepairOrderID: orders[3].ID, StatusFrom: string(model.StatusRegistered), StatusTo: string(model.StatusDiagnosing), Note: "检测防水性能", OperatorID: users["technician"].ID},
		{RepairOrderID: orders[3].ID, StatusFrom: string(model.StatusDiagnosing), StatusTo: string(model.StatusQuoted), Note: "更换防水圈报价", OperatorID: users["consultant"].ID},
		{RepairOrderID: orders[3].ID, StatusFrom: string(model.StatusQuoted), StatusTo: string(model.StatusConfirmed), Note: "客户确认维修", OperatorID: users["consultant"].ID},
		{RepairOrderID: orders[3].ID, StatusFrom: string(model.StatusConfirmed), StatusTo: string(model.StatusRepairing), Note: "开始更换防水圈", OperatorID: users["technician"].ID},
		{RepairOrderID: orders[4].ID, StatusFrom: string(model.StatusRegistered), StatusTo: string(model.StatusDiagnosing), Note: "检测表带损坏情况", OperatorID: users["technician"].ID},
		{RepairOrderID: orders[4].ID, StatusFrom: string(model.StatusDiagnosing), StatusTo: string(model.StatusQuoted), Note: "更换原装表带", OperatorID: users["consultant"].ID},
		{RepairOrderID: orders[4].ID, StatusFrom: string(model.StatusQuoted), StatusTo: string(model.StatusConfirmed), Note: "客户确认更换", OperatorID: users["consultant"].ID},
		{RepairOrderID: orders[4].ID, StatusFrom: string(model.StatusConfirmed), StatusTo: string(model.StatusRepairing), Note: "安装新表带", OperatorID: users["technician"].ID},
		{RepairOrderID: orders[4].ID, StatusFrom: string(model.StatusRepairing), StatusTo: string(model.StatusCompleted), Note: "表带更换完成", OperatorID: users["technician"].ID},
		{RepairOrderID: orders[5].ID, StatusFrom: string(model.StatusRegistered), StatusTo: string(model.StatusDiagnosing), Note: "检测表冠问题", OperatorID: users["technician"].ID},
		{RepairOrderID: orders[5].ID, StatusFrom: string(model.StatusDiagnosing), StatusTo: string(model.StatusQuoted), Note: "更换表冠组件", OperatorID: users["manager"].ID},
		{RepairOrderID: orders[5].ID, StatusFrom: string(model.StatusQuoted), StatusTo: string(model.StatusConfirmed), Note: "客户确认维修", OperatorID: users["consultant"].ID},
		{RepairOrderID: orders[5].ID, StatusFrom: string(model.StatusConfirmed), StatusTo: string(model.StatusRepairing), Note: "更换表冠中", OperatorID: users["technician"].ID},
		{RepairOrderID: orders[5].ID, StatusFrom: string(model.StatusRepairing), StatusTo: string(model.StatusCompleted), Note: "维修完成", OperatorID: users["technician"].ID},
		{RepairOrderID: orders[5].ID, StatusFrom: string(model.StatusCompleted), StatusTo: string(model.StatusPickedUp), Note: "客户已取件", OperatorID: users["consultant"].ID},
		{RepairOrderID: orders[8].ID, StatusFrom: string(model.StatusRegistered), StatusTo: string(model.StatusDiagnosing), Note: "开始检测发条盒", OperatorID: users["technician"].ID},
		{RepairOrderID: orders[9].ID, StatusFrom: string(model.StatusRegistered), StatusTo: string(model.StatusDiagnosing), Note: "检测齿轮组磨损", OperatorID: users["technician"].ID},
		{RepairOrderID: orders[9].ID, StatusFrom: string(model.StatusDiagnosing), StatusTo: string(model.StatusQuoted), Note: "齿轮组更换报价", OperatorID: users["manager"].ID},
		{RepairOrderID: orders[10].ID, StatusFrom: string(model.StatusRegistered), StatusTo: string(model.StatusDiagnosing), Note: "检测表壳凹陷", OperatorID: users["technician"].ID},
		{RepairOrderID: orders[10].ID, StatusFrom: string(model.StatusDiagnosing), StatusTo: string(model.StatusQuoted), Note: "表壳修复报价", OperatorID: users["consultant"].ID},
		{RepairOrderID: orders[10].ID, StatusFrom: string(model.StatusQuoted), StatusTo: string(model.StatusConfirmed), Note: "客户确认修复", OperatorID: users["consultant"].ID},
		{RepairOrderID: orders[11].ID, StatusFrom: string(model.StatusRegistered), StatusTo: string(model.StatusDiagnosing), Note: "检测计时功能", OperatorID: users["technician"].ID},
		{RepairOrderID: orders[11].ID, StatusFrom: string(model.StatusDiagnosing), StatusTo: string(model.StatusQuoted), Note: "计时模块修复报价", OperatorID: users["consultant"].ID},
		{RepairOrderID: orders[11].ID, StatusFrom: string(model.StatusQuoted), StatusTo: string(model.StatusConfirmed), Note: "客户确认", OperatorID: users["consultant"].ID},
		{RepairOrderID: orders[11].ID, StatusFrom: string(model.StatusConfirmed), StatusTo: string(model.StatusRepairing), Note: "开始修复计时功能", OperatorID: users["technician"].ID},
		{RepairOrderID: orders[12].ID, StatusFrom: string(model.StatusRegistered), StatusTo: string(model.StatusDiagnosing), Note: "检测表扣", OperatorID: users["technician"].ID},
		{RepairOrderID: orders[12].ID, StatusFrom: string(model.StatusDiagnosing), StatusTo: string(model.StatusQuoted), Note: "表扣调整报价", OperatorID: users["manager"].ID},
		{RepairOrderID: orders[12].ID, StatusFrom: string(model.StatusQuoted), StatusTo: string(model.StatusConfirmed), Note: "客户确认", OperatorID: users["consultant"].ID},
		{RepairOrderID: orders[12].ID, StatusFrom: string(model.StatusConfirmed), StatusTo: string(model.StatusRepairing), Note: "调整表扣", OperatorID: users["technician"].ID},
		{RepairOrderID: orders[12].ID, StatusFrom: string(model.StatusRepairing), StatusTo: string(model.StatusCompleted), Note: "表扣调整完成", OperatorID: users["technician"].ID},
		{RepairOrderID: orders[13].ID, StatusFrom: string(model.StatusRegistered), StatusTo: string(model.StatusDiagnosing), Note: "检测指针", OperatorID: users["technician"].ID},
		{RepairOrderID: orders[13].ID, StatusFrom: string(model.StatusDiagnosing), StatusTo: string(model.StatusQuoted), Note: "指针修复报价", OperatorID: users["consultant"].ID},
		{RepairOrderID: orders[13].ID, StatusFrom: string(model.StatusQuoted), StatusTo: string(model.StatusConfirmed), Note: "客户确认", OperatorID: users["consultant"].ID},
		{RepairOrderID: orders[13].ID, StatusFrom: string(model.StatusConfirmed), StatusTo: string(model.StatusRepairing), Note: "修复指针", OperatorID: users["technician"].ID},
		{RepairOrderID: orders[13].ID, StatusFrom: string(model.StatusRepairing), StatusTo: string(model.StatusCompleted), Note: "修复完成", OperatorID: users["technician"].ID},
		{RepairOrderID: orders[13].ID, StatusFrom: string(model.StatusCompleted), StatusTo: string(model.StatusPickedUp), Note: "客户已取件", OperatorID: users["consultant"].ID},
	}

	for i := range logs {
		db.Create(&logs[i])
	}
}

func seedCallbacks(db *gorm.DB, orders []model.RepairOrder, users map[string]model.User) {
	now := time.Now()

	completedAt1 := now.Add(-48 * time.Hour)
	satisfied := model.ResultSatisfied
	note1 := "客户对维修非常满意"
	callbacks := []model.SatisfactionCallback{
		{RepairOrderID: orders[4].ID, CallbackType: model.CallbackSatisfaction, ScheduledAt: now.Add(-24 * time.Hour), CompletedAt: &completedAt1, Result: &satisfied, Note: &note1, OperatorID: users["consultant"].ID},
		{RepairOrderID: orders[5].ID, CallbackType: model.CallbackSatisfaction, ScheduledAt: now.Add(-48 * time.Hour), CompletedAt: nil, Result: nil, OperatorID: users["consultant"].ID},
		{RepairOrderID: orders[12].ID, CallbackType: model.CallbackSatisfaction, ScheduledAt: now.Add(72 * time.Hour), OperatorID: users["consultant"].ID},
		{RepairOrderID: orders[13].ID, CallbackType: model.CallbackQualityCheck, ScheduledAt: now.Add(-36 * time.Hour), OperatorID: users["manager"].ID},
	}

	for i := range callbacks {
		db.Create(&callbacks[i])
	}

	overdueCallback := model.SatisfactionCallback{
		RepairOrderID: orders[13].ID,
		CallbackType:  model.CallbackSatisfaction,
		ScheduledAt:   now.Add(-72 * time.Hour),
		OperatorID:    users["manager"].ID,
	}
	db.Create(&overdueCallback)
}

func seedAuditLogs(db *gorm.DB, users map[string]model.User, orders []model.RepairOrder) {
	now := time.Now()

	auditLogs := []model.AuditLog{
		{EntityType: "repair_order", EntityID: orders[0].ID, Action: "create", NewValue: model.JSONB{"status": "registered"}, OperatorID: users["consultant"].ID, OperatorName: users["consultant"].DisplayName, CreatedAt: now.Add(-96 * time.Hour)},
		{EntityType: "repair_order", EntityID: orders[0].ID, Action: "status_change", OldValue: model.JSONB{"status": "registered"}, NewValue: model.JSONB{"status": "diagnosing"}, OperatorID: users["technician"].ID, OperatorName: users["technician"].DisplayName, CreatedAt: now.Add(-90 * time.Hour)},
		{EntityType: "repair_order", EntityID: orders[5].ID, Action: "create", NewValue: model.JSONB{"status": "registered"}, OperatorID: users["manager"].ID, OperatorName: users["manager"].DisplayName, CreatedAt: now.Add(-168 * time.Hour)},
		{EntityType: "repair_order", EntityID: orders[5].ID, Action: "status_change", OldValue: model.JSONB{"status": "completed"}, NewValue: model.JSONB{"status": "diagnosing", "error": "invalid transition"}, OperatorID: users["technician"].ID, OperatorName: users["technician"].DisplayName, CreatedAt: now.Add(-36 * time.Hour)},
	}

	for i := range auditLogs {
		db.Create(&auditLogs[i])
	}

	fmt.Println("[Seed] Created audit log with invalid status transition attempt (completed → diagnosing)")
}
