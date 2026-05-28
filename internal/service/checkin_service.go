package service

import (
	"camp-system/internal/database"
	"camp-system/internal/model"
	"errors"
	"time"

	"gorm.io/gorm"
)

type CheckInService struct {
	logService *LogService
}

func NewCheckInService() *CheckInService {
	return &CheckInService{
		logService: NewLogService(),
	}
}

type BatchCheckInRequest struct {
	ActivityID   string
	CamperIDs    []string
	Status       model.CheckInStatus
	CheckedBy    string
	CheckedByName string
	CheckedByRole string
	Temperature  float64
	HasSymptoms  bool
	Symptoms     string
	Remark       string
	IP           string
	UserAgent    string
}

func (s *CheckInService) BatchCheckIn(req BatchCheckInRequest) ([]model.CheckIn, error) {
	var results []model.CheckIn
	now := time.Now()

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		for _, camperID := range req.CamperIDs {
			var checkIn model.CheckIn
			err := tx.Where("activity_id = ? AND camper_id = ?", req.ActivityID, camperID).
				First(&checkIn).Error

			oldStatus := model.CheckInStatusPending
			if err == nil {
				oldStatus = checkIn.Status
				checkIn.Status = req.Status
				checkIn.CheckInTime = &now
				checkIn.CheckedBy = req.CheckedBy
				checkIn.Remark = req.Remark
				checkIn.Temperature = req.Temperature
				checkIn.HasSymptoms = req.HasSymptoms
				checkIn.Symptoms = req.Symptoms
				checkIn.UpdatedBy = req.CheckedBy
				if err := tx.Save(&checkIn).Error; err != nil {
					return err
				}
			} else if errors.Is(err, gorm.ErrRecordNotFound) {
				checkIn = model.CheckIn{
					ActivityID:  req.ActivityID,
					CamperID:    camperID,
					Status:      req.Status,
					CheckInTime: &now,
					CheckedBy:   req.CheckedBy,
					Remark:      req.Remark,
					Temperature: req.Temperature,
					HasSymptoms: req.HasSymptoms,
					Symptoms:    req.Symptoms,
				}
				checkIn.CreatedBy = req.CheckedBy
				checkIn.UpdatedBy = req.CheckedBy
				if err := tx.Create(&checkIn).Error; err != nil {
					return err
				}
			} else {
				return err
			}

			if oldStatus != req.Status {
				s.logService.LogStatusChange("checkin", checkIn.ID,
					string(oldStatus), string(req.Status), req.CheckedBy,
					"批量签到更新状态")
			}

			s.logService.LogOperation(
				req.CheckedBy, req.CheckedByName, req.CheckedByRole,
				"checkin_update", "checkin", checkIn.ID,
				map[string]interface{}{"status": oldStatus},
				map[string]interface{}{"status": req.Status, "temperature": req.Temperature},
				req.IP, req.UserAgent,
			)

			if req.HasSymptoms || (req.Temperature > 0 && req.Temperature >= 37.5) {
				if err := s.createAutoMedicalAlert(tx, &checkIn, req.CheckedBy); err != nil {
					return err
				}
			}

			results = append(results, checkIn)
		}
		return nil
	})

	return results, err
}

func (s *CheckInService) createAutoMedicalAlert(tx *gorm.DB, checkIn *model.CheckIn, userID string) error {
	var camper model.Camper
	if err := tx.Where("id = ?", checkIn.CamperID).First(&camper).Error; err != nil {
		return err
	}

	alert := &model.MedicalReport{
		CamperID:    checkIn.CamperID,
		ReporterID:  userID,
		ReportTime:  time.Now(),
		Severity:    model.MedicalSeverityMild,
		Status:      model.MedicalStatusReported,
		Symptoms:    checkIn.Symptoms,
		Description: "活动签到异常自动上报",
		Temperature: checkIn.Temperature,
		Remark:      "来自活动签到的异常标记，需要跟进处理",
	}
	alert.CreatedBy = userID
	alert.UpdatedBy = userID

	if err := tx.Create(alert).Error; err != nil {
		return err
	}

	link := &model.CheckInMedicalLink{
		CheckInID:       checkIn.ID,
		MedicalReportID: alert.ID,
		LinkedBy:        userID,
		LinkReason:      "签到异常自动关联",
	}
	link.CreatedBy = userID
	link.UpdatedBy = userID

	return tx.Create(link).Error
}

func (s *CheckInService) GetActivityCheckIns(activityID string, userID string, userRole model.Role) ([]model.CheckIn, error) {
	var checkIns []model.CheckIn
	query := database.DB.Where("activity_id = ?", activityID).
		Joins("JOIN campers ON campers.id = check_ins.camper_id")

	if userRole == model.RoleTeacher {
		query = query.Where("campers.teacher_id = ?", userID)
	}

	err := query.Preload("Camper").
		Preload("Checker").
		Preload("RelatedMedicals.MedicalReport").
		Preload("RelatedMedicals.Operator").
		Find(&checkIns).Error
	return checkIns, err
}

func (s *CheckInService) GetCamperCheckIns(camperID string, page, pageSize int) ([]model.CheckIn, int64, error) {
	var checkIns []model.CheckIn
	var total int64

	query := database.DB.Model(&model.CheckIn{}).Where("camper_id = ?", camperID)
	query.Count(&total)

	offset := (page - 1) * pageSize
	err := query.Preload("Activity").
		Preload("Checker").
		Order("check_in_time DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&checkIns).Error

	return checkIns, total, err
}

func (s *CheckInService) GetCheckInStatistics(activityID string) (map[string]interface{}, error) {
	var total int64
	var present, absent, late, excused, pending int64

	database.DB.Model(&model.CheckIn{}).Where("activity_id = ?", activityID).Count(&total)
	database.DB.Model(&model.CheckIn{}).Where("activity_id = ? AND status = ?", activityID, model.CheckInStatusPresent).Count(&present)
	database.DB.Model(&model.CheckIn{}).Where("activity_id = ? AND status = ?", activityID, model.CheckInStatusAbsent).Count(&absent)
	database.DB.Model(&model.CheckIn{}).Where("activity_id = ? AND status = ?", activityID, model.CheckInStatusLate).Count(&late)
	database.DB.Model(&model.CheckIn{}).Where("activity_id = ? AND status = ?", activityID, model.CheckInStatusExcused).Count(&excused)
	database.DB.Model(&model.CheckIn{}).Where("activity_id = ? AND status = ?", activityID, model.CheckInStatusPending).Count(&pending)

	var abnormalCount int64
	database.DB.Model(&model.CheckIn{}).
		Where("activity_id = ? AND (has_symptoms = ? OR temperature >= ?)", activityID, true, 37.5).
		Count(&abnormalCount)

	return map[string]interface{}{
		"total":     total,
		"present":   present,
		"absent":    absent,
		"late":      late,
		"excused":   excused,
		"pending":   pending,
		"abnormal":  abnormalCount,
		"present_rate": func() float64 {
			if total == 0 {
				return 0
			}
			return float64(present) / float64(total) * 100
		}(),
	}, nil
}

func (s *CheckInService) ValidateCampersAccess(camperIDs []string, userID string, userRole model.Role) error {
	for _, camperID := range camperIDs {
		var camper model.Camper
		if err := database.DB.Where("id = ?", camperID).First(&camper).Error; err != nil {
			return errors.New("营员不存在: " + camperID)
		}

		if userRole == model.RoleTeacher && camper.TeacherID != userID {
			return errors.New("无权限处理非本班营员: " + camper.Name)
		}
	}
	return nil
}

func (s *CheckInService) LinkToMedical(checkInID, medicalID, userID, reason string) error {
	link := &model.CheckInMedicalLink{
		CheckInID:       checkInID,
		MedicalReportID: medicalID,
		LinkedBy:        userID,
		LinkReason:      reason,
	}
	link.CreatedBy = userID
	link.UpdatedBy = userID
	return database.DB.Create(link).Error
}
