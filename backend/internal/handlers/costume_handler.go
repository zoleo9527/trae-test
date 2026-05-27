package handlers

import (
	"strconv"
	"wedding-photo-backend/internal/models"
	"wedding-photo-backend/pkg/database"
	"wedding-photo-backend/pkg/middleware"

	"github.com/gofiber/fiber/v2"
)

type CostumeHandler struct{}

func NewCostumeHandler() *CostumeHandler {
	return &CostumeHandler{}
}

type CreateCostumeRequest struct {
	Name          string  `json:"name" validate:"required"`
	Category      string  `json:"category" validate:"required"`
	Style         string  `json:"style"`
	Size          string  `json:"size" validate:"required"`
	Color         string  `json:"color"`
	Brand         string  `json:"brand"`
	PurchasePrice float64 `json:"purchase_price"`
	RentalPrice   float64 `json:"rental_price"`
	ImageURL      string  `json:"image_url"`
	Remark        string  `json:"remark"`
}

func (h *CostumeHandler) Create(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)

	var req CreateCostumeRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "请求参数错误",
		})
	}

	costume := models.Costume{
		Name:          req.Name,
		Category:      req.Category,
		Style:         req.Style,
		Size:          req.Size,
		Color:         req.Color,
		Brand:         req.Brand,
		PurchasePrice: req.PurchasePrice,
		RentalPrice:   req.RentalPrice,
		Status:        models.CostumeStatusAvailable,
		ImageURL:      req.ImageURL,
		Remark:        req.Remark,
	}

	if err := database.DB.Create(&costume).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "创建服装失败",
		})
	}

	logOperation(userID, "create", "costume", costume.ID, "", "")

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "创建成功",
		"data":    costume,
	})
}

func (h *CostumeHandler) GetList(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "10"))
	category := c.Query("category")
	status := c.Query("status")
	style := c.Query("style")
	size := c.Query("size")
	keyword := c.Query("keyword")

	query := database.DB.Model(&models.Costume{})

	if category != "" {
		query = query.Where("category = ?", category)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if style != "" {
		query = query.Where("style LIKE ?", "%"+style+"%")
	}
	if size != "" {
		query = query.Where("size = ?", size)
	}
	if keyword != "" {
		query = query.Where("name LIKE ? OR brand LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}

	var total int64
	query.Count(&total)

	var costumes []models.Costume
	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&costumes).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "获取列表失败",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "获取成功",
		"data": fiber.Map{
			"list":      costumes,
			"total":     total,
			"page":      page,
			"page_size": pageSize,
		},
	})
}

func (h *CostumeHandler) GetDetail(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "ID参数错误",
		})
	}

	var costume models.Costume
	if err := database.DB.First(&costume, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "服装不存在",
		})
	}

	var dispatchHistory []models.CostumeDispatch
	database.DB.Where("costume_id = ?", id).Order("created_at DESC").Limit(10).Find(&dispatchHistory)

	var maintenanceHistory []models.MaintenanceRecord
	database.DB.Where("costume_id = ?", id).Order("created_at DESC").Limit(10).Find(&maintenanceHistory)

	return c.JSON(fiber.Map{
		"success": true,
		"message": "获取成功",
		"data": fiber.Map{
			"costume":            costume,
			"dispatch_history":   dispatchHistory,
			"maintenance_history": maintenanceHistory,
		},
	})
}

func (h *CostumeHandler) Update(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "ID参数错误",
		})
	}

	var costume models.Costume
	if err := database.DB.First(&costume, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "服装不存在",
		})
	}

	oldStatus := string(costume.Status)

	if err := c.BodyParser(&costume); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "请求参数错误",
		})
	}

	if err := database.DB.Save(&costume).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "更新失败",
		})
	}

	logOperation(userID, "update", "costume", costume.ID, oldStatus, string(costume.Status))

	return c.JSON(fiber.Map{
		"success": true,
		"message": "更新成功",
		"data":    costume,
	})
}

func (h *CostumeHandler) Delete(c *fiber.Ctx) error {
	userID := middleware.GetCurrentUserID(c)
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "ID参数错误",
		})
	}

	var costume models.Costume
	if err := database.DB.First(&costume, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "服装不存在",
		})
	}

	if err := database.DB.Delete(&costume).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "删除失败",
		})
	}

	logOperation(userID, "delete", "costume", uint(id), "", "")

	return c.JSON(fiber.Map{
		"success": true,
		"message": "删除成功",
	})
}
