package handlers

import (
	"exhibition-system/internal/database"
	"exhibition-system/internal/middleware"
	"exhibition-system/internal/models"
	"exhibition-system/internal/services"
	"log"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
)

type TeardownHandler struct {
	auditService    *services.AuditService
	asyncJobService *services.AsyncJobService
}

func NewTeardownHandler() *TeardownHandler {
	return &TeardownHandler{
		auditService:    services.NewAuditService(),
		asyncJobService: services.NewAsyncJobService(),
	}
}

type IssueRequest struct {
	Title         string                `json:"title" validate:"required"`
	Description   string                `json:"description"`
	Severity      models.IssueSeverity  `json:"severity" validate:"required"`
	Category      string                `json:"category"`
	ResponsibleID uint                  `json:"responsible_id"`
	Status        models.TaskStatus     `json:"status"`
	Resolution    string                `json:"resolution"`
	Photos        []string              `json:"photos"`
	Deadline      *string               `json:"deadline"`
}

type CreateTeardownRequest struct {
	ProjectID        uint            `json:"project_id" validate:"required"`
	Title            string          `json:"title" validate:"required"`
	OperatorID       uint            `json:"operator_id"`
	SupervisorID     uint            `json:"supervisor_id"`
	StartTime        *string         `json:"start_time"`
	EndTime          *string         `json:"end_time"`
	Issues           []IssueRequest  `json:"issues"`
	MaterialReturned *bool           `json:"material_returned"`
	SiteCleared      *bool           `json:"site_cleared"`
	EquipmentChecked *bool           `json:"equipment_checked"`
	Summary          string          `json:"summary"`
	LessonsLearned   string          `json:"lessons_learned"`
	Improvements     string          `json:"improvements"`
	Attachments      []string        `json:"attachments"`
}

func (h *TeardownHandler) Create(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)

	var req CreateTeardownRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	teardown := &models.TeardownReview{
		ProjectID:        req.ProjectID,
		Title:            req.Title,
		Status:           models.StatusPending,
		MaterialReturned: req.MaterialReturned,
		SiteCleared:      req.SiteCleared,
		EquipmentChecked: req.EquipmentChecked,
		Summary:          req.Summary,
		LessonsLearned:   req.LessonsLearned,
		Improvements:     req.Improvements,
		Attachments:      req.Attachments,
	}

	if req.OperatorID > 0 {
		teardown.OperatorID = &req.OperatorID
	}
	if req.SupervisorID > 0 {
		teardown.SupervisorID = &req.SupervisorID
	}
	if req.StartTime != nil {
		if t, err := time.Parse(time.RFC3339, *req.StartTime); err == nil {
			teardown.StartTime = &t
		}
	}
	if req.EndTime != nil {
		if t, err := time.Parse(time.RFC3339, *req.EndTime); err == nil {
			teardown.EndTime = &t
		}
	}

	tx := database.DB.Begin()

	if err := tx.Create(teardown).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	for _, issueReq := range req.Issues {
		issue := models.TeardownIssue{
			TeardownReviewID: teardown.ID,
			Title:            issueReq.Title,
			Description:      issueReq.Description,
			Severity:         issueReq.Severity,
			Category:         issueReq.Category,
			Status:           models.TaskStatusTodo,
			Resolution:       issueReq.Resolution,
			Photos:           issueReq.Photos,
		}
		if issueReq.ResponsibleID > 0 {
			issue.ResponsibleID = &issueReq.ResponsibleID
		}
		if issueReq.Deadline != nil {
			if t, err := time.Parse(time.RFC3339, *issueReq.Deadline); err == nil {
				issue.Deadline = &t
			}
		}
		if err := tx.Create(&issue).Error; err != nil {
			tx.Rollback()
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
	}

	tx.Commit()

	h.auditService.Log(
		userID,
		models.ActionCreate,
		models.ResourceTeardown,
		teardown.ID,
		&teardown.ProjectID,
		nil,
		teardown,
		"Created teardown review: "+teardown.Title,
		c.IP(),
		c.Get("User-Agent"),
	)

	return c.Status(fiber.StatusCreated).JSON(teardown)
}

func (h *TeardownHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "20"))
	projectID := c.Query("project_id")
	status := c.Query("status")

	var teardowns []models.TeardownReview
	var total int64

	query := database.DB.Model(&models.TeardownReview{}).
		Preload("Operator").
		Preload("Supervisor").
		Preload("ApprovedBy").
		Preload("Issues").
		Preload("Issues.Responsible")

	if projectID != "" {
		query = query.Where("project_id = ?", projectID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&teardowns).Error
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data":  teardowns,
		"total": total,
		"page":  page,
		"size":  pageSize,
	})
}

func (h *TeardownHandler) Get(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))

	var teardown models.TeardownReview
	err := database.DB.Preload("Operator").
		Preload("Supervisor").
		Preload("ApprovedBy").
		Preload("Issues").
		Preload("Issues.Responsible").
		First(&teardown, id).Error
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Teardown review not found"})
	}

	return c.JSON(teardown)
}

func (h *TeardownHandler) Submit(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)
	id, _ := strconv.Atoi(c.Params("id"))

	var teardown models.TeardownReview
	if err := database.DB.First(&teardown, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Teardown review not found"})
	}

	oldTeardown := teardown
	teardown.Status = models.StatusReviewing

	if oldTeardown.Status == models.StatusRejected {
		teardown.Resubmitted = true
	}

	if err := database.DB.Save(&teardown).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	h.auditService.Log(
		userID,
		models.ActionSubmit,
		models.ResourceTeardown,
		teardown.ID,
		&teardown.ProjectID,
		&oldTeardown,
		&teardown,
		"Submitted teardown review: "+teardown.Title,
		c.IP(),
		c.Get("User-Agent"),
	)

	return c.JSON(teardown)
}

func (h *TeardownHandler) Approve(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)
	id, _ := strconv.Atoi(c.Params("id"))

	var teardown models.TeardownReview
	if err := database.DB.First(&teardown, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Teardown review not found"})
	}

	oldTeardown := teardown
	now := time.Now()
	teardown.Status = models.StatusApproved
	teardown.Resubmitted = false
	teardown.RejectReason = ""
	teardown.ActualEndTime = &now
	teardown.ApprovedByID = &userID
	teardown.ApprovedAt = &now

	tx := database.DB.Begin()

	if err := tx.Save(&teardown).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	var project models.Project
	database.DB.First(&project, teardown.ProjectID)
	if project.Phase == models.PhaseTeardown || project.Phase == models.PhaseReview {
		var pendingCount int64
		database.DB.Model(&models.TeardownReview{}).
			Where("project_id = ? AND status IN ?", project.ID, []string{
				string(models.StatusPending),
				string(models.StatusReviewing),
				string(models.StatusRejected),
			}).
			Count(&pendingCount)
		if pendingCount == 0 {
			job, err := h.asyncJobService.CreateJob("teardown_complete", map[string]interface{}{
				"project_id":         project.ID,
				"teardown_review_id": teardown.ID,
			}, userID)
			if err != nil {
				tx.Rollback()
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create completion job: " + err.Error()})
			}

			h.auditService.Log(
				userID,
				models.ActionApprove,
				models.ResourceTeardown,
				teardown.ID,
				&teardown.ProjectID,
				&oldTeardown,
				&teardown,
				"Approved teardown review, triggering project completion job_id="+strconv.FormatUint(uint64(job.ID), 10),
				c.IP(),
				c.Get("User-Agent"),
			)

			tx.Commit()

			go func() {
				if err := h.asyncJobService.ProcessJob(job); err != nil {
					log.Printf("Async job %d failed: %v", job.ID, err)
				}
			}()

			database.DB.Preload("Issues").Preload("Issues.Responsible").First(&teardown, id)
			return c.JSON(teardown)
		}
	}

	tx.Commit()

	h.auditService.Log(
		userID,
		models.ActionApprove,
		models.ResourceTeardown,
		teardown.ID,
		&teardown.ProjectID,
		&oldTeardown,
		&teardown,
		"Approved teardown review: "+teardown.Title,
		c.IP(),
		c.Get("User-Agent"),
	)

	return c.JSON(teardown)
}

func (h *TeardownHandler) Reject(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)
	id, _ := strconv.Atoi(c.Params("id"))

	var req struct {
		Reason string `json:"reason" validate:"required"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	var teardown models.TeardownReview
	if err := database.DB.First(&teardown, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Teardown review not found"})
	}

	oldTeardown := teardown
	teardown.Status = models.StatusRejected
	teardown.Resubmitted = false
	teardown.RejectReason = req.Reason

	if err := database.DB.Save(&teardown).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	h.auditService.Log(
		userID,
		models.ActionReject,
		models.ResourceTeardown,
		teardown.ID,
		&teardown.ProjectID,
		&oldTeardown,
		&teardown,
		"Rejected teardown review: "+teardown.Title+", Reason: "+req.Reason,
		c.IP(),
		c.Get("User-Agent"),
	)

	return c.JSON(teardown)
}

func (h *TeardownHandler) UpdateIssueStatus(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)
	id, _ := strconv.Atoi(c.Params("id"))
	issueID, _ := strconv.Atoi(c.Params("issueId"))

	var req struct {
		Status     models.TaskStatus `json:"status" validate:"required"`
		Resolution string            `json:"resolution"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	var issue models.TeardownIssue
	if err := database.DB.First(&issue, issueID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Issue not found"})
	}

	oldIssue := issue
	issue.Status = req.Status
	issue.Resolution = req.Resolution
	if req.Status == models.TaskStatusDone {
		now := time.Now()
		issue.ResolvedAt = &now
	}

	if err := database.DB.Save(&issue).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	h.auditService.Log(
		userID,
		models.ActionStatus,
		models.ResourceTeardown,
		uint(id),
		&issue.TeardownReviewID,
		&oldIssue,
		&issue,
		"Issue status updated: "+string(oldIssue.Status)+" -> "+string(req.Status),
		c.IP(),
		c.Get("User-Agent"),
	)

	return c.JSON(issue)
}
