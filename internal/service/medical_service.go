package service

import (
	"camp-system/internal/database"
	"camp-system/internal/model"
	"time"

	"gorm.io/gorm"
)

type MedicalService struct {
	logService *LogService
}

func NewMedicalService() *MedicalService {
	return &MedicalService{
		logService: NewLogService(),
	}
}

type CreateMedicalReportRequest struct {
	CamperID        string
	ReporterID      string
	ReporterName    string
	ReporterRole    string
	Severity        model.MedicalSeverity
	Symptoms        string
	Description     string
	Temperature     float64
	BloodPressure   string
	Pulse           int
	InitialTreatment string
	Medications     []string
	NeedFollowUp    bool
	Remark          string
	IP              string
	UserAgent       string
}

func (s *MedicalService) CreateMedicalReport(req CreateMedicalReportRequest) (*model.MedicalReport, error) {
	report := &model.MedicalReport{
		CamperID:        req.CamperID,
		ReporterID:      req.ReporterID,
		ReportTime:      time.Now(),
		Severity:        req.Severity,
		Status:          model.MedicalStatusReported,
		Symptoms:        req.Symptoms,
		Description:     req.Description,
		Temperature:     req.Temperature,
		BloodPressure:   req.BloodPressure,
		Pulse:           req.Pulse,
		InitialTreatment: req.InitialTreatment,
		Medications:     req.Medications,
		NeedFollowUp:    req.NeedFollowUp,
		Remark:          req.Remark,
	}
	report.CreatedBy = req.ReporterID
	report.UpdatedBy = req.ReporterID

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(report).Error; err != nil {
			return err
		}

		if req.NeedFollowUp {
			followUpTime := time.Now().Add(2 * time.Hour)
			report.FollowUpTime = &followUpTime
			if err := tx.Save(report).Error; err != nil {
				return err
			}

			if err := s.createFollowUpFromMedical(tx, report, req.ReporterID); err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	s.logService.LogStatusChange("medical", report.ID,
		"", string(model.MedicalStatusReported), req.ReporterID, "创建医疗上报")

	s.logService.LogOperation(
		req.ReporterID, req.ReporterName, req.ReporterRole,
		"medical_create", "medical", report.ID,
		nil, report, req.IP, req.UserAgent,
	)

	return report, nil
}

func (s *MedicalService) createFollowUpFromMedical(tx *gorm.DB, report *model.MedicalReport, userID string) error {
	var camper model.Camper
	if err := tx.Where("id = ?", report.CamperID).First(&camper).Error; err != nil {
		return err
	}

	priority := model.FollowUpPriorityMedium
	if report.Severity == model.MedicalSeveritySevere || report.Severity == model.MedicalSeverityCritical {
		priority = model.FollowUpPriorityUrgent
	}

	followUp := &model.FollowUp{
		CamperID:        report.CamperID,
		Type:            model.FollowUpTypeMedical,
		Status:          model.FollowUpStatusPending,
		Priority:        priority,
		Title:           "医疗随访: " + report.Symptoms,
		Description:     report.Description,
		RelatedMedicalID: report.ID,
		AssignedTo:      report.TreatmentBy,
		ScheduledTime:   report.FollowUpTime,
		DueTime:         report.FollowUpTime,
	}
	followUp.CreatedBy = userID
	followUp.UpdatedBy = userID

	return tx.Create(followUp).Error
}

type UpdateMedicalStatusRequest struct {
	ReportID       string
	Status         model.MedicalStatus
	UserID         string
	UserName       string
	UserRole       string
	Treatment      string
	Medications    []string
	Resolution     string
	Remark         string
	IP             string
	UserAgent      string
}

func (s *MedicalService) UpdateMedicalStatus(req UpdateMedicalStatusRequest) (*model.MedicalReport, error) {
	var report model.MedicalReport
	if err := database.DB.Where("id = ?", req.ReportID).First(&report).Error; err != nil {
		return nil, err
	}

	oldStatus := report.Status
	if oldStatus == req.Status && req.Treatment == "" && req.Resolution == "" {
		return &report, nil
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		report.Status = req.Status
		report.UpdatedBy = req.UserID

		if req.Treatment != "" {
			report.InitialTreatment = req.Treatment
			report.TreatmentBy = req.UserID
		}
		if len(req.Medications) > 0 {
			report.Medications = req.Medications
		}
		if req.Resolution != "" {
			report.Resolution = req.Resolution
		}
		if req.Remark != "" {
			report.Remark = report.Remark + "\n" + req.Remark
		}

		if req.Status == model.MedicalStatusResolved {
			now := time.Now()
			report.ResolvedAt = &now
			report.ResolvedBy = req.UserID
		}

		return tx.Save(&report).Error
	})

	if err != nil {
		return nil, err
	}

	if oldStatus != req.Status {
		s.logService.LogStatusChange("medical", report.ID,
			string(oldStatus), string(req.Status), req.UserID, req.Remark)
	}

	s.logService.LogOperation(
		req.UserID, req.UserName, req.UserRole,
		"medical_update", "medical", report.ID,
		map[string]interface{}{"status": oldStatus},
		map[string]interface{}{"status": req.Status, "treatment": req.Treatment},
		req.IP, req.UserAgent,
	)

	return &report, nil
}

type NotifyParentRequest struct {
	ReportID    string
	UserID      string
	UserName    string
	UserRole    string
	Method      string
	Content     string
	IP          string
	UserAgent   string
}

func (s *MedicalService) NotifyParent(req NotifyParentRequest) error {
	var report model.MedicalReport
	if err := database.DB.Where("id = ?", req.ReportID).First(&report).Error; err != nil {
		return err
	}

	now := time.Now()
	report.ParentNotified = true
	report.ParentNotifyTime = &now
	report.ParentNotifyBy = req.UserID

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&report).Error; err != nil {
			return err
		}

		var followUps []model.FollowUp
		tx.Where("related_medical_id = ?", req.ReportID).Find(&followUps)
		for i := range followUps {
			followUps[i].ParentNotified = true
			followUps[i].ParentNotifyTime = &now
			followUps[i].NotifyMethod = req.Method
			followUps[i].NotifyContent = req.Content
			followUps[i].NotifyBy = req.UserID
			followUps[i].UpdatedBy = req.UserID
			if err := tx.Save(&followUps[i]).Error; err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		return err
	}

	s.logService.LogOperation(
		req.UserID, req.UserName, req.UserRole,
		"medical_notify_parent", "medical", req.ReportID,
		map[string]interface{}{"parent_notified": false},
		map[string]interface{}{"parent_notified": true, "method": req.Method},
		req.IP, req.UserAgent,
	)

	return nil
}

func (s *MedicalService) GetMedicalReport(reportID string) (*model.MedicalReport, error) {
	var report model.MedicalReport
	err := database.DB.Preload("Camper").
		Preload("Reporter").
		Preload("TreatmentStaff").
		Preload("ResolvedStaff").
		Where("id = ?", reportID).
		First(&report).Error
	if err != nil {
		return nil, err
	}

	var links []model.CheckInMedicalLink
	database.DB.Where("medical_report_id = ?", reportID).Preload("CheckIn").Find(&links)

	return &report, nil
}

func (s *MedicalService) GetCampMedicalReports(campID string, status model.MedicalStatus, page, pageSize int, userID string, userRole model.Role) ([]model.MedicalReport, int64, error) {
	var reports []model.MedicalReport
	var total int64

	query := database.DB.Model(&model.MedicalReport{}).
		Joins("JOIN campers ON campers.id = medical_reports.camper_id").
		Where("campers.camp_id = ?", campID)

	if userRole == model.RoleTeacher {
		query = query.Where("campers.teacher_id = ?", userID)
	}

	if status != "" {
		query = query.Where("medical_reports.status = ?", status)
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	err := query.Preload("Camper").
		Preload("Reporter").
		Preload("TreatmentStaff").
		Preload("StatusHistory").
		Preload("ParentNotifications").
		Preload("RelatedCheckIn").
		Order("report_time DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&reports).Error

	return reports, total, err
}

func (s *MedicalService) GetCamperMedicalReports(camperID string) ([]model.MedicalReport, error) {
	var reports []model.MedicalReport
	err := database.DB.Where("camper_id = ?", camperID).
		Preload("Reporter").
		Preload("TreatmentStaff").
		Order("report_time DESC").
		Find(&reports).Error
	return reports, err
}

func (s *MedicalService) GetMedicalStatistics(campID string) (map[string]interface{}, error) {
	var total int64
	var reported, processing, resolved, transferred, followUp int64

	query := database.DB.Model(&model.MedicalReport{}).
		Joins("JOIN campers ON campers.id = medical_reports.camper_id").
		Where("campers.camp_id = ?", campID)

	query.Count(&total)
	query.Where("medical_reports.status = ?", model.MedicalStatusReported).Count(&reported)
	query.Where("medical_reports.status = ?", model.MedicalStatusProcessing).Count(&processing)
	query.Where("medical_reports.status = ?", model.MedicalStatusResolved).Count(&resolved)
	query.Where("medical_reports.status = ?", model.MedicalStatusTransferred).Count(&transferred)
	query.Where("medical_reports.status = ?", model.MedicalStatusFollowUp).Count(&followUp)

	var mild, moderate, severe, critical int64
	query.Where("medical_reports.severity = ?", model.MedicalSeverityMild).Count(&mild)
	query.Where("medical_reports.severity = ?", model.MedicalSeverityModerate).Count(&moderate)
	query.Where("medical_reports.severity = ?", model.MedicalSeveritySevere).Count(&severe)
	query.Where("medical_reports.severity = ?", model.MedicalSeverityCritical).Count(&critical)

	var parentNotNotified int64
	query.Where("medical_reports.parent_notified = ?", false).Count(&parentNotNotified)

	return map[string]interface{}{
		"total":            total,
		"reported":         reported,
		"processing":       processing,
		"resolved":         resolved,
		"transferred":      transferred,
		"follow_up":        followUp,
		"mild":             mild,
		"moderate":         moderate,
		"severe":           severe,
		"critical":         critical,
		"parent_notified_pending": parentNotNotified,
	}, nil
}

func (s *MedicalService) GetPendingMedicalTasks(campID string) ([]model.MedicalReport, error) {
	var reports []model.MedicalReport
	err := database.DB.Model(&model.MedicalReport{}).
		Joins("JOIN campers ON campers.id = medical_reports.camper_id").
		Where("campers.camp_id = ? AND (medical_reports.status = ? OR medical_reports.status = ?)",
			campID, model.MedicalStatusReported, model.MedicalStatusProcessing).
		Preload("Camper").
		Preload("Reporter").
		Order("report_time DESC").
		Find(&reports).Error
	return reports, err
}
