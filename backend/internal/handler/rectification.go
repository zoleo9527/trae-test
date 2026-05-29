package handler

import (
	"github.com/cultural-store/inspection-service/internal/middleware"
	"github.com/cultural-store/inspection-service/internal/model"
	"github.com/cultural-store/inspection-service/internal/service"
	"github.com/gofiber/fiber/v2"
)

type RectificationHandler struct {
	svc *service.Service
}

func NewRectificationHandler(svc *service.Service) *RectificationHandler {
	return &RectificationHandler{svc: svc}
}

func (h *RectificationHandler) List(c *fiber.Ctx) error {
	f := middleware.GetFilter(c)
	result, err := h.svc.ListRectifications(f)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(result)
}

func (h *RectificationHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	rect, err := h.svc.GetRectification(id)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "rectification not found"})
	}
	return c.JSON(rect)
}

func (h *RectificationHandler) Create(c *fiber.Ctx) error {
	var req model.CreateRectificationRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	if req.InspectionItemID == "" || req.Title == "" {
		return c.Status(400).JSON(fiber.Map{"error": "inspection_item_id and title required"})
	}
	operatorID := c.Locals("user_id").(string)
	operatorName := c.Locals("display_name").(string)
	rect, err := h.svc.CreateRectification(req, operatorID, operatorName)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(rect)
}

func (h *RectificationHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var req model.UpdateRectificationRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	operatorID := c.Locals("user_id").(string)
	operatorName := c.Locals("display_name").(string)
	rect, err := h.svc.UpdateRectification(id, req, operatorID, operatorName)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(rect)
}

func (h *RectificationHandler) ListPhotos(c *fiber.Ctx) error {
	id := c.Params("id")
	photos, err := h.svc.GetRectificationPhotos(id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(photos)
}

func (h *RectificationHandler) UploadPhoto(c *fiber.Ctx) error {
	id := c.Params("id")
	photoType := c.FormValue("type", "after")
	url := c.FormValue("url")
	caption := c.FormValue("caption", "")
	if url == "" {
		file, err := c.FormFile("photo")
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "photo file or url required"})
		}
		uploadDir := "./uploads/rectifications"
		if err := c.SaveFile(file, uploadDir+"/"+file.Filename); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "failed to save file"})
		}
		url = "/uploads/rectifications/" + file.Filename
	}
	operatorID := c.Locals("user_id").(string)
	operatorName := c.Locals("display_name").(string)
	photo, err := h.svc.CreateRectificationPhoto(id, photoType, url, caption, operatorID, operatorName)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(photo)
}

func (h *RectificationHandler) ListComments(c *fiber.Ctx) error {
	id := c.Params("id")
	comments, err := h.svc.GetRectificationComments(id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(comments)
}

func (h *RectificationHandler) CreateComment(c *fiber.Ctx) error {
	id := c.Params("id")
	var req model.CreateCommentRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	if req.Content == "" {
		return c.Status(400).JSON(fiber.Map{"error": "content required"})
	}
	operatorID := c.Locals("user_id").(string)
	operatorName := c.Locals("display_name").(string)
	comment, err := h.svc.CreateRectificationComment(id, req.Content, operatorID, operatorName)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(comment)
}
