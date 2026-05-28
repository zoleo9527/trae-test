package task

import (
	"instrument-rental/service"
	"time"

	"github.com/robfig/cron/v3"
)

type Scheduler struct {
	cron *cron.Cron
}

func NewScheduler() *Scheduler {
	return &Scheduler{
		cron: cron.New(cron.WithSeconds()),
	}
}

func (s *Scheduler) Start() {
	rentalSvc := service.NewRentalService()
	paymentSvc := service.NewPaymentService()

	s.cron.AddFunc("0 0 2 * * *", func() {
		now := time.Now().Format("2006-01-02 15:04:05")
		if count, err := rentalSvc.MarkOverdue(); err == nil && count > 0 {
			_ = now
		}
		if count, err := paymentSvc.MarkOverdue(); err == nil && count > 0 {
			_ = now
		}
	})

	s.cron.Start()
}

func (s *Scheduler) Stop() {
	s.cron.Stop()
}
