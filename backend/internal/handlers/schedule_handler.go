package handlers

import (
	"strconv"
	"time"
	"wedding-photo-backend/internal/models"
	"wedding-photo-backend/pkg/database"
	"wedding-photo-backend/pkg/middleware"

	"github.com/gofiber/fiber/v2"
)

type ScheduleHandler struct{}

func NewScheduleHandler() *ScheduleHandler {
	return &ScheduleHandler{}
}

type CreateCustomerRequest struct {
	Name        string `json:"name" validate:"required"`
	Phone       string `json:"phone" validate:"required"`
	WeddingDate string `json:"wedding_date"`
	Remark      string `json:"remark"`
}

func (h *ScheduleHandler) CreateCustomer(c *fiber.Ctx) error {
	var req CreateCustomerRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "请求参数错误",
		})
	}

	var customer models.Customer
	customer.Name = req.Name
	customer.Phone = req.Phone
	customer.Remark = req.Remark

	if req.WeddingDate != "" {
		t, err := time.Parse("2006-01-02", req.WeddingDate)
		if err == nil {
			customer.WeddingDate = &t
		}
	}

	if err := database.DB.Create(&customer).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "创建客户失败",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "创建成功",
		"data":    customer,
	})
}

func (h *ScheduleHandler) GetCustomers(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "10"))
	keyword := c.Query("keyword")

	query := database.DB.Model(&models.Customer{})

	if keyword != "" {
		query = query.Where("name LIKE ? OR phone LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}

	var total int64
	query.Count(&total)

	var customers []models.Customer
	offset := (page - 1) * pageSize
	query.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&customers)

	return c.JSON(fiber.Map{
		"success": true,
		"message": "获取成功",
		"data": fiber.Map{
			"list":      customers,
			"total":     total,
			"page":      page,
			"page_size": pageSize,
		},
	})
}

type CreateScheduleRequest struct {
	CustomerID    uint    `json:"customer_id" validate:"required"`
	ScheduleDate  string  `json:"schedule_date" validate:"required"`
	TimeSlot      string  `json:"time_slot" validate:"required"`
	Type          string  `json:"type" validate:"required"`
	ButlerID      *uint   `json:"butler_id"`
	SelectorID    *uint   `json:"selector_id"`
	DepositAmount float64 `json:"deposit_amount"`
	TotalAmount   float64 `json:"total_amount"`
	Remark        string  `json:"remark"`
}

func (h *ScheduleHandler) Create(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)

	var req CreateScheduleRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "请求参数错误",
		})
	}

	scheduleDate, err := time.Parse("2006-01-02", req.ScheduleDate)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "日期格式错误",
		})
	}

	schedule := models.Schedule{
		CustomerID:    req.CustomerID,
		ScheduleDate:  scheduleDate,
		TimeSlot:      req.TimeSlot,
		Type:          req.Type,
		Status:        models.ScheduleStatusPending,
		ButlerID:      req.ButlerID,
		SelectorID:    req.SelectorID,
		DepositAmount: req.DepositAmount,
		TotalAmount:   req.TotalAmount,
		Remark:        req.Remark,
	}

	if err := database.DB.Create(&schedule).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "创建档期失败",
		})
	}

	logOperation(userID, "create", "schedule", schedule.ID, "", string(schedule.Status))

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "创建成功",
		"data":    schedule,
	})
}

func (h *ScheduleHandler) GetList(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "10"))
	status := c.Query("status")
	date := c.Query("date")
	type_ := c.Query("type")
	customerID := c.Query("customer_id")

	query := database.DB.Model(&models.Schedule{}).Preload("Customer").Preload("Butler").Preload("Selector")

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if date != "" {
		query = query.Where("schedule_date = ?", date)
	}
	if type_ != "" {
		query = query.Where("type = ?", type_)
	}
	if customerID != "" {
		query = query.Where("customer_id = ?", customerID)
	}

	var total int64
	query.Count(&total)

	var schedules []models.Schedule
	offset := (page - 1) * pageSize
	query.Offset(offset).Limit(pageSize).Order("schedule_date DESC, created_at DESC").Find(&schedules)

	return c.JSON(fiber.Map{
		"success": true,
		"message": "获取成功",
		"data": fiber.Map{
			"list":      schedules,
			"total":     total,
			"page":      page,
			"page_size": pageSize,
		},
	})
}

func (h *ScheduleHandler) GetDetail(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "ID参数错误",
		})
	}

	var schedule models.Schedule
	if err := database.DB.Preload("Customer").Preload("Butler").Preload("Selector").First(&schedule, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "档期不存在",
		})
	}

	var dispatches []models.CostumeDispatch
	database.DB.Where("schedule_id = ?", id).Preload("Costume").Find(&dispatches)

	var logs []models.OperationLog
	database.DB.Where("resource_type = ? AND resource_id = ?", "schedule", id).Preload("User").Order("created_at DESC").Find(&logs)

	return c.JSON(fiber.Map{
		"success": true,
		"message": "获取成功",
		"data": fiber.Map{
			"schedule":   schedule,
			"dispatches": dispatches,
			"logs":       logs,
		},
	})
}

func (h *ScheduleHandler) Confirm(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "ID参数错误",
		})
	}

	var schedule models.Schedule
	if err := database.DB.First(&schedule, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "档期不存在",
		})
	}

	if err := models.ValidateScheduleTransition(schedule.Status, models.ScheduleStatusConfirmed); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	oldData := map[string]interface{}{
		"status": schedule.Status,
	}

	schedule.Status = models.ScheduleStatusConfirmed

	if err := database.DB.Save(&schedule).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "确认档期失败",
		})
	}

	newData := map[string]interface{}{
		"status": schedule.Status,
	}
	logOperationDetail(userID, "confirm", "schedule", uint(id), oldData, newData, "档期确认")

	return c.JSON(fiber.Map{
		"success": true,
		"message": "档期确认成功",
		"data":    schedule,
	})
}

type RescheduleScheduleRequest struct {
	ScheduleDate string  `json:"schedule_date" validate:"required"`
	TimeSlot     string  `json:"time_slot" validate:"required"`
	ButlerID     *uint   `json:"butler_id"`
	SelectorID   *uint   `json:"selector_id"`
	Remark       string  `json:"remark"`
}

func (h *ScheduleHandler) Reschedule(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "ID参数错误",
		})
	}

	var req RescheduleScheduleRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "请求参数错误",
		})
	}

	newDate, err := time.Parse("2006-01-02", req.ScheduleDate)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "日期格式错误",
		})
	}

	tx := database.DB.Begin()

	var schedule models.Schedule
	if err := tx.First(&schedule, id).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "档期不存在",
		})
	}

	if err := models.ValidateScheduleTransition(schedule.Status, models.ScheduleStatusRescheduled); err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	var relatedDispatches []models.CostumeDispatch
	tx.Where("schedule_id = ?", id).Find(&relatedDispatches)

	if can, reason := models.CanRescheduleSchedule(relatedDispatches); !can {
		tx.Rollback()
		logOperationDetail(userID, "reschedule_failed", "schedule", uint(id),
			map[string]interface{}{
				"status":       schedule.Status,
				"reason":       reason,
				"dispatches":   getDispatchStatusSummary(relatedDispatches),
			},
			map[string]interface{}{"error": reason},
			reason,
		)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": reason,
		})
	}

	oldData := map[string]interface{}{
		"status":        schedule.Status,
		"schedule_date": schedule.ScheduleDate,
		"time_slot":     schedule.TimeSlot,
		"butler_id":     schedule.ButlerID,
		"selector_id":   schedule.SelectorID,
	}

	schedule.Status = models.ScheduleStatusRescheduled
	schedule.ScheduleDate = newDate
	schedule.TimeSlot = req.TimeSlot
	if req.ButlerID != nil {
		schedule.ButlerID = req.ButlerID
	}
	if req.SelectorID != nil {
		schedule.SelectorID = req.SelectorID
	}
	if req.Remark != "" {
		if schedule.Remark != "" {
			schedule.Remark = schedule.Remark + "\n" + req.Remark
		} else {
			schedule.Remark = req.Remark
		}
	}

	if err := tx.Save(&schedule).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "改期失败",
		})
	}

	for _, d := range relatedDispatches {
		if d.Status == models.DispatchStatusConfirmed || d.Status == models.DispatchStatusRescheduled {
			tx.Model(&d).Update("status", models.DispatchStatusRescheduled)
			logOperationDetail(userID, "auto_reschedule", "dispatch", d.ID,
				map[string]interface{}{"status": d.Status},
				map[string]interface{}{"status": models.DispatchStatusRescheduled},
				"档期改期，自动更新关联调度状态")
		}
	}

	newData := map[string]interface{}{
		"status":        schedule.Status,
		"schedule_date": schedule.ScheduleDate,
		"time_slot":     schedule.TimeSlot,
		"butler_id":     schedule.ButlerID,
		"selector_id":   schedule.SelectorID,
		"related_dispatches": getDispatchStatusSummary(relatedDispatches),
	}
	logOperationDetail(userID, "reschedule", "schedule", uint(id), oldData, newData, req.Remark)

	tx.Commit()

	return c.JSON(fiber.Map{
		"success": true,
		"message": "改期成功",
		"data":    schedule,
	})
}

func (h *ScheduleHandler) Cancel(c *fiber.Ctx) error {
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

	var schedule models.Schedule
	if err := tx.First(&schedule, id).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "档期不存在",
		})
	}

	if err := models.ValidateScheduleTransition(schedule.Status, models.ScheduleStatusCancelled); err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	var relatedDispatches []models.CostumeDispatch
	tx.Where("schedule_id = ?", id).Find(&relatedDispatches)

	if can, reason := models.CanCancelSchedule(relatedDispatches); !can {
		tx.Rollback()
		logOperationDetail(userID, "cancel_failed", "schedule", uint(id),
			map[string]interface{}{
				"status":     schedule.Status,
				"reason":     reason,
				"dispatches": getDispatchStatusSummary(relatedDispatches),
			},
			map[string]interface{}{"error": reason},
			reason,
		)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": reason,
		})
	}

	oldData := map[string]interface{}{
		"status":     schedule.Status,
		"dispatches": getDispatchStatusSummary(relatedDispatches),
	}

	schedule.Status = models.ScheduleStatusCancelled

	if err := tx.Save(&schedule).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "取消档期失败",
		})
	}

	var dispatches []models.CostumeDispatch
	tx.Where("schedule_id = ? AND status IN ?", id, []models.DispatchStatus{
		models.DispatchStatusPending,
		models.DispatchStatusConfirmed,
		models.DispatchStatusRescheduled,
	}).Find(&dispatches)

	for _, d := range dispatches {
		tx.Model(&d).Update("status", models.DispatchStatusCancelled)

		var costume models.Costume
		tx.First(&costume, d.CostumeID)
		if costume.Status == models.CostumeStatusReserved {
			tx.Model(&costume).Update("status", models.CostumeStatusAvailable)
		}

		logOperationDetail(userID, "auto_cancel", "dispatch", d.ID,
			map[string]interface{}{"status": d.Status},
			map[string]interface{}{"status": models.DispatchStatusCancelled},
			"档期取消，自动取消关联调度")
	}

	newData := map[string]interface{}{
		"status": schedule.Status,
	}
	logOperationDetail(userID, "cancel", "schedule", uint(id), oldData, newData, req.Remark)

	tx.Commit()

	return c.JSON(fiber.Map{
		"success": true,
		"message": "档期取消成功",
		"data":    schedule,
	})
}

func (h *ScheduleHandler) Complete(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "ID参数错误",
		})
	}

	var schedule models.Schedule
	if err := database.DB.First(&schedule, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "档期不存在",
		})
	}

	if err := models.ValidateScheduleTransition(schedule.Status, models.ScheduleStatusCompleted); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	var relatedDispatches []models.CostumeDispatch
	database.DB.Where("schedule_id = ?", id).Find(&relatedDispatches)

	if can, reason := models.CanCompleteSchedule(relatedDispatches); !can {
		logOperationDetail(userID, "complete_failed", "schedule", uint(id),
			map[string]interface{}{
				"status":     schedule.Status,
				"reason":     reason,
				"dispatches": getDispatchStatusSummary(relatedDispatches),
			},
			map[string]interface{}{"error": reason},
			reason,
		)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": reason,
		})
	}

	oldData := map[string]interface{}{
		"status":     schedule.Status,
		"dispatches": getDispatchStatusSummary(relatedDispatches),
	}

	schedule.Status = models.ScheduleStatusCompleted

	if err := database.DB.Save(&schedule).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "完成档期失败",
		})
	}

	newData := map[string]interface{}{
		"status":     schedule.Status,
		"dispatches": getDispatchStatusSummary(relatedDispatches),
	}
	logOperationDetail(userID, "complete", "schedule", uint(id), oldData, newData, "")

	return c.JSON(fiber.Map{
		"success": true,
		"message": "档期完成",
		"data":    schedule,
	})
}
