package middleware

import (
	"github.com/cultural-store/inspection-service/internal/model"
	"github.com/gofiber/fiber/v2"
)

type StoreFetcher interface {
	GetReplenishmentOrderByID(id string) (*model.ReplenishmentOrder, error)
	GetTransferOrderByID(id string) (*model.TransferOrder, error)
	GetMemberRedemptionByID(id string) (*model.MemberRedemption, error)
	GetRectificationByID(id string) (*model.Rectification, error)
}

func RequireReplenishmentStoreAccess(fetcher StoreFetcher) fiber.Handler {
	return func(c *fiber.Ctx) error {
		role := c.Locals("role").(string)
		if role != "store_manager" {
			return c.Next()
		}
		userStoreID, ok := c.Locals("store_id").(string)
		if !ok || userStoreID == "" {
			return c.Status(403).JSON(fiber.Map{"error": "no store assigned"})
		}
		orderID := c.Params("id")
		if orderID == "" {
			return c.Next()
		}
		order, err := fetcher.GetReplenishmentOrderByID(orderID)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "order not found"})
		}
		if order.StoreID != userStoreID {
			return c.Status(403).JSON(fiber.Map{"error": "access denied: this order belongs to another store"})
		}
		return c.Next()
	}
}

func RequireTransferStoreAccess(fetcher StoreFetcher) fiber.Handler {
	return func(c *fiber.Ctx) error {
		role := c.Locals("role").(string)
		if role != "store_manager" {
			return c.Next()
		}
		userStoreID, ok := c.Locals("store_id").(string)
		if !ok || userStoreID == "" {
			return c.Status(403).JSON(fiber.Map{"error": "no store assigned"})
		}
		orderID := c.Params("id")
		if orderID == "" {
			return c.Next()
		}
		order, err := fetcher.GetTransferOrderByID(orderID)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "order not found"})
		}
		if order.FromStoreID != userStoreID && order.ToStoreID != userStoreID {
			return c.Status(403).JSON(fiber.Map{"error": "access denied: this transfer does not involve your store"})
		}
		return c.Next()
	}
}

func RequireRedemptionStoreAccess(fetcher StoreFetcher) fiber.Handler {
	return func(c *fiber.Ctx) error {
		role := c.Locals("role").(string)
		if role != "store_manager" {
			return c.Next()
		}
		userStoreID, ok := c.Locals("store_id").(string)
		if !ok || userStoreID == "" {
			return c.Status(403).JSON(fiber.Map{"error": "no store assigned"})
		}
		redemptionID := c.Params("id")
		if redemptionID == "" {
			return c.Next()
		}
		mr, err := fetcher.GetMemberRedemptionByID(redemptionID)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "redemption not found"})
		}
		if mr.StoreID != userStoreID {
			return c.Status(403).JSON(fiber.Map{"error": "access denied: this redemption belongs to another store"})
		}
		return c.Next()
	}
}

func RequireRectificationStoreAccess(fetcher StoreFetcher) fiber.Handler {
	return func(c *fiber.Ctx) error {
		role := c.Locals("role").(string)
		if role != "store_manager" {
			return c.Next()
		}
		userStoreID, ok := c.Locals("store_id").(string)
		if !ok || userStoreID == "" {
			return c.Status(403).JSON(fiber.Map{"error": "no store assigned"})
		}
		rectID := c.Params("id")
		if rectID == "" {
			return c.Next()
		}
		rect, err := fetcher.GetRectificationByID(rectID)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "rectification not found"})
		}
		if rect.StoreID != userStoreID {
			return c.Status(403).JSON(fiber.Map{"error": "access denied: this rectification belongs to another store"})
		}
		return c.Next()
	}
}
