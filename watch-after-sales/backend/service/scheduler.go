package service

import (
	"log"
	"time"

	"watch-after-sales/backend/model"

	"gorm.io/gorm"
)

type Scheduler struct {
	db           *gorm.DB
	partService  *PartService
	stopChan     chan struct{}
}

func NewScheduler(db *gorm.DB, partService *PartService) *Scheduler {
	return &Scheduler{
		db:          db,
		partService: partService,
		stopChan:    make(chan struct{}),
	}
}

func (s *Scheduler) Start() {
	go s.runCallbackChecker()
	go s.runLowStockChecker()
	go s.runOverdueRepairChecker()
}

func (s *Scheduler) Stop() {
	close(s.stopChan)
}

func (s *Scheduler) runCallbackChecker() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-s.stopChan:
			return
		case <-ticker.C:
			s.checkOverdueCallbacks()
		}
	}
}

func (s *Scheduler) runLowStockChecker() {
	ticker := time.NewTicker(10 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-s.stopChan:
			return
		case <-ticker.C:
			s.checkLowStock()
		}
	}
}

func (s *Scheduler) runOverdueRepairChecker() {
	ticker := time.NewTicker(15 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-s.stopChan:
			return
		case <-ticker.C:
			s.checkOverdueRepairs()
		}
	}
}

func (s *Scheduler) checkOverdueCallbacks() {
	var callbacks []model.SatisfactionCallback
	now := time.Now()
	if err := s.db.Where("completed_at IS NULL AND scheduled_at < ?", now).Find(&callbacks).Error; err != nil {
		log.Printf("[Scheduler] Error checking overdue callbacks: %v", err)
		return
	}
	if len(callbacks) > 0 {
		log.Printf("[Scheduler] Found %d overdue callbacks", len(callbacks))
	}
}

func (s *Scheduler) checkLowStock() {
	parts, err := s.partService.GetLowStockParts()
	if err != nil {
		log.Printf("[Scheduler] Error checking low stock: %v", err)
		return
	}
	if len(parts) > 0 {
		log.Printf("[Scheduler] Found %d low stock parts", len(parts))
	}
}

func (s *Scheduler) checkOverdueRepairs() {
	var orders []model.RepairOrder
	now := time.Now()
	if err := s.db.Where("estimated_completion IS NOT NULL AND estimated_completion < ? AND status NOT IN ?", now, []string{"completed", "picked_up"}).Find(&orders).Error; err != nil {
		log.Printf("[Scheduler] Error checking overdue repairs: %v", err)
		return
	}
	if len(orders) > 0 {
		log.Printf("[Scheduler] Found %d overdue repairs", len(orders))
	}
}
