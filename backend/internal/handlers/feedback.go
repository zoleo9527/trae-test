package handlers

import (
	"camp-management/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type FeedbackHandler struct {
	db *gorm.DB
}

func NewFeedbackHandler(db *gorm.DB) *FeedbackHandler {
	return &FeedbackHandler{db: db}
}

func (h *FeedbackHandler) List(c *fiber.Ctx) error {
	query := h.db.Model(&models.Feedback{})

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if fbType := c.Query("type"); fbType != "" {
		query = query.Where("type = ?", fbType)
	}
	if camperID := c.Query("camper_id"); camperID != "" {
		query = query.Where("camper_id = ?", camperID)
	}

	var total int64
	query.Count(&total)

	var feedbacks []models.Feedback
	if err := query.Preload("Camper").Preload("Assignee").Order("created_at DESC").Find(&feedbacks).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "获取反馈列表失败"})
	}

	return c.JSON(fiber.Map{"data": feedbacks, "total": total})
}

func (h *FeedbackHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")

	var feedback models.Feedback
	if err := h.db.Preload("Camper").Preload("Assignee").First(&feedback, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "反馈未找到"})
	}

	return c.JSON(fiber.Map{"data": feedback})
}

func (h *FeedbackHandler) Create(c *fiber.Ctx) error {
	var feedback models.Feedback
	if err := c.BodyParser(&feedback); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "无效的请求"})
	}

	if feedback.Status == "" {
		feedback.Status = "pending"
	}

	if err := h.db.Create(&feedback).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "创建反馈失败"})
	}

	userID := c.Locals("user_id").(string)
	h.db.Create(&models.TimelineEvent{
		CamperID:         feedback.CamperID,
		EventType:        "feedback_created",
		EventTitle:       "新增反馈",
		EventDescription: "新增反馈: " + feedback.Type + " - " + feedback.Content,
		OperatorID:       userID,
	})

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": feedback})
}

func (h *FeedbackHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")

	var feedback models.Feedback
	if err := h.db.First(&feedback, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "反馈未找到"})
	}

	var updates models.Feedback
	if err := c.BodyParser(&updates); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "无效的请求"})
	}

	if err := h.db.Model(&feedback).Updates(&updates).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "更新反馈失败"})
	}

	h.db.Preload("Camper").Preload("Assignee").First(&feedback, "id = ?", id)

	userID := c.Locals("user_id").(string)
	h.db.Create(&models.TimelineEvent{
		CamperID:         feedback.CamperID,
		EventType:        "feedback_updated",
		EventTitle:       "更新反馈",
		EventDescription: "更新反馈: " + feedback.Type,
		OperatorID:       userID,
	})

	return c.JSON(fiber.Map{"data": feedback})
}

type CompleteFeedbackRequest struct {
	ParentResponse string `json:"parent_response"`
}

func (h *FeedbackHandler) Complete(c *fiber.Ctx) error {
	id := c.Params("id")

	var req CompleteFeedbackRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "无效的请求"})
	}

	var feedback models.Feedback
	if err := h.db.First(&feedback, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "反馈未找到"})
	}

	userID := c.Locals("user_id").(string)
	feedback.Status = "completed"
	feedback.ParentResponse = req.ParentResponse
	feedback.AssigneeID = &userID

	if err := h.db.Save(&feedback).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "完成反馈失败"})
	}

	h.db.Create(&models.TimelineEvent{
		CamperID:         feedback.CamperID,
		EventType:        "feedback_completed",
		EventTitle:       "反馈已处理",
		EventDescription: "反馈已处理完成: " + feedback.Type,
		OperatorID:       userID,
	})

	h.db.Preload("Camper").Preload("Assignee").First(&feedback, "id = ?", id)

	return c.JSON(fiber.Map{"data": feedback})
}
