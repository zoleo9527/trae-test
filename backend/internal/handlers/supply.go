package handlers

import (
	"camp-management/internal/models"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type SupplyHandler struct {
	db *gorm.DB
}

func NewSupplyHandler(db *gorm.DB) *SupplyHandler {
	return &SupplyHandler{db: db}
}

func (h *SupplyHandler) List(c *fiber.Ctx) error {
	query := h.db.Model(&models.Supply{})

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if camperID := c.Query("camper_id"); camperID != "" {
		query = query.Where("camper_id = ?", camperID)
	}

	var total int64
	query.Count(&total)

	var supplies []models.Supply
	if err := query.Preload("Camper").Preload("Requester").Preload("Fulfiller").Order("created_at DESC").Find(&supplies).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "获取物资列表失败"})
	}

	return c.JSON(fiber.Map{"data": supplies, "total": total})
}

func (h *SupplyHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")

	var supply models.Supply
	if err := h.db.Preload("Camper").Preload("Requester").Preload("Fulfiller").First(&supply, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "物资申请未找到"})
	}

	return c.JSON(fiber.Map{"data": supply})
}

func (h *SupplyHandler) Create(c *fiber.Ctx) error {
	var supply models.Supply
	if err := c.BodyParser(&supply); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "无效的请求"})
	}

	userID := c.Locals("user_id").(string)
	supply.RequestedBy = userID
	supply.Status = "pending"

	if err := h.db.Create(&supply).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "创建物资申请失败"})
	}

	h.db.Create(&models.TimelineEvent{
		CamperID:         supply.CamperID,
		EventType:        "supply_requested",
		EventTitle:       "提交物资申请",
		EventDescription: "申请物资: " + supply.ItemName + " x" + strconv.Itoa(supply.Quantity),
		OperatorID:       userID,
	})

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": supply})
}

func (h *SupplyHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")

	var supply models.Supply
	if err := h.db.First(&supply, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "物资申请未找到"})
	}

	var updates models.Supply
	if err := c.BodyParser(&updates); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "无效的请求"})
	}

	if err := h.db.Model(&supply).Updates(&updates).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "更新物资申请失败"})
	}

	h.db.Preload("Camper").Preload("Requester").Preload("Fulfiller").First(&supply, "id = ?", id)

	userID := c.Locals("user_id").(string)
	h.db.Create(&models.TimelineEvent{
		CamperID:         supply.CamperID,
		EventType:        "supply_updated",
		EventTitle:       "更新物资申请",
		EventDescription: "更新物资申请: " + supply.ItemName,
		OperatorID:       userID,
	})

	return c.JSON(fiber.Map{"data": supply})
}

func (h *SupplyHandler) Fulfill(c *fiber.Ctx) error {
	id := c.Params("id")

	var supply models.Supply
	if err := h.db.First(&supply, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "物资申请未找到"})
	}

	userID := c.Locals("user_id").(string)
	supply.Status = "fulfilled"
	supply.FulfilledBy = &userID

	if err := h.db.Save(&supply).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "完成物资申请失败"})
	}

	h.db.Create(&models.TimelineEvent{
		CamperID:         supply.CamperID,
		EventType:        "supply_fulfilled",
		EventTitle:       "物资申请已完成",
		EventDescription: "物资申请已完成: " + supply.ItemName,
		OperatorID:       userID,
	})

	h.db.Preload("Camper").Preload("Requester").Preload("Fulfiller").First(&supply, "id = ?", id)

	return c.JSON(fiber.Map{"data": supply})
}
