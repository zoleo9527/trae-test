package service

import (
	"camp-system/internal/database"
	"camp-system/internal/model"
)

type DashboardService struct{}

func NewDashboardService() *DashboardService {
	return &DashboardService{}
}

type DirectorDashboardData struct {
	Overview map[string]interface{} `json:"overview"`
	TodayActivity map[string]interface{} `json:"today_activity"`
	MedicalAlerts []model.MedicalReport `json:"medical_alerts"`
	OverdueFollowUps []model.FollowUp `json:"overdue_follow_ups"`
	RoomStats map[string]interface{} `json:"room_stats"`
	MaterialWarnings []model.MaterialItem `json:"material_warnings"`
	RecentActivities []model.Activity `json:"recent_activities"`
}

type TeacherDashboardData struct {
	MyCampers []model.Camper `json:"my_campers"`
	TodayCheckIns []model.Activity `json:"today_check_ins"`
	MyAssignedFollowUps []model.FollowUp `json:"my_follow_ups"`
	RecentMedical []model.MedicalReport `json:"recent_medical"`
	CheckInStats map[string]interface{} `json:"checkin_stats"`
}

type LogisticsDashboardData struct {
	RoomStats map[string]interface{} `json:"room_stats"`
	PendingMaterialRequests []model.MaterialIssue `json:"pending_material"`
	LowStockItems []model.MaterialItem `json:"low_stock"`
	RecentRoomChanges []model.RoomChangeLog `json:"recent_room_changes"`
}

type MedicalDashboardData struct {
	MedicalStats map[string]interface{} `json:"medical_stats"`
	PendingCases []model.MedicalReport `json:"pending_cases"`
	TodayReports []model.MedicalReport `json:"today_reports"`
	MyFollowUps []model.FollowUp `json:"my_follow_ups"`
	ParentNotifyPending []model.MedicalReport `json:"parent_notify_pending"`
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
		"total_campers":  camperCount,
		"total_activities": activityCount,
		"total_checkins": checkInCount,
		"total_medical":  medicalCount,
	}

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

	return data, nil
}

func (s *DashboardService) GetMedicalDashboard(campID string, userID string) (*MedicalDashboardData, error) {
	data := &MedicalDashboardData{}

	medicalService := NewMedicalService()
	stats, _ := medicalService.GetMedicalStatistics(campID)
	data.MedicalStats = stats

	pending, _ := medicalService.GetPendingMedicalTasks(campID)
	data.PendingCases = pending

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
