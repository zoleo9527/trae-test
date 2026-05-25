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

	var activity models.Activity
	if err := database.DB.First(&activity, activityID).Error; err != nil {
		return utils.JSONError(c, fiber.StatusNotFound, "活动不存在", err.Error())
	}

	if activity.Status != models.ActivityPublished {
		return utils.JSONError(c, fiber.StatusBadRequest, "活动未发布，无法报名", "")
	}

	now := time.Now()
	if now.Before(activity.RegistrationStart) {
		return utils.JSONError(c, fiber.StatusBadRequest, "报名尚未开始", "")
	}
	if now.After(activity.RegistrationEnd) {
		return utils.JSONError(c, fiber.StatusBadRequest, "报名已结束", "")
	}

	var req CreateRegistrationRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "参数错误", err.Error())
	}

	var registeredCount int64
	database.DB.Model(&models.ActivityRegistration{}).
		Where("activity_id = ? AND status IN ?", activityID, []string{string(models.RegistrationConfirmed), string(models.RegistrationPending)}).
		Count(&registeredCount)

	status := models.RegistrationPending
	if activity.MaxParticipants > 0 && int(registeredCount)+req.Participants > activity.MaxParticipants {
		status = models.RegistrationWaitlist
	}

	registration := models.ActivityRegistration{
		ActivityID:   uint(activityID),
		MemberID:     req.MemberID,
		MemberName:   req.MemberName,
		MemberPhone:  req.MemberPhone,
		MemberEmail:  req.MemberEmail,
		Participants: req.Participants,
		Status:       status,
		RegisteredBy: claims.UserID,
		RegisteredAt: now,
	}

	if err := database.DB.Create(&registration).Error; err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "报名失败", err.Error())
	}

	_ = utils.CreateAuditLog(
		"activity", "registration", "registration", &registration.ID, registration.RegistrationNo,
		claims.UserID, claims.Username, claims.Role, nil, registration,
		c.IP(), c.Get("User-Agent"), "",
	)

	return utils.JSONResponse(c, fiber.StatusCreated, true, "报名成功", registration)
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

	var registration models.ActivityRegistration
	if err := database.DB.First(&registration, regID).Error; err != nil {
		return utils.JSONError(c, fiber.StatusNotFound, "报名记录不存在", err.Error())
	}

	if registration.Status != models.RegistrationPending && registration.Status != models.RegistrationWaitlist {
		return utils.JSONError(c, fiber.StatusBadRequest, "该报名状态无法确认", "")
	}

	now := time.Now()
	oldStatus := registration.Status
	registration.Status = models.RegistrationConfirmed
	registration.ConfirmedBy = &claims.UserID
	registration.ConfirmedAt = &now

	if err := database.DB.Save(&registration).Error; err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "确认失败", err.Error())
	}

	beforeData, _ := json.Marshal(fiber.Map{"status": oldStatus})
	afterData, _ := json.Marshal(fiber.Map{"status": models.RegistrationConfirmed})

	auditLog := models.ActivityAuditLog{
		ActivityID:     registration.ActivityID,
		RegistrationID: &registration.ID,
		Action:         "confirm_registration",
		OperatorID:     claims.UserID,
		OperatorName:   claims.Username,
		BeforeData:     string(beforeData),
		AfterData:      string(afterData),
		CreatedAt:      now,
	}
	database.DB.Create(&auditLog)

	_ = utils.CreateAuditLog(
		"activity", "confirm_registration", "registration", &registration.ID, registration.RegistrationNo,
		claims.UserID, claims.Username, claims.Role, oldStatus, models.RegistrationConfirmed,
		c.IP(), c.Get("User-Agent"), "",
	)

	return utils.JSONResponse(c, fiber.StatusOK, true, "确认成功", registration)
}

func CheckinRegistration(c *fiber.Ctx) error {
	claims := middleware.GetCurrentUser(c)
	regID, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "报名ID格式错误", err.Error())
	}

	var registration models.ActivityRegistration
	if err := database.DB.First(&registration, regID).Error; err != nil {
		return utils.JSONError(c, fiber.StatusNotFound, "报名记录不存在", err.Error())
	}

	if registration.Status != models.RegistrationConfirmed {
		return utils.JSONError(c, fiber.StatusBadRequest, "只有已确认的报名可以签到", "")
	}

	if registration.CheckinTime != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "该报名已签到", "")
	}

	now := time.Now()
	registration.CheckinTime = &now
	registration.CheckinBy = &claims.UserID

	if err := database.DB.Save(&registration).Error; err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "签到失败", err.Error())
	}

	_ = utils.CreateAuditLog(
		"activity", "checkin", "registration", &registration.ID, registration.RegistrationNo,
		claims.UserID, claims.Username, claims.Role, nil, registration,
		c.IP(), c.Get("User-Agent"), "",
	)

	return utils.JSONResponse(c, fiber.StatusOK, true, "签到成功", registration)
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
