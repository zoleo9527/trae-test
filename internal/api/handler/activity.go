package handler

import (
	"camp-management/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ActivityHandler struct {
	activityService *service.ActivityService
	authService     *service.AuthService
}

func NewActivityHandler(activityService *service.ActivityService, authService *service.AuthService) *ActivityHandler {
	return &ActivityHandler{activityService: activityService, authService: authService}
}

func (h *ActivityHandler) Create(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(uuid.UUID)

	var req service.CreateActivityRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"code":    "INVALID_REQUEST",
			"message": "请求参数错误",
		})
	}

	activity, err := h.activityService.Create(req, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return c.Status(fiber.StatusCreated).JSON(activity)
}

func (h *ActivityHandler) BatchCreate(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(uuid.UUID)

	var req []service.CreateActivityRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"code":    "INVALID_REQUEST",
			"message": "请求参数错误",
		})
	}

	activities, err := h.activityService.BatchCreate(req, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "批量创建成功",
		"count":   len(activities),
		"data":    activities,
	})
}

func (h *ActivityHandler) GetByCampID(c *fiber.Ctx) error {
	campID, err := ParseUUIDParam(c, "campId")
	if err != nil {
		return HandleError(c, err)
	}

	activities, err := h.activityService.GetByCampID(campID)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(activities)
}

func (h *ActivityHandler) Get(c *fiber.Ctx) error {
	id, err := ParseUUIDParam(c, "id")
	if err != nil {
		return HandleError(c, err)
	}

	activity, err := h.activityService.GetByID(id)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(activity)
}

func (h *ActivityHandler) CheckIn(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(uuid.UUID)

	var req service.CheckInRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"code":    "INVALID_REQUEST",
			"message": "请求参数错误",
		})
	}

	attendance, err := h.activityService.CheckIn(req, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(attendance)
}

func (h *ActivityHandler) BatchCheckIn(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(uuid.UUID)

	var req service.BatchCheckInRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"code":    "INVALID_REQUEST",
			"message": "请求参数错误",
		})
	}

	attendances, err := h.activityService.BatchCheckIn(req, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(fiber.Map{
		"message": "批量签到成功",
		"count":   len(attendances),
		"data":    attendances,
	})
}

func (h *ActivityHandler) GetAttendances(c *fiber.Ctx) error {
	activityID, err := ParseUUIDParam(c, "id")
	if err != nil {
		return HandleError(c, err)
	}

	attendances, err := h.activityService.GetAttendances(activityID)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(attendances)
}

func (h *ActivityHandler) GetCamperAttendances(c *fiber.Ctx) error {
	camperID, err := ParseUUIDParam(c, "camperId")
	if err != nil {
		return HandleError(c, err)
	}

	attendances, err := h.activityService.GetCamperAttendances(camperID)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(attendances)
}
