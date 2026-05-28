package handlers

import (
	"camp-server/internal/middleware"
	"camp-server/internal/models"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type CreateReviewRequest struct {
	ProductID     string   `json:"productId"`
	ReviewType    string   `json:"reviewType"`
	TotalQuantity int      `json:"totalQuantity"`
	TotalSales    int      `json:"totalSales"`
	TotalRevenue  float64  `json:"totalRevenue"`
	InventoryLeft int      `json:"inventoryLeft"`
	DisplayScore  int      `json:"displayScore"`
	TimingScore   int      `json:"timingScore"`
	SalesScore    int      `json:"salesScore"`
	OverallScore  int      `json:"overallScore"`
	Problems      []string `json:"problems"`
	Lessons       []string `json:"lessons"`
	Improvements  []string `json:"improvements"`
}

func ListReviews(c *fiber.Ctx) error {
	productID := c.Query("productId")
	reviewType := c.Query("reviewType")

	query := models.DB.Model(&models.ReviewRecord{})
	if productID != "" {
		query = query.Where("product_id = ?", productID)
	}
	if reviewType != "" {
		query = query.Where("review_type = ?", reviewType)
	}

	var reviews []models.ReviewRecord
	if err := query.Order("created_at DESC").Find(&reviews).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(reviews)
}

func GetReview(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid review ID",
		})
	}

	var review models.ReviewRecord
	if err := models.DB.First(&review, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Review not found",
		})
	}

	logs, _ := models.GetOperationLogs("review", id)

	return c.JSON(fiber.Map{
		"review": review,
		"logs":   logs,
	})
}

func CreateReview(c *fiber.Ctx) error {
	user := middleware.GetUser(c)

	var req CreateReviewRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	productID, err := uuid.Parse(req.ProductID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid product ID",
		})
	}

	var product models.CollabProduct
	if err := models.DB.First(&product, "id = ?", productID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Product not found",
		})
	}

	review := &models.ReviewRecord{
		ProductID:     productID,
		ProductSKU:    product.SKU,
		ProductName:   product.Name,
		ReviewType:    req.ReviewType,
		TotalQuantity: req.TotalQuantity,
		TotalSales:    req.TotalSales,
		TotalRevenue:  req.TotalRevenue,
		InventoryLeft: req.InventoryLeft,
		DisplayScore:  req.DisplayScore,
		TimingScore:   req.TimingScore,
		SalesScore:    req.SalesScore,
		OverallScore:  req.OverallScore,
		Problems:      req.Problems,
		Lessons:       req.Lessons,
		Improvements:  req.Improvements,
		ReviewedBy:    user.ID,
		ReviewedByName: user.Name,
		ReviewedAt:    time.Now(),
		CreatedAt:     time.Now(),
	}

	if err := models.DB.Create(review).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	models.LogOperation("review", review.ID, "create", nil, review,
		"创建复盘记录", user.ID, user.Name, user.Role)

	models.DB.Model(&models.CollabProduct{}).Where("id = ?", productID).Update("status", models.ProductStatusReviewing)

	return c.JSON(review)
}

func GetProductReviewSummary(c *fiber.Ctx) error {
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

	var totalQty int
	var totalInventoryLeft int
	models.DB.Model(&models.Inventory{}).Where("product_id = ?", id).Select("COALESCE(SUM(quantity), 0)").Scan(&totalQty)
	models.DB.Model(&models.Inventory{}).Where("product_id = ?", id).Select("COALESCE(SUM(quantity), 0)").Scan(&totalInventoryLeft)

	var totalRestock int
	models.DB.Model(&models.Order{}).Where("product_id = ? AND type = ? AND status = ?", id, models.OrderTypeRestock, models.OrderStatusCompleted).
		Select("COALESCE(SUM(quantity), 0)").Scan(&totalRestock)

	var totalTransferIn int
	models.DB.Model(&models.Order{}).Where("product_id = ? AND type = ? AND status = ? AND to_store_id IS NOT NULL", id, models.OrderTypeTransfer, models.OrderStatusCompleted).
		Select("COALESCE(SUM(quantity), 0)").Scan(&totalTransferIn)

	var totalExchange int
	models.DB.Model(&models.Order{}).Where("product_id = ? AND type = ? AND status = ?", id, models.OrderTypeExchange, models.OrderStatusCompleted).
		Select("COALESCE(SUM(quantity), 0)").Scan(&totalExchange)

	var inspectionCount int64
	var exceptionCount int64
	models.DB.Model(&models.Inspection{}).Where("product_id = ?", id).Count(&inspectionCount)
	models.DB.Model(&models.ExceptionRecord{}).Where("product_id = ?", id).Count(&exceptionCount)

	var avgDisplayScore float64
	var inspections []models.Inspection
	models.DB.Where("product_id = ?", id).Find(&inspections)
	if len(inspections) > 0 {
		passedCount := 0
		for _, insp := range inspections {
			if insp.DisplayCorrect {
				passedCount++
			}
		}
		avgDisplayScore = float64(passedCount) / float64(len(inspections)) * 100
	}

	var reviews []models.ReviewRecord
	models.DB.Where("product_id = ?", id).Order("created_at DESC").Find(&reviews)

	return c.JSON(fiber.Map{
		"product": product,
		"summary": fiber.Map{
			"totalQuantity":      totalQty + totalRestock + totalTransferIn,
			"totalSales":         product.TotalSales,
			"totalRevenue":       product.TotalRevenue,
			"inventoryLeft":      totalInventoryLeft,
			"totalRestock":       totalRestock,
			"totalTransfer":      totalTransferIn,
			"totalExchange":      totalExchange,
			"inspectionCount":    inspectionCount,
			"exceptionCount":     exceptionCount,
			"avgDisplayScore":    int(avgDisplayScore),
			"planOnShelfDate":    product.PlanOnShelfDate,
			"actualOnShelfDate":  product.ActualOnShelfDate,
			"planOffShelfDate":   product.PlanOffShelfDate,
			"actualOffShelfDate": product.ActualOffShelfDate,
		},
		"inspections": inspections,
		"reviews":     reviews,
	})
}
