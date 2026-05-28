package handler

import (
	"camp-management/internal/model"
	"camp-management/internal/service"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type CamperHandler struct {
	camperService *service.CamperService
	authService   *service.AuthService
}

func NewCamperHandler(camperService *service.CamperService, authService *service.AuthService) *CamperHandler {
	return &CamperHandler{camperService: camperService, authService: authService}
}

func (h *CamperHandler) Create(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(uuid.UUID)

	var req service.CreateCamperRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"code":    "INVALID_REQUEST",
			"message": "请求参数错误",
		})
	}

	camper, err := h.camperService.Create(req, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return c.Status(fiber.StatusCreated).JSON(camper)
}

func (h *CamperHandler) BatchCreate(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(uuid.UUID)

	var req service.BatchCreateCamperRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"code":    "INVALID_REQUEST",
			"message": "请求参数错误",
		})
	}

	campers, err := h.camperService.BatchCreate(req, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "批量创建成功",
		"count":   len(campers),
		"data":    campers,
	})
}

func (h *CamperHandler) Search(c *fiber.Ctx) error {
	campID, err := ParseUUIDParam(c, "campId")
	if err != nil {
		return HandleError(c, err)
	}

	keyword := c.Query("keyword", "")
	statusStr := c.Query("status")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "20"))

	var status *model.CamperStatus
	if statusStr != "" {
		s := model.CamperStatus(statusStr)
		status = &s
	}

	campers, total, err := h.camperService.Search(campID, keyword, status, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(NewPageResult(campers, total, page, pageSize))
}

func (h *CamperHandler) Get(c *fiber.Ctx) error {
	id, err := ParseUUIDParam(c, "id")
	if err != nil {
		return HandleError(c, err)
	}

	camper, err := h.camperService.GetByID(id)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(camper)
}

func (h *CamperHandler) AssignRoom(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(uuid.UUID)

	var req service.AssignRoomRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"code":    "INVALID_REQUEST",
			"message": "请求参数错误",
		})
	}

	if err := h.camperService.AssignRoom(req, userID); err != nil {
		return HandleError(c, err)
	}

	return c.JSON(fiber.Map{
		"message": "分配房间成功",
	})
}

func (h *CamperHandler) BatchAssignRoom(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(uuid.UUID)

	var req service.BatchAssignRoomRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"code":    "INVALID_REQUEST",
			"message": "请求参数错误",
		})
	}

	task, err := h.camperService.BatchAssignRoomAsync(req, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(fiber.Map{
		"message": "批量分房任务已提交",
		"task_id": task.ID,
	})
}

func (h *CamperHandler) UnassignRoom(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(uuid.UUID)
	id, err := ParseUUIDParam(c, "id")
	if err != nil {
		return HandleError(c, err)
	}

	if err := h.camperService.UnassignRoom(id, userID); err != nil {
		return HandleError(c, err)
	}

	return c.JSON(fiber.Map{
		"message": "取消房间分配成功",
	})
}

func (h *CamperHandler) UpdateStatus(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(uuid.UUID)
	id, err := ParseUUIDParam(c, "id")
	if err != nil {
		return HandleError(c, err)
	}

	var req struct {
		Status model.CamperStatus `json:"status" validate:"required"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"code":    "INVALID_REQUEST",
			"message": "请求参数错误",
		})
	}

	camper, err := h.camperService.UpdateStatus(id, req.Status, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(camper)
}

func (h *CamperHandler) GetWithoutRoom(c *fiber.Ctx) error {
	campID, err := ParseUUIDParam(c, "campId")
	if err != nil {
		return HandleError(c, err)
	}

	campers, err := h.camperService.GetWithoutRoom(campID)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(campers)
}
