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

type MaintenanceHandler struct {
	db           *gorm.DB
	auditService *services.AuditService
}

func NewMaintenanceHandler(db *gorm.DB) *MaintenanceHandler {
	return &MaintenanceHandler{
		db:           db,
		auditService: services.NewAuditService(db),
	}
}

type CreateMaintenanceRequest struct {
	Type            models.MaintenanceType `json:"type" validate:"required"`
	CustomerID      uint                  `json:"customer_id" validate:"required"`
	ProductID       *uint                 `json:"product_id"`
	ProductName     string                `json:"product_name" validate:"required"`
	Description     string                `json:"description"`
	Issues          string                `json:"issues"`
	EstimatedPrice  float64               `json:"estimated_price"`
	AppointmentDate *time.Time           `json:"appointment_date"`
	QuotationID     *uint                 `json:"quotation_id"`
	Remark          string                `json:"remark"`
}

type UpdateMaintenanceRequest struct {
	ProductName     string      `json:"product_name"`
	Description     string      `json:"description"`
	Issues          string      `json:"issues"`
	EstimatedPrice  float64     `json:"estimated_price"`
	ActualPrice     float64     `json:"actual_price"`
	AppointmentDate *time.Time `json:"appointment_date"`
	Remark          string      `json:"remark"`
}

type UpdateStatusRequest struct {
	Status  models.MaintenanceStatus `json:"status" validate:"required"`
	Comment string                    `json:"comment"`
}

type AssignMaintenanceRequest struct {
	HandlerID uint `json:"handler_id" validate:"required"`
	Comment   string `json:"comment"`
}

var validStatusTransitions = map[models.MaintenanceStatus][]models.MaintenanceStatus{
	models.MaintenanceStatusPending: {
		models.MaintenanceStatusConfirmed,
		models.MaintenanceStatusCancelled,
	},
	models.MaintenanceStatusConfirmed: {
		models.MaintenanceStatusInProgress,
		models.MaintenanceStatusCancelled,
	},
	models.MaintenanceStatusInProgress: {
		models.MaintenanceStatusCompleted,
		models.MaintenanceStatusCancelled,
	},
	models.MaintenanceStatusCompleted: {
		models.MaintenanceStatusPickedUp,
	},
	models.MaintenanceStatusPickedUp:   {},
	models.MaintenanceStatusCancelled:  {},
}

func isValidStatusTransition(oldStatus, newStatus models.MaintenanceStatus) bool {
	validNext, exists := validStatusTransitions[oldStatus]
	if !exists {
		return false
	}
	for _, s := range validNext {
		if s == newStatus {
			return true
		}
	}
	return false
}

func (h *MaintenanceHandler) generateMaintenanceNo() string {
	now := time.Now()
	var count int64
	h.db.Model(&models.Maintenance{}).Where("created_at >= ?", now.Format("2006-01-02")).Count(&count)
	return fmt.Sprintf("M%s%04d", now.Format("20060102"), count+1)
}

func (h *MaintenanceHandler) Create(c *fiber.Ctx) error {
	userID, userName, _ := middleware.GetCurrentUser(c)

	var req CreateMaintenanceRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	maintenance := models.Maintenance{
		MaintenanceNo:   h.generateMaintenanceNo(),
		Type:            req.Type,
		Status:          models.MaintenanceStatusPending,
		CustomerID:      req.CustomerID,
		ProductID:       req.ProductID,
		ProductName:     req.ProductName,
		Description:     req.Description,
		Issues:          req.Issues,
		EstimatedPrice:  req.EstimatedPrice,
		AppointmentDate: req.AppointmentDate,
		SalespersonID:   userID,
		QuotationID:     req.QuotationID,
		Remark:          req.Remark,
	}

	if err := h.db.Create(&maintenance).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create maintenance")
	}

	h.auditService.LogAction(
		"create", "maintenance", maintenance.ID,
		userID, userName,
		nil, maintenance,
		c.IP(), c.Get("User-Agent"),
	)

	return utils.SuccessResponse(c, maintenance)
}

func (h *MaintenanceHandler) List(c *fiber.Ctx) error {
	_, _, userRole := middleware.GetCurrentUser(c)

	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "10"))
	status := c.Query("status")
	maintenanceType := c.Query("type")
	customerID := c.Query("customer_id")
	handlerID := c.Query("handler_id")

	var maintenances []models.Maintenance
	var total int64

	query := h.db.Model(&models.Maintenance{}).Preload("Customer").Preload("Salesperson").Preload("Handler").Preload("Quotation")

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if maintenanceType != "" {
		query = query.Where("type = ?", maintenanceType)
	}
	if customerID != "" {
		query = query.Where("customer_id = ?", customerID)
	}
	if handlerID != "" {
		query = query.Where("handler_id = ?", handlerID)
	}

	if userRole == models.RoleSalesperson {
		userID, _, _ := middleware.GetCurrentUser(c)
		query = query.Where("salesperson_id = ?", userID)
	}

	if userRole == models.RoleAfterSales {
		userID, _, _ := middleware.GetCurrentUser(c)
		query = query.Where("handler_id = ?", userID)
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&maintenances)

	return utils.SuccessResponseWithPagination(c, maintenances, page, pageSize, total)
}

func (h *MaintenanceHandler) Get(c *fiber.Ctx) error {
	userID, _, userRole := middleware.GetCurrentUser(c)
	id, _ := strconv.Atoi(c.Params("id"))

	var maintenance models.Maintenance
	if err := h.db.Preload("Customer").Preload("Product").Preload("Salesperson").Preload("Handler").Preload("Quotation").
		First(&maintenance, id).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Maintenance not found")
	}

	if userRole == models.RoleSalesperson && maintenance.SalespersonID != userID {
		return utils.ErrorResponse(c, fiber.StatusForbidden, "You can only view your own maintenance records")
	}

	if userRole == models.RoleAfterSales && (maintenance.HandlerID == nil || *maintenance.HandlerID != userID) {
		return utils.ErrorResponse(c, fiber.StatusForbidden, "You can only view maintenance assigned to you")
	}

	statusHistory, _ := h.auditService.GetStatusHistory("maintenance", uint(id))

	return utils.SuccessResponse(c, fiber.Map{
		"maintenance":    maintenance,
		"status_history": statusHistory,
	})
}

type RawMaintenanceUpdateRequest struct {
	HandlerID *uint `json:"handler_id"`
	Status    *string `json:"status"`
}

const (
	ErrHandlerIDNotAllowed = "handler_id field is not allowed in update request. " +
		"To assign or reassign a handler, use the manager-only assign endpoint: POST /api/maintenances/:id/assign"
	ErrStatusNotAllowed = "status field is not allowed in update request. " +
		"To change status, use the dedicated status endpoint: POST /api/maintenances/:id/status"
)

func (h *MaintenanceHandler) Update(c *fiber.Ctx) error {
	userID, userName, userRole := middleware.GetCurrentUser(c)
	id, _ := strconv.Atoi(c.Params("id"))

	var rawReq RawMaintenanceUpdateRequest
	_ = c.BodyParser(&rawReq)

	if rawReq.HandlerID != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, ErrHandlerIDNotAllowed)
	}
	if rawReq.Status != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, ErrStatusNotAllowed)
	}

	var maintenance models.Maintenance
	if err := h.db.First(&maintenance, id).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Maintenance not found")
	}

	if userRole == models.RoleAfterSales {
		return utils.ErrorResponse(c, fiber.StatusForbidden, 
			"After-sales staff cannot edit maintenance details. To update status, use POST /api/maintenances/:id/status")
	}

	if userRole == models.RoleSalesperson && maintenance.SalespersonID != userID {
		return utils.ErrorResponse(c, fiber.StatusForbidden, "You can only update your own maintenance records")
	}

	if maintenance.Status != models.MaintenanceStatusPending && 
	   maintenance.Status != models.MaintenanceStatusConfirmed {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, 
			fmt.Sprintf("Cannot update maintenance with status '%s'. "+
				"Only pending (pending) or confirmed (confirmed) records can be edited. "+
				"Records in progress cannot be modified via this endpoint", maintenance.Status))
	}

	oldMaintenance := maintenance

	var req UpdateMaintenanceRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if req.ProductName != "" {
		maintenance.ProductName = req.ProductName
	}
	maintenance.Description = req.Description
	maintenance.Issues = req.Issues
	maintenance.EstimatedPrice = req.EstimatedPrice
	maintenance.ActualPrice = req.ActualPrice
	maintenance.AppointmentDate = req.AppointmentDate
	maintenance.Remark = req.Remark

	if err := h.db.Save(&maintenance).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update maintenance")
	}

	h.auditService.LogAction(
		"update", "maintenance", maintenance.ID,
		userID, userName,
		oldMaintenance, maintenance,
		c.IP(), c.Get("User-Agent"),
	)

	return utils.SuccessResponse(c, maintenance)
}

func (h *MaintenanceHandler) UpdateStatus(c *fiber.Ctx) error {
	userID, userName, userRole := middleware.GetCurrentUser(c)
	id, _ := strconv.Atoi(c.Params("id"))

	var req UpdateStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	var maintenance models.Maintenance
	if err := h.db.First(&maintenance, id).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Maintenance not found")
	}

	if !isValidStatusTransition(maintenance.Status, req.Status) {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, 
			fmt.Sprintf("Invalid status transition from %s to %s", maintenance.Status, req.Status))
	}

	switch req.Status {
	case models.MaintenanceStatusConfirmed, models.MaintenanceStatusInProgress, models.MaintenanceStatusCompleted:
		if userRole != models.RoleAfterSales {
			return utils.ErrorResponse(c, fiber.StatusForbidden, "Only assigned after-sales handler can process maintenance")
		}
		if maintenance.HandlerID == nil {
			return utils.ErrorResponse(c, fiber.StatusBadRequest, "Maintenance has not been assigned to any handler")
		}
		if *maintenance.HandlerID != userID {
			return utils.ErrorResponse(c, fiber.StatusForbidden, "You can only process maintenance assigned to you")
		}

	case models.MaintenanceStatusPickedUp:
		if userRole != models.RoleManager && userRole != models.RoleSalesperson {
			return utils.ErrorResponse(c, fiber.StatusForbidden, "Only manager or creator salesperson can mark pickup")
		}
		if userRole == models.RoleSalesperson && maintenance.SalespersonID != userID {
			return utils.ErrorResponse(c, fiber.StatusForbidden, "You can only mark pickup for your own maintenance records")
		}

	case models.MaintenanceStatusCancelled:
		if userRole != models.RoleManager && userRole != models.RoleSalesperson {
			return utils.ErrorResponse(c, fiber.StatusForbidden, "Only manager or creator salesperson can cancel maintenance")
		}
		if userRole == models.RoleSalesperson && maintenance.SalespersonID != userID {
			return utils.ErrorResponse(c, fiber.StatusForbidden, "You can only cancel your own maintenance records")
		}
	}

	oldMaintenance := maintenance
	oldStatus := maintenance.Status
	maintenance.Status = req.Status

	if req.Status == models.MaintenanceStatusCompleted {
		now := time.Now()
		maintenance.CompletedDate = &now
	}

	if req.Status == models.MaintenanceStatusPickedUp {
		now := time.Now()
		maintenance.PickupDate = &now
	}

	if err := h.db.Save(&maintenance).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update maintenance status")
	}

	h.auditService.AddStatusHistory(
		"maintenance", maintenance.ID,
		string(oldStatus), string(maintenance.Status),
		userID, userName, req.Comment,
	)

	h.auditService.LogAction(
		"status_change", "maintenance", maintenance.ID,
		userID, userName,
		oldMaintenance, maintenance,
		c.IP(), c.Get("User-Agent"),
	)

	return utils.SuccessResponse(c, maintenance)
}

func (h *MaintenanceHandler) Assign(c *fiber.Ctx) error {
	userID, userName, userRole := middleware.GetCurrentUser(c)
	id, _ := strconv.Atoi(c.Params("id"))

	var req AssignMaintenanceRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	var maintenance models.Maintenance
	if err := h.db.First(&maintenance, id).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Maintenance not found")
	}

	if userRole != models.RoleManager {
		return utils.ErrorResponse(c, fiber.StatusForbidden, "Only manager can assign maintenance handler")
	}

	var handler models.User
	if err := h.db.Where("id = ? AND role = ?", req.HandlerID, models.RoleAfterSales).First(&handler).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid handler: must be an after-sales staff")
	}

	oldMaintenance := maintenance
	oldStatus := maintenance.Status
	oldHandlerID := maintenance.HandlerID
	isReassign := oldHandlerID != nil

	maintenance.HandlerID = &req.HandlerID

	if maintenance.Status == models.MaintenanceStatusPending {
		maintenance.Status = models.MaintenanceStatusConfirmed
	}

	if err := h.db.Save(&maintenance).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to assign maintenance")
	}

	var oldHandlerName string
	if oldHandlerID != nil {
		var oldHandler models.User
		if err := h.db.First(&oldHandler, *oldHandlerID).Error; err == nil {
			oldHandlerName = oldHandler.Name
		}
	}

	comment := req.Comment
	if comment == "" {
		if !isReassign {
			comment = fmt.Sprintf("Assigned to handler: %s", handler.Name)
		} else {
			if oldHandlerName != "" {
				comment = fmt.Sprintf("Reassigned from %s to %s", oldHandlerName, handler.Name)
			} else {
				comment = fmt.Sprintf("Reassigned to handler: %s", handler.Name)
			}
		}
	}

	if isReassign && oldStatus == maintenance.Status {
		h.auditService.AddStatusHistory(
			"maintenance", maintenance.ID,
			string(oldStatus), string(maintenance.Status),
			userID, userName, comment,
		)
	} else {
		h.auditService.AddStatusHistory(
			"maintenance", maintenance.ID,
			string(oldStatus), string(maintenance.Status),
			userID, userName, comment,
		)
	}

	h.auditService.LogAction(
		"assign", "maintenance", maintenance.ID,
		userID, userName,
		oldMaintenance, maintenance,
		c.IP(), c.Get("User-Agent"),
	)

	return utils.SuccessResponse(c, maintenance)
}
