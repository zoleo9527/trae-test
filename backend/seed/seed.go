package seed

import (
	"instrument-rental/config"
	"instrument-rental/database"
	"instrument-rental/middleware"
	"instrument-rental/model"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func Run(cfg *config.Config) {
	if !shouldSeed() {
		return
	}
	seedUsers(cfg)
	seedInstruments()
	seedSchools()
	seedRentals()
	seedPayments()
	seedMaintenances()
	seedReturnRecords()
}

func shouldSeed() bool {
	var count int64
	database.DB.Model(&model.User{}).Count(&count)
	return count == 0
}

func seedUsers(cfg *config.Config) {
	users := []struct {
		Username string
		Password string
		Name     string
		Phone    string
		Role     model.Role
	}{
		{"admin", "admin123", "系统管理员", "13800000001", model.RoleAdmin},
		{"consultant1", "consult123", "张顾问", "13800000002", model.RoleConsultant},
		{"consultant2", "consult123", "李顾问", "13800000003", model.RoleConsultant},
		{"technician1", "tech123", "王师傅", "13800000004", model.RoleMaintenance},
		{"technician2", "tech123", "赵师傅", "13800000005", model.RoleMaintenance},
		{"store_owner1", "store123", "陈店长", "13800000006", model.RoleStoreOwner},
	}
	for _, u := range users {
		hash, _ := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
		user := model.User{
			Username:     u.Username,
			PasswordHash: string(hash),
			Name:         u.Name,
			Phone:        u.Phone,
			Role:         u.Role,
			IsActive:     true,
		}
		database.DB.Create(&user)
	}
}

func seedInstruments() {
	instruments := []model.Instrument{
		{Name: "Yamaha U1 立式钢琴", Type: "piano", Brand: "Yamaha", Model: "U1", SerialNumber: "YMH-U1-001", Status: model.InstrumentRented, PurchasePrice: 35000, DailyRentalRate: 80, DepositAmount: 5000},
		{Name: "Yamaha U3 立式钢琴", Type: "piano", Brand: "Yamaha", Model: "U3", SerialNumber: "YMH-U3-002", Status: model.InstrumentAvailable, PurchasePrice: 42000, DailyRentalRate: 100, DepositAmount: 6000},
		{Name: "Kawai K-300 立式钢琴", Type: "piano", Brand: "Kawai", Model: "K-300", SerialNumber: "KWI-K300-003", Status: model.InstrumentRented, PurchasePrice: 38000, DailyRentalRate: 85, DepositAmount: 5000},
		{Name: "Roland FP-90X 电钢琴", Type: "digital_piano", Brand: "Roland", Model: "FP-90X", SerialNumber: "RLD-FP90X-004", Status: model.InstrumentAvailable, PurchasePrice: 12000, DailyRentalRate: 40, DepositAmount: 2000},
		{Name: "Yamaha YFL-462H 长笛", Type: "flute", Brand: "Yamaha", Model: "YFL-462H", SerialNumber: "YMH-FL462-005", Status: model.InstrumentRented, PurchasePrice: 8500, DailyRentalRate: 30, DepositAmount: 1500},
		{Name: "Selmer SAS280R 萨克斯", Type: "saxophone", Brand: "Selmer", Model: "SAS280R", SerialNumber: "SLM-SAX280-006", Status: model.InstrumentMaintenance, PurchasePrice: 28000, DailyRentalRate: 60, DepositAmount: 4000},
		{Name: "Yamaha YTR-3335 小号", Type: "trumpet", Brand: "Yamaha", Model: "YTR-3335", SerialNumber: "YMH-TR3335-007", Status: model.InstrumentAvailable, PurchasePrice: 6500, DailyRentalRate: 25, DepositAmount: 1000},
		{Name: "Jupiter JCL1100S 单簧管", Type: "clarinet", Brand: "Jupiter", Model: "JCL1100S", SerialNumber: "JPT-CL1100-008", Status: model.InstrumentAvailable, PurchasePrice: 5500, DailyRentalRate: 20, DepositAmount: 800},
		{Name: "Stentor Student 小提琴 4/4", Type: "violin", Brand: "Stentor", Model: "Student", SerialNumber: "STN-VLN001-009", Status: model.InstrumentRented, PurchasePrice: 3000, DailyRentalRate: 15, DepositAmount: 500},
		{Name: "Eastman VL305 小提琴", Type: "violin", Brand: "Eastman", Model: "VL305", SerialNumber: "EST-VL305-010", Status: model.InstrumentAvailable, PurchasePrice: 8000, DailyRentalRate: 35, DepositAmount: 1500},
	}
	for i := range instruments {
		database.DB.Create(&instruments[i])
	}
}

func seedSchools() {
	cs1 := mustParseDate("2025-09-01")
	ce1 := mustParseDate("2026-08-31")
	cs2 := mustParseDate("2025-03-01")
	ce2 := mustParseDate("2026-02-28")
	cs3 := mustParseDate("2024-09-01")
	ce3 := mustParseDate("2025-08-31")
	schools := []model.School{
		{Name: "北京市朝阳区实验小学", ContactPerson: "刘主任", ContactPhone: "010-65001234", Address: "北京市朝阳区建国路88号", CooperationStatus: model.SchoolActive, ContractStart: &cs1, ContractEnd: &ce1},
		{Name: "上海市浦东新区明珠小学", ContactPerson: "孙校长", ContactPhone: "021-58001234", Address: "上海市浦东新区陆家嘴环路100号", CooperationStatus: model.SchoolActive, ContractStart: &cs2, ContractEnd: &ce2},
		{Name: "广州市天河区华阳小学", ContactPerson: "黄老师", ContactPhone: "020-38001234", Address: "广州市天河区体育西路200号", CooperationStatus: model.SchoolActive, ContractStart: &cs1, ContractEnd: &ce1},
		{Name: "深圳市南山区育才一小", ContactPerson: "吴主任", ContactPhone: "0755-26001234", Address: "深圳市南山区蛇口路50号", CooperationStatus: model.SchoolSuspended, ContractStart: &cs3, ContractEnd: &ce3},
		{Name: "杭州市西湖区学军小学", ContactPerson: "陈校长", ContactPhone: "0571-87001234", Address: "杭州市西湖区文三路120号", CooperationStatus: model.SchoolActive, ContractStart: &cs1, ContractEnd: &ce1},
	}
	for i := range schools {
		database.DB.Create(&schools[i])
	}
}

func seedRentals() {
	rd1 := mustParseDate("2025-10-15")
	erd1 := mustParseDate("2026-06-15")
	rd2 := mustParseDate("2025-11-01")
	erd2 := mustParseDate("2026-05-31")
	rd3 := mustParseDate("2025-09-01")
	erd3 := mustParseDate("2026-01-31")
	rd4 := mustParseDate("2025-12-01")
	erd4 := mustParseDate("2026-07-31")
	rentals := []model.Rental{
		{InstrumentID: 1, SchoolID: 1, UserID: 2, RentalDate: rd1, ExpectedReturnDate: erd1, Status: model.RentalActive, DepositAmount: 5000, DepositStatus: model.DepositCollected, DailyRate: 80},
		{InstrumentID: 3, SchoolID: 2, UserID: 2, RentalDate: rd2, ExpectedReturnDate: erd2, Status: model.RentalActive, DepositAmount: 5000, DepositStatus: model.DepositCollected, DailyRate: 85},
		{InstrumentID: 5, SchoolID: 3, UserID: 3, RentalDate: rd3, ExpectedReturnDate: erd3, Status: model.RentalOverdue, DepositAmount: 1500, DepositStatus: model.DepositCollected, DailyRate: 30},
		{InstrumentID: 9, SchoolID: 5, UserID: 3, RentalDate: rd4, ExpectedReturnDate: erd4, Status: model.RentalActive, DepositAmount: 500, DepositStatus: model.DepositCollected, DailyRate: 15},
	}
	for i := range rentals {
		database.DB.Create(&rentals[i])
	}
}

func seedPayments() {
	dd1 := mustParseDate("2026-01-15")
	dd2 := mustParseDate("2026-02-15")
	dd3 := mustParseDate("2026-03-15")
	dd4 := mustParseDate("2025-12-31")
	pd1 := mustParseDate("2026-01-10")
	payments := []model.Payment{
		{SchoolID: 1, RentalID: 1, Amount: 6720, PaidAmount: 6720, DueDate: dd1, PaidDate: &pd1, Status: model.PaymentPaid, PaymentMethod: "bank_transfer", InvoiceNumber: "INV-2026-001"},
		{SchoolID: 1, RentalID: 1, Amount: 6720, PaidAmount: 0, DueDate: dd2, Status: model.PaymentPending},
		{SchoolID: 2, RentalID: 2, Amount: 6970, PaidAmount: 3000, DueDate: dd3, Status: model.PaymentPartial, PaymentMethod: "bank_transfer"},
		{SchoolID: 3, RentalID: 3, Amount: 1530, PaidAmount: 0, DueDate: dd4, Status: model.PaymentOverdue},
		{SchoolID: 5, RentalID: 4, Amount: 1080, PaidAmount: 0, DueDate: dd2, Status: model.PaymentPending},
	}
	for i := range payments {
		database.DB.Create(&payments[i])
	}
}

func seedMaintenances() {
	sd1 := mustParseDate("2026-01-20")
	sd2 := mustParseDate("2026-02-10")
	ed2 := mustParseDate("2026-02-25")
	maintenances := []model.Maintenance{
		{InstrumentID: 6, Type: model.MaintenanceRepair, Description: "萨克斯按键松动，需更换软木垫", Cost: 350, TechnicianID: 4, Status: model.MaintenanceInProgress, StartDate: sd1},
		{InstrumentID: 2, Type: model.MaintenanceRoutine, Description: "钢琴调律保养", Cost: 200, TechnicianID: 5, Status: model.MaintenanceCompleted, StartDate: sd2, EndDate: &ed2},
	}
	for i := range maintenances {
		database.DB.Create(&maintenances[i])
	}
}

func seedReturnRecords() {
	rd := mustParseDate("2026-02-01")
	records := []model.ReturnRecord{
		{RentalID: 3, ReturnDate: rd, Condition: model.ReturnMinorDamage, DamageDescription: "长笛按键有轻微刮痕，不影响演奏", DepositDeduction: 200, DepositRefund: 1300, AssessorID: 2, Status: model.ReturnPendingReview},
	}
	for i := range records {
		database.DB.Create(&records[i])
	}
}

func mustParseDate(s string) time.Time {
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		panic(err)
	}
	return t
}

var _ = gorm.Model{}
var _ = middleware.GenerateToken
