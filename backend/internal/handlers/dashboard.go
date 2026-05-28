package handlers

import (
	"camp-server/internal/models"

	"github.com/gofiber/fiber/v2"
)

type DashboardStats struct {
	PendingApproval   int64 `json:"pendingApproval"`
	RejectedItems     int64 `json:"rejectedItems"`
	NeedReview        int64 `json:"needReview"`
	OpenExceptions    int64 `json:"openExceptions"`
	OnShelfProducts   int64 `json:"onShelfProducts"`
	PendingInspection int64 `json:"pendingInspection"`
}

type PendingItem struct {
	ID          string `json:"id"`
	Type        string `json:"type"`
	Title       string `json:"title"`
	Status      string `json:"status"`
	CreatedAt   string `json:"createdAt"`
	CreatedBy   string `json:"createdBy"`
	Description string `json:"description"`
}

type DashboardData struct {
	Stats          DashboardStats `json:"stats"`
	PendingItems   []PendingItem  `json:"pendingItems"`
	RejectedItems  []PendingItem  `json:"rejectedItems"`
	NeedReviewItems []PendingItem `json:"needReviewItems"`
}

func GetDashboard(c *fiber.Ctx) error {
	var stats DashboardStats

	models.DB.Model(&models.CollabProduct{}).Where("status = ?", models.ProductStatusPending).Count(&stats.PendingApproval)
	models.DB.Model(&models.CollabProduct{}).Where("status = ?", models.ProductStatusRejected).Count(&stats.RejectedItems)
	models.DB.Model(&models.ExceptionRecord{}).Where("need_review = ? AND status = ?", true, models.ExceptionStatusReview).Count(&stats.NeedReview)
	models.DB.Model(&models.ExceptionRecord{}).Where("status IN ?", []models.ExceptionStatus{models.ExceptionStatusOpen, models.ExceptionStatusHandling}).Count(&stats.OpenExceptions)
	models.DB.Model(&models.CollabProduct{}).Where("status = ?", models.ProductStatusOnShelf).Count(&stats.OnShelfProducts)
	models.DB.Model(&models.Inspection{}).Where("status = ?", models.InspectionStatusPending).Count(&stats.PendingInspection)

	var pendingProducts []models.CollabProduct
	models.DB.Where("status = ?", models.ProductStatusPending).Order("created_at DESC").Find(&pendingProducts)

	var pendingOrders []models.Order
	models.DB.Where("status = ?", models.OrderStatusPending).Order("created_at DESC").Find(&pendingOrders)

	pendingItems := make([]PendingItem, 0)
	for _, p := range pendingProducts {
		pendingItems = append(pendingItems, PendingItem{
			ID:          p.ID.String(),
			Type:        "product",
			Title:       p.Name,
			Status:      string(p.Status),
			CreatedAt:   p.CreatedAt.Format("2006-01-02 15:04"),
			CreatedBy:   p.CreatedByName,
			Description: p.Description,
		})
	}
	for _, o := range pendingOrders {
		pendingItems = append(pendingItems, PendingItem{
			ID:          o.ID.String(),
			Type:        string(o.Type),
			Title:       o.OrderNo + " - " + o.ProductName,
			Status:      string(o.Status),
			CreatedAt:   o.CreatedAt.Format("2006-01-02 15:04"),
			CreatedBy:   o.CreatedByName,
			Description: o.Remark,
		})
	}

	var rejectedProducts []models.CollabProduct
	models.DB.Where("status = ?", models.ProductStatusRejected).Order("updated_at DESC").Find(&rejectedProducts)

	var rejectedOrders []models.Order
	models.DB.Where("status = ?", models.OrderStatusRejected).Order("updated_at DESC").Find(&rejectedOrders)

	rejectedItems := make([]PendingItem, 0)
	for _, p := range rejectedProducts {
		rejectedItems = append(rejectedItems, PendingItem{
			ID:          p.ID.String(),
			Type:        "product",
			Title:       p.Name,
			Status:      string(p.Status),
			CreatedAt:   p.UpdatedAt.Format("2006-01-02 15:04"),
			CreatedBy:   p.CreatedByName,
			Description: p.RejectReason,
		})
	}
	for _, o := range rejectedOrders {
		rejectedItems = append(rejectedItems, PendingItem{
			ID:          o.ID.String(),
			Type:        string(o.Type),
			Title:       o.OrderNo + " - " + o.ProductName,
			Status:      string(o.Status),
			CreatedAt:   o.UpdatedAt.Format("2006-01-02 15:04"),
			CreatedBy:   o.CreatedByName,
			Description: o.RejectReason,
		})
	}

	var needReviewExceptions []models.ExceptionRecord
	models.DB.Where("need_review = ?", true).Order("updated_at DESC").Find(&needReviewExceptions)

	needReviewItems := make([]PendingItem, 0)
	for _, e := range needReviewExceptions {
		needReviewItems = append(needReviewItems, PendingItem{
			ID:          e.ID.String(),
			Type:        string(e.Type),
			Title:       e.Title,
			Status:      string(e.Status),
			CreatedAt:   e.UpdatedAt.Format("2006-01-02 15:04"),
			CreatedBy:   e.AssignedToName,
			Description: e.ResolutionNote,
		})
	}

	return c.JSON(DashboardData{
		Stats:           stats,
		PendingItems:    pendingItems,
		RejectedItems:   rejectedItems,
		NeedReviewItems: needReviewItems,
	})
}
