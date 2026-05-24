package handlers

import (
	"fmt"
	"jewelry-store-system/middleware"
	"jewelry-store-system/models"
	"jewelry-store-system/services"
	"jewelry-store-system/utils"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type QuotationHandler struct {
	db           *gorm.DB
	auditService *services.AuditService
}

func NewQuotationHandler(db *gorm.DB) *QuotationHandler {
	return &QuotationHandler{
		db:           db,
		auditService: services.NewAuditService(db),
	}
}

type CreateQuotationRequest struct {
	Type           models.QuotationType `json:"type" validate:"required"`
	CustomerID     uint                 `json:"customer_id" validate:"required"`
	ProductID      *uint                `json:"product_id"`
	ProductName    string               `json:"product_name" validate:"required"`
	Description    string               `json:"description"`
	Material       string               `json:"material"`
	Weight         float64              `json:"weight"`
	EstimatedPrice float64              `json:"estimated_price"`
	Cost           float64              `json:"cost"`
	Discount       float64              `json:"discount"`
	FinalPrice     float64              `json:"final_price"`
	Deposit        float64              `json:"deposit"`
	DeliveryDays   int                  `json:"delivery_days"`
	Remark         string               `json:"remark"`
}

type UpdateQuotationRequest struct {
	ProductName    string  `json:"product_name"`
	Description    string  `json:"description"`
	Material       string  `json:"material"`
	Weight         float64 `json:"weight"`
	EstimatedPrice float64 `json:"estimated_price"`
	Cost           float64 `json:"cost"`
	Discount       float64 `json:"discount"`
	FinalPrice     float64 `json:"final_price"`
	Deposit        float64 `json:"deposit"`
	DeliveryDays   int     `json:"delivery_days"`
	Remark         string  `json:"remark"`
}

type ApproveQuotationRequest struct {
	Action  string `json:"action" validate:"required"`
	Comment string `json:"comment"`
}

func (h *QuotationHandler) generateQuotationNo() string {
	now := time.Now()
	var count int64
	h.db.Model(&models.Quotation{}).Where("created_at >= ?", now.Format("2006-01-02")).Count(&count)
	return fmt.Sprintf("Q%s%04d", now.Format("20060102"), count+1)
}

func (h *QuotationHandler) Create(c *fiber.Ctx) error {
	userID, userName, _ := middleware.GetCurrentUser(c)

	var req CreateQuotationRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	quotation := models.Quotation{
		QuotationNo:    h.generateQuotationNo(),
		Type:           req.Type,
		Status:         models.QuotationStatusDraft,
		CustomerID:     req.CustomerID,
		ProductID:      req.ProductID,
		ProductName:    req.ProductName,
		Description:    req.Description,
		Material:       req.Material,
		Weight:         req.Weight,
		EstimatedPrice: req.EstimatedPrice,
		Cost:           req.Cost,
		Discount:       req.Discount,
		FinalPrice:     req.FinalPrice,
		Deposit:        req.Deposit,
		DeliveryDays:   req.DeliveryDays,
		SalespersonID:  userID,
		Remark:         req.Remark,
	}

	if err := h.db.Create(&quotation).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create quotation")
	}

	h.auditService.LogAction(
		"create", "quotation", quotation.ID,
		userID, userName,
		nil, quotation,
		c.IP(), c.Get("User-Agent"),
	)

	return utils.SuccessResponse(c, quotation)
}

func (h *QuotationHandler) List(c *fiber.Ctx) error {
	_, _, userRole := middleware.GetCurrentUser(c)

	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "10"))
	status := c.Query("status")
	quotationType := c.Query("type")
	customerID := c.Query("customer_id")

	var quotations []models.Quotation
	var total int64

	query := h.db.Model(&models.Quotation{}).Preload("Customer").Preload("Salesperson").Preload("Approver")

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if quotationType != "" {
		query = query.Where("type = ?", quotationType)
	}
	if customerID != "" {
		query = query.Where("customer_id = ?", customerID)
	}

	if userRole == models.RoleSalesperson {
		userID, _, _ := middleware.GetCurrentUser(c)
		query = query.Where("salesperson_id = ?", userID)
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&quotations)

	return utils.SuccessResponseWithPagination(c, quotations, page, pageSize, total)
}

func (h *QuotationHandler) Get(c *fiber.Ctx) error {
	userID, _, userRole := middleware.GetCurrentUser(c)
	id, _ := strconv.Atoi(c.Params("id"))

	var quotation models.Quotation
	if err := h.db.Preload("Customer").Preload("Product").Preload("Salesperson").Preload("Approver").
		First(&quotation, id).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Quotation not found")
	}

	if userRole == models.RoleAfterSales {
		return utils.ErrorResponse(c, fiber.StatusForbidden, "After-sales staff cannot view quotation details")
	}

	if userRole == models.RoleSalesperson && quotation.SalespersonID != userID {
		return utils.ErrorResponse(c, fiber.StatusForbidden, "You can only view your own quotations")
	}

	var approvalRecords []models.ApprovalRecord
	h.db.Where("quotation_id = ?", id).Preload("Approver").Order("created_at DESC").Find(&approvalRecords)

	statusHistory, _ := h.auditService.GetStatusHistory("quotation", uint(id))

	return utils.SuccessResponse(c, fiber.Map{
		"quotation":        quotation,
		"approval_records": approvalRecords,
		"status_history":   statusHistory,
	})
}

func (h *QuotationHandler) Update(c *fiber.Ctx) error {
	userID, userName, userRole := middleware.GetCurrentUser(c)
	id, _ := strconv.Atoi(c.Params("id"))

	var quotation models.Quotation
	if err := h.db.First(&quotation, id).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Quotation not found")
	}

	if userRole == models.RoleSalesperson && quotation.SalespersonID != userID {
		return utils.ErrorResponse(c, fiber.StatusForbidden, "You can only update your own quotations")
	}

	if quotation.Status != models.QuotationStatusDraft && quotation.Status != models.QuotationStatusRevising {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Only draft or revising quotations can be updated")
	}

	oldQuotation := quotation

	var req UpdateQuotationRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if req.ProductName != "" {
		quotation.ProductName = req.ProductName
	}
	quotation.Description = req.Description
	quotation.Material = req.Material
	quotation.Weight = req.Weight
	quotation.EstimatedPrice = req.EstimatedPrice
	quotation.Cost = req.Cost
	quotation.Discount = req.Discount
	quotation.FinalPrice = req.FinalPrice
	quotation.Deposit = req.Deposit
	quotation.DeliveryDays = req.DeliveryDays
	quotation.Remark = req.Remark

	if err := h.db.Save(&quotation).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update quotation")
	}

	h.auditService.LogAction(
		"update", "quotation", quotation.ID,
		userID, userName,
		oldQuotation, quotation,
		c.IP(), c.Get("User-Agent"),
	)

	return utils.SuccessResponse(c, quotation)
}

func (h *QuotationHandler) Submit(c *fiber.Ctx) error {
	userID, userName, userRole := middleware.GetCurrentUser(c)
	id, _ := strconv.Atoi(c.Params("id"))

	var quotation models.Quotation
	if err := h.db.First(&quotation, id).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Quotation not found")
	}

	if userRole != models.RoleSalesperson {
		return utils.ErrorResponse(c, fiber.StatusForbidden, "Only salesperson can submit quotation for approval")
	}

	if quotation.SalespersonID != userID {
		return utils.ErrorResponse(c, fiber.StatusForbidden, "You can only submit your own quotations")
	}

	if quotation.Status != models.QuotationStatusDraft && quotation.Status != models.QuotationStatusRevising {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Only draft or revising quotations can be submitted")
	}

	oldStatus := quotation.Status
	quotation.Status = models.QuotationStatusPending

	var manager models.User
	if err := h.db.Where("role = ?", models.RoleManager).First(&manager).Error; err == nil {
		quotation.CurrentApprover = &manager.ID
	}

	if err := h.db.Save(&quotation).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to submit quotation")
	}

	h.auditService.AddStatusHistory(
		"quotation", quotation.ID,
		string(oldStatus), string(quotation.Status),
		userID, userName, "Submitted for approval",
	)

	h.auditService.LogAction(
		"submit", "quotation", quotation.ID,
		userID, userName,
		oldStatus, quotation.Status,
		c.IP(), c.Get("User-Agent"),
	)

	return utils.SuccessResponse(c, quotation)
}

func (h *QuotationHandler) Approve(c *fiber.Ctx) error {
	userID, userName, _ := middleware.GetCurrentUser(c)
	id, _ := strconv.Atoi(c.Params("id"))

	var req ApproveQuotationRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	var quotation models.Quotation
	if err := h.db.First(&quotation, id).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Quotation not found")
	}

	if quotation.Status != models.QuotationStatusPending {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Only pending quotations can be approved/rejected")
	}

	oldStatus := quotation.Status
	oldPrice := quotation.FinalPrice

	var action string
	if req.Action == "approve" {
		quotation.Status = models.QuotationStatusApproved
		action = "approve"
	} else if req.Action == "reject" {
		quotation.Status = models.QuotationStatusRejected
		action = "reject"
	} else if req.Action == "revise" {
		quotation.Status = models.QuotationStatusRevising
		action = "revise"
	} else {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid action")
	}

	approvalRecord := models.ApprovalRecord{
		QuotationID: quotation.ID,
		ApproverID:  userID,
		Action:      action,
		OldStatus:   oldStatus,
		NewStatus:   quotation.Status,
		OldPrice:    &oldPrice,
		NewPrice:    &quotation.FinalPrice,
		Comment:     req.Comment,
	}

	if err := h.db.Create(&approvalRecord).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create approval record")
	}

	quotation.CurrentApprover = nil
	if err := h.db.Save(&quotation).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update quotation")
	}

	h.auditService.AddStatusHistory(
		"quotation", quotation.ID,
		string(oldStatus), string(quotation.Status),
		userID, userName, req.Comment,
	)

	h.auditService.LogAction(
		action, "quotation", quotation.ID,
		userID, userName,
		oldStatus, quotation.Status,
		c.IP(), c.Get("User-Agent"),
	)

	return utils.SuccessResponse(c, quotation)
}

func (h *QuotationHandler) Complete(c *fiber.Ctx) error {
	userID, userName, userRole := middleware.GetCurrentUser(c)
	id, _ := strconv.Atoi(c.Params("id"))

	var quotation models.Quotation
	if err := h.db.First(&quotation, id).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Quotation not found")
	}

	if userRole != models.RoleSalesperson {
		return utils.ErrorResponse(c, fiber.StatusForbidden, "Only salesperson can mark quotation as completed")
	}

	if quotation.SalespersonID != userID {
		return utils.ErrorResponse(c, fiber.StatusForbidden, "You can only complete your own quotations")
	}

	if quotation.Status != models.QuotationStatusApproved {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Only approved quotations can be completed")
	}

	oldQuotation := quotation
	oldStatus := quotation.Status
	quotation.Status = models.QuotationStatusCompleted

	if err := h.db.Save(&quotation).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to complete quotation")
	}

	h.auditService.AddStatusHistory(
		"quotation", quotation.ID,
		string(oldStatus), string(quotation.Status),
		userID, userName, "Order completed",
	)

	h.auditService.LogAction(
		"complete", "quotation", quotation.ID,
		userID, userName,
		oldQuotation, quotation,
		c.IP(), c.Get("User-Agent"),
	)

	return utils.SuccessResponse(c, quotation)
}
