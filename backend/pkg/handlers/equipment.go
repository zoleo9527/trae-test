package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"golf-range/pkg/database"
	"golf-range/pkg/middleware"
	"golf-range/pkg/models"
)

func ListEquipment(c *fiber.Ctx) error {
	status := c.Query("status")
	category := c.Query("category")

	var equipment []models.Equipment
	query := database.DB.Order("category, name")

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if category != "" {
		query = query.Where("category = ?", category)
	}

	result := query.Find(&equipment)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "查询器材失败"})
	}

	return c.JSON(equipment)
}

func BorrowEquipment(c *fiber.Ctx) error {
	equipmentIDStr := c.Params("id")
	equipmentID, err := uuid.Parse(equipmentIDStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "无效的器材ID"})
	}

	var req struct {
		BookingID string `json:"bookingId"`
		MemberID  string `json:"memberId"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "请求格式错误"})
	}

	user := middleware.GetCurrentUser(c)

	var equipment models.Equipment
	if err := database.DB.Where("id = ?", equipmentID).First(&equipment).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "器材不存在"})
	}

	if equipment.Status != "available" {
		return c.Status(400).JSON(fiber.Map{"error": "器材不可用"})
	}

	bookingID, _ := uuid.Parse(req.BookingID)
	memberID, _ := uuid.Parse(req.MemberID)

	tx := database.DB.Begin()

	rental := models.EquipmentRental{
		BookingID:     bookingID,
		EquipmentID:   equipmentID,
		MemberID:      memberID,
		EquipmentName: equipment.Name,
		RentedAt:      time.Now(),
		ConditionOut:  equipment.Condition,
		Fee:           equipment.DailyRate,
		OperatorID:    user.ID,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := tx.Create(&rental).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": "创建租借记录失败"})
	}

	equipment.Status = "in_use"
	equipment.UpdatedAt = time.Now()
	if err := tx.Save(&equipment).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": "更新器材状态失败"})
	}

	middleware.CreateAuditLog(c, "借出器材", "equipment", equipmentID, "available", "in_use", &bookingID, &memberID)

	tx.Commit()

	return c.JSON(rental)
}

func ReturnEquipment(c *fiber.Ctx) error {
	equipmentIDStr := c.Params("id")
	equipmentID, err := uuid.Parse(equipmentIDStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "无效的器材ID"})
	}

	var req struct {
		ConditionIn    string `json:"conditionIn"`
		DamageReported bool   `json:"damageReported"`
		DamageNote     string `json:"damageNote"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "请求格式错误"})
	}

	user := middleware.GetCurrentUser(c)

	var rental models.EquipmentRental
	if err := database.DB.Where("equipment_id = ? AND returned_at IS NULL", equipmentID).
		Order("rented_at DESC").First(&rental).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "未找到租借记录"})
	}

	var equipment models.Equipment
	if err := database.DB.Where("id = ?", equipmentID).First(&equipment).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "器材不存在"})
	}

	now := time.Now()
	tx := database.DB.Begin()

	oldCondition := equipment.Condition
	rental.ReturnedAt = &now
	rental.ConditionIn = req.ConditionIn
	rental.DamageReported = req.DamageReported
	rental.DamageNote = req.DamageNote
	rental.UpdatedAt = now

	if err := tx.Save(&rental).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": "更新租借记录失败"})
	}

	equipment.Status = "available"
	equipment.Condition = req.ConditionIn
	equipment.UpdatedAt = now
	if err := tx.Save(&equipment).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": "更新器材状态失败"})
	}

	middleware.CreateAuditLog(c, "归还器材", "equipment", equipmentID, oldCondition, req.ConditionIn, &rental.BookingID, &rental.MemberID)

	tx.Commit()

	response := fiber.Map{
		"rental":  rental,
		"warning": "",
	}

	if req.DamageReported {
		response["warning"] = "器材有损坏，建议创建异常单进行追责"
		response["damageNote"] = req.DamageNote
	}

	return c.JSON(response)
}

func ListRentals(c *fiber.Ctx) error {
	active := c.Query("active")

	var rentals []models.EquipmentRental
	query := database.DB.Order("rented_at DESC")

	if active == "true" {
		query = query.Where("returned_at IS NULL")
	}

	result := query.Find(&rentals)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "查询租借记录失败"})
	}

	return c.JSON(rentals)
}
