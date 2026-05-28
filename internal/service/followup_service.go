package service

import (
	"camp-system/internal/database"
	"camp-system/internal/model"
	"errors"
	"time"

	"gorm.io/gorm"
)

type FollowUpService struct {
	logService *LogService
}

func NewFollowUpService() *FollowUpService {
	return &FollowUpService{
		logService: NewLogService(),
	}
}

type CreateFollowUpRequest struct {
	CamperID        string
	Type            model.FollowUpType
	Priority        model.FollowUpPriority
	Title           string
	Description     string
	RelatedMedicalID string
	RelatedCheckInID string
	AssignedTo      string
	ScheduledTime   *time.Time
	DueTime         *time.Time
	CreatedBy       string
	CreatedByName   string
	CreatedByRole   string
	Remark          string
	IP              string
	UserAgent       string
}

func (s *FollowUpService) CreateFollowUp(req CreateFollowUpRequest) (*model.FollowUp, error) {
	followUp := &model.FollowUp{
		CamperID:        req.CamperID,
		Type:            req.Type,
		Status:          model.FollowUpStatusPending,
		Priority:        req.Priority,
		Title:           req.Title,
		Description:     req.Description,
		RelatedMedicalID: req.RelatedMedicalID,
		RelatedCheckInID: req.RelatedCheckInID,
		AssignedTo:      req.AssignedTo,
		ScheduledTime:   req.ScheduledTime,
		DueTime:         req.DueTime,
		Remark:          req.Remark,
	}
	followUp.CreatedBy = req.CreatedBy
	followUp.UpdatedBy = req.CreatedBy

	err := database.DB.Create(followUp).Error
	if err != nil {
		return nil, err
	}

	s.logService.LogStatusChange("followup", followUp.ID,
		"", string(model.FollowUpStatusPending), req.CreatedBy, "创建随访任务")

	s.logService.LogOperation(
		req.CreatedBy, req.CreatedByName, req.CreatedByRole,
		"followup_create", "followup", followUp.ID,
		nil, followUp, req.IP, req.UserAgent,
	)

	return followUp, nil
}

type UpdateFollowUpStatusRequest struct {
	FollowUpID  string
	Status      model.FollowUpStatus
	UserID      string
	UserName    string
	UserRole    string
	Result      string
	NextStep    string
	Remark      string
	IP          string
	UserAgent   string
}

func (s *FollowUpService) UpdateFollowUpStatus(req UpdateFollowUpStatusRequest) (*model.FollowUp, error) {
	var followUp model.FollowUp
	if err := database.DB.Where("id = ?", req.FollowUpID).First(&followUp).Error; err != nil {
		return nil, err
	}

	oldStatus := followUp.Status
	oldAssignedTo := followUp.AssignedTo

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		followUp.Status = req.Status
		followUp.UpdatedBy = req.UserID

		if req.Result != "" {
			followUp.Result = req.Result
		}
		if req.NextStep != "" {
			followUp.NextStep = req.NextStep
		}
		if req.Remark != "" {
			followUp.Remark = followUp.Remark + "\n" + req.Remark
		}

		if req.Status == model.FollowUpStatusCompleted {
			now := time.Now()
			followUp.CompletedTime = &now
			followUp.CompletedBy = req.UserID
		}

		if err := tx.Save(&followUp).Error; err != nil {
			return err
		}

		history := &model.FollowUpHistory{
			FollowUpID:    req.FollowUpID,
			OldStatus:     oldStatus,
			NewStatus:     req.Status,
			OldAssignedTo: oldAssignedTo,
			NewAssignedTo: followUp.AssignedTo,
			ChangedBy:     req.UserID,
			ChangeReason:  req.Remark,
		}
		history.CreatedBy = req.UserID
		history.UpdatedBy = req.UserID

		return tx.Create(history).Error
	})

	if err != nil {
		return nil, err
	}

	if oldStatus != req.Status {
		s.logService.LogStatusChange("followup", followUp.ID,
			string(oldStatus), string(req.Status), req.UserID, req.Remark)
	}

	s.logService.LogOperation(
		req.UserID, req.UserName, req.UserRole,
		"followup_update", "followup", followUp.ID,
		map[string]interface{}{"status": oldStatus},
		map[string]interface{}{"status": req.Status, "result": req.Result},
		req.IP, req.UserAgent,
	)

	return &followUp, nil
}

func (s *FollowUpService) GetCampFollowUps(campID string, status model.FollowUpStatus, page, pageSize int) ([]model.FollowUp, int64, error) {
	var followUps []model.FollowUp
	var total int64

	query := database.DB.Model(&model.FollowUp{}).
		Joins("JOIN campers ON campers.id = follow_ups.camper_id").
		Where("campers.camp_id = ?", campID)

	if status != "" {
		query = query.Where("follow_ups.status = ?", status)
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	err := query.Preload("Camper").
		Preload("AssignedStaff").
		Preload("RelatedMedical").
		Preload("History").
		Order("priority DESC, due_time ASC").
		Offset(offset).
		Limit(pageSize).
		Find(&followUps).Error

	return followUps, total, err
}

func (s *FollowUpService) GetUserAssignedFollowUps(userID string, status model.FollowUpStatus) ([]model.FollowUp, error) {
	var followUps []model.FollowUp

	query := database.DB.Where("assigned_to = ?", userID)
	if status != "" {
		query = query.Where("status = ?", status)
	}

	err := query.Preload("Camper").
		Preload("RelatedMedical").
		Order("priority DESC, due_time ASC").
		Find(&followUps).Error

	return followUps, err
}

func (s *FollowUpService) GetOverdueFollowUps(campID string) ([]model.FollowUp, error) {
	var followUps []model.FollowUp
	now := time.Now()

	err := database.DB.Model(&model.FollowUp{}).
		Joins("JOIN campers ON campers.id = follow_ups.camper_id").
		Where("campers.camp_id = ? AND follow_ups.status IN ? AND follow_ups.due_time < ?",
			campID, []model.FollowUpStatus{model.FollowUpStatusPending, model.FollowUpStatusScheduled}, now).
		Preload("Camper").
		Preload("AssignedStaff").
		Order("priority DESC").
		Find(&followUps).Error

	return followUps, err
}

func (s *FollowUpService) ValidateCamperAccess(camperID string, userID string, userRole model.Role) error {
	var camper model.Camper
	if err := database.DB.Where("id = ?", camperID).First(&camper).Error; err != nil {
		return errors.New("营员不存在: " + camperID)
	}

	var user model.User
	if err := database.DB.Where("id = ?", userID).First(&user).Error; err != nil {
		return errors.New("用户不存在")
	}

	hasCampAccess := false
	if user.Role == model.RoleAdmin || user.Role == model.RoleDirector {
		hasCampAccess = true
	} else {
		for _, cid := range user.CampIDs {
			if cid == camper.CampID {
				hasCampAccess = true
				break
			}
		}
	}
	if !hasCampAccess {
		return errors.New("无权限访问该营地数据")
	}

	if userRole == model.RoleTeacher && camper.TeacherID != userID {
		return errors.New("无权限处理非本班营员: " + camper.Name)
	}
	return nil
}

func (s *FollowUpService) ValidateFollowUpAccess(followUpID string, userID string, userRole model.Role) error {
	var followUp model.FollowUp
	if err := database.DB.Where("id = ?", followUpID).First(&followUp).Error; err != nil {
		return errors.New("随访任务不存在: " + followUpID)
	}

	return s.ValidateCamperAccess(followUp.CamperID, userID, userRole)
}

func (s *FollowUpService) GetCamperFollowUps(camperID string, userID string, userRole model.Role) ([]model.FollowUp, error) {
	if err := s.ValidateCamperAccess(camperID, userID, userRole); err != nil {
		return nil, err
	}

	var followUps []model.FollowUp
	err := database.DB.Where("camper_id = ?", camperID).
		Preload("AssignedStaff").
		Preload("CompletedStaff").
		Preload("RelatedMedical").
		Preload("History").
		Order("created_at DESC").
		Find(&followUps).Error
	return followUps, err
}
