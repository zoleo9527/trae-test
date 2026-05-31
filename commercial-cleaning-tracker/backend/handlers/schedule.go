package handlers

import (
	"net/http"
	"time"

	"github.com/cleaning-tracker/backend/config"
	"github.com/cleaning-tracker/backend/models"
	"github.com/gofiber/fiber/v2"
)

type CreateScheduleRequest struct {
	ProjectID uint      `json:"projectId"`
	WeekStart time.Time `json:"weekStart"`
	Shifts    []struct {
		WorkerID  uint           `json:"workerId"`
		Date      time.Time      `json:"date"`
		ShiftType models.ShiftType `json:"shiftType"`
		StartTime string         `json:"startTime"`
		EndTime   string         `json:"endTime"`
		Area      string         `json:"area"`
		Tasks     string         `json:"tasks"`
	} `json:"shifts"`
}

func GetSchedules(c *fiber.Ctx) error {
	var schedules []models.Schedule
	query := config.DB.Preload("Project").Preload("Creator").Preload("Shifts.Worker")

	projectID := c.Query("projectId")
	if projectID != "" {
		query = query.Where("project_id = ?", projectID)
	}

	weekStart := c.Query("weekStart")
	if weekStart != "" {
		query = query.Where("week_start >= ?", weekStart)
	}

	if err := query.Order("week_start desc").Find(&schedules).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch schedules"})
	}

	return c.JSON(schedules)
}

func GetSchedule(c *fiber.Ctx) error {
	id := c.Params("id")
	var schedule models.Schedule

	if err := config.DB.Preload("Project").Preload("Creator").
		Preload("Shifts.Worker").Preload("Shifts.CheckIns").
		Preload("Shifts.Inspections").Preload("Shifts.MaterialReqs").
		First(&schedule, id).Error; err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "Schedule not found"})
	}

	return c.JSON(schedule)
}

func CreateSchedule(c *fiber.Ctx) error {
	var req CreateScheduleRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	schedule := models.Schedule{
		ProjectID: req.ProjectID,
		WeekStart: req.WeekStart,
		WeekEnd:   req.WeekStart.AddDate(0, 0, 6),
		Status:    models.ScheduleDraft,
		CreatedBy: GetCurrentUserID(c),
	}

	if err := config.DB.Create(&schedule).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create schedule"})
	}

	for _, s := range req.Shifts {
		shift := models.Shift{
			ScheduleID: schedule.ID,
			WorkerID:   s.WorkerID,
			Date:       s.Date,
			ShiftType:  s.ShiftType,
			StartTime:  s.StartTime,
			EndTime:    s.EndTime,
			Area:       s.Area,
			Tasks:      s.Tasks,
		}
		config.DB.Create(&shift)
	}

	config.DB.Preload("Shifts").First(&schedule, schedule.ID)
	return c.JSON(schedule)
}

func PublishSchedule(c *fiber.Ctx) error {
	id := c.Params("id")
	var schedule models.Schedule

	if err := config.DB.First(&schedule, id).Error; err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "Schedule not found"})
	}

	schedule.Status = models.SchedulePublished
	if err := config.DB.Save(&schedule).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to publish schedule"})
	}

	return c.JSON(schedule)
}

func GetShifts(c *fiber.Ctx) error {
	var shifts []models.Shift
	query := config.DB.Preload("Worker").Preload("Schedule.Project").
		Preload("CheckIns").Preload("Inspections").Preload("MaterialReqs")

	workerID := c.Query("workerId")
	if workerID != "" {
		query = query.Where("worker_id = ?", workerID)
	}

	date := c.Query("date")
	if date != "" {
		query = query.Where("date = ?", date)
	}

	projectID := c.Query("projectId")
	if projectID != "" {
		query = query.Joins("JOIN schedules ON schedules.id = shifts.schedule_id").
			Where("schedules.project_id = ?", projectID)
	}

	if err := query.Order("date desc, start_time").Find(&shifts).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch shifts"})
	}

	return c.JSON(shifts)
}

func GetShift(c *fiber.Ctx) error {
	id := c.Params("id")
	var shift models.Shift

	if err := config.DB.Preload("Worker").Preload("Schedule.Project").
		Preload("CheckIns").Preload("Inspections.Rectification").
		Preload("Inspections.Inspector").Preload("MaterialReqs.Requester").
		First(&shift, id).Error; err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "Shift not found"})
	}

	return c.JSON(shift)
}

func GetProjects(c *fiber.Ctx) error {
	var projects []models.Project
	if err := config.DB.Preload("Manager").Find(&projects).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch projects"})
	}
	return c.JSON(projects)
}

func GetWorkers(c *fiber.Ctx) error {
	var workers []models.User
	if err := config.DB.Where("role = ?", models.RoleWorker).Find(&workers).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch workers"})
	}

	for i := range workers {
		workers[i].Password = ""
	}
	return c.JSON(workers)
}
