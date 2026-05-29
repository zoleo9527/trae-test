package handlers

import (
	"exhibition-system/internal/database"
	"exhibition-system/internal/models"

	"github.com/gofiber/fiber/v2"
)

type DashboardHandler struct{}

func NewDashboardHandler() *DashboardHandler {
	return &DashboardHandler{}
}

type DashboardStats struct {
	ProjectStats     ProjectStats     `json:"projects"`
	CertificateStats CertificateStats `json:"certificates"`
	MaterialStats    MaterialStats    `json:"materials"`
	InspectionStats  InspectionStats  `json:"inspections"`
	TeardownStats    TeardownStats    `json:"teardowns"`
	TaskStats        TaskStats        `json:"tasks"`
}

type ProjectStats struct {
	Total     int64 `json:"total"`
	Pending   int64 `json:"pending"`
	Active    int64 `json:"active"`
	Completed int64 `json:"completed"`
}

type CertificateStats struct {
	Total    int64 `json:"total"`
	Pending  int64 `json:"pending"`
	Approved int64 `json:"approved"`
	Rejected int64 `json:"rejected"`
}

type MaterialStats struct {
	Total    int64 `json:"total"`
	Draft    int64 `json:"draft"`
	Pending  int64 `json:"pending"`
	Approved int64 `json:"approved"`
}

type InspectionStats struct {
	Total    int64 `json:"total"`
	Pending  int64 `json:"pending"`
	Reviewing int64 `json:"reviewing"`
	Approved int64 `json:"approved"`
	Rejected int64 `json:"rejected"`
}

type TeardownStats struct {
	Total    int64 `json:"total"`
	Pending  int64 `json:"pending"`
	Reviewing int64 `json:"reviewing"`
	Approved int64 `json:"approved"`
	Rejected int64 `json:"rejected"`
}

type TaskStats struct {
	Total    int64 `json:"total"`
	Todo     int64 `json:"todo"`
	Doing    int64 `json:"doing"`
	Done     int64 `json:"done"`
	Blocked  int64 `json:"blocked"`
	Rejected int64 `json:"rejected"`
}

func (h *DashboardHandler) GetStats(c *fiber.Ctx) error {
	stats := DashboardStats{}

	database.DB.Model(&models.Project{}).Count(&stats.ProjectStats.Total)
	database.DB.Model(&models.Project{}).Where("status = ?", models.StatusPending).Count(&stats.ProjectStats.Pending)
	database.DB.Model(&models.Project{}).Where("phase IN ?", []string{
		string(models.PhaseSetup),
		string(models.PhaseInspection),
		string(models.PhaseExhibition),
		string(models.PhaseTeardown),
	}).Count(&stats.ProjectStats.Active)
	database.DB.Model(&models.Project{}).Where("phase = ?", models.PhaseCompleted).Count(&stats.ProjectStats.Completed)

	database.DB.Model(&models.Certificate{}).Count(&stats.CertificateStats.Total)
	database.DB.Model(&models.Certificate{}).Where("status = ?", models.StatusPending).Count(&stats.CertificateStats.Pending)
	database.DB.Model(&models.Certificate{}).Where("status = ?", models.StatusApproved).Count(&stats.CertificateStats.Approved)
	database.DB.Model(&models.Certificate{}).Where("status = ?", models.StatusRejected).Count(&stats.CertificateStats.Rejected)

	database.DB.Model(&models.Material{}).Count(&stats.MaterialStats.Total)
	database.DB.Model(&models.Material{}).Where("status = ?", models.MaterialStatusDraft).Count(&stats.MaterialStats.Draft)
	database.DB.Model(&models.Material{}).Where("status = ?", models.MaterialStatusPending).Count(&stats.MaterialStats.Pending)
	database.DB.Model(&models.Material{}).Where("status = ?", models.MaterialStatusApproved).Count(&stats.MaterialStats.Approved)

	database.DB.Model(&models.Inspection{}).Count(&stats.InspectionStats.Total)
	database.DB.Model(&models.Inspection{}).Where("status = ?", models.StatusPending).Count(&stats.InspectionStats.Pending)
	database.DB.Model(&models.Inspection{}).Where("status = ?", models.StatusReviewing).Count(&stats.InspectionStats.Reviewing)
	database.DB.Model(&models.Inspection{}).Where("status = ?", models.StatusApproved).Count(&stats.InspectionStats.Approved)
	database.DB.Model(&models.Inspection{}).Where("status = ?", models.StatusRejected).Count(&stats.InspectionStats.Rejected)

	database.DB.Model(&models.TeardownReview{}).Count(&stats.TeardownStats.Total)
	database.DB.Model(&models.TeardownReview{}).Where("status = ?", models.StatusPending).Count(&stats.TeardownStats.Pending)
	database.DB.Model(&models.TeardownReview{}).Where("status = ?", models.StatusReviewing).Count(&stats.TeardownStats.Reviewing)
	database.DB.Model(&models.TeardownReview{}).Where("status = ?", models.StatusApproved).Count(&stats.TeardownStats.Approved)
	database.DB.Model(&models.TeardownReview{}).Where("status = ?", models.StatusRejected).Count(&stats.TeardownStats.Rejected)

	database.DB.Model(&models.Task{}).Count(&stats.TaskStats.Total)
	database.DB.Model(&models.Task{}).Where("status = ?", models.TaskStatusTodo).Count(&stats.TaskStats.Todo)
	database.DB.Model(&models.Task{}).Where("status = ?", models.TaskStatusDoing).Count(&stats.TaskStats.Doing)
	database.DB.Model(&models.Task{}).Where("status = ?", models.TaskStatusDone).Count(&stats.TaskStats.Done)
	database.DB.Model(&models.Task{}).Where("status = ?", models.TaskStatusBlocked).Count(&stats.TaskStats.Blocked)
	database.DB.Model(&models.Task{}).Where("status = ?", models.TaskStatusRejected).Count(&stats.TaskStats.Rejected)

	return c.JSON(stats)
}

func (h *DashboardHandler) GetPendingItems(c *fiber.Ctx) error {
	var pendingCerts []models.Certificate
	var pendingInspections []models.Inspection
	var pendingTeardowns []models.TeardownReview

	database.DB.Where("status = ?", models.StatusPending).
		Preload("Project").
		Preload("Owner").
		Order("created_at DESC").
		Limit(10).
		Find(&pendingCerts)

	database.DB.Where("status IN ?", []string{string(models.StatusPending), string(models.StatusReviewing)}).
		Preload("Project").
		Preload("Inspector").
		Order("created_at DESC").
		Limit(10).
		Find(&pendingInspections)

	database.DB.Where("status IN ?", []string{string(models.StatusPending), string(models.StatusReviewing)}).
		Preload("Project").
		Preload("Operator").
		Order("created_at DESC").
		Limit(10).
		Find(&pendingTeardowns)

	return c.JSON(fiber.Map{
		"certificates": pendingCerts,
		"inspections":  pendingInspections,
		"teardowns":    pendingTeardowns,
	})
}

func (h *DashboardHandler) GetRecentActivity(c *fiber.Ctx) error {
	var logs []models.AuditLog
	err := database.DB.Preload("Operator").
		Preload("Project").
		Order("created_at DESC").
		Limit(20).
		Find(&logs).Error
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(logs)
}
