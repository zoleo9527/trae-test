package handlers

import (
	"camp-server/internal/middleware"
	"camp-server/internal/models"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type StockCountRequest struct {
	ActualQty int    `json:"actualQty"`
	Remark    string `json:"remark"`
}

type AdjustInventoryRequest struct {
	Quantity int    `json:"quantity"`
	Reason   string `json:"reason"`
}

func ListInventory(c *fiber.Ctx) error {
	productID := c.Query("productId")
	storeCode := c.Query("storeCode")

	query := models.DB.Model(&models.Inventory{})
	if productID != "" {
		query = query.Where("product_id = ?", productID)
	}
	if storeCode != "" {
		query = query.Where("store_code = ?", storeCode)
	}

	var inventory []models.Inventory
	if err := query.Order("updated_at DESC").Find(&inventory).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(inventory)
}

func GetInventory(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid inventory ID",
		})
	}

	var inventory models.Inventory
	if err := models.DB.First(&inventory, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Inventory not found",
		})
	}

	logs, _ := models.GetOperationLogs("inventory", id)

	return c.JSON(fiber.Map{
		"inventory": inventory,
		"logs":      logs,
	})
}

func StockCount(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid inventory ID",
		})
	}

	var req StockCountRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	var inventory models.Inventory
	if err := models.DB.First(&inventory, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Inventory not found",
		})
	}

	oldInventory := inventory
	now := time.Now()
	deviation := req.ActualQty - inventory.Quantity

	inventory.LastCountDate = &now
	inventory.LastCountQty = req.ActualQty
	inventory.DeviationQty = deviation
	inventory.UpdatedAt = now

	if deviation != 0 {
		inventory.Quantity = req.ActualQty
		inventory.AvailableQty = req.ActualQty - inventory.ReservedQty
	}

	if err := models.DB.Save(&inventory).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	models.LogOperation("inventory", inventory.ID, "stock_count", oldInventory, inventory,
		req.Remark, user.ID, user.Name, user.Role)

	if deviation > 5 || deviation < -5 {
		severity := "medium"
		if deviation > 10 || deviation < -10 {
			severity = "high"
		}

		var product models.CollabProduct
		var store models.Store
		models.DB.First(&product, "id = ?", inventory.ProductID)
		models.DB.First(&store, "id = ?", inventory.StoreID)

		var manager models.User
		models.DB.Where("role = ?", models.RoleManager).First(&manager)

		title := store.Code + "库存偏差" + strconv.Itoa(deviation) + "件"
		desc := "系统显示库存" + strconv.Itoa(oldInventory.Quantity) + "件，实际盘点" + strconv.Itoa(req.ActualQty) + "件，偏差" + strconv.Itoa(deviation) + "件"

		models.CreateException(
			models.ExceptionTypeInventory,
			title, desc, severity,
			&product.ID, &store.ID, nil, nil,
			product.SKU, product.Name, store.Code, store.Name, "",
			user.ID, user.Name, &manager.ID, manager.Name,
		)
	}

	return c.JSON(inventory)
}

func AdjustInventory(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid inventory ID",
		})
	}

	var req AdjustInventoryRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	var inventory models.Inventory
	if err := models.DB.First(&inventory, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Inventory not found",
		})
	}

	oldInventory := inventory
	inventory.Quantity += req.Quantity
	inventory.AvailableQty += req.Quantity
	inventory.UpdatedAt = time.Now()

	if err := models.DB.Save(&inventory).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	models.LogOperation("inventory", inventory.ID, "adjust", oldInventory, inventory,
		req.Reason, user.ID, user.Name, user.Role)

	return c.JSON(inventory)
}

func ListStores(c *fiber.Ctx) error {
	var stores []models.Store
	if err := models.DB.Where("is_active = ?", true).Order("code").Find(&stores).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(stores)
}
