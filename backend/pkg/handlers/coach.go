package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"golf-range/pkg/database"
	"golf-range/pkg/middleware"
	"golf-range/pkg/models"
)

func ListCoaches(c *fiber.Ctx) error {
	var coaches []models.User
	result := database.DB.Where("role = ?", models.RoleCoach).Find(&coaches)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "查询教练失败"})
	}
	return c.JSON(coaches)
}

func ListSchedules(c *fiber.Ctx) error {
	date := c.Query("date")
	coachID := c.Query("coachId")

	var schedules []models.CoachSchedule
	query := database.DB.Preload("Bookings").Order("date ASC, start_at ASC")

	if date != "" {
		parsedDate, err := time.Parse("2006-01-02", date)
		if err == nil {
			startOfDay := time.Date(parsedDate.Year(), parsedDate.Month(), parsedDate.Day(), 0, 0, 0, 0, parsedDate.Location())
			endOfDay := startOfDay.AddDate(0, 0, 1)
			query = query.Where("date >= ? AND date < ?", startOfDay, endOfDay)
		}
	}

	if coachID != "" {
		query = query.Where("coach_id = ?", coachID)
	}

	result := query.Find(&schedules)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "查询排班失败"})
	}

	return c.JSON(schedules)
}

func CreateSchedule(c *fiber.Ctx) error {
	var schedule models.CoachSchedule
	if err := c.BodyParser(&schedule); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "请求格式错误"})
	}

	var coach models.User
	if err := database.DB.Where("id = ?", schedule.CoachID).First(&coach).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "教练不存在"})
	}

	schedule.CoachName = coach.Name
	schedule.Status = "published"
	schedule.BookedCount = 0
	schedule.CreatedAt = time.Now()
	schedule.UpdatedAt = time.Now()

	if err := database.DB.Create(&schedule).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "创建排班失败"})
	}

	middleware.CreateAuditLog(c, "创建排班", "schedule", schedule.ID, "无", schedule.CoachName+" "+schedule.Date.Format("2006-01-02"), nil, nil)

	return c.JSON(schedule)
}

func UpdateSchedule(c *fiber.Ctx) error {
	id := c.Params("id")
	scheduleID, err := uuid.Parse(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "无效的排班ID"})
	}

	var schedule models.CoachSchedule
	if err := database.DB.Where("id = ?", scheduleID).First(&schedule).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "排班不存在"})
	}

	var updates map[string]interface{}
	if err := c.BodyParser(&updates); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "请求格式错误"})
	}

	oldStatus := schedule.Status

	if err := database.DB.Model(&schedule).Updates(updates).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "更新排班失败"})
	}

	schedule.UpdatedAt = time.Now()
	database.DB.Save(&schedule)

	newStatus, _ := updates["status"].(string)
	middleware.CreateAuditLog(c, "更新排班", "schedule", schedule.ID, oldStatus, newStatus, nil, nil)

	return c.JSON(schedule)
}
