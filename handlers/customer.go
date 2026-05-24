package handlers

import (
	"jewelry-store-system/middleware"
	"jewelry-store-system/models"
	"jewelry-store-system/utils"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type CustomerHandler struct {
	db *gorm.DB
}

func NewCustomerHandler(db *gorm.DB) *CustomerHandler {
	return &CustomerHandler{db: db}
}

type CreateCustomerRequest struct {
	Name     string `json:"name" validate:"required"`
	Phone    string `json:"phone" validate:"required"`
	WechatID string `json:"wechat_id"`
	Level    string `json:"level"`
	Remark   string `json:"remark"`
}

func (h *CustomerHandler) Create(c *fiber.Ctx) error {
	var req CreateCustomerRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	customer := models.Customer{
		Name:     req.Name,
		Phone:    req.Phone,
		WechatID: req.WechatID,
		Level:    req.Level,
		Remark:   req.Remark,
	}

	if customer.Level == "" {
		customer.Level = "normal"
	}

	if err := h.db.Create(&customer).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create customer")
	}

	return utils.SuccessResponse(c, customer)
}

func (h *CustomerHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "10"))
	keyword := c.Query("keyword")
	level := c.Query("level")

	var customers []models.Customer
	var total int64

	query := h.db.Model(&models.Customer{})

	if keyword != "" {
		query = query.Where("name LIKE ? OR phone LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}
	if level != "" {
		query = query.Where("level = ?", level)
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&customers)

	return utils.SuccessResponseWithPagination(c, customers, page, pageSize, total)
}

func (h *CustomerHandler) Get(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))

	var customer models.Customer
	if err := h.db.First(&customer, id).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Customer not found")
	}

	var quotations []models.Quotation
	h.db.Where("customer_id = ?", id).Order("created_at DESC").Limit(10).Find(&quotations)

	var maintenances []models.Maintenance
	h.db.Where("customer_id = ?", id).Order("created_at DESC").Limit(10).Find(&maintenances)

	return utils.SuccessResponse(c, fiber.Map{
		"customer":    customer,
		"quotations":  quotations,
		"maintenances": maintenances,
	})
}

func (h *CustomerHandler) Update(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))

	var customer models.Customer
	if err := h.db.First(&customer, id).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Customer not found")
	}

	var req CreateCustomerRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	customer.Name = req.Name
	customer.Phone = req.Phone
	customer.WechatID = req.WechatID
	customer.Level = req.Level
	customer.Remark = req.Remark

	if err := h.db.Save(&customer).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update customer")
	}

	return utils.SuccessResponse(c, customer)
}

func (h *CustomerHandler) Delete(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))

	if err := h.db.Delete(&models.Customer{}, id).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete customer")
	}

	return utils.SuccessResponse(c, nil)
}
