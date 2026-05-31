package seed

import (
	"floor-settlement/internal/model"
	"floor-settlement/internal/service"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func Seed(db *gorm.DB, authService *service.AuthService) error {
	project1ID := uuid.MustParse("10000000-0000-0000-0000-000000000001")
	team1ID := uuid.MustParse("20000000-0000-0000-0000-000000000001")
	team2ID := uuid.MustParse("20000000-0000-0000-0000-000000000002")
	adminID := uuid.MustParse("30000000-0000-0000-0000-000000000001")
	wangjmID := uuid.MustParse("30000000-0000-0000-0000-000000000002")
	liqcID := uuid.MustParse("30000000-0000-0000-0000-000000000003")
	zhangwfID := uuid.MustParse("30000000-0000-0000-0000-000000000004")
	chensbID := uuid.MustParse("30000000-0000-0000-0000-000000000005")

	att1ID := uuid.MustParse("40000000-0000-0000-0000-000000000001")
	att2ID := uuid.MustParse("40000000-0000-0000-0000-000000000002")
	att3ID := uuid.MustParse("40000000-0000-0000-0000-000000000003")
	att4ID := uuid.MustParse("40000000-0000-0000-0000-000000000004")
	att5ID := uuid.MustParse("40000000-0000-0000-0000-000000000005")
	att6ID := uuid.MustParse("40000000-0000-0000-0000-000000000006")
	att7ID := uuid.MustParse("40000000-0000-0000-0000-000000000007")
	att8ID := uuid.MustParse("40000000-0000-0000-0000-000000000008")
	att9ID := uuid.MustParse("40000000-0000-0000-0000-000000000009")
	att10ID := uuid.MustParse("40000000-0000-0000-0000-000000000010")
	att11ID := uuid.MustParse("40000000-0000-0000-0000-000000000011")
	att12ID := uuid.MustParse("40000000-0000-0000-0000-000000000012")
	att13ID := uuid.MustParse("40000000-0000-0000-0000-000000000013")
	att14ID := uuid.MustParse("40000000-0000-0000-0000-000000000014")
	att15ID := uuid.MustParse("40000000-0000-0000-0000-000000000015")
	att16ID := uuid.MustParse("40000000-0000-0000-0000-000000000016")
	att17ID := uuid.MustParse("40000000-0000-0000-0000-000000000017")
	att18ID := uuid.MustParse("40000000-0000-0000-0000-000000000018")
	att19ID := uuid.MustParse("40000000-0000-0000-0000-000000000019")
	att20ID := uuid.MustParse("40000000-0000-0000-0000-000000000020")
	att21ID := uuid.MustParse("40000000-0000-0000-0000-000000000021")
	att22ID := uuid.MustParse("40000000-0000-0000-0000-000000000022")

	batch1ID := uuid.MustParse("50000000-0000-0000-0000-000000000001")
	batch2ID := uuid.MustParse("50000000-0000-0000-0000-000000000002")
	si1ID := uuid.MustParse("51000000-0000-0000-0000-000000000001")
	si2ID := uuid.MustParse("51000000-0000-0000-0000-000000000002")
	si3ID := uuid.MustParse("51000000-0000-0000-0000-000000000003")
	si4ID := uuid.MustParse("51000000-0000-0000-0000-000000000004")
	si5ID := uuid.MustParse("51000000-0000-0000-0000-000000000005")
	si6ID := uuid.MustParse("51000000-0000-0000-0000-000000000006")
	si7ID := uuid.MustParse("51000000-0000-0000-0000-000000000007")
	si8ID := uuid.MustParse("51000000-0000-0000-0000-000000000008")
	si9ID := uuid.MustParse("51000000-0000-0000-0000-000000000009")
	si10ID := uuid.MustParse("51000000-0000-0000-0000-000000000010")
	si11ID := uuid.MustParse("51000000-0000-0000-0000-000000000011")
	si12ID := uuid.MustParse("51000000-0000-0000-0000-000000000012")

	qi1ID := uuid.MustParse("60000000-0000-0000-0000-000000000001")
	qi2ID := uuid.MustParse("60000000-0000-0000-0000-000000000002")
	qi3ID := uuid.MustParse("60000000-0000-0000-0000-000000000003")

	rw1ID := uuid.MustParse("70000000-0000-0000-0000-000000000001")
	rw2ID := uuid.MustParse("70000000-0000-0000-0000-000000000002")

	dr1ID := uuid.MustParse("80000000-0000-0000-0000-000000000001")
	dr2ID := uuid.MustParse("80000000-0000-0000-0000-000000000002")
	dr3ID := uuid.MustParse("80000000-0000-0000-0000-000000000003")
	dr4ID := uuid.MustParse("80000000-0000-0000-0000-000000000004")

	co1ID := uuid.MustParse("90000000-0000-0000-0000-000000000001")
	co2ID := uuid.MustParse("90000000-0000-0000-0000-000000000002")
	co3ID := uuid.MustParse("90000000-0000-0000-0000-000000000003")

	at1ID := uuid.MustParse("a0000000-0000-0000-0000-000000000001")
	at2ID := uuid.MustParse("a0000000-0000-0000-0000-000000000002")
	at3ID := uuid.MustParse("a0000000-0000-0000-0000-000000000003")
	at4ID := uuid.MustParse("a0000000-0000-0000-0000-000000000004")
	at5ID := uuid.MustParse("a0000000-0000-0000-0000-000000000005")
	at6ID := uuid.MustParse("a0000000-0000-0000-0000-000000000006")
	at7ID := uuid.MustParse("a0000000-0000-0000-0000-000000000007")
	at8ID := uuid.MustParse("a0000000-0000-0000-0000-000000000008")
	at9ID := uuid.MustParse("a0000000-0000-0000-0000-000000000009")
	at10ID := uuid.MustParse("a0000000-0000-0000-0000-000000000010")
	at11ID := uuid.MustParse("a0000000-0000-0000-0000-000000000011")
	at12ID := uuid.MustParse("a0000000-0000-0000-0000-000000000012")
	at13ID := uuid.MustParse("a0000000-0000-0000-0000-000000000013")
	at14ID := uuid.MustParse("a0000000-0000-0000-0000-000000000014")

	parseDate := func(s string) time.Time {
		t, _ := time.Parse("2006-01-02", s)
		return t
	}

	parseTime := func(s string) time.Time {
		t, _ := time.Parse("2006-01-02 15:04:05", s)
		return t
	}

	adminHash, _ := authService.HashPassword("admin123")
	wangjmHash, _ := authService.HashPassword("wang123")
	liqcHash, _ := authService.HashPassword("li123")
	zhangwfHash, _ := authService.HashPassword("zhang123")
	chensbHash, _ := authService.HashPassword("chen123")

	users := []model.User{
		{ID: adminID, Username: "admin", PasswordHash: adminHash, RealName: "系统管理员", Role: "admin", Phone: "13800000001", CreatedAt: parseTime("2025-03-01 09:00:00"), UpdatedAt: parseTime("2025-03-01 09:00:00")},
		{ID: wangjmID, Username: "wangjm", PasswordHash: wangjmHash, RealName: "王建明", Role: "project_manager", Phone: "13800000002", ProjectID: &project1ID, CreatedAt: parseTime("2025-03-01 09:05:00"), UpdatedAt: parseTime("2025-03-01 09:05:00")},
		{ID: liqcID, Username: "liqc", PasswordHash: liqcHash, RealName: "李启超", Role: "quality_engineer", Phone: "13800000003", ProjectID: &project1ID, CreatedAt: parseTime("2025-03-01 09:10:00"), UpdatedAt: parseTime("2025-03-01 09:10:00")},
		{ID: zhangwfID, Username: "zhangwf", PasswordHash: zhangwfHash, RealName: "张文发", Role: "team_leader", Phone: "13800000004", ProjectID: &project1ID, TeamID: &team1ID, CreatedAt: parseTime("2025-03-01 09:15:00"), UpdatedAt: parseTime("2025-03-01 09:15:00")},
		{ID: chensbID, Username: "chensb", PasswordHash: chensbHash, RealName: "陈生波", Role: "team_leader", Phone: "13800000005", ProjectID: &project1ID, TeamID: &team2ID, CreatedAt: parseTime("2025-03-01 09:20:00"), UpdatedAt: parseTime("2025-03-01 09:20:00")},
	}
	if err := db.Create(&users).Error; err != nil {
		return err
	}

	projectStartDate := parseDate("2025-03-01")
	projects := []model.Project{
		{ID: project1ID, Name: "华南科技园B区地坪工程", Location: "深圳宝安", Status: "active", StartDate: projectStartDate, CreatedAt: parseTime("2025-03-01 08:00:00"), UpdatedAt: parseTime("2025-03-01 08:00:00")},
	}
	if err := db.Create(&projects).Error; err != nil {
		return err
	}

	teams := []model.Team{
		{ID: team1ID, ProjectID: project1ID, Name: "环氧地坪一组", LeaderName: "张文发", LeaderPhone: "13800000004", TradeType: "环氧地坪", CreatedAt: parseTime("2025-03-01 10:00:00"), UpdatedAt: parseTime("2025-03-01 10:00:00")},
		{ID: team2ID, ProjectID: project1ID, Name: "耐磨地坪二组", LeaderName: "陈生波", LeaderPhone: "13800000005", TradeType: "耐磨地坪", CreatedAt: parseTime("2025-03-01 10:05:00"), UpdatedAt: parseTime("2025-03-01 10:05:00")},
	}
	if err := db.Create(&teams).Error; err != nil {
		return err
	}

	attendances := []model.AttendanceRecord{
		{ID: att1ID, TeamID: team1ID, ProjectID: project1ID, RecordDate: parseDate("2025-04-01"), WorkerName: "张文发", WorkerIDCard: "440306199001011234", Status: "present", HoursWorked: 8.0, WorkArea: "A1仓库", TaskDescription: "环氧底漆施工", CreatedBy: zhangwfID, CreatedAt: parseTime("2025-04-01 18:00:00"), UpdatedAt: parseTime("2025-04-01 18:00:00")},
		{ID: att2ID, TeamID: team1ID, ProjectID: project1ID, RecordDate: parseDate("2025-04-01"), WorkerName: "李大强", WorkerIDCard: "440306199205062345", Status: "present", HoursWorked: 8.0, WorkArea: "A1仓库", TaskDescription: "基层处理", CreatedBy: zhangwfID, CreatedAt: parseTime("2025-04-01 18:05:00"), UpdatedAt: parseTime("2025-04-01 18:05:00")},
		{ID: att3ID, TeamID: team1ID, ProjectID: project1ID, RecordDate: parseDate("2025-04-02"), WorkerName: "王志刚", WorkerIDCard: "440306198812103456", Status: "present", HoursWorked: 9.0, WorkArea: "B2车间", TaskDescription: "环氧中涂施工", Remark: "加班两小时", CreatedBy: zhangwfID, CreatedAt: parseTime("2025-04-02 19:00:00"), UpdatedAt: parseTime("2025-04-02 19:00:00")},
		{ID: att4ID, TeamID: team1ID, ProjectID: project1ID, RecordDate: parseDate("2025-04-02"), WorkerName: "刘明华", WorkerIDCard: "440306199307154567", Status: "late", HoursWorked: 7.0, WorkArea: "B2车间", TaskDescription: "刮涂作业", CreatedBy: zhangwfID, CreatedAt: parseTime("2025-04-02 19:05:00"), UpdatedAt: parseTime("2025-04-02 19:05:00")},
		{ID: att5ID, TeamID: team1ID, ProjectID: project1ID, RecordDate: parseDate("2025-04-03"), WorkerName: "赵德才", WorkerIDCard: "440306199108205678", Status: "present", HoursWorked: 8.0, WorkArea: "A1仓库", TaskDescription: "面漆滚涂", CreatedBy: zhangwfID, CreatedAt: parseTime("2025-04-03 18:00:00"), UpdatedAt: parseTime("2025-04-03 18:00:00")},
		{ID: att6ID, TeamID: team1ID, ProjectID: project1ID, RecordDate: parseDate("2025-04-04"), WorkerName: "张文发", WorkerIDCard: "440306199001011234", Status: "absent", HoursWorked: 0, WorkArea: "A1仓库", Remark: "上午请假下午到岗", CreatedBy: zhangwfID, CreatedAt: parseTime("2025-04-04 18:00:00"), UpdatedAt: parseTime("2025-04-04 18:00:00")},
		{ID: att7ID, TeamID: team1ID, ProjectID: project1ID, RecordDate: parseDate("2025-04-05"), WorkerName: "李大强", WorkerIDCard: "440306199205062345", Status: "present", HoursWorked: 10.0, WorkArea: "C3展厅", TaskDescription: "环氧自流平施工", Remark: "加班两小时", CreatedBy: zhangwfID, CreatedAt: parseTime("2025-04-05 19:30:00"), UpdatedAt: parseTime("2025-04-05 19:30:00")},
		{ID: att8ID, TeamID: team1ID, ProjectID: project1ID, RecordDate: parseDate("2025-04-06"), WorkerName: "王志刚", WorkerIDCard: "440306198812103456", Status: "present", HoursWorked: 8.0, WorkArea: "A1仓库", TaskDescription: "环氧面漆施工", CreatedBy: zhangwfID, CreatedAt: parseTime("2025-04-06 18:00:00"), UpdatedAt: parseTime("2025-04-06 18:00:00")},
		{ID: att9ID, TeamID: team1ID, ProjectID: project1ID, RecordDate: parseDate("2025-04-07"), WorkerName: "刘明华", WorkerIDCard: "440306199307154567", Status: "leave", HoursWorked: 0, WorkArea: "", CreatedBy: zhangwfID, CreatedAt: parseTime("2025-04-07 18:00:00"), UpdatedAt: parseTime("2025-04-07 18:00:00")},
		{ID: att10ID, TeamID: team1ID, ProjectID: project1ID, RecordDate: parseDate("2025-04-08"), WorkerName: "赵德才", WorkerIDCard: "440306199108205678", Status: "present", HoursWorked: 8.0, WorkArea: "B2车间", TaskDescription: "底漆补涂", CreatedBy: zhangwfID, CreatedAt: parseTime("2025-04-08 18:00:00"), UpdatedAt: parseTime("2025-04-08 18:00:00")},
		{ID: att11ID, TeamID: team1ID, ProjectID: project1ID, RecordDate: parseDate("2025-04-10"), WorkerName: "张文发", WorkerIDCard: "440306199001011234", Status: "present", HoursWorked: 9.0, WorkArea: "A1仓库", TaskDescription: "环氧底漆施工", CreatedBy: zhangwfID, CreatedAt: parseTime("2025-04-10 19:00:00"), UpdatedAt: parseTime("2025-04-10 19:00:00")},
		{ID: att12ID, TeamID: team2ID, ProjectID: project1ID, RecordDate: parseDate("2025-04-01"), WorkerName: "陈生波", WorkerIDCard: "440306198705066789", Status: "present", HoursWorked: 8.0, WorkArea: "C3展厅", TaskDescription: "耐磨骨料铺设", CreatedBy: chensbID, CreatedAt: parseTime("2025-04-01 18:00:00"), UpdatedAt: parseTime("2025-04-01 18:00:00")},
		{ID: att13ID, TeamID: team2ID, ProjectID: project1ID, RecordDate: parseDate("2025-04-01"), WorkerName: "周建国", WorkerIDCard: "440306199209117890", Status: "present", HoursWorked: 8.0, WorkArea: "C3展厅", TaskDescription: "基层打磨", CreatedBy: chensbID, CreatedAt: parseTime("2025-04-01 18:05:00"), UpdatedAt: parseTime("2025-04-01 18:05:00")},
		{ID: att14ID, TeamID: team2ID, ProjectID: project1ID, RecordDate: parseDate("2025-04-02"), WorkerName: "吴明亮", WorkerIDCard: "440306199403128901", Status: "present", HoursWorked: 9.0, WorkArea: "D4办公区", TaskDescription: "撒布耐磨料", Remark: "加班两小时", CreatedBy: chensbID, CreatedAt: parseTime("2025-04-02 19:00:00"), UpdatedAt: parseTime("2025-04-02 19:00:00")},
		{ID: att15ID, TeamID: team2ID, ProjectID: project1ID, RecordDate: parseDate("2025-04-03"), WorkerName: "黄志远", WorkerIDCard: "440306198906049012", Status: "late", HoursWorked: 7.0, WorkArea: "C3展厅", TaskDescription: "抹光作业", CreatedBy: chensbID, CreatedAt: parseTime("2025-04-03 18:00:00"), UpdatedAt: parseTime("2025-04-03 18:00:00")},
		{ID: att16ID, TeamID: team2ID, ProjectID: project1ID, RecordDate: parseDate("2025-04-04"), WorkerName: "马永福", WorkerIDCard: "440306199104150123", Status: "present", HoursWorked: 8.0, WorkArea: "D4办公区", TaskDescription: "切缝处理", CreatedBy: chensbID, CreatedAt: parseTime("2025-04-04 18:00:00"), UpdatedAt: parseTime("2025-04-04 18:00:00")},
		{ID: att17ID, TeamID: team2ID, ProjectID: project1ID, RecordDate: parseDate("2025-04-05"), WorkerName: "陈生波", WorkerIDCard: "440306198705066789", Status: "absent", HoursWorked: 0, WorkArea: "", Remark: "请假", CreatedBy: chensbID, CreatedAt: parseTime("2025-04-05 18:00:00"), UpdatedAt: parseTime("2025-04-05 18:00:00")},
		{ID: att18ID, TeamID: team2ID, ProjectID: project1ID, RecordDate: parseDate("2025-04-07"), WorkerName: "周建国", WorkerIDCard: "440306199209117890", Status: "present", HoursWorked: 10.0, WorkArea: "C3展厅", TaskDescription: "养护作业", Remark: "加班两小时", CreatedBy: chensbID, CreatedAt: parseTime("2025-04-07 19:30:00"), UpdatedAt: parseTime("2025-04-07 19:30:00")},
		{ID: att19ID, TeamID: team2ID, ProjectID: project1ID, RecordDate: parseDate("2025-04-08"), WorkerName: "吴明亮", WorkerIDCard: "440306199403128901", Status: "present", HoursWorked: 8.0, WorkArea: "D4办公区", TaskDescription: "耐磨面层收光", CreatedBy: chensbID, CreatedAt: parseTime("2025-04-08 18:00:00"), UpdatedAt: parseTime("2025-04-08 18:00:00")},
		{ID: att20ID, TeamID: team2ID, ProjectID: project1ID, RecordDate: parseDate("2025-04-10"), WorkerName: "黄志远", WorkerIDCard: "440306198906049012", Status: "present", HoursWorked: 8.0, WorkArea: "C3展厅", TaskDescription: "养护检查", CreatedBy: chensbID, CreatedAt: parseTime("2025-04-10 18:00:00"), UpdatedAt: parseTime("2025-04-10 18:00:00")},
		{ID: att21ID, TeamID: team2ID, ProjectID: project1ID, RecordDate: parseDate("2025-04-12"), WorkerName: "马永福", WorkerIDCard: "440306199104150123", Status: "present", HoursWorked: 9.0, WorkArea: "D4办公区", TaskDescription: "二次撒布", CreatedBy: chensbID, CreatedAt: parseTime("2025-04-12 19:00:00"), UpdatedAt: parseTime("2025-04-12 19:00:00")},
		{ID: att22ID, TeamID: team2ID, ProjectID: project1ID, RecordDate: parseDate("2025-04-14"), WorkerName: "陈生波", WorkerIDCard: "440306198705066789", Status: "present", HoursWorked: 8.0, WorkArea: "C3展厅", TaskDescription: "耐磨骨料铺设", CreatedBy: chensbID, CreatedAt: parseTime("2025-04-14 18:00:00"), UpdatedAt: parseTime("2025-04-14 18:00:00")},
	}
	if err := db.Create(&attendances).Error; err != nil {
		return err
	}

	batch1SubmittedAt := parseTime("2025-04-16 09:00:00")
	batch1VerifiedAt := parseTime("2025-04-17 14:30:00")
	batch1ApprovedAt := parseTime("2025-04-18 10:00:00")
	batch2SubmittedAt := parseTime("2025-04-16 10:30:00")

	settlements := []model.SettlementBatch{
		{
			ID: batch1ID, TeamID: team1ID, ProjectID: project1ID,
			PeriodStart: parseDate("2025-04-01"), PeriodEnd: parseDate("2025-04-15"),
			TotalAmount: 5937.50, Status: "approved",
			SubmittedBy: &zhangwfID, VerifiedBy: &liqcID, ApprovedBy: &wangjmID,
			SubmittedAt: &batch1SubmittedAt, VerifiedAt: &batch1VerifiedAt, ApprovedAt: &batch1ApprovedAt,
			Remark: "4月上半月结算，含2天加班",
			CreatedAt: parseTime("2025-04-15 17:00:00"), UpdatedAt: parseTime("2025-04-18 10:00:00"),
			Items: []model.SettlementItem{
				{ID: si1ID, SettlementBatchID: batch1ID, AttendanceRecordID: &att1ID, WorkerName: "张文发", RecordDate: parseDate("2025-04-01"), WorkArea: "A1仓库", WorkContent: "环氧底漆施工", Quantity: 1.0, Unit: "工日", UnitPrice: 950, DailyAmount: 950, CreatedAt: parseTime("2025-04-15 17:00:00")},
				{ID: si2ID, SettlementBatchID: batch1ID, AttendanceRecordID: &att2ID, WorkerName: "李大强", RecordDate: parseDate("2025-04-01"), WorkArea: "A1仓库", WorkContent: "基层处理", Quantity: 1.0, Unit: "工日", UnitPrice: 950, DailyAmount: 950, CreatedAt: parseTime("2025-04-15 17:01:00")},
				{ID: si3ID, SettlementBatchID: batch1ID, AttendanceRecordID: &att3ID, WorkerName: "王志刚", RecordDate: parseDate("2025-04-02"), WorkArea: "B2车间", WorkContent: "环氧中涂施工", Quantity: 1.125, Unit: "工日", UnitPrice: 950, DailyAmount: 1068.75, CreatedAt: parseTime("2025-04-15 17:02:00")},
				{ID: si4ID, SettlementBatchID: batch1ID, AttendanceRecordID: &att4ID, WorkerName: "刘明华", RecordDate: parseDate("2025-04-02"), WorkArea: "B2车间", WorkContent: "刮涂作业", Quantity: 0.875, Unit: "工日", UnitPrice: 950, DailyAmount: 831.25, CreatedAt: parseTime("2025-04-15 17:03:00")},
				{ID: si5ID, SettlementBatchID: batch1ID, AttendanceRecordID: &att5ID, WorkerName: "赵德才", RecordDate: parseDate("2025-04-03"), WorkArea: "A1仓库", WorkContent: "面漆滚涂", Quantity: 1.0, Unit: "工日", UnitPrice: 950, DailyAmount: 950, CreatedAt: parseTime("2025-04-15 17:04:00")},
				{ID: si6ID, SettlementBatchID: batch1ID, AttendanceRecordID: &att7ID, WorkerName: "李大强", RecordDate: parseDate("2025-04-05"), WorkArea: "C3展厅", WorkContent: "环氧自流平施工", Quantity: 1.25, Unit: "工日", UnitPrice: 950, DailyAmount: 1187.50, Remark: "含加班", CreatedAt: parseTime("2025-04-15 17:05:00")},
			},
		},
		{
			ID: batch2ID, TeamID: team2ID, ProjectID: project1ID,
			PeriodStart: parseDate("2025-04-01"), PeriodEnd: parseDate("2025-04-15"),
			TotalAmount: 5300.00, Status: "submitted",
			SubmittedBy: &chensbID,
			SubmittedAt: &batch2SubmittedAt,
			Remark: "4月上半月结算，待质检确认",
			CreatedAt: parseTime("2025-04-15 18:00:00"), UpdatedAt: parseTime("2025-04-16 10:30:00"),
			Items: []model.SettlementItem{
				{ID: si7ID, SettlementBatchID: batch2ID, AttendanceRecordID: &att12ID, WorkerName: "陈生波", RecordDate: parseDate("2025-04-01"), WorkArea: "C3展厅", WorkContent: "耐磨骨料铺设", Quantity: 1.0, Unit: "工日", UnitPrice: 800, DailyAmount: 800, CreatedAt: parseTime("2025-04-15 18:01:00")},
				{ID: si8ID, SettlementBatchID: batch2ID, AttendanceRecordID: &att13ID, WorkerName: "周建国", RecordDate: parseDate("2025-04-01"), WorkArea: "C3展厅", WorkContent: "基层打磨", Quantity: 1.0, Unit: "工日", UnitPrice: 800, DailyAmount: 800, CreatedAt: parseTime("2025-04-15 18:02:00")},
				{ID: si9ID, SettlementBatchID: batch2ID, AttendanceRecordID: &att14ID, WorkerName: "吴明亮", RecordDate: parseDate("2025-04-02"), WorkArea: "D4办公区", WorkContent: "撒布耐磨料", Quantity: 1.125, Unit: "工日", UnitPrice: 800, DailyAmount: 900, Remark: "含加班", CreatedAt: parseTime("2025-04-15 18:03:00")},
				{ID: si10ID, SettlementBatchID: batch2ID, AttendanceRecordID: &att15ID, WorkerName: "黄志远", RecordDate: parseDate("2025-04-03"), WorkArea: "C3展厅", WorkContent: "抹光作业", Quantity: 0.875, Unit: "工日", UnitPrice: 800, DailyAmount: 700, CreatedAt: parseTime("2025-04-15 18:04:00")},
				{ID: si11ID, SettlementBatchID: batch2ID, AttendanceRecordID: &att16ID, WorkerName: "马永福", RecordDate: parseDate("2025-04-04"), WorkArea: "D4办公区", WorkContent: "切缝处理", Quantity: 1.0, Unit: "工日", UnitPrice: 800, DailyAmount: 800, CreatedAt: parseTime("2025-04-15 18:05:00")},
				{ID: si12ID, SettlementBatchID: batch2ID, AttendanceRecordID: &att18ID, WorkerName: "周建国", RecordDate: parseDate("2025-04-07"), WorkArea: "C3展厅", WorkContent: "养护作业", Quantity: 1.25, Unit: "工日", UnitPrice: 800, DailyAmount: 1000, Remark: "含加班", CreatedAt: parseTime("2025-04-15 18:06:00")},
			},
		},
	}
	if err := db.Create(&settlements).Error; err != nil {
		return err
	}

	inspections := []model.QualityInspection{
		{ID: qi1ID, ProjectID: project1ID, TeamID: team1ID, Area: "A1仓库", InspectionDate: parseDate("2025-04-05"), InspectorID: liqcID, Result: "pass", ReworkRequired: false, Remark: "平整度合格，表面光洁", CreatedAt: parseTime("2025-04-05 16:00:00"), UpdatedAt: parseTime("2025-04-05 16:00:00")},
		{ID: qi2ID, ProjectID: project1ID, TeamID: team1ID, Area: "B2车间", InspectionDate: parseDate("2025-04-08"), InspectorID: liqcID, Result: "rework", IssuesFound: "表面起砂，平整度不达标", ReworkRequired: true, Remark: "需要返工处理", CreatedAt: parseTime("2025-04-08 16:30:00"), UpdatedAt: parseTime("2025-04-08 16:30:00")},
		{ID: qi3ID, ProjectID: project1ID, TeamID: team2ID, Area: "C3展厅", InspectionDate: parseDate("2025-04-10"), InspectorID: liqcID, Result: "pass", ReworkRequired: false, Remark: "耐磨层均匀，强度达标", CreatedAt: parseTime("2025-04-10 15:00:00"), UpdatedAt: parseTime("2025-04-10 15:00:00")},
	}
	if err := db.Create(&inspections).Error; err != nil {
		return err
	}

	rw1CompletedAt := parseTime("2025-04-12 17:00:00")
	reworks := []model.ReworkRecord{
		{ID: rw1ID, ProjectID: project1ID, TeamID: team1ID, QualityInspectionID: qi2ID, Reason: "基层处理不到位导致起砂", Description: "重新打磨基层，重新涂布环氧底漆", Cost: 3500, ResponsiblePerson: "张文发", CompletedAt: &rw1CompletedAt, Status: "completed", Remark: "班组承担材料费和人工费", CreatedBy: liqcID, CreatedAt: parseTime("2025-04-09 09:00:00"), UpdatedAt: parseTime("2025-04-12 17:00:00")},
		{ID: rw2ID, ProjectID: project1ID, TeamID: team2ID, QualityInspectionID: qi3ID, Reason: "色差超出验收标准", Description: "局部补色处理，调整配比", Cost: 2000, ResponsiblePerson: "陈生波", Status: "in_progress", Remark: "等待第二次验收", CreatedBy: liqcID, CreatedAt: parseTime("2025-04-11 10:00:00"), UpdatedAt: parseTime("2025-04-13 09:00:00")},
	}
	if err := db.Create(&reworks).Error; err != nil {
		return err
	}

	deliveries := []model.DeliveryReceipt{
		{ID: dr1ID, ProjectID: project1ID, TeamID: team1ID, MaterialName: "环氧底漆", Specification: "XX-101 30kg/桶", Quantity: 50.0, Unit: "桶", DeliveryDate: parseDate("2025-04-01"), ReceivedBy: "张文发", ReceiptStatus: "received", CreatedBy: wangjmID, CreatedAt: parseTime("2025-04-01 10:00:00"), UpdatedAt: parseTime("2025-04-02 08:30:00")},
		{ID: dr2ID, ProjectID: project1ID, TeamID: team1ID, MaterialName: "环氧中涂", Specification: "XX-201 25kg/桶", Quantity: 30.0, Unit: "桶", DeliveryDate: parseDate("2025-04-03"), ReceivedBy: "", ReceiptStatus: "pending", Remark: "待现场确认数量", CreatedBy: wangjmID, CreatedAt: parseTime("2025-04-03 09:00:00"), UpdatedAt: parseTime("2025-04-03 09:00:00")},
		{ID: dr3ID, ProjectID: project1ID, TeamID: team2ID, MaterialName: "耐磨骨料", Specification: "NM-501 50kg/袋", Quantity: 5.0, Unit: "吨", DeliveryDate: parseDate("2025-04-02"), ReceivedBy: "陈生波", ReceiptStatus: "partial", Remark: "实收4.8吨，短缺0.2吨", CreatedBy: wangjmID, CreatedAt: parseTime("2025-04-02 11:00:00"), UpdatedAt: parseTime("2025-04-02 14:00:00")},
		{ID: dr4ID, ProjectID: project1ID, TeamID: team2ID, MaterialName: "固化剂", Specification: "GH-301 5kg/桶", Quantity: 20.0, Unit: "桶", DeliveryDate: parseDate("2025-04-05"), ReceivedBy: "", ReceiptStatus: "pending", CreatedBy: wangjmID, CreatedAt: parseTime("2025-04-05 09:30:00"), UpdatedAt: parseTime("2025-04-05 09:30:00")},
	}
	if err := db.Create(&deliveries).Error; err != nil {
		return err
	}

	co1ConfirmedAt := parseTime("2025-04-10 11:00:00")
	co3ConfirmedAt := parseTime("2025-04-14 15:00:00")
	changes := []model.ChangeOrder{
		{
			ID: co1ID, ProjectID: project1ID, TeamID: team1ID, ChangeType: "材料变更",
			Description: "B2车间由普通环氧改为防静电环氧",
			BeforeValue: model.MapJSON{"material": "普通环氧", "unit_price": 350},
			AfterValue:  model.MapJSON{"material": "防静电环氧", "unit_price": 420},
			ImpactAmount: 8400, RequestedBy: wangjmID, ConfirmedBy: &wangjmID, ConfirmedAt: &co1ConfirmedAt,
			Status: "confirmed", Remark: "甲方书面确认",
			CreatedAt: parseTime("2025-04-08 14:00:00"), UpdatedAt: parseTime("2025-04-10 11:00:00"),
		},
		{
			ID: co2ID, ProjectID: project1ID, TeamID: team2ID, ChangeType: "工期调整",
			Description: "D4办公区耐磨地坪工期延长5天，因基层含水率过高需延长养护期",
			BeforeValue: model.MapJSON{"original_end_date": "2025-04-20"},
			AfterValue:  model.MapJSON{"new_end_date": "2025-04-25"},
			ImpactAmount: 3000, RequestedBy: chensbID,
			Status: "pending", Remark: "等待项目经理审批",
			CreatedAt: parseTime("2025-04-09 16:00:00"), UpdatedAt: parseTime("2025-04-09 16:00:00"),
		},
		{
			ID: co3ID, ProjectID: project1ID, TeamID: team1ID, ChangeType: "面积增减",
			Description: "A1仓库实际施工面积比合同增加120平方米",
			BeforeValue: model.MapJSON{"area_sqm": 800, "unit_price": 45},
			AfterValue:  model.MapJSON{"area_sqm": 920, "unit_price": 45},
			ImpactAmount: 5400, RequestedBy: zhangwfID, ConfirmedBy: &wangjmID, ConfirmedAt: &co3ConfirmedAt,
			Status: "confirmed", Remark: "经现场测量确认",
			CreatedAt: parseTime("2025-04-12 10:00:00"), UpdatedAt: parseTime("2025-04-14 15:00:00"),
		},
	}
	if err := db.Create(&changes).Error; err != nil {
		return err
	}

	auditTrails := []model.AuditTrail{
		{
			ID: at1ID, EntityType: "attendance_record", EntityID: att1ID, Action: "create",
			AfterValue: model.MapJSON{"worker_name": "张文发", "status": "present", "hours_worked": 8.0, "work_area": "A1仓库"},
			OperatorID: zhangwfID, OperatorName: "张文发", OperatorRole: "team_leader",
			Remark: "录入4月1日考勤", CreatedAt: parseTime("2025-04-01 18:00:00"),
		},
		{
			ID: at2ID, EntityType: "attendance_record", EntityID: att3ID, Action: "create",
			AfterValue: model.MapJSON{"worker_name": "王志刚", "status": "present", "hours_worked": 9.0, "work_area": "B2车间"},
			OperatorID: zhangwfID, OperatorName: "张文发", OperatorRole: "team_leader",
			Remark: "录入4月2日考勤，含加班记录", CreatedAt: parseTime("2025-04-02 19:00:00"),
		},
		{
			ID: at3ID, EntityType: "attendance_record", EntityID: att12ID, Action: "create",
			AfterValue: model.MapJSON{"worker_name": "陈生波", "status": "present", "hours_worked": 8.0, "work_area": "C3展厅"},
			OperatorID: chensbID, OperatorName: "陈生波", OperatorRole: "team_leader",
			Remark: "录入4月1日考勤", CreatedAt: parseTime("2025-04-01 18:00:00"),
		},
		{
			ID: at4ID, EntityType: "attendance_record", EntityID: att14ID, Action: "create",
			AfterValue: model.MapJSON{"worker_name": "吴明亮", "status": "present", "hours_worked": 9.0, "work_area": "D4办公区"},
			OperatorID: chensbID, OperatorName: "陈生波", OperatorRole: "team_leader",
			Remark: "录入4月2日考勤", CreatedAt: parseTime("2025-04-02 19:00:00"),
		},
		{
			ID: at5ID, EntityType: "settlement_batch", EntityID: batch1ID, Action: "update",
			BeforeValue: model.MapJSON{"status": "draft"},
			AfterValue:  model.MapJSON{"status": "submitted"},
			OperatorID: zhangwfID, OperatorName: "张文发", OperatorRole: "team_leader",
			Remark: "提交4月上半月结算单", CreatedAt: parseTime("2025-04-16 09:00:00"),
		},
		{
			ID: at6ID, EntityType: "settlement_batch", EntityID: batch1ID, Action: "update",
			BeforeValue: model.MapJSON{"status": "submitted"},
			AfterValue:  model.MapJSON{"status": "verified"},
			OperatorID: liqcID, OperatorName: "李启超", OperatorRole: "quality_engineer",
			Remark: "质检确认通过，核实工日无误", CreatedAt: parseTime("2025-04-17 14:30:00"),
		},
		{
			ID: at7ID, EntityType: "settlement_batch", EntityID: batch1ID, Action: "update",
			BeforeValue: model.MapJSON{"status": "verified"},
			AfterValue:  model.MapJSON{"status": "approved"},
			OperatorID: wangjmID, OperatorName: "王建明", OperatorRole: "project_manager",
			Remark: "项目经理审批通过", CreatedAt: parseTime("2025-04-18 10:00:00"),
		},
		{
			ID: at8ID, EntityType: "settlement_batch", EntityID: batch2ID, Action: "update",
			BeforeValue: model.MapJSON{"status": "draft"},
			AfterValue:  model.MapJSON{"status": "submitted"},
			OperatorID: chensbID, OperatorName: "陈生波", OperatorRole: "team_leader",
			Remark: "提交4月上半月结算单", CreatedAt: parseTime("2025-04-16 10:30:00"),
		},
		{
			ID: at9ID, EntityType: "quality_inspection", EntityID: qi1ID, Action: "create",
			AfterValue: model.MapJSON{"area": "A1仓库", "result": "pass", "inspector": "李启超"},
			OperatorID: liqcID, OperatorName: "李启超", OperatorRole: "quality_engineer",
			Remark: "A1仓库质检通过", CreatedAt: parseTime("2025-04-05 16:00:00"),
		},
		{
			ID: at10ID, EntityType: "quality_inspection", EntityID: qi2ID, Action: "create",
			AfterValue: model.MapJSON{"area": "B2车间", "result": "rework", "inspector": "李启超", "issues_found": "表面起砂，平整度不达标"},
			OperatorID: liqcID, OperatorName: "李启超", OperatorRole: "quality_engineer",
			Remark: "B2车间质检不合格，需返工", CreatedAt: parseTime("2025-04-08 16:30:00"),
		},
		{
			ID: at11ID, EntityType: "rework_record", EntityID: rw1ID, Action: "update",
			BeforeValue: model.MapJSON{"status": "in_progress"},
			AfterValue:  model.MapJSON{"status": "completed"},
			OperatorID: liqcID, OperatorName: "李启超", OperatorRole: "quality_engineer",
			Remark: "B2车间返工完成，验收通过", CreatedAt: parseTime("2025-04-12 17:00:00"),
		},
		{
			ID: at12ID, EntityType: "rework_record", EntityID: rw2ID, Action: "create",
			AfterValue: model.MapJSON{"team_id": team2ID.String(), "reason": "色差超出验收标准", "status": "in_progress", "cost": 2000},
			OperatorID: liqcID, OperatorName: "李启超", OperatorRole: "quality_engineer",
			Remark: "C3展厅色差返工记录创建", CreatedAt: parseTime("2025-04-11 10:00:00"),
		},
		{
			ID: at13ID, EntityType: "change_order", EntityID: co1ID, Action: "update",
			BeforeValue: model.MapJSON{"status": "pending"},
			AfterValue:  model.MapJSON{"status": "confirmed"},
			OperatorID: wangjmID, OperatorName: "王建明", OperatorRole: "project_manager",
			Remark: "材料变更确认，甲方书面确认", CreatedAt: parseTime("2025-04-10 11:00:00"),
		},
		{
			ID: at14ID, EntityType: "change_order", EntityID: co3ID, Action: "update",
			BeforeValue: model.MapJSON{"status": "pending"},
			AfterValue:  model.MapJSON{"status": "confirmed"},
			OperatorID: wangjmID, OperatorName: "王建明", OperatorRole: "project_manager",
			Remark: "面积增减确认，现场测量核实", CreatedAt: parseTime("2025-04-14 15:00:00"),
		},
	}
	if err := db.Create(&auditTrails).Error; err != nil {
		return err
	}

	return nil
}
