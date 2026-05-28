package handler

import (
	"camp-management/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type RoomHandler struct {
	roomService *service.RoomService
	authService *service.AuthService
}

func NewRoomHandler(roomService *service.RoomService, authService *service.AuthService) *RoomHandler {
	return &RoomHandler{roomService: roomService, authService: authService}
}

func (h *RoomHandler) Create(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(uuid.UUID)

	var req service.CreateRoomRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"code":    "INVALID_REQUEST",
			"message": "请求参数错误",
		})
	}

	room, err := h.roomService.Create(req, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return c.Status(fiber.StatusCreated).JSON(room)
}

func (h *RoomHandler) BatchCreate(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(uuid.UUID)

	var req []service.CreateRoomRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"code":    "INVALID_REQUEST",
			"message": "请求参数错误",
		})
	}

	rooms, err := h.roomService.BatchCreate(req, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "批量创建成功",
		"count":   len(rooms),
		"data":    rooms,
	})
}

func (h *RoomHandler) GetByCampID(c *fiber.Ctx) error {
	campID, err := ParseUUIDParam(c, "campId")
	if err != nil {
		return HandleError(c, err)
	}

	rooms, err := h.roomService.GetByCampID(campID)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(rooms)
}

func (h *RoomHandler) GetAvailable(c *fiber.Ctx) error {
	campID, err := ParseUUIDParam(c, "campId")
	if err != nil {
		return HandleError(c, err)
	}

	gender := c.Query("gender", "mixed")
	rooms, err := h.roomService.GetAvailableRooms(campID, gender)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(rooms)
}

func (h *RoomHandler) GetStats(c *fiber.Ctx) error {
	campID, err := ParseUUIDParam(c, "campId")
	if err != nil {
		return HandleError(c, err)
	}

	stats, err := h.roomService.GetStats(campID)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(stats)
}

func (h *RoomHandler) Get(c *fiber.Ctx) error {
	id, err := ParseUUIDParam(c, "id")
	if err != nil {
		return HandleError(c, err)
	}

	room, err := h.roomService.GetByID(id)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(room)
}
