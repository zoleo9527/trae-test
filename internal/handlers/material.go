package handlers

import (
	"exhibition-system/internal/database"
	"exhibition-system/internal/middleware"
	"exhibition-system/internal/models"
	"exhibition-system/internal/services"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type MaterialHandler struct {
	auditService *services.AuditService
}

func NewMaterialHandler() *MaterialHandler {
	return &MaterialHandler{
		auditService: services.NewAuditService(),
	}
}

type CreateMaterialRequest struct {
	ProjectID      uint                   `json:"project_id" validate:"required"`
	SupplierID     uint                   `json:"supplier_id"`
	Name           string                 `json:"name" validate:"required"`
	SKU            string                 `json:"sku"`
	Description    string                 `json:"description"`
	Category       string                 `json:"category"`
	Quantity       int                    `json:"quantity"`
	Unit           string                 `json:"unit"`
	UnitPrice      float64                `json:"unit_price"`
	Specifications map[string]string        `json:"specifications"`
	Attachments    []string               `json:"attachments"`
	Remarks        string                 `json:"remarks"`
}

func (h *MaterialHandler) Create(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)

	var req CreateMaterialRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	material := &models.Material{
		ProjectID:      req.ProjectID,
		SupplierID:   &req.SupplierID,
		Name:           req.Name,
		SKU:            req.SKU,
		Version:        1,
		Description:    req.Description,
		Category:       req.Category,
		Quantity:       req.Quantity,
		Unit:           req.Unit,
		UnitPrice:      req.UnitPrice,
		TotalPrice:     float64(req.Quantity) * req.UnitPrice,
		Status:         models.MaterialStatusDraft,
		Specifications: req.Specifications,
		Attachments:    req.Attachments,
		Remarks:        req.Remarks,
	}

	if req.SupplierID > 0 {
		material.SupplierID = &req.SupplierID
	}

	if err := database.DB.Create(material).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	versionLog := &models.VersionLog{
		MaterialID: material.ID,
		Version:    1,
		ChangeType: "create",
		ChangeLog:  "Initial version",
		OperatorID: userID,
	}
	database.DB.Create(versionLog)

	h.auditService.Log(
		userID,
		models.ActionCreate,
		models.ResourceMaterial,
		material.ID,
		&material.ProjectID,
		nil,
		material,
		"Created material: "+material.Name,
		c.IP(),
		c.Get("User-Agent"),
	)

	return c.Status(fiber.StatusCreated).JSON(material)
}

func (h *MaterialHandler) CreateNewVersion(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)
	id, _ := strconv.Atoi(c.Params("id"))

	var oldMaterial models.Material
	if err := database.DB.First(&oldMaterial, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Material not found"})
	}

	var req CreateMaterialRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	newMaterial := &models.Material{
		ProjectID:      oldMaterial.ProjectID,
		SupplierID:   oldMaterial.SupplierID,
		Name:           req.Name,
		SKU:            req.SKU,
		Version:        oldMaterial.Version + 1,
		Description:    req.Description,
		Category:       req.Category,
		Quantity:       req.Quantity,
		Unit:           req.Unit,
		UnitPrice:      req.UnitPrice,
		TotalPrice:     float64(req.Quantity) * req.UnitPrice,
		Status:         models.MaterialStatusDraft,
		Specifications: req.Specifications,
		Attachments:    req.Attachments,
		Remarks:        req.Remarks,
		ParentID:       &oldMaterial.ID,
	}

	tx := database.DB.Begin()

	if err := tx.Create(newMaterial).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	versionLog := &models.VersionLog{
		MaterialID: newMaterial.ID,
		Version:    newMaterial.Version,
		ChangeType: "update",
		ChangeLog:  "Created new version from v" + strconv.Itoa(oldMaterial.Version) + " -> v" + strconv.Itoa(newMaterial.Version),
		OperatorID: userID,
	}
	if err := tx.Create(versionLog).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	tx.Commit()

	h.auditService.Log(
		userID,
		models.ActionUpdate,
		models.ResourceMaterial,
		newMaterial.ID,
		&newMaterial.ProjectID,
		&oldMaterial,
		newMaterial,
		"Created new version for material: "+newMaterial.Name,
		c.IP(),
		c.Get("User-Agent"),
	)

	return c.Status(fiber.StatusCreated).JSON(newMaterial)
}

func (h *MaterialHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "20"))
	projectID := c.Query("project_id")
	status := c.Query("status")
	search := c.Query("search")

	var materials []models.Material
	var total int64

	query := database.DB.Model(&models.Material{}).Preload("Supplier").Preload("VersionLogs")

	if projectID != "" {
		query = query.Where("project_id = ?", projectID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if search != "" {
		query = query.Where("name ILIKE ? OR sku ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&materials).Error
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data":  materials,
		"total": total,
		"page":  page,
		"size":  pageSize,
	})
}

func (h *MaterialHandler) Get(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))

	var material models.Material
	err := database.DB.Preload("Supplier").Preload("VersionLogs").Preload("VersionLogs.Operator").First(&material, id).Error
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Material not found"})
	}

	return c.JSON(material)
}

func (h *MaterialHandler) UpdateStatus(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)
	id, _ := strconv.Atoi(c.Params("id"))

	var req struct {
		Status models.MaterialStatus `json:"status" validate:"required"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	var material models.Material
	if err := database.DB.First(&material, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Material not found"})
	}

	oldMaterial := material
	material.Status = req.Status

	if err := database.DB.Save(&material).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	h.auditService.Log(
		userID,
		models.ActionStatus,
		models.ResourceMaterial,
		material.ID,
		&material.ProjectID,
		&oldMaterial,
		&material,
		"Material status changed: "+string(oldMaterial.Status)+" -> "+string(req.Status),
		c.IP(),
		c.Get("User-Agent"),
	)

	return c.JSON(material)
}

func (h *MaterialHandler) GetVersionHistory(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))

	var logs []models.VersionLog
	err := database.DB.Where("material_id = ?", id).Preload("Operator").Order("version DESC").Find(&logs).Error
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(logs)
}
