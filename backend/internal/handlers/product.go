package handlers

import (
	"camp-server/internal/middleware"
	"camp-server/internal/models"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type CreateProductRequest struct {
	SKU             string    `json:"sku"`
	Name            string    `json:"name"`
	BrandPartner    string    `json:"brandPartner"`
	Category        string    `json:"category"`
	RetailPrice     float64   `json:"retailPrice"`
	CostPrice       float64   `json:"costPrice"`
	Description     string    `json:"description"`
	ImageURL        string    `json:"imageUrl"`
	PlanOnShelfDate time.Time `json:"planOnShelfDate"`
	PlanOffShelfDate time.Time `json:"planOffShelfDate"`
	TargetStores    []string  `json:"targetStores"`
}

type UpdateProductRequest struct {
	Name            string    `json:"name"`
	BrandPartner    string    `json:"brandPartner"`
	Category        string    `json:"category"`
	RetailPrice     float64   `json:"retailPrice"`
	CostPrice       float64   `json:"costPrice"`
	Description     string    `json:"description"`
	ImageURL        string    `json:"imageUrl"`
	PlanOnShelfDate time.Time `json:"planOnShelfDate"`
	PlanOffShelfDate time.Time `json:"planOffShelfDate"`
	TargetStores    []string  `json:"targetStores"`
}

type ApproveRequest struct {
	Remark string `json:"remark"`
}

type RejectRequest struct {
	Reason string `json:"reason"`
}

type ReviewRequest struct {
	ReviewNote string `json:"reviewNote"`
}

func ListProducts(c *fiber.Ctx) error {
	status := c.Query("status")
	category := c.Query("category")

	query := models.DB.Model(&models.CollabProduct{})
	if status != "" {
		if strings.Contains(status, ",") {
			statuses := strings.Split(status, ",")
			query = query.Where("status IN ?", statuses)
		} else {
			query = query.Where("status = ?", status)
		}
	}
	if category != "" {
		query = query.Where("category = ?", category)
	}

	var products []models.CollabProduct
	if err := query.Order("created_at DESC").Find(&products).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(products)
}

func GetProduct(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid product ID",
		})
	}

	var product models.CollabProduct
	if err := models.DB.First(&product, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Product not found",
		})
	}

	logs, _ := models.GetOperationLogs("product", id)

	return c.JSON(fiber.Map{
		"product": product,
		"logs":    logs,
	})
}

func CreateProduct(c *fiber.Ctx) error {
	user := middleware.GetUser(c)

	var req CreateProductRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	product := &models.CollabProduct{
		SKU:              req.SKU,
		Name:             req.Name,
		BrandPartner:     req.BrandPartner,
		Category:         req.Category,
		RetailPrice:      req.RetailPrice,
		CostPrice:        req.CostPrice,
		Description:      req.Description,
		ImageURL:         req.ImageURL,
		Status:           models.ProductStatusPending,
		PlanOnShelfDate:  req.PlanOnShelfDate,
		PlanOffShelfDate: req.PlanOffShelfDate,
		TargetStores:     req.TargetStores,
		CreatedBy:        user.ID,
		CreatedByName:    user.Name,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	if err := models.DB.Create(product).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	models.LogOperation("product", product.ID, "create", nil, product,
		"创建联名商品", user.ID, user.Name, user.Role)

	return c.JSON(product)
}

func UpdateProduct(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid product ID",
		})
	}

	var product models.CollabProduct
	if err := models.DB.First(&product, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Product not found",
		})
	}

	oldProduct := product

	var req UpdateProductRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	product.Name = req.Name
	product.BrandPartner = req.BrandPartner
	product.Category = req.Category
	product.RetailPrice = req.RetailPrice
	product.CostPrice = req.CostPrice
	product.Description = req.Description
	product.ImageURL = req.ImageURL
	product.PlanOnShelfDate = req.PlanOnShelfDate
	product.PlanOffShelfDate = req.PlanOffShelfDate
	product.TargetStores = req.TargetStores
	product.UpdatedAt = time.Now()

	if product.Status == models.ProductStatusRejected {
		product.Status = models.ProductStatusPending
		product.RejectReason = ""
	}

	if err := models.DB.Save(&product).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	models.LogOperation("product", product.ID, "update", oldProduct, product,
		"更新商品信息", user.ID, user.Name, user.Role)

	return c.JSON(product)
}

func SubmitForApproval(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid product ID",
		})
	}

	var product models.CollabProduct
	if err := models.DB.First(&product, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Product not found",
		})
	}

	oldStatus := product.Status
	product.Status = models.ProductStatusPending
	product.UpdatedAt = time.Now()

	if err := models.DB.Save(&product).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	models.LogOperation("product", product.ID, "submit",
		fiber.Map{"status": oldStatus}, fiber.Map{"status": product.Status},
		"提交审批", user.ID, user.Name, user.Role)

	return c.JSON(product)
}

func ApproveProduct(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid product ID",
		})
	}

	var req ApproveRequest
	c.BodyParser(&req)

	var product models.CollabProduct
	if err := models.DB.First(&product, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Product not found",
		})
	}

	oldStatus := product.Status
	product.Status = models.ProductStatusApproved
	product.ApprovedBy = &user.ID
	product.ApprovedByName = user.Name
	product.UpdatedAt = time.Now()

	if err := models.DB.Save(&product).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	for _, storeCode := range product.TargetStores {
		var store models.Store
		if err := models.DB.Where("code = ?", storeCode).First(&store).Error; err == nil {
			inventory := models.Inventory{
				ProductID:    product.ID,
				StoreID:      store.ID,
				StoreCode:    store.Code,
				Quantity:     0,
				ReservedQty:  0,
				AvailableQty: 0,
				CreatedAt:    time.Now(),
				UpdatedAt:    time.Now(),
			}
			models.DB.FirstOrCreate(&inventory, models.Inventory{ProductID: product.ID, StoreID: store.ID})
		}
	}

	models.LogOperation("product", product.ID, "approve",
		fiber.Map{"status": oldStatus}, fiber.Map{"status": product.Status},
		req.Remark, user.ID, user.Name, user.Role)

	return c.JSON(product)
}

func RejectProduct(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid product ID",
		})
	}

	var req RejectRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request",
		})
	}

	var product models.CollabProduct
	if err := models.DB.First(&product, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Product not found",
		})
	}

	oldStatus := product.Status
	product.Status = models.ProductStatusRejected
	product.RejectReason = req.Reason
	product.UpdatedAt = time.Now()

	if err := models.DB.Save(&product).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	models.LogOperation("product", product.ID, "reject",
		fiber.Map{"status": oldStatus}, fiber.Map{"status": product.Status},
		req.Reason, user.ID, user.Name, user.Role)

	return c.JSON(product)
}

func OnShelfProduct(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid product ID",
		})
	}

	var product models.CollabProduct
	if err := models.DB.First(&product, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Product not found",
		})
	}

	oldStatus := product.Status
	now := time.Now()
	product.Status = models.ProductStatusOnShelf
	product.ActualOnShelfDate = &now
	product.UpdatedAt = now

	if err := models.DB.Save(&product).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	models.LogOperation("product", product.ID, "on_shelf",
		fiber.Map{"status": oldStatus}, fiber.Map{"status": product.Status},
		"商品上架", user.ID, user.Name, user.Role)

	if !product.PlanOnShelfDate.IsZero() && now.After(product.PlanOnShelfDate) {
		daysLate := int(now.Sub(product.PlanOnShelfDate).Hours() / 24)
		if daysLate > 0 {
			var warehouseUser models.User
			models.DB.Where("role = ?", models.RoleWarehouse).First(&warehouseUser)
			models.CreateException(
				models.ExceptionTypeTiming,
				product.Name+"上架延迟"+strconv.Itoa(daysLate)+"天",
				"原计划"+product.PlanOnShelfDate.Format("2006-01-02")+"上架，实际"+now.Format("2006-01-02")+"才完成上架，延误"+strconv.Itoa(daysLate)+"天",
				"high",
				&product.ID, nil, nil, nil,
				product.SKU, product.Name, "", "", "",
				user.ID, user.Name, &warehouseUser.ID, warehouseUser.Name,
			)
		}
	}

	return c.JSON(product)
}

func OffShelfProduct(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid product ID",
		})
	}

	var product models.CollabProduct
	if err := models.DB.First(&product, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Product not found",
		})
	}

	oldStatus := product.Status
	now := time.Now()
	product.Status = models.ProductStatusOffShelf
	product.ActualOffShelfDate = &now
	product.UpdatedAt = now

	if err := models.DB.Save(&product).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	models.LogOperation("product", product.ID, "off_shelf",
		fiber.Map{"status": oldStatus}, fiber.Map{"status": product.Status},
		"商品下架", user.ID, user.Name, user.Role)

	return c.JSON(product)
}

func CompleteReview(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid product ID",
		})
	}

	var req ReviewRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request",
		})
	}

	var product models.CollabProduct
	if err := models.DB.First(&product, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Product not found",
		})
	}

	oldStatus := product.Status
	product.Status = models.ProductStatusReviewing
	product.ReviewNote = req.ReviewNote
	product.UpdatedAt = time.Now()

	if err := models.DB.Save(&product).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	models.LogOperation("product", product.ID, "complete_review",
		fiber.Map{"status": oldStatus}, fiber.Map{"status": product.Status},
		req.ReviewNote, user.ID, user.Name, user.Role)

	return c.JSON(product)
}
