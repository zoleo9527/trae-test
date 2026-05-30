package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"golf-range/pkg/database"
	"golf-range/pkg/middleware"
	"golf-range/pkg/models"
)

func GetWallet(c *fiber.Ctx) error {
	memberIDStr := c.Params("memberId")
	memberID, err := uuid.Parse(memberIDStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "无效的会员ID"})
	}

	var wallet models.Wallet
	result := database.DB.Where("member_id = ?", memberID).First(&wallet)
	if result.Error != nil {
		return c.Status(404).JSON(fiber.Map{"error": "钱包不存在"})
	}

	return c.JSON(wallet)
}

func RechargeWallet(c *fiber.Ctx) error {
	memberIDStr := c.Params("memberId")
	memberID, err := uuid.Parse(memberIDStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "无效的会员ID"})
	}

	var req struct {
		Amount float64 `json:"amount"`
		Remark string  `json:"remark"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "请求格式错误"})
	}

	if req.Amount <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "充值金额必须大于0"})
	}

	user := middleware.GetCurrentUser(c)

	tx := database.DB.Begin()

	var wallet models.Wallet
	if err := tx.Where("member_id = ?", memberID).First(&wallet).Error; err != nil {
		wallet = models.Wallet{
			MemberID:      memberID,
			Balance:       0,
			TotalRecharged: 0,
		}
		tx.Create(&wallet)
	}

	oldBalance := wallet.Balance
	wallet.Balance += req.Amount
	wallet.TotalRecharged += req.Amount
	wallet.UpdatedAt = time.Now()

	if err := tx.Save(&wallet).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": "充值失败"})
	}

	record := models.WalletRecord{
		WalletID:      wallet.ID,
		MemberID:      memberID,
		Type:          "充值",
		Amount:        req.Amount,
		BalanceBefore: oldBalance,
		BalanceAfter:  wallet.Balance,
		OperatorID:    user.ID,
		Remark:        req.Remark,
		CreatedAt:     time.Now(),
	}

	if err := tx.Create(&record).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": "创建充值记录失败"})
	}

	middleware.CreateAuditLog(c, "储值充值", "wallet", wallet.ID, "", "+"+string(rune(req.Amount)), nil, &memberID)

	tx.Commit()

	return c.JSON(fiber.Map{
		"wallet": wallet,
		"record": record,
	})
}

func ListWalletRecords(c *fiber.Ctx) error {
	memberIDStr := c.Params("memberId")
	memberID, err := uuid.Parse(memberIDStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "无效的会员ID"})
	}

	var wallet models.Wallet
	if err := database.DB.Where("member_id = ?", memberID).First(&wallet).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "钱包不存在"})
	}

	var records []models.WalletRecord
	result := database.DB.Where("wallet_id = ?", wallet.ID).Order("created_at DESC").Find(&records)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "查询交易记录失败"})
	}

	return c.JSON(fiber.Map{
		"wallet":  wallet,
		"records": records,
	})
}
