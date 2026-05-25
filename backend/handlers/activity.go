package handlers

import (
	"encoding/json"
	"gallery-system/database"
	"gallery-system/middleware"
	"gallery-system/models"
	"gallery-system/utils"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
)

type CreateActivityRequest struct {
	Title             string    `json:"title"`
	Type              string    `json:"type"`
	Description       string    `json:"description"`
	Location          string    `json:"location"`
	StartDate         time.Time `json:"start_date"`
	EndDate           time.Time `json:"end_date"`
	RegistrationStart time.Time `json:"registration_start"`
	RegistrationEnd   time.Time `json:"registration_end"`
	MaxParticipants   int       `json:"max_participants"`
	MinParticipants   int       `json:"min_participants"`
	IsMemberOnly      bool      `json:"is_member_only"`
	RequiresTicket    bool      `json:"requires_ticket"`
	TicketPrice       float64   `json:"ticket_price"`
	ManagedBy         *uint     `json:"managed_by"`
}

type CreateRegistrationRequest struct {
	MemberID     *uint  `json:"member_id"`
	MemberName   string `json:"member_name"`
	MemberPhone  string `json:"member_phone"`
	MemberEmail  string `json:"member_email"`
	Participants int    `json:"participants"`
	TicketID     *uint  `json:"ticket_id"`
	TicketNo     string `json:"ticket_no"`
}

func CreateActivity(c *fiber.Ctx) error {
	claims := middleware.GetCurrentUser(c)

	var req CreateActivityRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "参数错误", err.Error())
	}

	activity := models.Activity{
		Title:             req.Title,
		Type:              req.Type,
		Description:       req.Description,
		Location:          req.Location,
		StartDate:         req.StartDate,
		EndDate:           req.EndDate,
		RegistrationStart: req.RegistrationStart,
		RegistrationEnd:   req.RegistrationEnd,
		MaxParticipants:   req.MaxParticipants,
		MinParticipants:   req.MinParticipants,
		IsMemberOnly:      req.IsMemberOnly,
		RequiresTicket:    req.RequiresTicket,
		TicketPrice:       req.TicketPrice,
		Status:            models.ActivityDraft,
		CheckinStatus:     models.CheckinNotStarted,
		CreatedBy:         claims.UserID,
		ManagedBy:         req.ManagedBy,
	}

	if err := database.DB.Create(&activity).Error; err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "创建活动失败", err.Error())
	}

	_ = utils.CreateAuditLog(
		"activity", "create", "activity", &activity.ID, activity.ActivityNo,
		claims.UserID, claims.Username, claims.Role, nil, activity,
		c.IP(), c.Get("User-Agent"), "",
	)

	return utils.JSONResponse(c, fiber.StatusCreated, true, "活动创建成功", activity)
}

func GetActivity(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID格式错误", err.Error())
	}

	var activity models.Activity
	if err := database.DB.Preload("Creator").Preload("Manager").Preload("Approver").
		First(&activity, id).Error; err != nil {
		return utils.JSONError(c, fiber.StatusNotFound, "活动不存在", err.Error())
	}

	return utils.JSONResponse(c, fiber.StatusOK, true, "", activity)
}

func GetActivityList(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "20"))
	status := c.Query("status")
	activityType := c.Query("type")
	title := c.Query("title")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	offset := (page - 1) * pageSize

	query := database.DB.Model(&models.Activity{})

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if activityType != "" {
		query = query.Where("type = ?", activityType)
	}
	if title != "" {
		query = query.Where("title LIKE ?", "%"+title+"%")
	}
	if startDate != "" {
		query = query.Where("start_date >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("end_date <= ?", endDate)
	}

	var total int64
	query.Count(&total)

	var activities []models.Activity
	if err := query.Preload("Creator").Preload("Manager").
		Order("created_at DESC").
		Offset(offset).Limit(pageSize).
		Find(&activities).Error; err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "查询失败", err.Error())
	}

	return utils.PaginatedResult(c, activities, page, pageSize, total)
}

func UpdateActivityStatus(c *fiber.Ctx) error {
	claims := middleware.GetCurrentUser(c)
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID格式错误", err.Error())
	}

	var req struct {
		Status models.ActivityStatus `json:"status"`
		Remark string                `json:"remark"`
	}

	if err := c.BodyParser(&req); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "参数错误", err.Error())
	}

	var activity models.Activity
	if err := database.DB.First(&activity, id).Error; err != nil {
		return utils.JSONError(c, fiber.StatusNotFound, "活动不存在", err.Error())
	}

	oldStatus := activity.Status
	activity.Status = req.Status

	if req.Status == models.ActivityPublished {
		now := time.Now()
		activity.ApprovedBy = &claims.UserID
		activity.ApprovedAt = &now
	}

	if err := database.DB.Save(&activity).Error; err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "更新失败", err.Error())
	}

	beforeData, _ := json.Marshal(fiber.Map{"status": oldStatus})
	afterData, _ := json.Marshal(fiber.Map{"status": req.Status})

	auditLog := models.ActivityAuditLog{
		ActivityID:   activity.ID,
		Action:       "update_status",
		OperatorID:   claims.UserID,
		OperatorName: claims.Username,
		BeforeData:   string(beforeData),
		AfterData:    string(afterData),
		Remark:       req.Remark,
		CreatedAt:    time.Now(),
	}
	database.DB.Create(&auditLog)

	_ = utils.CreateAuditLog(
		"activity", "update_status", "activity", &activity.ID, activity.ActivityNo,
		claims.UserID, claims.Username, claims.Role, oldStatus, req.Status,
		c.IP(), c.Get("User-Agent"), req.Remark,
	)

	return utils.JSONResponse(c, fiber.StatusOK, true, "状态更新成功", activity)
}

func CreateRegistration(c *fiber.Ctx) error {
	claims := middleware.GetCurrentUser(c)
	activityID, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "活动ID格式错误", err.Error())
	}

	tx := database.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var activity models.Activity
	if err := tx.First(&activity, activityID).Error; err != nil {
		tx.Rollback()
		return utils.JSONError(c, fiber.StatusNotFound, "活动不存在", err.Error())
	}

	if activity.Status != models.ActivityPublished {
		tx.Rollback()
		return utils.JSONError(c, fiber.StatusBadRequest, "活动未发布，无法报名", "")
	}

	now := time.Now()
	if now.Before(activity.RegistrationStart) {
		tx.Rollback()
		return utils.JSONError(c, fiber.StatusBadRequest, "报名尚未开始", "")
	}
	if now.After(activity.RegistrationEnd) {
		tx.Rollback()
		return utils.JSONError(c, fiber.StatusBadRequest, "报名已结束", "")
	}

	var req CreateRegistrationRequest
	if err := c.BodyParser(&req); err != nil {
		tx.Rollback()
		return utils.JSONError(c, fiber.StatusBadRequest, "参数错误", err.Error())
	}

	if activity.IsMemberOnly {
		if req.MemberID == nil {
			tx.Rollback()
			return utils.JSONError(c, fiber.StatusBadRequest, "该活动仅限会员参加，请提供会员ID", "")
		}
		var member models.User
		if err := tx.Where("id = ? AND status = ?", *req.MemberID, "active").First(&member).Error; err != nil {
			tx.Rollback()
			return utils.JSONError(c, fiber.StatusBadRequest, "会员不存在或已失效", "")
		}
	}

	var ticket *models.Ticket
	if activity.RequiresTicket {
		if req.TicketID == nil && req.TicketNo == "" {
			tx.Rollback()
			return utils.JSONError(c, fiber.StatusBadRequest, "该活动需要购票，请提供票据ID或票号", "")
		}

		ticket = &models.Ticket{}
		ticketQuery := tx.Set("gorm:query_option", "FOR UPDATE")
		if req.TicketID != nil {
			ticketQuery = ticketQuery.Where("id = ?", *req.TicketID)
		} else {
			ticketQuery = ticketQuery.Where("ticket_no = ?", req.TicketNo)
		}
		if err := ticketQuery.First(ticket).Error; err != nil {
			tx.Rollback()
			return utils.JSONError(c, fiber.StatusBadRequest, "票据不存在", "")
		}

		if ticket.ActivityID != nil && *ticket.ActivityID != activity.ID {
			tx.Rollback()
			return utils.JSONError(c, fiber.StatusBadRequest, "该票据不属于此活动", "")
		}

		if ticket.Status != models.TicketStatusIssued {
			tx.Rollback()
			return utils.JSONError(c, fiber.StatusBadRequest, "票据状态异常，当前状态: "+string(ticket.Status), "")
		}

		if now.After(ticket.ValidTo) {
			tx.Rollback()
			return utils.JSONError(c, fiber.StatusBadRequest, "票据已过期", "")
		}
	}

	var registeredCount int64
	tx.Model(&models.ActivityRegistration{}).
		Where("activity_id = ? AND status IN ?", activityID, []string{string(models.RegistrationConfirmed), string(models.RegistrationPending)}).
		Count(&registeredCount)

	status := models.RegistrationPending
	if activity.MaxParticipants > 0 && int(registeredCount)+req.Participants > activity.MaxParticipants {
		status = models.RegistrationWaitlist
	}

	var ticketID *uint
	if ticket != nil {
		ticketID = &ticket.ID
		ticket.Status = models.TicketStatusVerified
		ticket.VerifiedBy = &claims.UserID
		ticket.VerifiedAt = &now
		ticket.VerifyStation = "activity-registration"
		if err := tx.Save(ticket).Error; err != nil {
			tx.Rollback()
			return utils.JSONError(c, fiber.StatusInternalServerError, "票据核销失败", err.Error())
		}

		verifyLog := models.TicketVerifyLog{
			TicketID:     ticket.ID,
			TicketNo:     ticket.TicketNo,
			OperatorID:   claims.UserID,
			OperatorName: claims.Username,
			Station:      "activity-registration",
			VerifyStatus: models.VerifyStatusNormal,
			Message:      "活动报名核销",
			BeforeStatus: models.TicketStatusIssued,
			AfterStatus:  models.TicketStatusVerified,
			ClientIP:     c.IP(),
			UserAgent:    c.Get("User-Agent"),
			CreatedAt:    now,
		}
		tx.Create(&verifyLog)
	}

	registration := models.ActivityRegistration{
		ActivityID:   uint(activityID),
		MemberID:     req.MemberID,
		MemberName:   req.MemberName,
		MemberPhone:  req.MemberPhone,
		MemberEmail:  req.MemberEmail,
		Participants: req.Participants,
		Status:       status,
		TicketID:     ticketID,
		RegisteredBy: claims.UserID,
		RegisteredAt: now,
	}

	if err := tx.Create(&registration).Error; err != nil {
		tx.Rollback()
		return utils.JSONError(c, fiber.StatusInternalServerError, "报名失败", err.Error())
	}

	beforeData, _ := json.Marshal(nil)
	afterData, _ := json.Marshal(registration)
	activityAudit := models.ActivityAuditLog{
		ActivityID:     activity.ID,
		RegistrationID: &registration.ID,
		Action:         "create_registration",
		OperatorID:     claims.UserID,
		OperatorName:   claims.Username,
		BeforeData:     string(beforeData),
		AfterData:      string(afterData),
		Remark:         "活动报名",
		CreatedAt:      now,
	}
	tx.Create(&activityAudit)

	tx.Commit()

	_ = utils.CreateAuditLog(
		"activity", "registration", "registration", &registration.ID, registration.RegistrationNo,
		claims.UserID, claims.Username, claims.Role, nil, registration,
		c.IP(), c.Get("User-Agent"), "",
	)

	if ticket != nil {
		_ = utils.CreateAuditLog(
			"ticket", "verify_by_activity", "ticket", &ticket.ID, ticket.TicketNo,
			claims.UserID, claims.Username, claims.Role, models.TicketStatusIssued, models.TicketStatusVerified,
			c.IP(), c.Get("User-Agent"), "活动报名自动核销: "+activity.Title,
		)
	}

	return utils.JSONResponse(c, fiber.StatusCreated, true, "报名成功", fiber.Map{
		"registration": registration,
		"ticket_used":  ticket != nil,
	})
}

func GetRegistrationList(c *fiber.Ctx) error {
	activityID, _ := strconv.ParseUint(c.Params("id"), 10, 32)
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "20"))
	status := c.Query("status")
	memberName := c.Query("member_name")
	memberPhone := c.Query("member_phone")

	offset := (page - 1) * pageSize

	query := database.DB.Model(&models.ActivityRegistration{})

	if activityID > 0 {
		query = query.Where("activity_id = ?", activityID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if memberName != "" {
		query = query.Where("member_name LIKE ?", "%"+memberName+"%")
	}
	if memberPhone != "" {
		query = query.Where("member_phone LIKE ?", "%"+memberPhone+"%")
	}

	var total int64
	query.Count(&total)

	var registrations []models.ActivityRegistration
	if err := query.Preload("Activity").Preload("Member").Preload("Checker").
		Order("created_at DESC").
		Offset(offset).Limit(pageSize).
		Find(&registrations).Error; err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "查询失败", err.Error())
	}

	return utils.PaginatedResult(c, registrations, page, pageSize, total)
}

func ConfirmRegistration(c *fiber.Ctx) error {
	claims := middleware.GetCurrentUser(c)
	regID, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "报名ID格式错误", err.Error())
	}

	tx := database.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var registration models.ActivityRegistration
	if err := tx.Preload("Activity").First(&registration, regID).Error; err != nil {
		tx.Rollback()
		return utils.JSONError(c, fiber.StatusNotFound, "报名记录不存在", err.Error())
	}

	if registration.Status != models.RegistrationPending && registration.Status != models.RegistrationWaitlist {
		tx.Rollback()
		return utils.JSONError(c, fiber.StatusBadRequest, "该报名状态无法确认", "当前状态: "+string(registration.Status))
	}

	var activity models.Activity
	if err := tx.First(&activity, registration.ActivityID).Error; err != nil {
		tx.Rollback()
		return utils.JSONError(c, fiber.StatusNotFound, "关联活动不存在", err.Error())
	}

	if activity.IsMemberOnly && registration.MemberID == nil {
		tx.Rollback()
		return utils.JSONError(c, fiber.StatusBadRequest, "会员专属活动，报名记录缺少会员信息", "")
	}

	if activity.RequiresTicket && registration.TicketID == nil {
		tx.Rollback()
		return utils.JSONError(c, fiber.StatusBadRequest, "该活动需要购票，报名记录缺少关联票据", "")
	}

	var registeredCount int64
	tx.Model(&models.ActivityRegistration{}).
		Where("activity_id = ? AND status = ?", activity.ID, models.RegistrationConfirmed).
		Count(&registeredCount)

	if activity.MaxParticipants > 0 && int(registeredCount)+registration.Participants > activity.MaxParticipants {
		tx.Rollback()
		return utils.JSONError(c, fiber.StatusBadRequest, "活动名额已满，无法确认", "")
	}

	now := time.Now()
	oldStatus := registration.Status
	registration.Status = models.RegistrationConfirmed
	registration.ConfirmedBy = &claims.UserID
	registration.ConfirmedAt = &now

	if err := tx.Save(&registration).Error; err != nil {
		tx.Rollback()
		return utils.JSONError(c, fiber.StatusInternalServerError, "确认失败", err.Error())
	}

	beforeData, _ := json.Marshal(fiber.Map{
		"status":       oldStatus,
		"ticket_id":    registration.TicketID,
		"participants": registration.Participants,
	})
	afterData, _ := json.Marshal(fiber.Map{
		"status":       models.RegistrationConfirmed,
		"ticket_id":    registration.TicketID,
		"participants": registration.Participants,
		"confirmed_by": claims.UserID,
		"confirmed_at": now,
	})

	activityAudit := models.ActivityAuditLog{
		ActivityID:     registration.ActivityID,
		RegistrationID: &registration.ID,
		Action:         "confirm_registration",
		OperatorID:     claims.UserID,
		OperatorName:   claims.Username,
		BeforeData:     string(beforeData),
		AfterData:      string(afterData),
		Remark:         "确认报名",
		CreatedAt:      now,
	}
	tx.Create(&activityAudit)

	if registration.TicketID != nil {
		var ticket models.Ticket
		if err := tx.First(&ticket, *registration.TicketID).Error; err == nil {
			_ = utils.CreateAuditLog(
				"ticket", "link_registration", "ticket", &ticket.ID, ticket.TicketNo,
				claims.UserID, claims.Username, claims.Role, nil, registration.RegistrationNo,
				c.IP(), c.Get("User-Agent"), "活动报名确认，关联票据",
			)
		}
	}

	tx.Commit()

	_ = utils.CreateAuditLog(
		"activity", "confirm_registration", "registration", &registration.ID, registration.RegistrationNo,
		claims.UserID, claims.Username, claims.Role, oldStatus, models.RegistrationConfirmed,
		c.IP(), c.Get("User-Agent"), "",
	)

	return utils.JSONResponse(c, fiber.StatusOK, true, "确认成功", fiber.Map{
		"registration": registration,
		"activity":     activity,
	})
}

func CheckinRegistration(c *fiber.Ctx) error {
	claims := middleware.GetCurrentUser(c)
	regID, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "报名ID格式错误", err.Error())
	}

	tx := database.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var registration models.ActivityRegistration
	if err := tx.Preload("Activity").First(&registration, regID).Error; err != nil {
		tx.Rollback()
		return utils.JSONError(c, fiber.StatusNotFound, "报名记录不存在", err.Error())
	}

	var activity models.Activity
	if err := tx.First(&activity, registration.ActivityID).Error; err != nil {
		tx.Rollback()
		return utils.JSONError(c, fiber.StatusNotFound, "关联活动不存在", err.Error())
	}

	if activity.CheckinStatus != models.CheckinInProgress {
		tx.Rollback()
		return utils.JSONError(c, fiber.StatusBadRequest, "活动签到未开始", "当前签到状态: "+string(activity.CheckinStatus))
	}

	if registration.Status != models.RegistrationConfirmed {
		tx.Rollback()
		return utils.JSONError(c, fiber.StatusBadRequest, "只有已确认的报名可以签到", "当前状态: "+string(registration.Status))
	}

	if registration.CheckinTime != nil {
		tx.Rollback()
		return utils.JSONError(c, fiber.StatusBadRequest, "该报名已签到", "签到时间: "+registration.CheckinTime.String())
	}

	if activity.RequiresTicket && registration.TicketID == nil {
		tx.Rollback()
		return utils.JSONError(c, fiber.StatusBadRequest, "该活动需要购票，报名记录缺少关联票据", "")
	}

	if registration.TicketID != nil {
		var ticket models.Ticket
		if err := tx.First(&ticket, *registration.TicketID).Error; err != nil {
			tx.Rollback()
			return utils.JSONError(c, fiber.StatusBadRequest, "关联票据不存在", "")
		}
		if ticket.Status != models.TicketStatusVerified {
			tx.Rollback()
			return utils.JSONError(c, fiber.StatusBadRequest, "票据状态异常", "当前状态: "+string(ticket.Status))
		}
	}

	now := time.Now()
	oldCheckinTime := registration.CheckinTime
	registration.CheckinTime = &now
	registration.CheckinBy = &claims.UserID

	if err := tx.Save(&registration).Error; err != nil {
		tx.Rollback()
		return utils.JSONError(c, fiber.StatusInternalServerError, "签到失败", err.Error())
	}

	beforeData, _ := json.Marshal(fiber.Map{
		"checkin_time": nil,
		"ticket_id":    registration.TicketID,
		"member_id":    registration.MemberID,
	})
	afterData, _ := json.Marshal(fiber.Map{
		"checkin_time": now,
		"checkin_by":   claims.UserID,
		"ticket_id":    registration.TicketID,
		"member_id":    registration.MemberID,
	})

	activityAudit := models.ActivityAuditLog{
		ActivityID:     registration.ActivityID,
		RegistrationID: &registration.ID,
		Action:         "checkin",
		OperatorID:     claims.UserID,
		OperatorName:   claims.Username,
		BeforeData:     string(beforeData),
		AfterData:      string(afterData),
		Remark:         "活动签到",
		CreatedAt:      now,
	}
	tx.Create(&activityAudit)

	if registration.TicketID != nil {
		var ticket models.Ticket
		if err := tx.First(&ticket, *registration.TicketID).Error; err == nil {
			_ = utils.CreateAuditLog(
				"ticket", "checkin", "ticket", &ticket.ID, ticket.TicketNo,
				claims.UserID, claims.Username, claims.Role, nil, registration.RegistrationNo,
				c.IP(), c.Get("User-Agent"), "活动签到，票据使用确认: "+activity.Title,
			)
		}
	}

	tx.Commit()

	_ = utils.CreateAuditLog(
		"activity", "checkin", "registration", &registration.ID, registration.RegistrationNo,
		claims.UserID, claims.Username, claims.Role, oldCheckinTime, now,
		c.IP(), c.Get("User-Agent"), "",
	)

	return utils.JSONResponse(c, fiber.StatusOK, true, "签到成功", fiber.Map{
		"registration": registration,
		"activity":     activity,
	})
}

func GetActivityAuditLogs(c *fiber.Ctx) error {
	activityID, _ := strconv.ParseUint(c.Params("id"), 10, 32)
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "20"))
	offset := (page - 1) * pageSize

	query := database.DB.Model(&models.ActivityAuditLog{})
	if activityID > 0 {
		query = query.Where("activity_id = ?", activityID)
	}

	var total int64
	query.Count(&total)

	var logs []models.ActivityAuditLog
	if err := query.Preload("Activity").Preload("Registration").Preload("Operator").
		Order("created_at DESC").
		Offset(offset).Limit(pageSize).
		Find(&logs).Error; err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "查询失败", err.Error())
	}

	return utils.PaginatedResult(c, logs, page, pageSize, total)
}

func UpdateActivityCheckinStatus(c *fiber.Ctx) error {
	claims := middleware.GetCurrentUser(c)
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID格式错误", err.Error())
	}

	var req struct {
		CheckinStatus models.CheckinStatus `json:"checkin_status"`
	}

	if err := c.BodyParser(&req); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "参数错误", err.Error())
	}

	var activity models.Activity
	if err := database.DB.First(&activity, id).Error; err != nil {
		return utils.JSONError(c, fiber.StatusNotFound, "活动不存在", err.Error())
	}

	oldStatus := activity.CheckinStatus
	activity.CheckinStatus = req.CheckinStatus

	if err := database.DB.Save(&activity).Error; err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "更新失败", err.Error())
	}

	_ = utils.CreateAuditLog(
		"activity", "update_checkin_status", "activity", &activity.ID, activity.ActivityNo,
		claims.UserID, claims.Username, claims.Role, oldStatus, req.CheckinStatus,
		c.IP(), c.Get("User-Agent"), "",
	)

	return utils.JSONResponse(c, fiber.StatusOK, true, "签到状态更新成功", activity)
}

func GetRegistrationTrace(c *fiber.Ctx) error {
	regID, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "报名ID格式错误", err.Error())
	}

	var registration models.ActivityRegistration
	if err := database.DB.Preload("Activity").Preload("Ticket").Preload("Member").
		First(&registration, regID).Error; err != nil {
		return utils.JSONError(c, fiber.StatusNotFound, "报名记录不存在", err.Error())
	}

	var ticket *models.Ticket
	var ticketVerifyLogs []models.TicketVerifyLog
	if registration.TicketID != nil {
		ticket = &models.Ticket{}
		if err := database.DB.First(ticket, *registration.TicketID).Error; err == nil {
			database.DB.Where("ticket_id = ?", ticket.ID).
				Order("created_at ASC").
				Find(&ticketVerifyLogs)
		}
	}

	var activityAuditLogs []models.ActivityAuditLog
	database.DB.Where("registration_id = ?", registration.ID).
		Preload("Operator").
		Order("created_at ASC").
		Find(&activityAuditLogs)

	var auditTraces []models.AuditLog
	database.DB.Where(`
		(resource_type = ? AND resource_id = ?) OR
		(resource_type = ? AND resource_id = ?)
	`, "registration", registration.ID, "ticket", registration.TicketID).
		Order("created_at ASC").
		Find(&auditTraces)

	return utils.JSONResponse(c, fiber.StatusOK, true, "", fiber.Map{
		"registration":       registration,
		"activity":           registration.Activity,
		"ticket":             ticket,
		"ticket_verify_logs": ticketVerifyLogs,
		"activity_audit_logs": activityAuditLogs,
		"audit_traces":       auditTraces,
	})
}

func GetActivityFullTrace(c *fiber.Ctx) error {
	activityID, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "活动ID格式错误", err.Error())
	}

	var activity models.Activity
	if err := database.DB.First(&activity, activityID).Error; err != nil {
		return utils.JSONError(c, fiber.StatusNotFound, "活动不存在", err.Error())
	}

	var registrations []models.ActivityRegistration
	database.DB.Where("activity_id = ?", activityID).
		Preload("Ticket").
		Order("created_at DESC").
		Find(&registrations)

	var activityAuditLogs []models.ActivityAuditLog
	database.DB.Where("activity_id = ?", activityID).
		Preload("Operator").
		Order("created_at ASC").
		Find(&activityAuditLogs)

	var registrationIDs []uint
	var ticketIDs []uint
	for _, r := range registrations {
		registrationIDs = append(registrationIDs, r.ID)
		if r.TicketID != nil {
			ticketIDs = append(ticketIDs, *r.TicketID)
		}
	}

	var auditTraces []models.AuditLog
	if len(registrationIDs) > 0 {
		database.DB.Where(`
			(resource_type = ? AND resource_id IN (?)) OR
			(resource_type = ? AND resource_id IN (?)) OR
			(resource_type = ? AND resource_id = ?)
		`, "registration", registrationIDs, "ticket", ticketIDs, "activity", activityID).
			Order("created_at ASC").
			Find(&auditTraces)
	}

	return utils.JSONResponse(c, fiber.StatusOK, true, "", fiber.Map{
		"activity":            activity,
		"registrations":       registrations,
		"activity_audit_logs": activityAuditLogs,
		"audit_traces":        auditTraces,
		"stats": fiber.Map{
			"total_registrations": len(registrations),
			"total_tickets":       len(ticketIDs),
		},
	})
}
