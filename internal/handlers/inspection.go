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

type InspectionHandler struct {
	auditService    *services.AuditService
	asyncJobService *services.AsyncJobService
}

func NewInspectionHandler() *InspectionHandler {
	return &InspectionHandler{
		auditService:    services.NewAuditService(),
		asyncJobService: services.NewAsyncJobService(),
	}
}

type InspectionItemRequest struct {
	ID          uint     `json:"id"`
	Name        string   `json:"name" validate:"required"`
	Description string   `json:"description"`
	Standard    string   `json:"standard"`
	Passed      *bool    `json:"passed"`
	Remarks     string   `json:"remarks"`
	Photos      []string `json:"photos"`
}

type CreateInspectionRequest struct {
	ProjectID    uint                      `json:"project_id" validate:"required"`
	Type         models.InspectionType     `json:"type" validate:"required"`
	Title        string                    `json:"title" validate:"required"`
	InspectorID  uint                      `json:"inspector_id"`
	SupervisorID uint                      `json:"supervisor_id"`
	ScheduleTime *string                   `json:"schedule_time"`
	Items        []InspectionItemRequest   `json:"items"`
	Remarks      string                    `json:"remarks"`
	Attachments  []string                  `json:"attachments"`
}

func (h *InspectionHandler) Create(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)

	var req CreateInspectionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	inspection := &models.Inspection{
		ProjectID:    req.ProjectID,
		Type:         req.Type,
		Title:        req.Title,
		Status:       models.StatusPending,
		Remarks:      req.Remarks,
		Attachments:  req.Attachments,
	}

	if req.InspectorID > 0 {
		inspection.InspectorID = &req.InspectorID
	}
	if req.SupervisorID > 0 {
		inspection.SupervisorID = &req.SupervisorID
	}
	if req.ScheduleTime != nil {
		if t, err := time.Parse(time.RFC3339, *req.ScheduleTime); err == nil {
			inspection.ScheduleTime = &t
		}
	}

	tx := database.DB.Begin()

	if err := tx.Create(inspection).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	for _, itemReq := range req.Items {
		item := models.InspectionItem{
			InspectionID: inspection.ID,
			Name:         itemReq.Name,
			Description:  itemReq.Description,
			Standard:     itemReq.Standard,
			Passed:       itemReq.Passed,
			Remarks:      itemReq.Remarks,
			Photos:       itemReq.Photos,
		}
		if err := tx.Create(&item).Error; err != nil {
			tx.Rollback()
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
	}

	tx.Commit()

	h.auditService.Log(
		userID,
		models.ActionCreate,
		models.ResourceInspection,
		inspection.ID,
		&inspection.ProjectID,
		nil,
		inspection,
		"Created inspection: "+inspection.Title,
		c.IP(),
		c.Get("User-Agent"),
	)

	return c.Status(fiber.StatusCreated).JSON(inspection)
}

func (h *InspectionHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "20"))
	projectID := c.Query("project_id")
	status := c.Query("status")
	inspectionType := c.Query("type")

	var inspections []models.Inspection
	var total int64

	query := database.DB.Model(&models.Inspection{}).
		Preload("Inspector").
		Preload("Supervisor").
		Preload("ApprovedBy").
		Preload("Items")

	if projectID != "" {
		query = query.Where("project_id = ?", projectID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if inspectionType != "" {
		query = query.Where("type = ?", inspectionType)
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&inspections).Error
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data":  inspections,
		"total": total,
		"page":  page,
		"size":  pageSize,
	})
}

func (h *InspectionHandler) Get(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))

	var inspection models.Inspection
	err := database.DB.Preload("Inspector").
		Preload("Supervisor").
		Preload("ApprovedBy").
		Preload("Items").
		First(&inspection, id).Error
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Inspection not found"})
	}

	return c.JSON(inspection)
}

func (h *InspectionHandler) Submit(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)
	id, _ := strconv.Atoi(c.Params("id"))

	var req struct {
		Items        []InspectionItemRequest `json:"items"`
		OverallPassed bool                   `json:"overall_passed"`
		Remarks      string                 `json:"remarks"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	var inspection models.Inspection
	if err := database.DB.First(&inspection, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Inspection not found"})
	}

	oldInspection := inspection
	now := time.Now()
	inspection.Status = models.StatusReviewing
	inspection.StartTime = &now
	inspection.OverallPassed = &req.OverallPassed
	inspection.Remarks = req.Remarks

	if oldInspection.Status == models.StatusRejected {
		inspection.Resubmitted = true
	}

	tx := database.DB.Begin()

	if err := tx.Save(&inspection).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	for _, itemReq := range req.Items {
		if itemReq.ID > 0 && itemReq.Passed != nil {
			tx.Model(&models.InspectionItem{}).
				Where("id = ? AND inspection_id = ?", itemReq.ID, inspection.ID).
				Updates(map[string]interface{}{
					"passed":  itemReq.Passed,
					"remarks": itemReq.Remarks,
					"photos":  itemReq.Photos,
				})
		}
	}

	tx.Commit()

	h.auditService.Log(
		userID,
		models.ActionSubmit,
		models.ResourceInspection,
		inspection.ID,
		&inspection.ProjectID,
		&oldInspection,
		&inspection,
		"Submitted inspection for review: "+inspection.Title,
		c.IP(),
		c.Get("User-Agent"),
	)

	return c.JSON(inspection)
}

func (h *InspectionHandler) Approve(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)
	id, _ := strconv.Atoi(c.Params("id"))

	var inspection models.Inspection
	if err := database.DB.First(&inspection, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Inspection not found"})
	}

	oldInspection := inspection
	now := time.Now()
	inspection.Status = models.StatusApproved
	inspection.Resubmitted = false
	inspection.EndTime = &now
	inspection.ApprovedByID = &userID
	inspection.ApprovedAt = &now

	tx := database.DB.Begin()

	if err := tx.Save(&inspection).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	var project models.Project
	database.DB.First(&project, inspection.ProjectID)
	if project.Phase == models.PhaseInspection {
		var pendingCount int64
		database.DB.Model(&models.Inspection{}).
			Where("project_id = ? AND status IN ?", project.ID, []string{
				string(models.StatusPending),
				string(models.StatusReviewing),
				string(models.StatusRejected),
			}).
			Count(&pendingCount)
		if pendingCount == 0 {
			job, err := h.asyncJobService.CreateJob("inspection_to_teardown", map[string]interface{}{
				"project_id": project.ID,
			}, userID)
			if err != nil {
				tx.Rollback()
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create transition job: " + err.Error()})
			}

			h.auditService.Log(
				userID,
				models.ActionApprove,
				models.ResourceInspection,
				inspection.ID,
				&inspection.ProjectID,
				&oldInspection,
				&inspection,
				"Approved inspection, triggering teardown transition job_id="+strconv.FormatUint(uint64(job.ID), 10),
				c.IP(),
				c.Get("User-Agent"),
			)

			tx.Commit()

			go func() {
				if err := h.asyncJobService.ProcessJob(job); err != nil {
					log.Printf("Async job %d failed: %v", job.ID, err)
				}
			}()

			database.DB.Preload("Items").First(&inspection, id)
			return c.JSON(inspection)
		}
	}

	tx.Commit()

	h.auditService.Log(
		userID,
		models.ActionApprove,
		models.ResourceInspection,
		inspection.ID,
		&inspection.ProjectID,
		&oldInspection,
		&inspection,
		"Approved inspection: "+inspection.Title,
		c.IP(),
		c.Get("User-Agent"),
	)

	return c.JSON(inspection)
}

func (h *InspectionHandler) Reject(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)
	id, _ := strconv.Atoi(c.Params("id"))

	var req struct {
		Reason string `json:"reason" validate:"required"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	var inspection models.Inspection
	if err := database.DB.First(&inspection, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Inspection not found"})
	}

	oldInspection := inspection
	inspection.Status = models.StatusRejected
	inspection.RejectReason = req.Reason

	if err := database.DB.Save(&inspection).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	h.auditService.Log(
		userID,
		models.ActionReject,
		models.ResourceInspection,
		inspection.ID,
		&inspection.ProjectID,
		&oldInspection,
		&inspection,
		"Rejected inspection: "+inspection.Title+", Reason: "+req.Reason,
		c.IP(),
		c.Get("User-Agent"),
	)

	return c.JSON(inspection)
}
