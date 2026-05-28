package handlers

import (
	"camp-management/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type AttendanceHandler struct {
	db *gorm.DB
}

func NewAttendanceHandler(db *gorm.DB) *AttendanceHandler {
	return &AttendanceHandler{db: db}
}

func (h *AttendanceHandler) List(c *fiber.Ctx) error {
	query := h.db.Model(&models.Attendance{})

	if date := c.Query("date"); date != "" {
		query = query.Where("date = ?", date)
	}
	if approvalStatus := c.Query("approval_status"); approvalStatus != "" {
		query = query.Where("approval_status = ?", approvalStatus)
	}
	if group := c.Query("group"); group != "" {
		query = query.Joins("JOIN campers ON campers.id = attendances.camper_id").Where("campers.group_name = ?", group)
	}

	var total int64
	query.Count(&total)

	var records []models.Attendance
	if err := query.Preload("Camper").Preload("Submitter").Preload("Reviewer").Order("created_at DESC").Find(&records).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "获取考勤列表失败"})
	}

	return c.JSON(fiber.Map{"data": records, "total": total})
}

func (h *AttendanceHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")

	var record models.Attendance
	if err := h.db.Preload("Camper").Preload("Submitter").Preload("Reviewer").First(&record, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "考勤记录未找到"})
	}

	return c.JSON(fiber.Map{"data": record})
}

func (h *AttendanceHandler) Create(c *fiber.Ctx) error {
	var record models.Attendance
	if err := c.BodyParser(&record); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "无效的请求"})
	}

	userID := c.Locals("user_id").(string)
	record.SubmittedBy = userID
	record.ApprovalStatus = "pending"

	if err := h.db.Create(&record).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "创建考勤记录失败"})
	}

	h.db.Create(&models.TimelineEvent{
		CamperID:         record.CamperID,
		EventType:        "attendance_created",
		EventTitle:       "提交考勤",
		EventDescription: "提交考勤记录: " + record.Date + " " + record.Session,
		OperatorID:       userID,
	})

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": record})
}

func (h *AttendanceHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")

	var record models.Attendance
	if err := h.db.First(&record, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "考勤记录未找到"})
	}

	var updates models.Attendance
	if err := c.BodyParser(&updates); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "无效的请求"})
	}

	if err := h.db.Model(&record).Updates(&updates).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "更新考勤记录失败"})
	}

	h.db.Preload("Camper").Preload("Submitter").Preload("Reviewer").First(&record, "id = ?", id)

	userID := c.Locals("user_id").(string)
	h.db.Create(&models.TimelineEvent{
		CamperID:         record.CamperID,
		EventType:        "attendance_updated",
		EventTitle:       "更新考勤",
		EventDescription: "更新考勤记录: " + record.Date + " " + record.Session,
		OperatorID:       userID,
	})

	return c.JSON(fiber.Map{"data": record})
}

func (h *AttendanceHandler) Approve(c *fiber.Ctx) error {
	id := c.Params("id")

	var record models.Attendance
	if err := h.db.First(&record, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "考勤记录未找到"})
	}

	userID := c.Locals("user_id").(string)
	record.ApprovalStatus = "approved"
	record.ReviewedBy = &userID

	if err := h.db.Save(&record).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "审批考勤失败"})
	}

	h.db.Create(&models.TimelineEvent{
		CamperID:         record.CamperID,
		EventType:        "attendance_approved",
		EventTitle:       "考勤已通过",
		EventDescription: "考勤记录审批通过: " + record.Date + " " + record.Session,
		OperatorID:       userID,
	})

	return c.JSON(fiber.Map{"message": "考勤已通过"})
}

func (h *AttendanceHandler) Reject(c *fiber.Ctx) error {
	id := c.Params("id")

	var record models.Attendance
	if err := h.db.First(&record, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "考勤记录未找到"})
	}

	userID := c.Locals("user_id").(string)
	record.ApprovalStatus = "rejected"
	record.ReviewedBy = &userID

	if err := h.db.Save(&record).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "驳回考勤失败"})
	}

	h.db.Create(&models.TimelineEvent{
		CamperID:         record.CamperID,
		EventType:        "attendance_rejected",
		EventTitle:       "考勤已驳回",
		EventDescription: "考勤记录已驳回: " + record.Date + " " + record.Session,
		OperatorID:       userID,
	})

	return c.JSON(fiber.Map{"message": "考勤已驳回"})
}
