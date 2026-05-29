package handler

import (
	"github.com/cultural-store/inspection-service/internal/middleware"
	"github.com/cultural-store/inspection-service/internal/model"
	"github.com/cultural-store/inspection-service/internal/service"
	"github.com/gofiber/fiber/v2"
)

type InspectionHandler struct {
	svc *service.Service
}

func NewInspectionHandler(svc *service.Service) *InspectionHandler {
	return &InspectionHandler{svc: svc}
}

func (h *InspectionHandler) List(c *fiber.Ctx) error {
	f := middleware.GetFilter(c)
	result, err := h.svc.ListInspections(f)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(result)
}

func (h *InspectionHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	ins, err := h.svc.GetInspection(id)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "inspection not found"})
	}
	return c.JSON(ins)
}

func (h *InspectionHandler) Create(c *fiber.Ctx) error {
	var req model.CreateInspectionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	if req.StoreID == "" || req.Title == "" {
		return c.Status(400).JSON(fiber.Map{"error": "store_id and title required"})
	}
	operatorID := c.Locals("user_id").(string)
	operatorName := c.Locals("display_name").(string)
	ins, err := h.svc.CreateInspection(req, operatorID, operatorName)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(ins)
}

func (h *InspectionHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var req model.UpdateInspectionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	operatorID := c.Locals("user_id").(string)
	operatorName := c.Locals("display_name").(string)
	ins, err := h.svc.UpdateInspection(id, req, operatorID, operatorName)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(ins)
}

func (h *InspectionHandler) ListItems(c *fiber.Ctx) error {
	inspectionID := c.Params("id")
	items, err := h.svc.GetInspectionItems(inspectionID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(items)
}

func (h *InspectionHandler) CreateItem(c *fiber.Ctx) error {
	inspectionID := c.Params("id")
	var req model.CreateInspectionItemRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	if req.Description == "" {
		return c.Status(400).JSON(fiber.Map{"error": "description required"})
	}
	operatorID := c.Locals("user_id").(string)
	operatorName := c.Locals("display_name").(string)
	item, err := h.svc.CreateInspectionItem(inspectionID, req, operatorID, operatorName)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(item)
}

func (h *InspectionHandler) UpdateItem(c *fiber.Ctx) error {
	itemID := c.Params("itemId")
	var req model.UpdateInspectionItemRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	operatorID := c.Locals("user_id").(string)
	operatorName := c.Locals("display_name").(string)
	item, err := h.svc.UpdateInspectionItem(itemID, req, operatorID, operatorName)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(item)
}

func (h *InspectionHandler) ListPhotos(c *fiber.Ctx) error {
	itemID := c.Params("itemId")
	photos, err := h.svc.GetInspectionPhotos(itemID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(photos)
}

func (h *InspectionHandler) UploadPhoto(c *fiber.Ctx) error {
	itemID := c.Params("itemId")
	file, err := c.FormFile("photo")
	if err != nil {
		url := c.FormValue("url")
		if url == "" {
			return c.Status(400).JSON(fiber.Map{"error": "photo file or url required"})
		}
		caption := c.FormValue("caption", "")
		operatorID := c.Locals("user_id").(string)
		operatorName := c.Locals("display_name").(string)
		photo, err := h.svc.CreateInspectionPhoto(itemID, url, caption, operatorID, operatorName)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(201).JSON(photo)
	}
	uploadDir := "./uploads/inspections"
	if err := c.SaveFile(file, uploadDir+"/"+file.Filename); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to save file"})
	}
	url := "/uploads/inspections/" + file.Filename
	caption := c.FormValue("caption", "")
	operatorID := c.Locals("user_id").(string)
	operatorName := c.Locals("display_name").(string)
	photo, err := h.svc.CreateInspectionPhoto(itemID, url, caption, operatorID, operatorName)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(photo)
}
