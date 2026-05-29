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
	JobStats         JobStats         `json:"jobs"`
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
	Rejected int64 `json:"rejected"`
}

type InspectionStats struct {
	Total     int64 `json:"total"`
	Pending   int64 `json:"pending"`
	Reviewing int64 `json:"reviewing"`
	Approved  int64 `json:"approved"`
	Rejected  int64 `json:"rejected"`
}

type TeardownStats struct {
	Total     int64 `json:"total"`
	Pending   int64 `json:"pending"`
	Reviewing int64 `json:"reviewing"`
	Approved  int64 `json:"approved"`
	Rejected  int64 `json:"rejected"`
}

type TaskStats struct {
	Total    int64 `json:"total"`
	Todo     int64 `json:"todo"`
	Doing    int64 `json:"doing"`
	Done     int64 `json:"done"`
	Blocked  int64 `json:"blocked"`
	Rejected int64 `json:"rejected"`
}

type JobStats struct {
	Total    int64 `json:"total"`
	Pending  int64 `json:"pending"`
	Running  int64 `json:"running"`
	Completed int64 `json:"completed"`
	Failed   int64 `json:"failed"`
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
	database.DB.Model(&models.Material{}).Where("status = ?", models.MaterialStatusRejected).Count(&stats.MaterialStats.Rejected)

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

	database.DB.Model(&models.AsyncJob{}).Count(&stats.JobStats.Total)
	database.DB.Model(&models.AsyncJob{}).Where("status = ?", "pending").Count(&stats.JobStats.Pending)
	database.DB.Model(&models.AsyncJob{}).Where("status = ?", "running").Count(&stats.JobStats.Running)
	database.DB.Model(&models.AsyncJob{}).Where("status = ?", "completed").Count(&stats.JobStats.Completed)
	database.DB.Model(&models.AsyncJob{}).Where("status = ?", "failed").Count(&stats.JobStats.Failed)

	return c.JSON(stats)
}

func (h *DashboardHandler) GetPendingItems(c *fiber.Ctx) error {
	var pendingCerts []models.Certificate
	var pendingInspections []models.Inspection
	var pendingTeardowns []models.TeardownReview

	var rejectedCerts []models.Certificate
	var rejectedInspections []models.Inspection
	var rejectedTeardowns []models.TeardownReview

	var reviewNeededCerts []models.Certificate
	var reviewNeededInspections []models.Inspection
	var reviewNeededTeardowns []models.TeardownReview

	var completedProjects []models.Project

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

	database.DB.Where("status = ?", models.StatusRejected).
		Preload("Project").
		Preload("Owner").
		Order("updated_at DESC").
		Limit(10).
		Find(&rejectedCerts)

	database.DB.Where("status = ?", models.StatusRejected).
		Preload("Project").
		Preload("Inspector").
		Order("updated_at DESC").
		Limit(10).
		Find(&rejectedInspections)

	database.DB.Where("status = ?", models.StatusRejected).
		Preload("Project").
		Preload("Operator").
		Order("updated_at DESC").
		Limit(10).
		Find(&rejectedTeardowns)

	database.DB.Where("status = ? AND reject_reason IS NOT NULL AND reject_reason != ''", models.StatusPending).
		Preload("Project").
		Preload("Owner").
		Order("updated_at DESC").
		Limit(10).
		Find(&reviewNeededCerts)

	database.DB.Where("status = ? AND reject_reason IS NOT NULL AND reject_reason != ''", models.StatusPending).
		Preload("Project").
		Preload("Inspector").
		Order("updated_at DESC").
		Limit(10).
		Find(&reviewNeededInspections)

	database.DB.Where("status = ? AND reject_reason IS NOT NULL AND reject_reason != ''", models.StatusPending).
		Preload("Project").
		Preload("Operator").
		Order("updated_at DESC").
		Limit(10).
		Find(&reviewNeededTeardowns)

	database.DB.Where("phase = ?", models.PhaseCompleted).
		Order("updated_at DESC").
		Limit(10).
		Find(&completedProjects)

	return c.JSON(fiber.Map{
		"pending": fiber.Map{
			"certificates": pendingCerts,
			"inspections":  pendingInspections,
			"teardowns":    pendingTeardowns,
		},
		"rejected": fiber.Map{
			"certificates": rejectedCerts,
			"inspections":  rejectedInspections,
			"teardowns":    rejectedTeardowns,
		},
		"review_needed": fiber.Map{
			"certificates": reviewNeededCerts,
			"inspections":  reviewNeededInspections,
			"teardowns":    reviewNeededTeardowns,
		},
		"completed_projects": completedProjects,
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
