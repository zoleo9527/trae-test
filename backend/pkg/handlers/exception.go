package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"golf-range/pkg/database"
	"golf-range/pkg/middleware"
	"golf-range/pkg/models"
)

func CreateException(c *fiber.Ctx) error {
	bookingIDStr := c.Params("id")
	bookingID, err := uuid.Parse(bookingIDStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "无效的预约ID"})
	}

	var req models.ExceptionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "请求格式错误"})
	}

	user := middleware.GetCurrentUser(c)

	var booking models.Booking
	if err := database.DB.Where("id = ?", bookingID).First(&booking).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "预约不存在"})
	}

	exception := models.Exception{
		BookingID:      bookingID,
		ReportedByID: user.ID,
		ReportedByName: user.Name,
		Type:         models.ExceptionType(req.Type),
		Severity:    models.ExceptionSeverity(req.Severity),
		Status:       models.ExceptionStatusOpen,
		Title:        req.Title,
		Description:  req.Description,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	tx := database.DB.Begin()
	if err := tx.Create(&exception).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": "创建异常单失败"})
	}

	booking.Status = models.BookingStatusException
	booking.UpdatedAt = time.Now()
	if err := tx.Save(&booking).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": "更新预约状态失败"})
	}

	middleware.CreateAuditLog(c, "创建异常单", "exception", exception.ID, "无", req.Title, &bookingID, &booking.MemberID)

	tx.Commit()

	var fullException models.Exception
	database.DB.Preload("FollowUps").Where("id = ?", exception.ID).First(&fullException)

	return c.JSON(fullException)
}

func ListBookingExceptions(c *fiber.Ctx) error {
	bookingIDStr := c.Params("id")
	bookingID, err := uuid.Parse(bookingIDStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "无效的预约ID"})
	}

	var exceptions []models.Exception
	result := database.DB.Preload("FollowUps").Where("booking_id = ?", bookingID).Order("created_at DESC").Find(&exceptions)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "查询异常单失败"})
	}

	return c.JSON(exceptions)
}

func ResolveException(c *fiber.Ctx) error {
	exceptionIDStr := c.Params("exceptionId")
	exceptionID, err := uuid.Parse(exceptionIDStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "无效的异常单ID"})
	}

	var req models.ResolveExceptionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "请求格式错误"})
	}

	user := middleware.GetCurrentUser(c)

	var exception models.Exception
	if err := database.DB.Where("id = ?", exceptionID).First(&exception).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "异常单不存在"})
	}

	oldStatus := exception.Status

	tx := database.DB.Begin()

	if req.RefundAmount > 0 || req.PenaltyAmount > 0 {
		var wallet models.Wallet
		if err := tx.Where("member_id = ?", exception.ID).First(&wallet).Error; err == nil {
			oldBalance := wallet.Balance

			if req.RefundAmount > 0 {
				wallet.Balance += req.RefundAmount

				refundRecord := models.WalletRecord{
					WalletID:      wallet.ID,
					MemberID:      wallet.MemberID,
					BookingID:     &exception.BookingID,
					Type:            "退款",
					Amount:          req.RefundAmount,
					BalanceBefore: oldBalance,
					BalanceAfter:  wallet.Balance,
					OperatorID:    user.ID,
					Remark:          "异常退款: " + exception.Title,
					CreatedAt:       time.Now(),
				}
				tx.Create(&refundRecord)
				oldBalance = wallet.Balance
			}

			if req.PenaltyAmount > 0 {
				wallet.Balance -= req.PenaltyAmount

				penaltyRecord := models.WalletRecord{
					WalletID:      wallet.ID,
					MemberID:      wallet.MemberID,
					BookingID:     &exception.BookingID,
					Type:            "违约金",
					Amount:          -req.PenaltyAmount,
					BalanceBefore: oldBalance,
					BalanceAfter:  wallet.Balance,
					OperatorID:    user.ID,
					Remark:          "违约金: " + exception.Title,
					CreatedAt:       time.Now(),
				}
				tx.Create(&penaltyRecord)
			}

			wallet.UpdatedAt = time.Now()
			tx.Save(&wallet)
		}
	}

	now := time.Now()
	exception.Status = models.ExceptionStatus(req.Status)
	exception.Resolution = req.Resolution
	exception.RefundAmount = req.RefundAmount
	exception.PenaltyAmount = req.PenaltyAmount
	exception.ResolvedByID = &user.ID
	exception.ResolvedByName = user.Name
	exception.ResolvedAt = &now
	exception.UpdatedAt = now

	if err := tx.Save(&exception).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": "处理异常单失败"})
	}

	followUp := models.ExceptionFollowUp{
		ExceptionID: exception.ID,
		OperatorID:  user.ID,
		OperatorName: user.Name,
		Note:        "处理结果: " + req.Resolution,
		CreatedAt:   time.Now(),
	}
	tx.Create(&followUp)

	middleware.CreateAuditLog(c, "处理异常单", "exception", exception.ID, string(oldStatus), string(exception.Status), &exception.BookingID, nil)

	tx.Commit()

	return c.JSON(exception)
}

func AddExceptionFollowUp(c *fiber.Ctx) error {
	exceptionIDStr := c.Params("exceptionId")
	exceptionID, err := uuid.Parse(exceptionIDStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "无效的异常单ID"})
	}

	var req models.FollowUpRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "请求格式错误"})
	}

	user := middleware.GetCurrentUser(c)

	followUp := models.ExceptionFollowUp{
		ExceptionID: exceptionID,
		OperatorID:  user.ID,
		OperatorName: user.Name,
		Note:        req.Note,
		CreatedAt:   time.Now(),
	}

	if err := database.DB.Create(&followUp).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "添加跟进失败"})
	}

	return c.JSON(followUp)
}
