package handlers

import (
	"bakery-system/backend/database"
	"bakery-system/backend/models"
	"fmt"

	"github.com/gofiber/fiber/v2"
)

type MemberHandler struct{}

func NewMemberHandler() *MemberHandler {
	return &MemberHandler{}
}

func (h *MemberHandler) GetMembers(c *fiber.Ctx) error {
	var members []models.Member
	query := database.DB.Model(&models.Member{})

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if search := c.Query("search"); search != "" {
		query = query.Where("name LIKE ? OR phone LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	query.Find(&members)
	return c.JSON(fiber.Map{"data": members})
}

func (h *MemberHandler) GetMember(c *fiber.Ctx) error {
	id := c.Params("id")
	var member models.Member
	if err := database.DB.Preload("Recharges").Preload("Orders").First(&member, "id = ?", id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Member not found"})
	}
	return c.JSON(member)
}

func (h *MemberHandler) CreateMember(c *fiber.Ctx) error {
	var member models.Member
	if err := c.BodyParser(&member); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	database.DB.Create(&member)
	return c.Status(201).JSON(member)
}

func (h *MemberHandler) UpdateMember(c *fiber.Ctx) error {
	id := c.Params("id")
	var member models.Member
	if err := database.DB.First(&member, "id = ?", id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Member not found"})
	}

	var data map[string]interface{}
	if err := c.BodyParser(&data); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	database.DB.Model(&member).Updates(data)
	return c.JSON(member)
}

func (h *MemberHandler) Recharge(c *fiber.Ctx) error {
	id := c.Params("id")
	var member models.Member
	if err := database.DB.First(&member, "id = ?", id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Member not found"})
	}

	var recharge models.Recharge
	if err := c.BodyParser(&recharge); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	recharge.MemberID = id
	recharge.Status = "completed"

	tx := database.DB.Begin()
	tx.Create(&recharge)
	tx.Model(&member).Updates(map[string]interface{}{
		"balance":        member.Balance + recharge.Amount + recharge.Bonus,
		"total_recharge": member.TotalRecharge + recharge.Amount,
	})
	database.AddStatusLog(member.ID, "recharge", "", "completed", recharge.Operator,
		fmt.Sprintf("储值 %.2f, 赠送 %.2f, 方式: %s", recharge.Amount, recharge.Bonus, recharge.PaymentType))
	tx.Commit()

	return c.Status(201).JSON(recharge)
}

func (h *MemberHandler) GetRecharges(c *fiber.Ctx) error {
	memberID := c.Params("id")
	var recharges []models.Recharge
	database.DB.Where("member_id = ?", memberID).Order("created_at desc").Find(&recharges)
	return c.JSON(fiber.Map{"data": recharges})
}
