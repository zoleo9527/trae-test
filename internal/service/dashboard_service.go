package service

import (
	"camp-system/internal/database"
	"camp-system/internal/model"
	"time"
)

type CheckInProgress struct {
	ActivityName string `json:"activity_name"`
	Total        int64  `json:"total"`
	Present      int64  `json:"present"`
	Absent       int64  `json:"absent"`
	Pending      int64  `json:"pending"`
	Abnormal     int64  `json:"abnormal"`
	PresentRate  float64 `json:"present_rate"`
}

type MedicalProgress struct {
	Total        int64  `json:"total"`
	Reported     int64  `json:"reported"`
	Processing   int64  `json:"processing"`
	FollowUp     int64  `json:"follow_up"`
	Resolved     int64  `json:"resolved"`
	Abnormal     int64  `json:"abnormal"`
}

type FollowUpProgress struct {
	Total      int64  `json:"total"`
	Pending    int64  `json:"pending"`
	Scheduled  int64  `json:"scheduled"`
	Completed  int64  `json:"completed"`
	Overdue    int64  `json:"overdue"`
}

type DashboardService struct{}

func NewDashboardService() *DashboardService {
	return &DashboardService{}
}

type DirectorDashboardData struct {
	Overview         map[string]interface{} `json:"overview"`
	CheckInProgress  []CheckInProgress      `json:"checkin_progress"`
	MedicalProgress  MedicalProgress        `json:"medical_progress"`
	FollowUpProgress FollowUpProgress       `json:"followup_progress"`
	MedicalAlerts    []model.MedicalReport  `json:"medical_alerts"`
	OverdueFollowUps []model.FollowUp       `json:"overdue_follow_ups"`
	RoomStats        map[string]interface{} `json:"room_stats"`
	MaterialWarnings []model.MaterialItem   `json:"material_warnings"`
	RecentActivities []model.Activity       `json:"recent_activities"`
}

type TeacherDashboardData struct {
	MyCampers        []model.Camper         `json:"my_campers"`
	CheckInProgress  []CheckInProgress      `json:"checkin_progress"`
	CheckInStats     map[string]interface{} `json:"checkin_stats"`
	MedicalProgress  MedicalProgress        `json:"medical_progress"`
	RecentMedical    []model.MedicalReport  `json:"recent_medical"`
	FollowUpProgress FollowUpProgress       `json:"followup_progress"`
	MyAssignedFollowUps []model.FollowUp    `json:"my_follow_ups"`
}

type LogisticsDashboardData struct {
	RoomStats               map[string]interface{} `json:"room_stats"`
	PendingMaterialRequests []model.MaterialIssue  `json:"pending_material"`
	LowStockItems           []model.MaterialItem   `json:"low_stock"`
	RecentRoomChanges       []model.RoomChangeLog  `json:"recent_room_changes"`
	MaterialStats           map[string]interface{} `json:"material_stats"`
}

type MedicalDashboardData struct {
	MedicalProgress   MedicalProgress        `json:"medical_progress"`
	CheckInProgress   []CheckInProgress      `json:"checkin_progress"`
	PendingCases      []model.MedicalReport  `json:"pending_cases"`
	TodayReports      []model.MedicalReport  `json:"today_reports"`
	FollowUpProgress  FollowUpProgress       `json:"followup_progress"`
	MyFollowUps       []model.FollowUp       `json:"my_follow_ups"`
	ParentNotifyPending []model.MedicalReport `json:"parent_notify_pending"`
}

func getCampCheckInProgress(campID string, teacherID string) []CheckInProgress {
	var activities []model.Activity
	database.DB.Where("camp_id = ?", campID).Order("start_time DESC").Limit(10).Find(&activities)

	var result []CheckInProgress
	for _, act := range activities {
		query := database.DB.Model(&model.CheckIn{}).
			Where("check_ins.activity_id = ?", act.ID).
			Joins("JOIN campers ON campers.id = check_ins.camper_id")

		if teacherID != "" {
			query = query.Where("campers.teacher_id = ?", teacherID)
		}

		var total, present, absent, pending, abnormal int64
		q := *query
		q.Count(&total)

		q = *query
		q.Where("check_ins.status = ?", model.CheckInStatusPresent).Count(&present)

		q = *query
		q.Where("check_ins.status = ?", model.CheckInStatusAbsent).Count(&absent)

		q = *query
		q.Where("check_ins.status = ?", model.CheckInStatusPending).Count(&pending)

		q = *query
		q.Where("check_ins.has_symptoms = ? OR check_ins.temperature >= ?", true, 37.5).Count(&abnormal)

		var presentRate float64
		if total > 0 {
			presentRate = float64(present) / float64(total) * 100
		}

		result = append(result, CheckInProgress{
			ActivityName: act.Name,
			Total:        total,
			Present:      present,
			Absent:       absent,
			Pending:      pending,
			Abnormal:     abnormal,
			PresentRate:  presentRate,
		})
	}
	return result
}

func getCampMedicalProgress(campID string, teacherID string) MedicalProgress {
	query := database.DB.Model(&model.MedicalReport{}).
		Joins("JOIN campers ON campers.id = medical_reports.camper_id").
		Where("campers.camp_id = ?", campID)

	if teacherID != "" {
		query = query.Where("campers.teacher_id = ?", teacherID)
	}

	var total, reported, processing, followUp, resolved, abnormal int64

	q := *query
	q.Count(&total)

	q = *query
	q.Where("medical_reports.status = ?", model.MedicalStatusReported).Count(&reported)

	q = *query
	q.Where("medical_reports.status = ?", model.MedicalStatusProcessing).Count(&processing)

	q = *query
	q.Where("medical_reports.status = ?", model.MedicalStatusFollowUp).Count(&followUp)

	q = *query
	q.Where("medical_reports.status = ?", model.MedicalStatusResolved).Count(&resolved)

	q = *query
	q.Where("medical_reports.severity IN ?", []model.MedicalSeverity{model.MedicalSeverityModerate, model.MedicalSeveritySevere}).Count(&abnormal)

	return MedicalProgress{
		Total:      total,
		Reported:   reported,
		Processing: processing,
		FollowUp:   followUp,
		Resolved:   resolved,
		Abnormal:   abnormal,
	}
}

func getCampFollowUpProgress(campID string, teacherID string) FollowUpProgress {
	query := database.DB.Model(&model.FollowUp{}).
		Joins("JOIN campers ON campers.id = follow_ups.camper_id").
		Where("campers.camp_id = ?", campID)

	if teacherID != "" {
		query = query.Where("campers.teacher_id = ? OR follow_ups.assigned_to = ?", teacherID, teacherID)
	}

	var total, pending, scheduled, completed, overdue int64

	q := *query
	q.Count(&total)

	q = *query
	q.Where("follow_ups.status = ?", model.FollowUpStatusPending).Count(&pending)

	q = *query
	q.Where("follow_ups.status = ?", model.FollowUpStatusScheduled).Count(&scheduled)

	q = *query
	q.Where("follow_ups.status = ?", model.FollowUpStatusCompleted).Count(&completed)

	q = *query
	q.Where("follow_ups.status IN ? AND follow_ups.due_time < ?", []model.FollowUpStatus{model.FollowUpStatusPending, model.FollowUpStatusScheduled}, time.Now()).Count(&overdue)

	return FollowUpProgress{
		Total:     total,
		Pending:   pending,
		Scheduled: scheduled,
		Completed: completed,
		Overdue:   overdue,
	}
}

func (s *DashboardService) GetDirectorDashboard(campID string) (*DirectorDashboardData, error) {
	data := &DirectorDashboardData{}

	var camperCount int64
	database.DB.Model(&model.Camper{}).Where("camp_id = ?", campID).Count(&camperCount)

	var activityCount int64
	database.DB.Model(&model.Activity{}).Where("camp_id = ?", campID).Count(&activityCount)

	var checkInCount int64
	database.DB.Model(&model.CheckIn{}).
		Joins("JOIN activities ON activities.id = check_ins.activity_id").
		Where("activities.camp_id = ?", campID).Count(&checkInCount)

	var medicalCount int64
	database.DB.Model(&model.MedicalReport{}).
		Joins("JOIN campers ON campers.id = medical_reports.camper_id").
		Where("campers.camp_id = ?", campID).Count(&medicalCount)

	data.Overview = map[string]interface{}{
		"total_campers":   camperCount,
		"total_activities": activityCount,
		"total_checkins":  checkInCount,
		"total_medical":   medicalCount,
	}

	data.CheckInProgress = getCampCheckInProgress(campID, "")
	data.MedicalProgress = getCampMedicalProgress(campID, "")
	data.FollowUpProgress = getCampFollowUpProgress(campID, "")

	roomService := NewRoomService()
	roomStats, _ := roomService.GetRoomStatistics(campID)
	data.RoomStats = roomStats

	materialService := NewMaterialService()
	lowStock, _ := materialService.GetLowStockItems()
	data.MaterialWarnings = lowStock

	medicalService := NewMedicalService()
	pendingMedical, _ := medicalService.GetPendingMedicalTasks(campID)
	data.MedicalAlerts = pendingMedical

	followUpService := NewFollowUpService()
	overdue, _ := followUpService.GetOverdueFollowUps(campID)
	data.OverdueFollowUps = overdue

	var activities []model.Activity
	database.DB.Where("camp_id = ?", campID).Order("start_time DESC").Limit(5).Find(&activities)
	data.RecentActivities = activities

	return data, nil
}

func (s *DashboardService) GetTeacherDashboard(campID string, teacherID string) (*TeacherDashboardData, error) {
	data := &TeacherDashboardData{}

	var campers []model.Camper
	database.DB.Where("camp_id = ? AND teacher_id = ?", campID, teacherID).
		Preload("Room").
		Find(&campers)
	data.MyCampers = campers

	data.CheckInProgress = getCampCheckInProgress(campID, teacherID)

	var totalCheckins, presentCheckins int64
	database.DB.Model(&model.CheckIn{}).
		Joins("JOIN campers ON campers.id = check_ins.camper_id").
		Where("campers.camp_id = ? AND campers.teacher_id = ?", campID, teacherID).
		Count(&totalCheckins)
	database.DB.Model(&model.CheckIn{}).
		Joins("JOIN campers ON campers.id = check_ins.camper_id").
		Where("campers.camp_id = ? AND campers.teacher_id = ? AND check_ins.status = ?", campID, teacherID, model.CheckInStatusPresent).
		Count(&presentCheckins)

	var presentRate float64
	if totalCheckins > 0 {
		presentRate = float64(presentCheckins) / float64(totalCheckins) * 100
	}
	data.CheckInStats = map[string]interface{}{
		"total":        totalCheckins,
		"present":      presentCheckins,
		"present_rate": presentRate,
	}

	data.MedicalProgress = getCampMedicalProgress(campID, teacherID)

	var recentMedical []model.MedicalReport
	database.DB.Model(&model.MedicalReport{}).
		Joins("JOIN campers ON campers.id = medical_reports.camper_id").
		Where("campers.camp_id = ? AND campers.teacher_id = ?", campID, teacherID).
		Preload("Camper").
		Preload("Reporter").
		Order("report_time DESC").
		Limit(10).
		Find(&recentMedical)
	data.RecentMedical = recentMedical

	data.FollowUpProgress = getCampFollowUpProgress(campID, teacherID)

	var followUps []model.FollowUp
	database.DB.Where("assigned_to = ? AND status IN ?",
		teacherID, []model.FollowUpStatus{model.FollowUpStatusPending, model.FollowUpStatusScheduled}).
		Preload("Camper").
		Preload("RelatedMedical").
		Order("priority DESC, due_time ASC").
		Find(&followUps)
	data.MyAssignedFollowUps = followUps

	return data, nil
}

func (s *DashboardService) GetLogisticsDashboard(campID string) (*LogisticsDashboardData, error) {
	data := &LogisticsDashboardData{}

	roomService := NewRoomService()
	roomStats, _ := roomService.GetRoomStatistics(campID)
	data.RoomStats = roomStats

	var pendingIssues []model.MaterialIssue
	database.DB.Model(&model.MaterialIssue{}).
		Joins("JOIN campers ON campers.id = material_issues.camper_id").
		Where("campers.camp_id = ? AND material_issues.status = ?", campID, model.MaterialStatusPending).
		Preload("Camper").
		Preload("Item").
		Preload("Requester").
		Order("request_time DESC").
		Find(&pendingIssues)
	data.PendingMaterialRequests = pendingIssues

	materialService := NewMaterialService()
	lowStock, _ := materialService.GetLowStockItems()
	data.LowStockItems = lowStock

	var recentChanges []model.RoomChangeLog
	database.DB.Where("campers.camp_id = ?", campID).
		Joins("JOIN campers ON campers.id = room_change_logs.camper_id").
		Preload("Camper").
		Preload("OldRoom").
		Preload("NewRoom").
		Preload("Operator").
		Order("change_time DESC").
		Limit(10).
		Find(&recentChanges)
	data.RecentRoomChanges = recentChanges

	var totalIssues, approvedIssues, issuedIssues int64
	database.DB.Model(&model.MaterialIssue{}).
		Joins("JOIN campers ON campers.id = material_issues.camper_id").
		Where("campers.camp_id = ?", campID).Count(&totalIssues)
	database.DB.Model(&model.MaterialIssue{}).
		Joins("JOIN campers ON campers.id = material_issues.camper_id").
		Where("campers.camp_id = ? AND material_issues.status = ?", campID, model.MaterialStatusApproved).Count(&approvedIssues)
	database.DB.Model(&model.MaterialIssue{}).
		Joins("JOIN campers ON campers.id = material_issues.camper_id").
		Where("campers.camp_id = ? AND material_issues.status = ?", campID, model.MaterialStatusIssued).Count(&issuedIssues)

	data.MaterialStats = map[string]interface{}{
		"total":    totalIssues,
		"approved": approvedIssues,
		"issued":   issuedIssues,
		"pending":  len(pendingIssues),
	}

	return data, nil
}

func (s *DashboardService) GetMedicalDashboard(campID string, userID string) (*MedicalDashboardData, error) {
	data := &MedicalDashboardData{}

	data.MedicalProgress = getCampMedicalProgress(campID, "")
	data.CheckInProgress = getCampCheckInProgress(campID, "")

	medicalService := NewMedicalService()
	pending, _ := medicalService.GetPendingMedicalTasks(campID)
	data.PendingCases = pending

	var todayReports []model.MedicalReport
	today := time.Now().Format("2006-01-02")
	database.DB.Model(&model.MedicalReport{}).
		Joins("JOIN campers ON campers.id = medical_reports.camper_id").
		Where("campers.camp_id = ? AND DATE(medical_reports.report_time) = ?", campID, today).
		Preload("Camper").
		Preload("Reporter").
		Order("report_time DESC").
		Find(&todayReports)
	data.TodayReports = todayReports

	data.FollowUpProgress = getCampFollowUpProgress(campID, "")

	followUpService := NewFollowUpService()
	myFollowUps, _ := followUpService.GetUserAssignedFollowUps(userID, "")
	data.MyFollowUps = myFollowUps

	var notifyPending []model.MedicalReport
	database.DB.Model(&model.MedicalReport{}).
		Joins("JOIN campers ON campers.id = medical_reports.camper_id").
		Where("campers.camp_id = ? AND medical_reports.parent_notified = ?", campID, false).
		Preload("Camper").
		Order("report_time DESC").
		Find(&notifyPending)
	data.ParentNotifyPending = notifyPending

	return data, nil
}
