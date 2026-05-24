package handlers

import (
	"jewelry-store-system/models"
	"jewelry-store-system/utils"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type ProductHandler struct {
	db *gorm.DB
}

func NewProductHandler(db *gorm.DB) *ProductHandler {
	return &ProductHandler{db: db}
}

type CreateProductRequest struct {
	SKU         string  `json:"sku" validate:"required"`
	Name        string  `json:"name" validate:"required"`
	Category    string  `json:"category" validate:"required"`
	Material    string  `json:"material"`
	Weight      float64 `json:"weight"`
	Price       float64 `json:"price" validate:"required"`
	Cost        float64 `json:"cost"`
	Stock       int     `json:"stock"`
	Description string  `json:"description"`
	ImageURL    string  `json:"image_url"`
}

func (h *ProductHandler) Create(c *fiber.Ctx) error {
	var req CreateProductRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	product := models.Product{
		SKU:         req.SKU,
		Name:        req.Name,
		Category:    req.Category,
		Material:    req.Material,
		Weight:      req.Weight,
		Price:       req.Price,
		Cost:        req.Cost,
		Stock:       req.Stock,
		Description: req.Description,
		ImageURL:    req.ImageURL,
		Status:      "available",
	}

	if err := h.db.Create(&product).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create product")
	}

	return utils.SuccessResponse(c, product)
}

func (h *ProductHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "10"))
	keyword := c.Query("keyword")
	category := c.Query("category")
	status := c.Query("status")

	var products []models.Product
	var total int64

	query := h.db.Model(&models.Product{})

	if keyword != "" {
		query = query.Where("name LIKE ? OR sku LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}
	if category != "" {
		query = query.Where("category = ?", category)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&products)

	return utils.SuccessResponseWithPagination(c, products, page, pageSize, total)
}

func (h *ProductHandler) Get(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))

	var product models.Product
	if err := h.db.First(&product, id).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Product not found")
	}

	return utils.SuccessResponse(c, product)
}

func (h *ProductHandler) Update(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))

	var product models.Product
	if err := h.db.First(&product, id).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Product not found")
	}

	var req CreateProductRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	product.SKU = req.SKU
	product.Name = req.Name
	product.Category = req.Category
	product.Material = req.Material
	product.Weight = req.Weight
	product.Price = req.Price
	product.Cost = req.Cost
	product.Stock = req.Stock
	product.Description = req.Description
	product.ImageURL = req.ImageURL

	if err := h.db.Save(&product).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update product")
	}

	return utils.SuccessResponse(c, product)
}

func (h *ProductHandler) Delete(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))

	if err := h.db.Delete(&models.Product{}, id).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete product")
	}

	return utils.SuccessResponse(c, nil)
}
