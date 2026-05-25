package handlers

import (
	"gallery-system/database"
	"gallery-system/middleware"
	"gallery-system/models"
	"gallery-system/utils"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
)

type CreateTicketRequest struct {
	Type          models.TicketType `json:"type"`
	Price         float64           `json:"price"`
	VisitorName   string            `json:"visitor_name"`
	VisitorPhone  string            `json:"visitor_phone"`
	VisitorIDCard string            `json:"visitor_id_card"`
	VisitDate     time.Time         `json:"visit_date"`
	Channel       string            `json:"channel"`
	OrderNo       string            `json:"order_no"`
	MemberID      *uint             `json:"member_id"`
	ActivityID    *uint             `json:"activity_id"`
}

type VerifyTicketRequest struct {
	QrCode  string `json:"qr_code"`
	Station string `json:"station"`
}

func CreateTicket(c *fiber.Ctx) error {
	claims := middleware.GetCurrentUser(c)

	var req CreateTicketRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "参数错误", err.Error())
	}

	now := time.Now()
	visitDate := req.VisitDate
	if visitDate.IsZero() {
		visitDate = now
	}

	ticket := models.Ticket{
		Type:          req.Type,
		Price:         req.Price,
		OriginalPrice: req.Price,
		VisitorName:   req.VisitorName,
		VisitorPhone:  req.VisitorPhone,
		VisitorIDCard: req.VisitorIDCard,
		VisitDate:     visitDate,
		ValidFrom:     visitDate,
		ValidTo:       visitDate.Add(24 * time.Hour),
		Status:        models.TicketStatusIssued,
		Channel:       req.Channel,
		OrderNo:       req.OrderNo,
		MemberID:      req.MemberID,
		ActivityID:    req.ActivityID,
		IssuedBy:      claims.UserID,
		IssuedAt:      now,
	}

	if err := database.DB.Create(&ticket).Error; err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "创建票务失败", err.Error())
	}

	_ = utils.CreateAuditLog(
		"ticket", "create", "ticket", &ticket.ID, ticket.TicketNo,
		claims.UserID, claims.Username, claims.Role, nil, ticket,
		c.IP(), c.Get("User-Agent"), "",
	)

	return utils.JSONResponse(c, fiber.StatusCreated, true, "票务创建成功", ticket)
}

func GetTicket(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID格式错误", err.Error())
	}

	var ticket models.Ticket
	if err := database.DB.Preload("Issuer").Preload("Verifier").
		First(&ticket, id).Error; err != nil {
		return utils.JSONError(c, fiber.StatusNotFound, "票务不存在", err.Error())
	}

	return utils.JSONResponse(c, fiber.StatusOK, true, "", ticket)
}

func GetTicketList(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "20"))
	status := c.Query("status")
	ticketType := c.Query("type")
	visitorPhone := c.Query("visitor_phone")
	ticketNo := c.Query("ticket_no")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	offset := (page - 1) * pageSize

	query := database.DB.Model(&models.Ticket{})

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if ticketType != "" {
		query = query.Where("type = ?", ticketType)
	}
	if visitorPhone != "" {
		query = query.Where("visitor_phone LIKE ?", "%"+visitorPhone+"%")
	}
	if ticketNo != "" {
		query = query.Where("ticket_no LIKE ?", "%"+ticketNo+"%")
	}
	if startDate != "" {
		query = query.Where("created_at >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("created_at <= ?", endDate)
	}

	var total int64
	query.Count(&total)

	var tickets []models.Ticket
	if err := query.Preload("Issuer").Preload("Verifier").
		Order("created_at DESC").
		Offset(offset).Limit(pageSize).
		Find(&tickets).Error; err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "查询失败", err.Error())
	}

	return utils.PaginatedResult(c, tickets, page, pageSize, total)
}

func VerifyTicket(c *fiber.Ctx) error {
	claims := middleware.GetCurrentUser(c)

	var req VerifyTicketRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "参数错误", err.Error())
	}

	if req.QrCode == "" {
		return utils.JSONError(c, fiber.StatusBadRequest, "请提供二维码", "")
	}

	tx := database.DB.Begin()

	var ticket models.Ticket
	if err := tx.Set("gorm:query_option", "FOR UPDATE").
		Where("qr_code = ?", req.QrCode).First(&ticket).Error; err != nil {
		tx.Rollback()
		_ = utils.CreateAuditLog(
			"ticket", "verify_failed", "ticket", nil, "",
			claims.UserID, claims.Username, claims.Role, nil, nil,
			c.IP(), c.Get("User-Agent"), "票务不存在: "+req.QrCode,
		)
		return utils.JSONError(c, fiber.StatusNotFound, "票务不存在", err.Error())
	}

	oldStatus := ticket.Status
	verifyStatus := models.VerifyStatusNormal
	message := "核销成功"
	now := time.Now()

	switch ticket.Status {
	case models.TicketStatusVerified:
		verifyStatus = models.VerifyStatusWarning
		message = "该票已核销过"
	case models.TicketStatusExpired:
		verifyStatus = models.VerifyStatusError
		message = "该票已过期"
	case models.TicketStatusRefunded:
		verifyStatus = models.VerifyStatusError
		message = "该票已退款"
	case models.TicketStatusVoid:
		verifyStatus = models.VerifyStatusError
		message = "该票已作废"
	}

	if now.After(ticket.ValidTo) {
		verifyStatus = models.VerifyStatusError
		message = "该票已超出有效期"
	}

	var newStatus models.TicketStatus
	if verifyStatus == models.VerifyStatusNormal {
		newStatus = models.TicketStatusVerified
		ticket.Status = newStatus
		ticket.VerifiedBy = &claims.UserID
		ticket.VerifiedAt = &now
		ticket.VerifyStation = req.Station

		if err := tx.Save(&ticket).Error; err != nil {
			tx.Rollback()
			return utils.JSONError(c, fiber.StatusInternalServerError, "核销失败", err.Error())
		}
	} else {
		newStatus = oldStatus
	}

	verifyLog := models.TicketVerifyLog{
		TicketID:     ticket.ID,
		TicketNo:     ticket.TicketNo,
		OperatorID:   claims.UserID,
		OperatorName: claims.Username,
		Station:      req.Station,
		VerifyStatus: verifyStatus,
		Message:      message,
		BeforeStatus: oldStatus,
		AfterStatus:  newStatus,
		ClientIP:     c.IP(),
		UserAgent:    c.Get("User-Agent"),
		CreatedAt:    now,
	}
	tx.Create(&verifyLog)

	tx.Commit()

	_ = utils.CreateAuditLog(
		"ticket", "verify", "ticket", &ticket.ID, ticket.TicketNo,
		claims.UserID, claims.Username, claims.Role, oldStatus, ticket.Status,
		c.IP(), c.Get("User-Agent"), message,
	)

	if verifyStatus != models.VerifyStatusNormal {
		return utils.JSONResponse(c, fiber.StatusOK, false, message, fiber.Map{
			"verify_status": verifyStatus,
			"ticket":        ticket,
		})
	}

	return utils.JSONResponse(c, fiber.StatusOK, true, message, fiber.Map{
		"verify_status": verifyStatus,
		"ticket":        ticket,
	})
}

func GetTicketVerifyLogs(c *fiber.Ctx) error {
	ticketID, _ := strconv.ParseUint(c.Params("id"), 10, 32)
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "20"))
	offset := (page - 1) * pageSize

	query := database.DB.Model(&models.TicketVerifyLog{})
	if ticketID > 0 {
		query = query.Where("ticket_id = ?", ticketID)
	}

	var total int64
	query.Count(&total)

	var logs []models.TicketVerifyLog
	if err := query.Preload("Ticket").Preload("Operator").
		Order("created_at DESC").
		Offset(offset).Limit(pageSize).
		Find(&logs).Error; err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "查询失败", err.Error())
	}

	return utils.PaginatedResult(c, logs, page, pageSize, total)
}

func UpdateTicketStatus(c *fiber.Ctx) error {
	claims := middleware.GetCurrentUser(c)
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID格式错误", err.Error())
	}

	var req struct {
		Status models.TicketStatus `json:"status"`
		Reason string              `json:"reason"`
	}

	if err := c.BodyParser(&req); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "参数错误", err.Error())
	}

	var ticket models.Ticket
	if err := database.DB.First(&ticket, id).Error; err != nil {
		return utils.JSONError(c, fiber.StatusNotFound, "票务不存在", err.Error())
	}

	oldStatus := ticket.Status
	ticket.Status = req.Status

	if err := database.DB.Save(&ticket).Error; err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "更新失败", err.Error())
	}

	_ = utils.CreateAuditLog(
		"ticket", "update_status", "ticket", &ticket.ID, ticket.TicketNo,
		claims.UserID, claims.Username, claims.Role, oldStatus, req.Status,
		c.IP(), c.Get("User-Agent"), req.Reason,
	)

	return utils.JSONResponse(c, fiber.StatusOK, true, "状态更新成功", ticket)
}

func GetTicketStatistics(c *fiber.Ctx) error {
	startDate := c.Query("start_date", time.Now().Format("2006-01-02"))
	endDate := c.Query("end_date", time.Now().Format("2006-01-02"))

	var stats struct {
		TotalIssued    int64   `json:"total_issued"`
		TotalVerified  int64   `json:"total_verified"`
		TotalAmount    float64 `json:"total_amount"`
		TodayIssued    int64   `json:"today_issued"`
		TodayVerified  int64   `json:"today_verified"`
	}

	database.DB.Model(&models.Ticket{}).
		Where("created_at BETWEEN ? AND ?", startDate, endDate+" 23:59:59").
		Count(&stats.TotalIssued)

	database.DB.Model(&models.Ticket{}).
		Where("status = ? AND verified_at BETWEEN ? AND ?", models.TicketStatusVerified, startDate, endDate+" 23:59:59").
		Count(&stats.TotalVerified)

	database.DB.Model(&models.Ticket{}).
		Where("created_at BETWEEN ? AND ?", startDate, endDate+" 23:59:59").
		Select("COALESCE(SUM(price), 0)").Scan(&stats.TotalAmount)

	today := time.Now().Format("2006-01-02")
	database.DB.Model(&models.Ticket{}).
		Where("DATE(created_at) = ?", today).
		Count(&stats.TodayIssued)

	database.DB.Model(&models.Ticket{}).
		Where("status = ? AND DATE(verified_at) = ?", models.TicketStatusVerified, today).
		Count(&stats.TodayVerified)

	return utils.JSONResponse(c, fiber.StatusOK, true, "", stats)
}
