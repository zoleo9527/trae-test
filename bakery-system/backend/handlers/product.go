package handlers

import (
	"bakery-system/backend/database"
	"bakery-system/backend/models"

	"github.com/gofiber/fiber/v2"
)

type ProductHandler struct{}

func NewProductHandler() *ProductHandler {
	return &ProductHandler{}
}

func (h *ProductHandler) GetProducts(c *fiber.Ctx) error {
	var products []models.Product
	query := database.DB.Model(&models.Product{})

	if category := c.Query("category"); category != "" {
		query = query.Where("category = ?", category)
	}
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	query.Find(&products)
	return c.JSON(fiber.Map{"data": products})
}

func (h *ProductHandler) GetProduct(c *fiber.Ctx) error {
	id := c.Params("id")
	var product models.Product
	if err := database.DB.First(&product, "id = ?", id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Product not found"})
	}
	return c.JSON(product)
}

func (h *ProductHandler) CreateProduct(c *fiber.Ctx) error {
	var product models.Product
	if err := c.BodyParser(&product); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	database.DB.Create(&product)
	return c.Status(201).JSON(product)
}

func (h *ProductHandler) UpdateProduct(c *fiber.Ctx) error {
	id := c.Params("id")
	var product models.Product
	if err := database.DB.First(&product, "id = ?", id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Product not found"})
	}

	var data map[string]interface{}
	if err := c.BodyParser(&data); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	database.DB.Model(&product).Updates(data)
	return c.JSON(product)
}
