package service

import (
	"instrument-rental/database"
	"instrument-rental/model"
)

type DashboardService struct{}

func NewDashboardService() *DashboardService { return &DashboardService{} }

type DashboardStats struct {
	PendingReturns      int64 `json:"pending_returns"`
	DisputedReturns     int64 `json:"disputed_returns"`
	PendingMaintenance  int64 `json:"pending_maintenance"`
	OverdueRentals      int64 `json:"overdue_rentals"`
	PendingPayments     int64 `json:"pending_payments"`
	OverduePayments     int64 `json:"overdue_payments"`
	ActiveRentals       int64 `json:"active_rentals"`
	ActiveSchools       int64 `json:"active_schools"`
	AvailableInstruments int64 `json:"available_instruments"`
	RentedInstruments   int64 `json:"rented_instruments"`
}

type RecentActivity struct {
	Type        string `json:"type"`
	ID          uint   `json:"id"`
	Description string `json:"description"`
	CreatedAt   string `json:"created_at"`
}

func (s *DashboardService) GetStats() (*DashboardStats, error) {
	stats := &DashboardStats{}
	database.DB.Model(&model.ReturnRecord{}).Where("status = ?", model.ReturnPendingReview).Count(&stats.PendingReturns)
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
