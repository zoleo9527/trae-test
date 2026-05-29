package handlers

import (
	"exhibition-system/internal/database"
	"exhibition-system/internal/middleware"
	"exhibition-system/internal/models"
	"exhibition-system/internal/services"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
)

type ProjectHandler struct {
	auditService *services.AuditService
}

func NewProjectHandler() *ProjectHandler {
	return &ProjectHandler{
		auditService: services.NewAuditService(),
	}
}

type CreateProjectRequest struct {
	Name         string              `json:"name" validate:"required"`
	Code         string              `json:"code" validate:"required"`
	Description  string              `json:"description"`
	Location     string              `json:"location"`
	BoothNumber  string              `json:"booth_number"`
	Priority     int                 `json:"priority"`
	SetupStart   *string             `json:"setup_start_date"`
	SetupEnd     *string             `json:"setup_end_date"`
	OpenDate     *string             `json:"open_date"`
	CloseDate    *string             `json:"close_date"`
	TeardownStart *string            `json:"teardown_start"`
	TeardownEnd  *string             `json:"teardown_end"`
	AssignedUsers []uint             `json:"assigned_users"`
}

func (h *ProjectHandler) Create(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)

	var req CreateProjectRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	project := &models.Project{
		Name:        req.Name,
		Code:        req.Code,
		Description: req.Description,
		Location:    req.Location,
		BoothNumber: req.BoothNumber,
		Priority:    req.Priority,
		Phase:       models.PhasePlanning,
		Status:      models.StatusPending,
		CreatorID:   userID,
	}

	if req.SetupStart != nil {
		if t, err := time.Parse(time.RFC3339, *req.SetupStart); err == nil {
			project.SetupStartDate = &t
		}
	}
	if req.SetupEnd != nil {
		if t, err := time.Parse(time.RFC3339, *req.SetupEnd); err == nil {
			project.SetupEndDate = &t
		}
	}
	if req.OpenDate != nil {
		if t, err := time.Parse(time.RFC3339, *req.OpenDate); err == nil {
			project.OpenDate = &t
		}
	}
	if req.CloseDate != nil {
		if t, err := time.Parse(time.RFC3339, *req.CloseDate); err == nil {
			project.CloseDate = &t
		}
	}
	if req.TeardownStart != nil {
		if t, err := time.Parse(time.RFC3339, *req.TeardownStart); err == nil {
			project.TeardownStart = &t
		}
	}
	if req.TeardownEnd != nil {
		if t, err := time.Parse(time.RFC3339, *req.TeardownEnd); err == nil {
			project.TeardownEnd = &t
		}
	}

	if len(req.AssignedUsers) > 0 {
		var users []models.User
		database.DB.Find(&users, req.AssignedUsers)
		project.AssignedUsers = users
	}

	if err := database.DB.Create(project).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	h.auditService.Log(
		userID,
		models.ActionCreate,
		models.ResourceProject,
		project.ID,
		&project.ID,
		nil,
		project,
		"Created project: "+project.Name,
		c.IP(),
		c.Get("User-Agent"),
	)

	return c.Status(fiber.StatusCreated).JSON(project)
}

func (h *ProjectHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "20"))
	phase := c.Query("phase")
	status := c.Query("status")
	search := c.Query("search")

	var projects []models.Project
	var total int64

	query := database.DB.Model(&models.Project{}).Preload("Creator").Preload("AssignedUsers")

	if phase != "" {
		query = query.Where("phase = ?", phase)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if search != "" {
		query = query.Where("name ILIKE ? OR code ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&projects).Error
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data":  projects,
		"total": total,
		"page":  page,
		"size":  pageSize,
	})
}

func (h *ProjectHandler) Get(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))

	var project models.Project
	err := database.DB.Preload("Creator").
		Preload("AssignedUsers").
		Preload("Certificates").
		Preload("Materials").
		Preload("Inspections").
		Preload("TeardownReviews").
		Preload("Suppliers").
		First(&project, id).Error

	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Project not found"})
	}

	return c.JSON(project)
}

func (h *ProjectHandler) Update(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)
	id, _ := strconv.Atoi(c.Params("id"))

	var project models.Project
	if err := database.DB.First(&project, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Project not found"})
	}

	oldProject := project

	var req CreateProjectRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	project.Name = req.Name
	project.Code = req.Code
	project.Description = req.Description
	project.Location = req.Location
	project.BoothNumber = req.BoothNumber
	project.Priority = req.Priority

	if req.SetupStart != nil {
		if t, err := time.Parse(time.RFC3339, *req.SetupStart); err == nil {
			project.SetupStartDate = &t
		}
	} else {
		project.SetupStartDate = nil
	}
	if req.SetupEnd != nil {
		if t, err := time.Parse(time.RFC3339, *req.SetupEnd); err == nil {
			project.SetupEndDate = &t
		}
	} else {
		project.SetupEndDate = nil
	}
	if req.OpenDate != nil {
		if t, err := time.Parse(time.RFC3339, *req.OpenDate); err == nil {
			project.OpenDate = &t
		}
	} else {
		project.OpenDate = nil
	}
	if req.CloseDate != nil {
		if t, err := time.Parse(time.RFC3339, *req.CloseDate); err == nil {
			project.CloseDate = &t
		}
	} else {
		project.CloseDate = nil
	}
	if req.TeardownStart != nil {
		if t, err := time.Parse(time.RFC3339, *req.TeardownStart); err == nil {
			project.TeardownStart = &t
		}
	} else {
		project.TeardownStart = nil
	}
	if req.TeardownEnd != nil {
		if t, err := time.Parse(time.RFC3339, *req.TeardownEnd); err == nil {
			project.TeardownEnd = &t
		}
	} else {
		project.TeardownEnd = nil
	}

	if err := database.DB.Save(&project).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	changes := h.auditService.GetChanges(&oldProject, &project)
	h.auditService.Log(
		userID,
		models.ActionUpdate,
		models.ResourceProject,
		project.ID,
		&project.ID,
		&oldProject,
		&project,
		changes,
		c.IP(),
		c.Get("User-Agent"),
	)

	return c.JSON(project)
}

func (h *ProjectHandler) UpdatePhase(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)
	id, _ := strconv.Atoi(c.Params("id"))

	var req struct {
		Phase models.ProjectPhase `json:"phase" validate:"required"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	var project models.Project
	if err := database.DB.First(&project, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Project not found"})
	}

	oldPhase := project.Phase
	project.Phase = req.Phase

	if err := database.DB.Save(&project).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	h.auditService.Log(
		userID,
		models.ActionPhase,
		models.ResourceProject,
		project.ID,
		&project.ID,
		nil,
		nil,
		"Phase changed from "+string(oldPhase)+" to "+string(req.Phase),
		c.IP(),
		c.Get("User-Agent"),
	)

	return c.JSON(project)
}

func (h *ProjectHandler) Delete(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)
	id, _ := strconv.Atoi(c.Params("id"))

	var project models.Project
	if err := database.DB.First(&project, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Project not found"})
	}

	if err := database.DB.Delete(&project).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	h.auditService.Log(
		userID,
		models.ActionDelete,
		models.ResourceProject,
		project.ID,
		&project.ID,
		&project,
		nil,
		"Deleted project: "+project.Name,
		c.IP(),
		c.Get("User-Agent"),
	)

	return c.JSON(fiber.Map{"message": "Project deleted successfully"})
}
