package handlers

import (
	"strconv"
	"time"
	"wedding-photo-backend/internal/models"
	"wedding-photo-backend/pkg/database"
	"wedding-photo-backend/pkg/middleware"

	"github.com/gofiber/fiber/v2"
)

type MaintenanceHandler struct{}

func NewMaintenanceHandler() *MaintenanceHandler {
	return &MaintenanceHandler{}
}

type CreateMaintenanceRequest struct {
	CostumeID         uint   `json:"costume_id" validate:"required"`
	CostumeDispatchID *uint  `json:"costume_dispatch_id"`
	Type              string `json:"type" validate:"required"`
	Description       string `json:"description" validate:"required"`
	Cost              float64 `json:"cost"`
	BeforeImageURL    string `json:"before_image_url"`
	Remark            string `json:"remark"`
}

func (h *MaintenanceHandler) Create(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)

	var req CreateMaintenanceRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "请求参数错误",
		})
	}

	tx := database.DB.Begin()

	var costume models.Costume
	if err := tx.First(&costume, req.CostumeID).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "服装不存在",
		})
	}

	now := time.Now()
	maintenance := models.MaintenanceRecord{
		CostumeID:         req.CostumeID,
		CostumeDispatchID: req.CostumeDispatchID,
		Type:              models.MaintenanceType(req.Type),
		Status:            models.MaintenanceStatusPending,
		Description:       req.Description,
		Cost:              req.Cost,
		HandledByID:       &userID,
		StartedAt:         &now,
		BeforeImageURL:    req.BeforeImageURL,
		Remark:            req.Remark,
	}

	if err := tx.Create(&maintenance).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "创建保养记录失败",
		})
	}

	if req.Type == string(models.MaintenanceRepair) {
		costume.Status = models.CostumeStatusRepairing
	} else {
		costume.Status = models.CostumeStatusCleaning
	}
	if err := tx.Save(&costume).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "更新服装状态失败",
		})
	}

	tx.Commit()

	logOperation(userID, "create", "maintenance", maintenance.ID, "", string(maintenance.Status))

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "创建成功",
		"data":    maintenance,
	})
}

func (h *MaintenanceHandler) GetList(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "10"))
	status := c.Query("status")
	type_ := c.Query("type")
	costumeID := c.Query("costume_id")
	dispatchID := c.Query("dispatch_id")

	query := database.DB.Model(&models.MaintenanceRecord{}).Preload("Costume").Preload("HandledBy").Preload("CostumeDispatch")

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if type_ != "" {
		query = query.Where("type = ?", type_)
	}
	if costumeID != "" {
		query = query.Where("costume_id = ?", costumeID)
	}
	if dispatchID != "" {
		query = query.Where("costume_dispatch_id = ?", dispatchID)
	}

	var total int64
	query.Count(&total)

	var records []models.MaintenanceRecord
	offset := (page - 1) * pageSize
	query.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&records)

	return c.JSON(fiber.Map{
		"success": true,
		"message": "获取成功",
		"data": fiber.Map{
			"list":      records,
			"total":     total,
			"page":      page,
			"page_size": pageSize,
		},
	})
}

func (h *MaintenanceHandler) GetDetail(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "ID参数错误",
		})
	}

	var record models.MaintenanceRecord
	if err := database.DB.Preload("Costume").Preload("HandledBy").Preload("CostumeDispatch").First(&record, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "保养记录不存在",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "获取成功",
		"data":    record,
	})
}

type CompleteMaintenanceRequest struct {
	Cost          float64 `json:"cost"`
	AfterImageURL string  `json:"after_image_url"`
	Remark        string  `json:"remark"`
}

func (h *MaintenanceHandler) Complete(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "ID参数错误",
		})
	}

	var req CompleteMaintenanceRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "请求参数错误",
		})
	}

	tx := database.DB.Begin()

	var record models.MaintenanceRecord
	if err := tx.First(&record, id).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "保养记录不存在",
		})
	}

	oldStatus := string(record.Status)
	record.Status = models.MaintenanceStatusDone
	now := time.Now()
	record.CompletedAt = &now
	record.HandledByID = &userID
	record.AfterImageURL = req.AfterImageURL
	record.Remark = req.Remark
	if req.Cost > 0 {
		record.Cost = req.Cost
	}

	if err := tx.Save(&record).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "更新保养记录失败",
		})
	}

	var costume models.Costume
	if err := tx.First(&costume, record.CostumeID).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "服装不存在",
		})
	}

	costume.Status = models.CostumeStatusAvailable
	if err := tx.Save(&costume).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "更新服装状态失败",
		})
	}

	tx.Commit()

	logOperation(userID, "complete", "maintenance", uint(id), oldStatus, string(record.Status))

	return c.JSON(fiber.Map{
		"success": true,
		"message": "保养完成",
		"data":    record,
	})
}

func (h *MaintenanceHandler) UpdateStatus(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "ID参数错误",
		})
	}

	var req struct {
		Status string `json:"status" validate:"required"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "请求参数错误",
		})
	}

	var record models.MaintenanceRecord
	if err := database.DB.First(&record, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "保养记录不存在",
		})
	}

	oldStatus := string(record.Status)
	record.Status = models.MaintenanceStatus(req.Status)

	if err := database.DB.Save(&record).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "更新失败",
		})
	}

	logOperation(userID, "status_change", "maintenance", uint(id), oldStatus, req.Status)

	return c.JSON(fiber.Map{
		"success": true,
		"message": "更新成功",
		"data":    record,
	})
}
