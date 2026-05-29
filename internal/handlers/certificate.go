package handlers

import (
	"exhibition-system/internal/database"
	"exhibition-system/internal/middleware"
	"exhibition-system/internal/models"
	"exhibition-system/internal/services"
	"fmt"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
)

type CertificateHandler struct {
	auditService   *services.AuditService
	asyncJobService *services.AsyncJobService
}

func NewCertificateHandler() *CertificateHandler {
	return &CertificateHandler{
		auditService:   services.NewAuditService(),
		asyncJobService: services.NewAsyncJobService(),
	}
}

type CreateCertificateRequest struct {
	ProjectID   uint                     `json:"project_id" validate:"required"`
	Name        string                   `json:"name" validate:"required"`
	Type        models.CertificateType   `json:"type" validate:"required"`
	Code        string                   `json:"code"`
	OwnerID     uint                     `json:"owner_id"`
	Issuer      string                   `json:"issuer"`
	IssueDate   *string                  `json:"issue_date"`
	ExpireDate  *string                  `json:"expire_date"`
	Remarks     string                   `json:"remarks"`
	Attachments []string                 `json:"attachments"`
}

func (h *CertificateHandler) Create(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)

	var req CreateCertificateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	cert := &models.Certificate{
		ProjectID:   req.ProjectID,
		Name:        req.Name,
		Type:        req.Type,
		Code:        req.Code,
		Status:      models.StatusPending,
		OwnerID:     req.OwnerID,
		Issuer:      req.Issuer,
		Remarks:     req.Remarks,
		Attachments: req.Attachments,
	}

	if req.IssueDate != nil {
		if t, err := time.Parse(time.RFC3339, *req.IssueDate); err == nil {
			cert.IssueDate = &t
		}
	}
	if req.ExpireDate != nil {
		if t, err := time.Parse(time.RFC3339, *req.ExpireDate); err == nil {
			cert.ExpireDate = &t
		}
	}

	if err := database.DB.Create(cert).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	h.auditService.Log(
		userID,
		models.ActionCreate,
		models.ResourceCertificate,
		cert.ID,
		&cert.ProjectID,
		nil,
		cert,
		"Created certificate: "+cert.Name,
		c.IP(),
		c.Get("User-Agent"),
	)

	return c.Status(fiber.StatusCreated).JSON(cert)
}

func (h *CertificateHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "20"))
	projectID := c.Query("project_id")
	status := c.Query("status")
	certType := c.Query("type")

	var certs []models.Certificate
	var total int64

	query := database.DB.Model(&models.Certificate{}).Preload("Owner").Preload("Project").Preload("ApprovedBy")

	if projectID != "" {
		query = query.Where("project_id = ?", projectID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if certType != "" {
		query = query.Where("type = ?", certType)
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&certs).Error
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data":  certs,
		"total": total,
		"page":  page,
		"size":  pageSize,
	})
}

func (h *CertificateHandler) Get(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))

	var cert models.Certificate
	err := database.DB.Preload("Owner").Preload("Project").Preload("ApprovedBy").First(&cert, id).Error
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Certificate not found"})
	}

	return c.JSON(cert)
}

func (h *CertificateHandler) Approve(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)
	id, _ := strconv.Atoi(c.Params("id"))

	var cert models.Certificate
	if err := database.DB.First(&cert, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Certificate not found"})
	}

	oldCert := cert
	now := time.Now()
	cert.Status = models.StatusApproved
	cert.ApprovedByID = &userID
	cert.ApprovedAt = &now

	if err := database.DB.Save(&cert).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	h.auditService.Log(
		userID,
		models.ActionApprove,
		models.ResourceCertificate,
		cert.ID,
		&cert.ProjectID,
		&oldCert,
		&cert,
		"Approved certificate: "+cert.Name,
		c.IP(),
		c.Get("User-Agent"),
	)

	return c.JSON(cert)
}

func (h *CertificateHandler) Reject(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)
	id, _ := strconv.Atoi(c.Params("id"))

	var req struct {
		Reason string `json:"reason" validate:"required"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	var cert models.Certificate
	if err := database.DB.First(&cert, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Certificate not found"})
	}

	oldCert := cert
	cert.Status = models.StatusRejected
	cert.RejectReason = req.Reason

	if err := database.DB.Save(&cert).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	h.auditService.Log(
		userID,
		models.ActionReject,
		models.ResourceCertificate,
		cert.ID,
		&cert.ProjectID,
		&oldCert,
		&cert,
		"Rejected certificate: "+cert.Name+", Reason: "+req.Reason,
		c.IP(),
		c.Get("User-Agent"),
	)

	return c.JSON(cert)
}

func (h *CertificateHandler) BatchApprove(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)

	var req struct {
		IDs []uint `json:"ids" validate:"required"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if len(req.IDs) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "No certificate IDs provided"})
	}

	idsInterface := make([]interface{}, len(req.IDs))
	for i, id := range req.IDs {
		idsInterface[i] = id
	}

	job, err := h.asyncJobService.CreateJob("certificate_batch_approve", map[string]interface{}{
		"ids": req.IDs,
	}, userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create async job: " + err.Error()})
	}

	h.auditService.Log(
		userID,
		models.ActionApprove,
		models.ResourceCertificate,
		0,
		nil,
		nil,
		nil,
		fmt.Sprintf("Initiated batch approve for %d certificates, job_id: %d", len(req.IDs), job.ID),
		c.IP(),
		c.Get("User-Agent"),
	)

	if err := h.asyncJobService.ProcessJob(job); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Batch approve job failed",
			"job_id":  job.ID,
			"details": err.Error(),
		})
	}

	processedCount := 0
	if job.Result != nil {
		if count, ok := job.Result["processed_count"]; ok {
			if countInt, ok := count.(int); ok {
				processedCount = countInt
			}
		}
	}

	return c.JSON(fiber.Map{
		"message":         "Batch approved successfully",
		"job_id":          job.ID,
		"processed_count": processedCount,
		"total_requested": len(req.IDs),
	})
}
