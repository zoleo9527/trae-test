package service

import (
	"camp-management/internal/model"
	"camp-management/internal/repository"
	"errors"
	"time"

	"github.com/google/uuid"
)

type ActivityService struct {
	repo         *repository.ActivityRepository
	attendanceRepo *repository.AttendanceRepository
	camperRepo   *repository.CamperRepository
	auditService *AuditService
}

func NewActivityService(repo *repository.ActivityRepository, attendanceRepo *repository.AttendanceRepository, camperRepo *repository.CamperRepository, auditService *AuditService) *ActivityService {
	return &ActivityService{
		repo: repo, attendanceRepo: attendanceRepo, camperRepo: camperRepo, auditService: auditService}
}

type CreateActivityRequest struct {
	CampID          uuid.UUID `json:"camp_id" validate:"required"`
	Name            string    `json:"name" validate:"required"`
	Description     string    `json:"description"`
	Location        string    `json:"location"`
	StartTime       string    `json:"start_time" validate:"required"`
	EndTime         string    `json:"end_time" validate:"required"`
	TeacherID       uuid.UUID `json:"teacher_id"`
	MaxParticipants int       `json:"max_participants"`
}

func (s *ActivityService) Create(req CreateActivityRequest, userID uuid.UUID) (*model.Activity, error) {
	startTime, err := time.Parse(time.RFC3339, req.StartTime)
	if err != nil {
		return nil, NewServiceError("INVALID_START_TIME", "开始时间格式错误", ErrValidation)
	}

	endTime, err := time.Parse(time.RFC3339, req.EndTime)
	if err != nil {
		return nil, NewServiceError("INVALID_END_TIME", "结束时间格式错误", ErrValidation)
	}

	activity := &model.Activity{
		CampID: req.CampID,
		Name: req.Name,
		Description: req.Description,
		Location: req.Location,
		StartTime: startTime,
		EndTime: endTime,
		MaxParticipants: req.MaxParticipants,
	}

	if req.TeacherID != uuid.Nil {
		activity.TeacherID = &req.TeacherID
	}

	if err := s.repo.Create(activity); err != nil {
		return nil, err
	}

	s.auditService.Log(userID, model.AuditActionCreate, "activity", &activity.ID, nil, activity, nil, "", "", "创建活动")
	return activity, nil
}

func (s *ActivityService) GetByID(id uuid.UUID) (*model.Activity, error) {
	activity, err := s.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, repository.ErrRecordNotFound) {
			return nil, NewServiceError("ACTIVITY_NOT_FOUND", "活动不存在", ErrNotFound)
		}
		return nil, err
	}
	return activity, nil
}

func (s *ActivityService) GetByCampID(campID uuid.UUID) ([]model.Activity, error) {
	return s.repo.GetByCampID(campID)
}

func (s *ActivityService) BatchCreate(activities []CreateActivityRequest, userID uuid.UUID) ([]model.Activity, error) {
	var activityModels []model.Activity
	for _, a := range activities {
		startTime, _ := time.Parse(time.RFC3339, a.StartTime)
		endTime, _ := time.Parse(time.RFC3339, a.EndTime)
		activity := model.Activity{
			CampID: a.CampID,
			Name: a.Name,
			Description: a.Description,
			Location: a.Location,
			StartTime: startTime,
			EndTime: endTime,
			MaxParticipants: a.MaxParticipants,
		}
		if a.TeacherID != uuid.Nil {
			activity.TeacherID = &a.TeacherID
		}
		activityModels = append(activityModels, activity)
	}

	if err := s.repo.BatchCreate(activityModels); err != nil {
		return nil, err
	}

	s.auditService.Log(userID, model.AuditActionCreate, "activity", nil, nil, map[string]interface{}{"count": len(activities)}, nil, "", "", "批量创建活动")
	return activityModels, nil
}

type CheckInRequest struct {
	ActivityID uuid.UUID               `json:"activity_id" validate:"required"`
	CamperID   uuid.UUID               `json:"camper_id" validate:"required"`
	Status     model.AttendanceStatus `json:"status" validate:"required"`
	Notes      string                `json:"notes"`
}

func (s *ActivityService) CheckIn(req CheckInRequest, userID uuid.UUID) (*model.Attendance, error) {
	_, err := s.repo.GetByID(req.ActivityID)
	if err != nil {
		return nil, NewServiceError("ACTIVITY_NOT_FOUND", "活动不存在", ErrNotFound)
	}

	_, err = s.camperRepo.GetByID(req.CamperID)
	if err != nil {
		return nil, NewServiceError("CAMPER_NOT_FOUND", "营员不存在", ErrNotFound)
	}

	now := time.Now()
	attendance := &model.Attendance{
		ActivityID: req.ActivityID,
		CamperID: req.CamperID,
		Status: req.Status,
		Notes: req.Notes,
		CheckedInAt: &now,
		CheckedBy: userID,
	}

	if req.Status == model.AttendancePresent {
		attendance.CheckedInAt = &now
	}

	if err := s.attendanceRepo.Create(attendance); err != nil {
		return nil, err
	}

	s.auditService.Log(userID, model.AuditActionCreate, "attendance", &attendance.ID, nil, attendance, nil, "", "", "活动签到")
	return attendance, nil
}

type BatchCheckInRequest struct {
	ActivityID uuid.UUID                  `json:"activity_id" validate:"required"`
	Records    []BatchCheckInRecord `json:"records" validate:"required,min=1"`
}

type BatchCheckInRecord struct {
	CamperID uuid.UUID               `json:"camper_id" validate:"required"`
	Status     model.AttendanceStatus `json:"status" validate:"required"`
	Notes      string                `json:"notes"`
}

func (s *ActivityService) BatchCheckIn(req BatchCheckInRequest, userID uuid.UUID) ([]model.Attendance, error) {
	now := time.Now()
	var attendances []model.Attendance
	for _, r := range req.Records {
		attendance := model.Attendance{
			ActivityID: req.ActivityID,
			CamperID: r.CamperID,
			Status: r.Status,
			Notes: r.Notes,
			CheckedInAt: &now,
			CheckedBy: userID,
		}
		if r.Status == model.AttendancePresent {
			attendance.CheckedInAt = &now
		}
		attendances = append(attendances, attendance)
	}

	if err := s.attendanceRepo.BatchCreate(attendances); err != nil {
		return nil, err
	}

	s.auditService.Log(userID, model.AuditActionCreate, "attendance", nil, nil, map[string]interface{}{"count": len(attendances)}, nil, "", "", "批量签到")
	return attendances, nil
}

func (s *ActivityService) GetAttendances(activityID uuid.UUID) ([]model.Attendance, error) {
	return s.attendanceRepo.GetByActivityID(activityID)
}

func (s *ActivityService) GetCamperAttendances(camperID uuid.UUID) ([]model.Attendance, error) {
	return s.attendanceRepo.GetByCamperID(camperID)
}
