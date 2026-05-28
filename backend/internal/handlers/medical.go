package handlers

import (
	"camp-management/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type MedicalHandler struct {
	db *gorm.DB
}

func NewMedicalHandler(db *gorm.DB) *MedicalHandler {
	return &MedicalHandler{db: db}
}

func (h *MedicalHandler) List(c *fiber.Ctx) error {
	query := h.db.Model(&models.MedicalRecord{})

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if severity := c.Query("severity"); severity != "" {
		query = query.Where("severity = ?", severity)
	}
	if camperID := c.Query("camper_id"); camperID != "" {
		query = query.Where("camper_id = ?", camperID)
	}

	var total int64
	query.Count(&total)

	var records []models.MedicalRecord
	if err := query.Preload("Camper").Preload("Reporter").Preload("Resolver").Order("created_at DESC").Find(&records).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "获取医疗记录列表失败"})
	}

	return c.JSON(fiber.Map{"data": records, "total": total})
}

func (h *MedicalHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")

	var record models.MedicalRecord
	if err := h.db.Preload("Camper").Preload("Reporter").Preload("Resolver").Preload("FollowUps.Author").First(&record, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "医疗记录未找到"})
	}

	return c.JSON(fiber.Map{"data": record})
}

func (h *MedicalHandler) Create(c *fiber.Ctx) error {
	var record models.MedicalRecord
	if err := c.BodyParser(&record); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "无效的请求"})
	}

	userID := c.Locals("user_id").(string)
	record.ReportedBy = userID
	record.Status = "pending"

	if err := h.db.Create(&record).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "创建医疗记录失败"})
	}

	h.db.Create(&models.TimelineEvent{
		CamperID:         record.CamperID,
		EventType:        "medical_created",
		EventTitle:       "新增医疗记录",
		EventDescription: "新增医疗记录: " + record.Type + " - " + record.Description,
		OperatorID:       userID,
	})

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": record})
}

func (h *MedicalHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")

	var record models.MedicalRecord
	if err := h.db.First(&record, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "医疗记录未找到"})
	}

	var updates models.MedicalRecord
	if err := c.BodyParser(&updates); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "无效的请求"})
	}

	if err := h.db.Model(&record).Updates(&updates).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "更新医疗记录失败"})
	}

	h.db.Preload("Camper").Preload("Reporter").Preload("Resolver").First(&record, "id = ?", id)

	userID := c.Locals("user_id").(string)
	h.db.Create(&models.TimelineEvent{
		CamperID:         record.CamperID,
		EventType:        "medical_updated",
		EventTitle:       "更新医疗记录",
		EventDescription: "更新医疗记录: " + record.Type,
		OperatorID:       userID,
	})

	return c.JSON(fiber.Map{"data": record})
}

func (h *MedicalHandler) Resolve(c *fiber.Ctx) error {
	id := c.Params("id")

	var record models.MedicalRecord
	if err := h.db.First(&record, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "医疗记录未找到"})
	}

	userID := c.Locals("user_id").(string)
	record.Status = "resolved"
	record.ResolvedBy = &userID

	if err := h.db.Save(&record).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "解决医疗记录失败"})
	}

	h.db.Create(&models.TimelineEvent{
		CamperID:         record.CamperID,
		EventType:        "medical_resolved",
		EventTitle:       "医疗记录已解决",
		EventDescription: "医疗记录已解决: " + record.Type + " - " + record.Description,
		OperatorID:       userID,
	})

	return c.JSON(fiber.Map{"message": "医疗记录已解决"})
}

func (h *MedicalHandler) AddFollowUp(c *fiber.Ctx) error {
	id := c.Params("id")

	var record models.MedicalRecord
	if err := h.db.First(&record, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "医疗记录未找到"})
	}

	var followUp models.MedicalFollowUp
	if err := c.BodyParser(&followUp); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "无效的请求"})
	}

	userID := c.Locals("user_id").(string)
	followUp.MedicalID = id
	followUp.AuthorID = userID

	if err := h.db.Create(&followUp).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "添加随访记录失败"})
	}

	h.db.Create(&models.TimelineEvent{
		CamperID:         record.CamperID,
		EventType:        "medical_followup",
		EventTitle:       "新增随访记录",
		EventDescription: "新增随访记录: " + record.Type,
		OperatorID:       userID,
	})

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": followUp})
}
