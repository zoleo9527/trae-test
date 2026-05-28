package handlers

import (
	"camp-management/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type RoomHandler struct {
	db *gorm.DB
}

func NewRoomHandler(db *gorm.DB) *RoomHandler {
	return &RoomHandler{db: db}
}

func (h *RoomHandler) List(c *fiber.Ctx) error {
	var rooms []models.Room
	if err := h.db.Preload("Campers").Find(&rooms).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "获取房间列表失败"})
	}

	var total int64
	h.db.Model(&models.Room{}).Count(&total)

	return c.JSON(fiber.Map{"data": rooms, "total": total})
}

func (h *RoomHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")

	var room models.Room
	if err := h.db.Preload("Campers").First(&room, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "房间未找到"})
	}

	return c.JSON(fiber.Map{"data": room})
}

func (h *RoomHandler) Create(c *fiber.Ctx) error {
	var room models.Room
	if err := c.BodyParser(&room); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "无效的请求"})
	}

	if err := h.db.Create(&room).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "创建房间失败"})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": room})
}

func (h *RoomHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")

	var room models.Room
	if err := h.db.First(&room, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "房间未找到"})
	}

	var updates models.Room
	if err := c.BodyParser(&updates); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "无效的请求"})
	}

	if err := h.db.Model(&room).Updates(&updates).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "更新房间失败"})
	}

	h.db.Preload("Campers").First(&room, "id = ?", id)

	return c.JSON(fiber.Map{"data": room})
}

type AssignRequest struct {
	CamperID string `json:"camper_id"`
	RoomID   string `json:"room_id"`
	CamperId string `json:"camperId"`
	RoomId   string `json:"roomId"`
}

func (r *AssignRequest) GetCamperID() string {
	if r.CamperID != "" {
		return r.CamperID
	}
	return r.CamperId
}

func (r *AssignRequest) GetRoomID() string {
	if r.RoomID != "" {
		return r.RoomID
	}
	return r.RoomId
}

func (h *RoomHandler) AssignCamper(c *fiber.Ctx) error {
	var req AssignRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "无效的请求"})
	}

	camperID := req.GetCamperID()
	roomID := req.GetRoomID()

	var camper models.Camper
	if err := h.db.First(&camper, "id = ?", camperID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "营员未找到"})
	}

	var room models.Room
	if err := h.db.First(&room, "id = ?", roomID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "房间未找到"})
	}

	var count int64
	h.db.Model(&models.Camper{}).Where("room_id = ?", roomID).Count(&count)
	if int(count) >= room.Capacity {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "房间已满"})
	}

	camper.RoomID = &roomID
	if err := h.db.Save(&camper).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "分配房间失败"})
	}

	userID := c.Locals("user_id").(string)
	h.db.Create(&models.TimelineEvent{
		CamperID:         camper.ID,
		EventType:        "room_assigned",
		EventTitle:       "分配房间",
		EventDescription: "分配营员 " + camper.Name + " 到房间 " + room.Name,
		OperatorID:       userID,
	})

	h.db.Preload("Campers").First(&room, "id = ?", roomID)

	return c.JSON(fiber.Map{"data": room})
}

type UnassignRequest struct {
	CamperID string `json:"camper_id"`
	CamperId string `json:"camperId"`
}

func (r *UnassignRequest) GetCamperID() string {
	if r.CamperID != "" {
		return r.CamperID
	}
	return r.CamperId
}

func (h *RoomHandler) UnassignCamper(c *fiber.Ctx) error {
	var req UnassignRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "无效的请求"})
	}

	camperID := req.GetCamperID()

	var camper models.Camper
	if err := h.db.Preload("Room").First(&camper, "id = ?", camperID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "营员未找到"})
	}

	roomID := ""
	roomName := ""
	if camper.Room != nil {
		roomID = camper.Room.ID
		roomName = camper.Room.Name
	}

	camper.RoomID = nil
	if err := h.db.Save(&camper).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "取消房间分配失败"})
	}

	userID := c.Locals("user_id").(string)
	h.db.Create(&models.TimelineEvent{
		CamperID:         camper.ID,
		EventType:        "room_unassigned",
		EventTitle:       "取消房间分配",
		EventDescription: "取消营员 " + camper.Name + " 的房间分配" + roomName,
		OperatorID:       userID,
	})

	var room models.Room
	if roomID != "" {
		h.db.Preload("Campers").First(&room, "id = ?", roomID)
	}

	return c.JSON(fiber.Map{"data": room})
}
