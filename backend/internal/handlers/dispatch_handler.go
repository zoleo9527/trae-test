package handlers

import (
	"strconv"
	"time"
	"wedding-photo-backend/internal/models"
	"wedding-photo-backend/pkg/database"
	"wedding-photo-backend/pkg/middleware"

	"github.com/gofiber/fiber/v2"
)

type DispatchHandler struct{}

func NewDispatchHandler() *DispatchHandler {
	return &DispatchHandler{}
}

type CreateDispatchRequest struct {
	ScheduleID       uint   `json:"schedule_id" validate:"required"`
	CostumeID        uint   `json:"costume_id" validate:"required"`
	CustomerID       uint   `json:"customer_id" validate:"required"`
	ExpectedPickupAt string `json:"expected_pickup_at"`
	ExpectedReturnAt string `json:"expected_return_at"`
	Accessories      string `json:"accessories"`
	Remark           string `json:"remark"`
}

func (h *DispatchHandler) Create(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)

	var req CreateDispatchRequest
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

	if costume.Status != models.CostumeStatusAvailable {
		tx.Rollback()
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "服装当前状态不可预约",
		})
	}

	dispatch := models.CostumeDispatch{
		ScheduleID:  req.ScheduleID,
		CostumeID:   req.CostumeID,
		CustomerID:  req.CustomerID,
		Status:      models.DispatchStatusPending,
		Accessories: req.Accessories,
		Remark:      req.Remark,
	}

	if req.ExpectedPickupAt != "" {
		t, err := time.Parse(time.RFC3339, req.ExpectedPickupAt)
		if err == nil {
			dispatch.ExpectedPickupAt = &t
		}
	}
	if req.ExpectedReturnAt != "" {
		t, err := time.Parse(time.RFC3339, req.ExpectedReturnAt)
		if err == nil {
			dispatch.ExpectedReturnAt = &t
		}
	}

	if err := tx.Create(&dispatch).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "创建调度记录失败",
		})
	}

	costume.Status = models.CostumeStatusReserved
	if err := tx.Save(&costume).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "更新服装状态失败",
		})
	}

	tx.Commit()

	logOperation(userID, "create", "dispatch", dispatch.ID, "", string(dispatch.Status))

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "调度成功",
		"data":    dispatch,
	})
}

func (h *DispatchHandler) GetList(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "10"))
	status := c.Query("status")
	customerID := c.Query("customer_id")
	scheduleID := c.Query("schedule_id")
	costumeID := c.Query("costume_id")

	query := database.DB.Model(&models.CostumeDispatch{}).Preload("Costume").Preload("Customer").Preload("Schedule")

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if customerID != "" {
		query = query.Where("customer_id = ?", customerID)
	}
	if scheduleID != "" {
		query = query.Where("schedule_id = ?", scheduleID)
	}
	if costumeID != "" {
		query = query.Where("costume_id = ?", costumeID)
	}

	var total int64
	query.Count(&total)

	var dispatches []models.CostumeDispatch
	offset := (page - 1) * pageSize
	query.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&dispatches)

	return c.JSON(fiber.Map{
		"success": true,
		"message": "获取成功",
		"data": fiber.Map{
			"list":      dispatches,
			"total":     total,
			"page":      page,
			"page_size": pageSize,
		},
	})
}

func (h *DispatchHandler) GetDetail(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "ID参数错误",
		})
	}

	var dispatch models.CostumeDispatch
	if err := database.DB.Preload("Costume").Preload("Customer").Preload("Schedule").Preload("PickedUpBy").Preload("ReturnedBy").First(&dispatch, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "调度记录不存在",
		})
	}

	var maintenance []models.MaintenanceRecord
	database.DB.Where("costume_dispatch_id = ?", id).Find(&maintenance)

	return c.JSON(fiber.Map{
		"success": true,
		"message": "获取成功",
		"data": fiber.Map{
			"dispatch":    dispatch,
			"maintenance": maintenance,
		},
	})
}

func (h *DispatchHandler) Confirm(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "ID参数错误",
		})
	}

	var dispatch models.CostumeDispatch
	if err := database.DB.First(&dispatch, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "调度记录不存在",
		})
	}

	if err := models.ValidateDispatchTransition(dispatch.Status, models.DispatchStatusConfirmed); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	oldData := map[string]interface{}{
		"status": dispatch.Status,
	}

	dispatch.Status = models.DispatchStatusConfirmed

	if err := database.DB.Save(&dispatch).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "确认调度失败",
		})
	}

	newData := map[string]interface{}{
		"status": dispatch.Status,
	}
	logOperationDetail(userID, "confirm", "dispatch", uint(id), oldData, newData, "")

	return c.JSON(fiber.Map{
		"success": true,
		"message": "调度确认成功",
		"data":    dispatch,
	})
}

type RescheduleDispatchRequest struct {
	NewCostumeID     *uint  `json:"new_costume_id"`
	ExpectedPickupAt string `json:"expected_pickup_at"`
	ExpectedReturnAt string `json:"expected_return_at"`
	PickedUpByID     *uint  `json:"picked_up_by_id"`
	Remark           string `json:"remark"`
}

func (h *DispatchHandler) Reschedule(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "ID参数错误",
		})
	}

	var req RescheduleDispatchRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "请求参数错误",
		})
	}

	tx := database.DB.Begin()

	var dispatch models.CostumeDispatch
	if err := tx.First(&dispatch, id).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "调度记录不存在",
		})
	}

	if err := models.ValidateDispatchTransition(dispatch.Status, models.DispatchStatusRescheduled); err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	oldData := map[string]interface{}{
		"status":              dispatch.Status,
		"costume_id":          dispatch.CostumeID,
		"expected_pickup_at":  dispatch.ExpectedPickupAt,
		"expected_return_at": dispatch.ExpectedReturnAt,
		"picked_up_by_id":     dispatch.PickedUpByID,
	}

	oldCostumeID := dispatch.CostumeID

	if req.NewCostumeID != nil && *req.NewCostumeID != dispatch.CostumeID {
		var newCostume models.Costume
		if err := tx.First(&newCostume, *req.NewCostumeID).Error; err != nil {
			tx.Rollback()
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"success": false,
				"message": "新服装不存在",
			})
		}

		if newCostume.Status != models.CostumeStatusAvailable {
			tx.Rollback()
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"success": false,
				"message": "新服装当前状态不可预约",
			})
		}

		var oldCostume models.Costume
		if err := tx.First(&oldCostume, oldCostumeID).Error; err == nil {
			oldCostume.Status = models.CostumeStatusAvailable
			tx.Save(&oldCostume)
		}

		newCostume.Status = models.CostumeStatusReserved
		tx.Save(&newCostume)

		dispatch.CostumeID = *req.NewCostumeID
	}

	dispatch.Status = models.DispatchStatusRescheduled

	if req.ExpectedPickupAt != "" {
		t, err := time.Parse(time.RFC3339, req.ExpectedPickupAt)
		if err == nil {
			dispatch.ExpectedPickupAt = &t
		}
	}
	if req.ExpectedReturnAt != "" {
		t, err := time.Parse(time.RFC3339, req.ExpectedReturnAt)
		if err == nil {
			dispatch.ExpectedReturnAt = &t
		}
	}
	if req.PickedUpByID != nil {
		dispatch.PickedUpByID = req.PickedUpByID
	}
	if req.Remark != "" {
		if dispatch.Remark != "" {
			dispatch.Remark = dispatch.Remark + "\n" + req.Remark
		} else {
			dispatch.Remark = req.Remark
		}
	}

	if err := tx.Save(&dispatch).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "改期失败",
		})
	}

	newData := map[string]interface{}{
		"status":              dispatch.Status,
		"costume_id":          dispatch.CostumeID,
		"expected_pickup_at":  dispatch.ExpectedPickupAt,
		"expected_return_at": dispatch.ExpectedReturnAt,
		"picked_up_by_id":     dispatch.PickedUpByID,
	}
	logOperationDetail(userID, "reschedule", "dispatch", uint(id), oldData, newData, req.Remark)

	tx.Commit()

	return c.JSON(fiber.Map{
		"success": true,
		"message": "改期成功",
		"data":    dispatch,
	})
}

type PickupRequest struct {
	ActualPickupAt string `json:"actual_pickup_at"`
	Accessories    string `json:"accessories"`
	Remark         string `json:"remark"`
}

func (h *DispatchHandler) Pickup(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "ID参数错误",
		})
	}

	var req PickupRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "请求参数错误",
		})
	}

	tx := database.DB.Begin()

	var dispatch models.CostumeDispatch
	if err := tx.First(&dispatch, id).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "调度记录不存在",
		})
	}

	if err := models.ValidateDispatchTransition(dispatch.Status, models.DispatchStatusPickedUp); err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	oldData := map[string]interface{}{
		"status":           dispatch.Status,
		"actual_pickup_at": dispatch.ActualPickupAt,
	}

	dispatch.Status = models.DispatchStatusPickedUp
	dispatch.PickedUpByID = &userID

	if req.ActualPickupAt != "" {
		t, err := time.Parse(time.RFC3339, req.ActualPickupAt)
		if err == nil {
			dispatch.ActualPickupAt = &t
		}
	} else {
		now := time.Now()
		dispatch.ActualPickupAt = &now
	}

	if req.Accessories != "" {
		dispatch.Accessories = req.Accessories
	}
	if req.Remark != "" {
		dispatch.Remark = req.Remark
	}

	if err := tx.Save(&dispatch).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "更新调度记录失败",
		})
	}

	var costume models.Costume
	if err := tx.First(&costume, dispatch.CostumeID).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "服装不存在",
		})
	}

	oldCostumeStatus := costume.Status
	costume.Status = models.CostumeStatusLent
	costume.TotalUseCount++
	now := time.Now()
	costume.LastUsedAt = &now

	if err := tx.Save(&costume).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "更新服装状态失败",
		})
	}

	tx.Commit()

	newData := map[string]interface{}{
		"status":           dispatch.Status,
		"actual_pickup_at": dispatch.ActualPickupAt,
		"costume_status":   map[string]interface{}{"from": oldCostumeStatus, "to": costume.Status},
	}
	logOperationDetail(userID, "pickup", "dispatch", uint(id), oldData, newData, req.Remark)

	return c.JSON(fiber.Map{
		"success": true,
		"message": "领取成功",
		"data":    dispatch,
	})
}

type ReturnRequest struct {
	ActualReturnAt string `json:"actual_return_at"`
	DamageRemark   string `json:"damage_remark"`
	Remark         string `json:"remark"`
}

func (h *DispatchHandler) Return(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "ID参数错误",
		})
	}

	var req ReturnRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "请求参数错误",
		})
	}

	tx := database.DB.Begin()

	var dispatch models.CostumeDispatch
	if err := tx.First(&dispatch, id).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "调度记录不存在",
		})
	}

	if err := models.ValidateDispatchTransition(dispatch.Status, models.DispatchStatusReturned); err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	oldData := map[string]interface{}{
		"status":            dispatch.Status,
		"damage_remark":     dispatch.DamageRemark,
		"actual_return_at":  dispatch.ActualReturnAt,
		"returned_by_id":    dispatch.ReturnedByID,
	}

	dispatch.Status = models.DispatchStatusReturned
	dispatch.ReturnedByID = &userID
	dispatch.DamageRemark = req.DamageRemark

	if req.ActualReturnAt != "" {
		t, err := time.Parse(time.RFC3339, req.ActualReturnAt)
		if err == nil {
			dispatch.ActualReturnAt = &t
		}
	} else {
		now := time.Now()
		dispatch.ActualReturnAt = &now
	}

	if req.Remark != "" {
		if dispatch.Remark != "" {
			dispatch.Remark = dispatch.Remark + "\n" + req.Remark
		} else {
			dispatch.Remark = req.Remark
		}
	}

	if err := tx.Save(&dispatch).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "更新调度记录失败",
		})
	}

	var costume models.Costume
	if err := tx.First(&costume, dispatch.CostumeID).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "服装不存在",
		})
	}

	oldCostumeStatus := costume.Status
	newCostumeStatus := models.CostumeStatusCleaning
	if req.DamageRemark != "" {
		newCostumeStatus = models.CostumeStatusRepairing
	}
	costume.Status = newCostumeStatus

	if err := tx.Save(&costume).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "更新服装状态失败",
		})
	}

	now := time.Now()
	maintenanceType := models.MaintenanceCleaning
	description := "归还后常规清洁"

	if req.DamageRemark != "" {
		maintenanceType = models.MaintenanceRepair
		description = "损坏修复: " + req.DamageRemark
	}

	maintenance := models.MaintenanceRecord{
		CostumeID:         dispatch.CostumeID,
		CostumeDispatchID: &dispatch.ID,
		Type:              maintenanceType,
		Status:            models.MaintenanceStatusPending,
		Description:       description,
		StartedAt:         &now,
	}

	if err := tx.Create(&maintenance).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "创建保养记录失败",
		})
	}

	tx.Commit()

	newData := map[string]interface{}{
		"status":            dispatch.Status,
		"damage_remark":     dispatch.DamageRemark,
		"actual_return_at":  dispatch.ActualReturnAt,
		"returned_by_id":    dispatch.ReturnedByID,
		"costume_status":    map[string]interface{}{"from": oldCostumeStatus, "to": newCostumeStatus},
		"maintenance_id":    maintenance.ID,
		"maintenance_type":  maintenance.Type,
	}
	logOperationDetail(userID, "return", "dispatch", uint(id), oldData, newData, req.Remark)

	return c.JSON(fiber.Map{
		"success": true,
		"message": "归还成功，已自动创建保养记录",
		"data": fiber.Map{
			"dispatch":    dispatch,
			"maintenance": maintenance,
		},
	})
}

func (h *DispatchHandler) Cancel(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "ID参数错误",
		})
	}

	var req struct {
		Remark string `json:"remark"`
	}
	c.BodyParser(&req)

	tx := database.DB.Begin()

	var dispatch models.CostumeDispatch
	if err := tx.First(&dispatch, id).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "调度记录不存在",
		})
	}

	if err := models.ValidateDispatchTransition(dispatch.Status, models.DispatchStatusCancelled); err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	oldData := map[string]interface{}{
		"status":      dispatch.Status,
		"costume_id":  dispatch.CostumeID,
	}

	dispatch.Status = models.DispatchStatusCancelled

	if err := tx.Save(&dispatch).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "更新调度记录失败",
		})
	}

	var costume models.Costume
	oldCostumeStatus := ""
	if err := tx.First(&costume, dispatch.CostumeID).Error; err == nil {
		oldCostumeStatus = string(costume.Status)
		costume.Status = models.CostumeStatusAvailable
		tx.Save(&costume)
	}

	tx.Commit()

	newData := map[string]interface{}{
		"status":         dispatch.Status,
		"costume_status": map[string]interface{}{"from": oldCostumeStatus, "to": models.CostumeStatusAvailable},
	}
	logOperationDetail(userID, "cancel", "dispatch", uint(id), oldData, newData, req.Remark)

	return c.JSON(fiber.Map{
		"success": true,
		"message": "取消成功",
		"data":    dispatch,
	})
}
