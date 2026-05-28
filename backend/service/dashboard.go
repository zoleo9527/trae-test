package service

import (
	"instrument-rental/database"
	"instrument-rental/model"
	"strconv"
)

type DashboardService struct{}

func NewDashboardService() *DashboardService { return &DashboardService{} }

type DashboardStats struct {
	PendingReturns       int64 `json:"pending_returns"`
	RejectedReturns      int64 `json:"rejected_returns"`
	NeedsReviewReturns   int64 `json:"needs_review_returns"`
	DisputedReturns      int64 `json:"disputed_returns"`
	PendingMaintenance   int64 `json:"pending_maintenance"`
	OverdueRentals       int64 `json:"overdue_rentals"`
	PendingPayments      int64 `json:"pending_payments"`
	OverduePayments      int64 `json:"overdue_payments"`
	ActiveRentals        int64 `json:"active_rentals"`
	ActiveSchools        int64 `json:"active_schools"`
	AvailableInstruments int64 `json:"available_instruments"`
	RentedInstruments    int64 `json:"rented_instruments"`
}

type RecentActivity struct {
	Type        string `json:"type"`
	ID          uint   `json:"id"`
	Description string `json:"description"`
	CreatedAt   string `json:"created_at"`
}

type PendingItem struct {
	Category    string `json:"category"`
	EntityType  string `json:"entity_type"`
	EntityID    uint   `json:"entity_id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Status      string `json:"status"`
	CreatedAt   string `json:"created_at"`
	Meta        map[string]any `json:"meta,omitempty"`
}

func (s *DashboardService) GetStats() (*DashboardStats, error) {
	stats := &DashboardStats{}
	database.DB.Model(&model.ReturnRecord{}).Where("status = ?", model.ReturnPendingReview).Count(&stats.PendingReturns)
	database.DB.Model(&model.ReturnRecord{}).Where("status = ?", model.ReturnRejected).Count(&stats.RejectedReturns)
	database.DB.Model(&model.ReturnRecord{}).Where("status = ?", model.ReturnNeedsReview).Count(&stats.NeedsReviewReturns)
	database.DB.Model(&model.ReturnRecord{}).Where("status = ?", model.ReturnDisputed).Count(&stats.DisputedReturns)
	database.DB.Model(&model.Maintenance{}).Where("status = ?", model.MaintenancePending).Count(&stats.PendingMaintenance)
	database.DB.Model(&model.Rental{}).Where("status = ?", model.RentalOverdue).Count(&stats.OverdueRentals)
	database.DB.Model(&model.Payment{}).Where("status = ?", model.PaymentPending).Count(&stats.PendingPayments)
	database.DB.Model(&model.Payment{}).Where("status = ?", model.PaymentOverdue).Count(&stats.OverduePayments)
	database.DB.Model(&model.Rental{}).Where("status = ?", model.RentalActive).Count(&stats.ActiveRentals)
	database.DB.Model(&model.School{}).Where("cooperation_status = ?", model.SchoolActive).Count(&stats.ActiveSchools)
	database.DB.Model(&model.Instrument{}).Where("status = ?", model.InstrumentAvailable).Count(&stats.AvailableInstruments)
	database.DB.Model(&model.Instrument{}).Where("status = ?", model.InstrumentRented).Count(&stats.RentedInstruments)
	return stats, nil
}

func (s *DashboardService) GetRecentActivities(limit int) ([]RecentActivity, error) {
	var activities []RecentActivity
	var logs []model.AuditLog
	database.DB.Preload("User").Order("created_at DESC").Limit(limit).Find(&logs)
	for _, l := range logs {
		desc := l.Action + " " + l.EntityType
		if l.UserID > 0 && l.User.ID > 0 {
			desc += " by " + l.User.Name
		}
		activities = append(activities, RecentActivity{
			Type:        l.EntityType,
			ID:          l.EntityID,
			Description: desc,
			CreatedAt:   l.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}
	return activities, nil
}

func (s *DashboardService) GetPendingItems() ([]PendingItem, error) {
	var items []PendingItem

	var returns []model.ReturnRecord
	database.DB.Preload("Rental").Preload("Rental.Instrument").Preload("Rental.School").
		Where("status = ?", model.ReturnPendingReview).
		Order("created_at DESC").Find(&returns)
	for _, r := range returns {
		title := "归还待审核"
		if r.Rental.ID > 0 {
			title = r.Rental.School.Name + " - " + r.Rental.Instrument.Name + " 归还待审"
		}
		items = append(items, PendingItem{
			Category:    "pending",
			EntityType:  "return",
			EntityID:    r.ID,
			Title:       title,
			Description: r.DamageDescription,
			Status:      string(r.Status),
			CreatedAt:   r.CreatedAt.Format("2006-01-02 15:04:05"),
			Meta: map[string]any{
				"rental_id":          r.RentalID,
				"condition":          string(r.Condition),
				"deposit_deduction":  r.DepositDeduction,
				"deposit_refund":     r.DepositRefund,
			},
		})
	}

	var maintenances []model.Maintenance
	database.DB.Preload("Instrument").Preload("Technician").
		Where("status = ?", model.MaintenancePending).
		Order("created_at DESC").Find(&maintenances)
	for _, m := range maintenances {
		items = append(items, PendingItem{
			Category:    "pending",
			EntityType:  "maintenance",
			EntityID:    m.ID,
			Title:       m.Instrument.Name + " 维修待处理",
			Description: m.Description,
			Status:      string(m.Status),
			CreatedAt:   m.CreatedAt.Format("2006-01-02 15:04:05"),
			Meta: map[string]any{
				"instrument_id": m.InstrumentID,
				"type":          string(m.Type),
				"cost":          m.Cost,
				"technician":    m.Technician.Name,
			},
		})
	}

	var rentals []model.Rental
	database.DB.Preload("Instrument").Preload("School").
		Where("status = ?", model.RentalOverdue).
		Order("expected_return_date ASC").Find(&rentals)
	for _, r := range rentals {
		items = append(items, PendingItem{
			Category:    "pending",
			EntityType:  "rental",
			EntityID:    r.ID,
			Title:       r.School.Name + " - " + r.Instrument.Name + " 已逾期",
			Description: "应还日期: " + r.ExpectedReturnDate.Format("2006-01-02"),
			Status:      string(r.Status),
			CreatedAt:   r.CreatedAt.Format("2006-01-02 15:04:05"),
			Meta: map[string]any{
				"instrument_id":       r.InstrumentID,
				"school_id":           r.SchoolID,
				"expected_return":     r.ExpectedReturnDate.Format("2006-01-02"),
				"deposit_amount":      r.DepositAmount,
			},
		})
	}

	var payments []model.Payment
	database.DB.Preload("School").Preload("Rental").Preload("Rental.Instrument").
		Where("status IN ?", []model.PaymentStatus{model.PaymentPending, model.PaymentPartial}).
		Order("due_date ASC").Find(&payments)
	for _, p := range payments {
		title := p.School.Name + " 回款待处理"
		if p.Rental.ID > 0 {
			title = p.School.Name + " - " + p.Rental.Instrument.Name + " 回款待处理"
		}
		items = append(items, PendingItem{
			Category:    "pending",
			EntityType:  "payment",
			EntityID:    p.ID,
			Title:       title,
			Description: "应付款: " + p.DueDate.Format("2006-01-02") + ", 金额: " + fmtFloat(p.Amount),
			Status:      string(p.Status),
			CreatedAt:   p.CreatedAt.Format("2006-01-02 15:04:05"),
			Meta: map[string]any{
				"rental_id":     p.RentalID,
				"school_id":     p.SchoolID,
				"amount":        p.Amount,
				"paid_amount":   p.PaidAmount,
				"due_date":      p.DueDate.Format("2006-01-02"),
				"invoice":       p.InvoiceNumber,
			},
		})
	}

	return items, nil
}

func (s *DashboardService) GetRejectedItems() ([]PendingItem, error) {
	var items []PendingItem

	var returns []model.ReturnRecord
	database.DB.Preload("Rental").Preload("Rental.Instrument").Preload("Rental.School").
		Where("status = ?", model.ReturnRejected).
		Order("created_at DESC").Find(&returns)
	for _, r := range returns {
		title := "归还已驳回"
		if r.Rental.ID > 0 {
			title = r.Rental.School.Name + " - " + r.Rental.Instrument.Name + " 归还已驳回"
		}
		items = append(items, PendingItem{
			Category:    "rejected",
			EntityType:  "return",
			EntityID:    r.ID,
			Title:       title,
			Description: r.ReviewNotes,
			Status:      string(r.Status),
			CreatedAt:   r.UpdatedAt.Format("2006-01-02 15:04:05"),
			Meta: map[string]any{
				"rental_id":         r.RentalID,
				"condition":         string(r.Condition),
				"review_notes":      r.ReviewNotes,
				"deposit_deduction": r.DepositDeduction,
			},
		})
	}

	return items, nil
}

func (s *DashboardService) GetNeedsReviewItems() ([]PendingItem, error) {
	var items []PendingItem

	var returns []model.ReturnRecord
	database.DB.Preload("Rental").Preload("Rental.Instrument").Preload("Rental.School").
		Where("status IN ?", []model.ReturnStatus{model.ReturnNeedsReview, model.ReturnDisputed}).
		Order("created_at DESC").Find(&returns)
	for _, r := range returns {
		title := "需回查"
		if r.Rental.ID > 0 {
			title = r.Rental.School.Name + " - " + r.Rental.Instrument.Name + " 需回查"
		}
		items = append(items, PendingItem{
			Category:    "needs_review",
			EntityType:  "return",
			EntityID:    r.ID,
			Title:       title,
			Description: r.ReviewNotes,
			Status:      string(r.Status),
			CreatedAt:   r.UpdatedAt.Format("2006-01-02 15:04:05"),
			Meta: map[string]any{
				"rental_id":         r.RentalID,
				"condition":         string(r.Condition),
				"review_notes":      r.ReviewNotes,
				"deposit_deduction": r.DepositDeduction,
			},
		})
	}

	return items, nil
}

func fmtFloat(f float64) string {
	return strconv.FormatFloat(f, 'f', 2, 64)
}
