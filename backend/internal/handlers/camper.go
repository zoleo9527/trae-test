package handlers

import (
	"camp-management/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type CamperHandler struct {
	db *gorm.DB
}

func NewCamperHandler(db *gorm.DB) *CamperHandler {
	return &CamperHandler{db: db}
}

func (h *CamperHandler) List(c *fiber.Ctx) error {
	query := h.db.Model(&models.Camper{})

	if search := c.Query("search"); search != "" {
		query = query.Where("name LIKE ?", "%"+search+"%")
	}
	if group := c.Query("group"); group != "" {
		query = query.Where("group_name = ?", group)
	}
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	query.Count(&total)

	var campers []models.Camper
	if err := query.Preload("Room").Find(&campers).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "获取营员列表失败"})
	}

	return c.JSON(fiber.Map{"data": campers, "total": total})
}

func (h *CamperHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")

	var camper models.Camper
	if err := h.db.Preload("Room").First(&camper, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "营员未找到"})
	}

	return c.JSON(fiber.Map{"data": camper})
}

func (h *CamperHandler) Create(c *fiber.Ctx) error {
	var camper models.Camper
	if err := c.BodyParser(&camper); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "无效的请求"})
	}

	if camper.Status == "" {
		camper.Status = "active"
	}

	if err := h.db.Create(&camper).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "创建营员失败"})
	}

	userID := c.Locals("user_id").(string)
	h.db.Create(&models.TimelineEvent{
		CamperID:         camper.ID,
		EventType:        "camper_created",
		EventTitle:       "营员登记",
		EventDescription: "登记营员: " + camper.Name,
		OperatorID:       userID,
	})

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": camper})
}

func (h *CamperHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")

	var camper models.Camper
	if err := h.db.First(&camper, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "营员未找到"})
	}

	var updates models.Camper
	if err := c.BodyParser(&updates); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "无效的请求"})
	}

	if err := h.db.Model(&camper).Updates(&updates).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "更新营员失败"})
	}

	h.db.Preload("Room").First(&camper, "id = ?", id)

	userID := c.Locals("user_id").(string)
	h.db.Create(&models.TimelineEvent{
		CamperID:         camper.ID,
		EventType:        "camper_updated",
		EventTitle:       "营员信息更新",
		EventDescription: "更新营员信息: " + camper.Name,
		OperatorID:       userID,
	})

	return c.JSON(fiber.Map{"data": camper})
}

func (h *CamperHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	var camper models.Camper
	if err := h.db.First(&camper, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "营员未找到"})
	}

	userID := c.Locals("user_id").(string)
	h.db.Create(&models.TimelineEvent{
		CamperID:         camper.ID,
		EventType:        "camper_deleted",
		EventTitle:       "营员删除",
		EventDescription: "删除营员: " + camper.Name,
		OperatorID:       userID,
	})

	if err := h.db.Delete(&camper).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "删除营员失败"})
	}

	return c.JSON(fiber.Map{"message": "营员已删除"})
}

func (h *CamperHandler) GetTimeline(c *fiber.Ctx) error {
	id := c.Params("id")

	var events []models.TimelineEvent
	if err := h.db.Where("camper_id = ?", id).Preload("Operator").Order("created_at DESC").Find(&events).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "获取时间线失败"})
	}

	return c.JSON(fiber.Map{"data": events})
}
