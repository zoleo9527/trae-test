package handlers

import (
	"camp-server/internal/middleware"
	"camp-server/internal/models"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type CreateOrderRequest struct {
	Type           models.OrderType `json:"type"`
	ProductID      string      `json:"productId"`
	FromStoreID    string      `json:"fromStoreId"`
	ToStoreID      string      `json:"toStoreId"`
	Quantity       int         `json:"quantity"`
	MemberPhone    string      `json:"memberPhone"`
	MemberName     string      `json:"memberName"`
	ExchangePoints int         `json:"exchangePoints"`
	Remark         string      `json:"remark"`
}

func ListOrders(c *fiber.Ctx) error {
	orderType := c.Query("type")
	status := c.Query("status")
	storeCode := c.Query("storeCode")

	query := models.DB.Model(&models.Order{})
	if orderType != "" {
		query = query.Where("type = ?", orderType)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if storeCode != "" {
		query = query.Where("from_store_code = ? OR to_store_code = ?", storeCode, storeCode)
	}

	var orders []models.Order
	if err := query.Order("created_at DESC").Find(&orders).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(orders)
}

func GetOrder(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid order ID",
		})
	}

	var order models.Order
	if err := models.DB.First(&order, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Order not found",
		})
	}

	logs, _ := models.GetOperationLogs("order", id)

	return c.JSON(fiber.Map{
		"order": order,
		"logs":  logs,
	})
}

func CreateOrder(c *fiber.Ctx) error {
	user := middleware.GetUser(c)

	var req CreateOrderRequest
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

	toStoreID, err := uuid.Parse(req.ToStoreID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid to store ID",
		})
	}

	var product models.CollabProduct
	if err := models.DB.First(&product, "id = ?", productID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Product not found",
		})
	}

	var toStore models.Store
	if err := models.DB.First(&toStore, "id = ?", toStoreID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "To store not found",
		})
	}

	var fromStoreID *uuid.UUID
	var fromStoreCode string
	if req.Type == models.OrderTypeTransfer && req.FromStoreID != "" {
		fsID, err := uuid.Parse(req.FromStoreID)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid from store ID",
			})
		}
		fromStoreID = &fsID

		var fromStore models.Store
		if err := models.DB.First(&fromStore, "id = ?", fsID).Error; err != nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "From store not found",
			})
		}
		fromStoreCode = fromStore.Code
	}

	order := &models.Order{
		OrderNo:        fmt.Sprintf("ORD-%s-%04d", time.Now().Format("200601"), time.Now().Unix()%10000),
		Type:           req.Type,
		Status:         models.OrderStatusPending,
		ProductID:      productID,
		ProductSKU:     product.SKU,
		ProductName:    product.Name,
		FromStoreID:    fromStoreID,
		FromStoreCode:  fromStoreCode,
		ToStoreID:      toStoreID,
		ToStoreCode:    toStore.Code,
		Quantity:       req.Quantity,
		MemberPhone:    req.MemberPhone,
		MemberName:     req.MemberName,
		ExchangePoints: req.ExchangePoints,
		Remark:         req.Remark,
		CreatedBy:    user.ID,
		CreatedByName: user.Name,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if err := models.DB.Create(order).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	models.LogOperation("order", order.ID, "create", nil, order,
		fmt.Sprintf("创建%s单", order.Type), user.ID, user.Name, user.Role)

	return c.JSON(order)
}

func ApproveOrder(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid order ID",
		})
	}

	var order models.Order
	if err := models.DB.First(&order, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Order not found",
		})
	}

	oldStatus := order.Status
	order.Status = models.OrderStatusApproved
	order.ApprovedBy = &user.ID
	order.ApprovedByName = user.Name
	order.UpdatedAt = time.Now()

	if err := models.DB.Save(&order).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	models.LogOperation("order", order.ID, "approve",
		fiber.Map{"status": oldStatus}, fiber.Map{"status": order.Status},
		"审批通过", user.ID, user.Name, user.Role)

	return c.JSON(order)
}

func RejectOrder(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid order ID",
		})
	}

	var req RejectRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request",
		})
	}

	var order models.Order
	if err := models.DB.First(&order, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Order not found",
		})
	}

	oldStatus := order.Status
	order.Status = models.OrderStatusRejected
	order.RejectReason = req.Reason
	order.UpdatedAt = time.Now()

	if err := models.DB.Save(&order).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	models.LogOperation("order", order.ID, "reject",
		fiber.Map{"status": oldStatus}, fiber.Map{"status": order.Status},
		req.Reason, user.ID, user.Name, user.Role)

	return c.JSON(order)
}

func ShipOrder(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid order ID",
		})
	}

	var order models.Order
	if err := models.DB.First(&order, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Order not found",
		})
	}

	if order.Status != models.OrderStatusApproved {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Order must be approved before shipping",
		})
	}

	oldStatus := order.Status
	now := time.Now()
	order.Status = models.OrderStatusShipped
	order.ShippedAt = &now
	order.UpdatedAt = now

	if err := models.DB.Save(&order).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	if order.Type == models.OrderTypeRestock || order.Type == models.OrderTypeTransfer {
		var inv models.Inventory
		if err := models.DB.Where("product_id = ? AND store_id = ?", order.ProductID, order.ToStoreID).First(&inv).Error; err == nil {
			inv.Quantity += order.Quantity
			inv.AvailableQty += order.Quantity
			inv.UpdatedAt = now
			models.DB.Save(&inv)
		}

		if order.Type == models.OrderTypeTransfer && order.FromStoreID != nil {
			var fromInv models.Inventory
			if err := models.DB.Where("product_id = ? AND store_id = ?", order.ProductID, *order.FromStoreID).First(&fromInv).Error; err == nil {
				fromInv.Quantity -= order.Quantity
				fromInv.AvailableQty -= order.Quantity
				fromInv.UpdatedAt = now
				models.DB.Save(&fromInv)
			}
		}
	}

	models.LogOperation("order", order.ID, "ship",
		fiber.Map{"status": oldStatus}, fiber.Map{"status": order.Status},
		"订单已发货", user.ID, user.Name, user.Role)

	return c.JSON(order)
}

func ReceiveOrder(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid order ID",
		})
	}

	var order models.Order
	if err := models.DB.First(&order, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Order not found",
		})
	}

	if order.Status != models.OrderStatusShipped {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Order must be shipped before receiving",
		})
	}

	oldStatus := order.Status
	now := time.Now()
	order.Status = models.OrderStatusReceived
	order.ReceivedAt = &now
	order.UpdatedAt = now

	if order.Type == models.OrderTypeExchange {
		var inv models.Inventory
		if err := models.DB.Where("product_id = ? AND store_id = ?", order.ProductID, order.ToStoreID).First(&inv).Error; err == nil {
			inv.Quantity -= order.Quantity
			inv.AvailableQty -= order.Quantity
			inv.UpdatedAt = now
			models.DB.Save(&inv)
		}
	}

	if err := models.DB.Save(&order).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	if order.Status == models.OrderStatusReceived && order.Type == models.OrderTypeExchange {
		order.Status = models.OrderStatusCompleted
		models.DB.Save(&order)
	}

	models.LogOperation("order", order.ID, "receive",
		fiber.Map{"status": oldStatus}, fiber.Map{"status": order.Status},
		"订单已签收", user.ID, user.Name, user.Role)

	return c.JSON(order)
}

func CompleteOrder(c *fiber.Ctx) error {
	user := middleware.GetUser(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid order ID",
		})
	}

	var order models.Order
	if err := models.DB.First(&order, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Order not found",
		})
	}

	if order.Status != models.OrderStatusReceived {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Order must be received before completing",
		})
	}

	oldStatus := order.Status
	order.Status = models.OrderStatusCompleted
	order.UpdatedAt = time.Now()

	if err := models.DB.Save(&order).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	var product models.CollabProduct
	if err := models.DB.First(&product, "id = ?", order.ProductID).Error; err == nil {
		product.TotalSales += order.Quantity
		product.TotalRevenue += float64(order.Quantity) * product.RetailPrice
		models.DB.Save(&product)
	}

	models.LogOperation("order", order.ID, "complete",
		fiber.Map{"status": oldStatus}, fiber.Map{"status": order.Status},
		"订单已完成", user.ID, user.Name, user.Role)

	return c.JSON(order)
}
