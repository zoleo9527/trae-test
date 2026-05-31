package service

import (
	"time"

	"floor-settlement/internal/dto"
	"floor-settlement/internal/model"
	"floor-settlement/internal/repository"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type AttendanceService struct {
	repo *repository.AttendanceRepository
}

func NewAttendanceService() *AttendanceService {
	return &AttendanceService{repo: &repository.AttendanceRepository{}}
}

func (s *AttendanceService) Create(ctx *fiber.Ctx, req *dto.AttendanceCreate) (*model.AttendanceRecord, error) {
	claims := getUserClaims(ctx)

	teamID, err := uuid.Parse(req.TeamID)
	if err != nil {
		return nil, err
	}
	projectID, err := uuid.Parse(req.ProjectID)
	if err != nil {
		return nil, err
	}
	recordDate, err := time.Parse("2006-01-02", req.RecordDate)
	if err != nil {
		return nil, err
	}

	record := &model.AttendanceRecord{
		TeamID:          teamID,
		ProjectID:       projectID,
		RecordDate:      recordDate,
		WorkerName:      req.WorkerName,
		WorkerIDCard:    req.WorkerIDCard,
		Status:          req.Status,
		HoursWorked:     req.HoursWorked,
		WorkArea:        req.WorkArea,
		TaskDescription: req.TaskDescription,
		Remark:          req.Remark,
		CreatedBy:       claims.ID,
	}

	if err := s.repo.Create(record); err != nil {
		return nil, err
	}

	RecordAudit(ctx, "attendance_record", record.ID, "create", nil, toMap(record), "")

	return record, nil
}

func (s *AttendanceService) FindByID(id uuid.UUID) (*model.AttendanceRecord, error) {
	return s.repo.FindByID(id)
}

func (s *AttendanceService) Update(ctx *fiber.Ctx, id uuid.UUID, req *dto.AttendanceUpdate) (*model.AttendanceRecord, error) {
	record, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	before := toMap(record)

	if req.Status != nil {
		record.Status = *req.Status
	}
	if req.HoursWorked != nil {
		record.HoursWorked = *req.HoursWorked
	}
	if req.WorkArea != nil {
		record.WorkArea = *req.WorkArea
	}
	if req.TaskDescription != nil {
		record.TaskDescription = *req.TaskDescription
	}
	if req.Remark != nil {
		record.Remark = *req.Remark
	}

	if err := s.repo.Update(record); err != nil {
		return nil, err
	}

	RecordAudit(ctx, "attendance_record", id, "update", before, toMap(record), "")

	return record, nil
}

func (s *AttendanceService) Delete(ctx *fiber.Ctx, id uuid.UUID) error {
	record, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}

	RecordAudit(ctx, "attendance_record", id, "delete", toMap(record), nil, "")

	return s.repo.Delete(id)
}

func (s *AttendanceService) Filter(ctx *fiber.Ctx, filter *dto.AttendanceFilter) ([]model.AttendanceRecord, int64, error) {
	claims := getUserClaims(ctx)

	var projectID uuid.UUID
	var teamID uuid.UUID
	var startDate, endDate time.Time

	if filter.ProjectID != "" {
		projectID, _ = uuid.Parse(filter.ProjectID)
	}
	if filter.TeamID != "" {
		teamID, _ = uuid.Parse(filter.TeamID)
	}
	if filter.StartDate != "" {
		startDate, _ = time.Parse("2006-01-02", filter.StartDate)
	}
	if filter.EndDate != "" {
		endDate, _ = time.Parse("2006-01-02", filter.EndDate)
	}

	if claims != nil {
		switch claims.Role {
		case "team_leader":
			if claims.TeamID != nil {
				teamID = *claims.TeamID
			}
		case "project_manager":
			if claims.ProjectID != nil {
				projectID = *claims.ProjectID
			}
		}
	}

	return s.repo.Filter(projectID, teamID, startDate, endDate, filter.Status, filter.WorkerName, filter.WorkArea, filter.Page, filter.PageSize)
}

func (s *AttendanceService) GetTeamAttendanceSummary(teamID uuid.UUID, startDate, endDate time.Time) (map[string]interface{}, error) {
	records, err := s.repo.FindByTeamAndDateRange(teamID, startDate, endDate)
	if err != nil {
		return nil, err
	}

	total := len(records)
	present := 0
	absent := 0
	var totalHours float64
	workers := make(map[string]bool)

	for _, r := range records {
		workers[r.WorkerName] = true
		totalHours += r.HoursWorked
		if r.Status == "present" {
			present++
		} else if r.Status == "absent" {
			absent++
		}
	}

	return map[string]interface{}{
		"total_records":  total,
		"present_count":  present,
		"absent_count":   absent,
		"total_hours":    totalHours,
		"unique_workers": len(workers),
	}, nil
}
