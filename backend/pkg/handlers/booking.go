package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"golf-range/pkg/database"
	"golf-range/pkg/middleware"
	"golf-range/pkg/models"
)

func ListBookings(c *fiber.Ctx) error {
	status := c.Query("status")
	date := c.Query("date")

	var bookings []models.Booking
	query := database.DB.Preload("Member").Preload("Bay").Preload("Coach").
		Preload("Exceptions").Preload("EquipmentRentals").Preload("WalletRecords").
		Preload("AuditLogs").Order("created_at DESC")

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if date != "" {
		parsedDate, err := time.Parse("2006-01-02", date)
		if err == nil {
			startOfDay := time.Date(parsedDate.Year(), parsedDate.Month(), parsedDate.Day(), 0, 0, 0, 0, parsedDate.Location())
			endOfDay := startOfDay.AddDate(0, 0, 1)
			query = query.Where("start_at >= ? AND start_at < ?", startOfDay, endOfDay)
		}
	}

	result := query.Find(&bookings)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "查询预约失败"})
	}

	return c.JSON(bookings)
}

func GetBooking(c *fiber.Ctx) error {
	id := c.Params("id")
	bookingID, err := uuid.Parse(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "无效的预约ID"})
	}

	var booking models.Booking
	result := database.DB.Preload("Member").Preload("Bay").Preload("Coach").
		Preload("Exceptions.FollowUps").Preload("EquipmentRentals").Preload("WalletRecords").
		Preload("AuditLogs").Where("id = ?", bookingID).First(&booking)

	if result.Error != nil {
		return c.Status(404).JSON(fiber.Map{"error": "预约不存在"})
	}

	return c.JSON(booking)
}

func CreateBooking(c *fiber.Ctx) error {
	var req models.CreateBookingRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "请求格式错误"})
	}

	user := middleware.GetCurrentUser(c)
	memberID, err := uuid.Parse(req.MemberID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "无效的会员ID"})
	}

	bayID, err := uuid.Parse(req.BayID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "无效的打位ID"})
	}

	var member models.Member
	if err := database.DB.Where("id = ?", memberID).First(&member).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "会员不存在"})
	}

	var bay models.Bay
	if err := database.DB.Where("id = ?", bayID).First(&bay).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "打位不存在"})
	}

	duration := req.EndAt.Sub(req.StartAt).Hours()
	totalAmount := bay.HourlyRate * duration
	if req.IncludeCoaching {
		totalAmount += 200 * duration
	}

	var coachID *uuid.UUID
	var coachName string
	if req.CoachID != "" {
		parsedCoachID, err := uuid.Parse(req.CoachID)
		if err == nil {
			var coach models.User
			if err := database.DB.Where("id = ?", parsedCoachID).First(&coach).Error; err == nil {
				coachID = &parsedCoachID
				coachName = coach.Name
			}
		}
	}

	booking := models.Booking{
		MemberID:        memberID,
		BayID:           bayID,
		CoachID:         coachID,
		MemberName:      member.Name,
		MemberPhone:     member.Phone,
		BayNumber:       bay.BayNumber,
		CoachName:       coachName,
		StartAt:         req.StartAt,
		EndAt:           req.EndAt,
		DurationHours:   duration,
		Status:          models.BookingStatusConfirmed,
		TotalAmount:     totalAmount,
		PaidAmount:      0,
		PaymentMethod:   req.PaymentMethod,
		GuestCount:      req.GuestCount,
		IncludeCoaching: req.IncludeCoaching,
		Remark:          req.Remark,
		OperatorID:      user.ID,
		OperatorName:    user.Name,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	tx := database.DB.Begin()
	if err := tx.Create(&booking).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": "创建预约失败"})
	}

	if req.PaymentMethod == "wallet" {
		var wallet models.Wallet
		if err := tx.Where("member_id = ?", memberID).First(&wallet).Error; err != nil {
			tx.Rollback()
			return c.Status(400).JSON(fiber.Map{"error": "会员钱包不存在"})
		}

		if wallet.Balance < totalAmount {
			tx.Rollback()
			return c.Status(400).JSON(fiber.Map{
				"error": "余额不足",
				"details": fiber.Map{
					"balance": wallet.Balance,
					"required": totalAmount,
				},
			})
		}

		oldBalance := wallet.Balance
		wallet.Balance -= totalAmount
		wallet.UpdatedAt = time.Now()
		if err := tx.Save(&wallet).Error; err != nil {
			tx.Rollback()
			return c.Status(500).JSON(fiber.Map{"error": "扣款失败"})
		}

		walletRecord := models.WalletRecord{
			WalletID:      wallet.ID,
			MemberID:      memberID,
			BookingID:     &booking.ID,
			Type:          "消费",
			Amount:        -totalAmount,
			BalanceBefore: oldBalance,
			BalanceAfter:  wallet.Balance,
			OperatorID:    user.ID,
			Remark:        "预约消费: " + bay.BayNumber + " " + duration + "小时",
			CreatedAt:     time.Now(),
		}
		if err := tx.Create(&walletRecord).Error; err != nil {
			tx.Rollback()
			return c.Status(500).JSON(fiber.Map{"error": "创建消费记录失败"})
		}

		booking.PaidAmount = totalAmount
		tx.Save(&booking)
	}

	auditLog := models.AuditLog{
		BookingID:  &booking.ID,
		MemberID:   &memberID,
		UserID:     user.ID,
		UserName:   user.Name,
		Action:     "创建预约",
		EntityType: "booking",
		EntityID:   booking.ID,
		NewValue:   booking.BayNumber + " " + booking.StartAt.Format("15:04") + "-" + booking.EndAt.Format("15:04"),
		CreatedAt:  time.Now(),
	}
	tx.Create(&auditLog)

	tx.Commit()

	var fullBooking models.Booking
	database.DB.Preload("Member").Preload("Bay").Preload("Coach").
		Where("id = ?", booking.ID).First(&fullBooking)

	return c.JSON(fullBooking)
}

func CheckInBooking(c *fiber.Ctx) error {
	id := c.Params("id")
	bookingID, err := uuid.Parse(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "无效的预约ID"})
	}

	user := middleware.GetCurrentUser(c)

	var booking models.Booking
	if err := database.DB.Where("id = ?", bookingID).First(&booking).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "预约不存在"})
	}

	oldStatus := booking.Status
	now := time.Now()
	booking.Status = models.BookingStatusCheckedIn
	booking.CheckInTime = &now
	booking.UpdatedAt = now

	if err := database.DB.Save(&booking).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "签到失败"})
	}

	middleware.CreateAuditLog(c, "签到", "booking", booking.ID, string(oldStatus), string(booking.Status), &booking.ID, &booking.MemberID)

	return c.JSON(booking)
}

func CheckOutBooking(c *fiber.Ctx) error {
	id := c.Params("id")
	bookingID, err := uuid.Parse(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "无效的预约ID"})
	}

	user := middleware.GetCurrentUser(c)

	var booking models.Booking
	if err := database.DB.Where("id = ?", bookingID).First(&booking).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "预约不存在"})
	}

	oldStatus := booking.Status
	now := time.Now()
	booking.Status = models.BookingStatusCompleted
	booking.CheckOutTime = &now
	booking.UpdatedAt = now

	var overstayMinutes int
	if now.After(booking.EndAt) {
		overstayMinutes = int(now.Sub(booking.EndAt).Minutes())
	}

	tx := database.DB.Begin()
	if err := tx.Save(&booking).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": "签出失败"})
	}

	var member models.Member
	tx.Where("id = ?", booking.MemberID).First(&member)
	member.TotalVisits++
	member.TotalSpent += booking.PaidAmount
	tx.Save(&member)

	middleware.CreateAuditLog(c, "签出", "booking", booking.ID, string(oldStatus), string(booking.Status), &booking.ID, &booking.MemberID)

	tx.Commit()

	response := fiber.Map{
		"booking":         booking,
		"overstayMinutes": overstayMinutes,
	}

	if overstayMinutes > 15 {
		response["warning"] = "超时超过15分钟，请确认是否需要创建异常单"
	}

	return c.JSON(response)
}

func ListMembers(c *fiber.Ctx) error {
	var members []models.Member
	result := database.DB.Preload("Wallet").Find(&members)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "查询会员失败"})
	}
	return c.JSON(members)
}
