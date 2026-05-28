package handlers

import (
	"camp-server/internal/middleware"
	"camp-server/internal/models"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type CreateInspectionRequest struct {
	ProductID      string   `json:"productId"`
	StoreID        string   `json:"storeId"`
	DisplayCorrect bool     `json:"displayCorrect"`
	DisplayPosition string  `json:"displayPosition"`
	PhotoURLs      []string `json:"photoUrls"`
	InventoryCheck bool     `json:"inventoryCheck"`
	ExpectedQty    int      `json:"expectedQty"`
	ActualQty      int      `json:"actualQty"`
	Issues         []string `json:"issues"`
	Remark         string   `json:"remark"`
}

type FollowUpRequest struct {
	FollowUpNote string `json:"followUpNote"`
	FollowUpBy   string `json:"followUpBy"`
}

type CloseInspectionRequest struct {
	ClosingNote string `json:"closingNote"`
}

func ListInspections(c *fiber.Ctx) error {
	status := c.Query("status")
	productID := c.Query("productId")
	storeID := c.Query("storeId")

	query := models.DB.Model(&models.Inspection{})
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if productID != "" {
		query = query.Where("product_id = ?", productID)
	}
	if storeID != "" {
		query = query.Where("store_id = ?", storeID)
	}

	var inspections []models.Inspection
	if err := query.Order("created_at DESC").Find(&inspections).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(inspections)
}

func GetInspection(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid inspection ID",
		})
	}

	var inspection models.Inspection
	if err := models.DB.First(&inspection, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Inspection not found",
		})
	}

	logs, _ := models.GetOperationLogs("inspection", id)

	return c.JSON(fiber.Map{
		"inspection": inspection,
		"logs":       logs,
	})
}

func CreateInspection(c *fiber.Ctx) error {
	user := middleware.GetUser(c)

	var req CreateInspectionRequest
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

	storeID, err := uuid.Parse(req.StoreID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid store ID",
		})
	}

	var product models.CollabProduct
	if err := models.DB.First(&product, "id = ?", productID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Product not found",
		})
	}

	var store models.Store
	if err := models.DB.First(&store, "id = ?", storeID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Store not found",
		})
	}

	status := models.InspectionStatusPassed
	deviation := req.ActualQty - req.ExpectedQty

	if !req.DisplayCorrect || (req.InventoryCheck && (deviation > 5 || deviation < -5)) || len(req.Issues) > 0 {
		status = models.InspectionStatusException
	}

	inspection := &models.Inspection{
		ProductID:      productID,
		ProductSKU:     product.SKU,
		ProductName:    product.Name,
		StoreID:        storeID,
		StoreCode:      store.Code,
		StoreName:      store.Name,
		Status:         status,
		DisplayCorrect: req.DisplayCorrect,
		DisplayPosition: req.DisplayPosition,
		PhotoURLs:      req.PhotoURLs,
		InventoryCheck: req.InventoryCheck,
		ExpectedQty:    req.ExpectedQty,
		ActualQty:      req.ActualQty,
		DeviationQty:   deviation,
		Issues:         req.Issues,
		InspectorID:    user.ID,
		InspectorName:  user.Name,
		Remark:         req.Remark,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if err := models.DB.Create(inspection).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	models.LogOperation("inspection", inspection.ID, "create", nil, inspection,
		"创建巡店记录", user.ID, user.Name, user.Role)

	if status == models.InspectionStatusException {
		var warehouse models.User
		models.DB.Where("role = ?", models.RoleWarehouse).First(&warehouse)

		exType := models.ExceptionTypeDisplay
		severity := "medium"
		if req.InventoryCheck && (deviation > 10 || deviation < -10) {
			exType = models.ExceptionTypeInventory
			severity = "high"
		}

		title := store.Code + "巡店发现异常"
		if len(req.Issues) > 0 {
			title = store.Code + ":" + req.Issues[0]
		}

		models.CreateException(
			exType, title, inspection.Remark, severity,
			&productID, &storeID, nil, &inspection.ID,
			product.SKU, product.Name, store.Code, store.Name, "",
			user.ID, user.Name, &warehouse.ID, warehouse.Name,
		)
	}

	return c.JSON(inspection)
}

func FollowUpInspection(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid inspection ID",
		})
	}

	var req FollowUpRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	var inspection models.Inspection
	if err := models.DB.First(&inspection, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Inspection not found",
		})
	}

	followUpBy, err := uuid.Parse(req.FollowUpBy)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid follow-up user ID",
		})
	}

	var followUpUser models.User
	if err := models.DB.First(&followUpUser, "id = ?", followUpBy).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Follow-up user not found",
		})
	}

	oldInspection := inspection
	inspection.FollowUpBy = &followUpBy
	inspection.FollowUpByName = followUpUser.Name
	inspection.FollowUpNote = req.FollowUpNote
	inspection.UpdatedAt = time.Now()

	if err := models.DB.Save(&inspection).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	models.LogOperation("inspection", inspection.ID, "follow_up", oldInspection, inspection,
		req.FollowUpNote, user.ID, user.Name, user.Role)

	return c.JSON(inspection)
}

func CloseInspection(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid inspection ID",
		})
	}

	var req CloseInspectionRequest
	if err := c.BodyParser(&req); err != nil {
		if err.Error() != "EOF" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
	}

	var inspection models.Inspection
	if err := models.DB.First(&inspection, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Inspection not found",
		})
	}

	oldInspection := inspection
	now := time.Now()
	inspection.Status = models.InspectionStatusClosed
	inspection.ClosedAt = &now
	inspection.UpdatedAt = now

	if req.ClosingNote != "" {
		inspection.FollowUpNote = req.ClosingNote
	}

	if err := models.DB.Save(&inspection).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	models.LogOperation("inspection", inspection.ID, "close", oldInspection, inspection,
		req.ClosingNote, user.ID, user.Name, user.Role)

	return c.JSON(inspection)
}
