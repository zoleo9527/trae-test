package handlers

import (
	"time"

	"camp-management/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type DashboardHandler struct {
	db *gorm.DB
}

func NewDashboardHandler(db *gorm.DB) *DashboardHandler {
	return &DashboardHandler{db: db}
}

func (h *DashboardHandler) GetStats(c *fiber.Ctx) error {
	var pendingCount int64
	h.db.Model(&models.Attendance{}).Where("approval_status = ?", "pending").Count(&pendingCount)

	var rejectedCount int64
	h.db.Model(&models.Attendance{}).Where("approval_status = ?", "rejected").Count(&rejectedCount)

	var reviewNeededCount int64
	h.db.Model(&models.MedicalRecord{}).Where("status IN ?", []string{"pending", "in_progress"}).Count(&reviewNeededCount)

	var totalCampers int64
	h.db.Model(&models.Camper{}).Count(&totalCampers)

	var activeCampers int64
	h.db.Model(&models.Camper{}).Where("status = ?", "active").Count(&activeCampers)

	today := time.Now().Format("2006-01-02")
	var todayPresent int64
	h.db.Model(&models.Attendance{}).Where("date = ? AND status = ?", today, "present").Count(&todayPresent)

	todayAttendanceRate := float64(0)
	if activeCampers > 0 {
		todayAttendanceRate = float64(todayPresent) / float64(activeCampers) * 100
	}

	return c.JSON(fiber.Map{
		"data": fiber.Map{
			"pendingCount":        pendingCount,
			"rejectedCount":       rejectedCount,
			"reviewNeededCount":   reviewNeededCount,
			"totalCampers":        totalCampers,
			"activeCampers":       activeCampers,
			"todayAttendanceRate": todayAttendanceRate,
		},
	})
}

func (h *DashboardHandler) GetTodoItems(c *fiber.Ctx) error {
	type TodoItem struct {
		ID          string `json:"id"`
		Type        string `json:"type"`
		Title       string `json:"title"`
		Description string `json:"description"`
		Status      string `json:"status"`
		CreatedAt   string `json:"created_at"`
	}

	var items []TodoItem

	var pendingAttendance []models.Attendance
	h.db.Where("approval_status = ?", "pending").Preload("Camper").Find(&pendingAttendance)
	for _, a := range pendingAttendance {
		camperName := ""
		if a.Camper.ID != "" {
			camperName = a.Camper.Name
		}
		items = append(items, TodoItem{
			ID:          a.ID,
			Type:        "attendance",
			Title:       "待审批考勤",
			Description: camperName + " " + a.Date + " " + a.Session,
			Status:      a.ApprovalStatus,
			CreatedAt:   a.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	var pendingMedical []models.MedicalRecord
	h.db.Where("status IN ?", []string{"pending", "in_progress"}).Preload("Camper").Find(&pendingMedical)
	for _, m := range pendingMedical {
		camperName := ""
		if m.Camper.ID != "" {
			camperName = m.Camper.Name
		}
		items = append(items, TodoItem{
			ID:          m.ID,
			Type:        "medical",
			Title:       "待处理医疗记录",
			Description: camperName + " " + m.Type + " " + m.Description,
			Status:      m.Status,
			CreatedAt:   m.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	var pendingSupply []models.Supply
	h.db.Where("status = ?", "pending").Preload("Camper").Find(&pendingSupply)
	for _, s := range pendingSupply {
		camperName := ""
		if s.Camper.ID != "" {
			camperName = s.Camper.Name
		}
		items = append(items, TodoItem{
			ID:          s.ID,
			Type:        "supply",
			Title:       "待处理物资申请",
			Description: camperName + " " + s.ItemName,
			Status:      s.Status,
			CreatedAt:   s.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	var pendingFeedback []models.Feedback
	h.db.Where("status = ?", "pending").Preload("Camper").Find(&pendingFeedback)
	for _, f := range pendingFeedback {
		camperName := ""
		if f.Camper.ID != "" {
			camperName = f.Camper.Name
		}
		items = append(items, TodoItem{
			ID:          f.ID,
			Type:        "feedback",
			Title:       "待处理反馈",
			Description: camperName + " " + f.Type + " " + f.Content,
			Status:      f.Status,
			CreatedAt:   f.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	return c.JSON(fiber.Map{"data": items})
}
