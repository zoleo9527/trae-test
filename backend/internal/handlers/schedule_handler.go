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

type UpdateScheduleStatusRequest struct {
	Status string `json:"status" validate:"required"`
	Remark string `json:"remark"`
}

func (h *ScheduleHandler) UpdateStatus(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "ID参数错误",
		})
	}

	var req UpdateScheduleStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "请求参数错误",
		})
	}

	var schedule models.Schedule
	if err := database.DB.First(&schedule, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "档期不存在",
		})
	}

	oldStatus := string(schedule.Status)
	schedule.Status = models.ScheduleStatus(req.Status)

	if err := database.DB.Save(&schedule).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "更新状态失败",
		})
	}

	logOperation(userID, "status_change", "schedule", uint(id), oldStatus, req.Status)

	return c.JSON(fiber.Map{
		"success": true,
		"message": "更新成功",
		"data":    schedule,
	})
}
