package worker

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/cultural-store/inspection-service/internal/model"
)

type Repo interface {
	ListInventoryRecordsWithDiscrepancy(storeID string) ([]model.InventoryRecord, error)
	UpsertInventory(inv *model.InventoryRecord) error
	ListOverdueRectifications() ([]model.Rectification, error)
	CreateAuditLog(log *model.AuditLog) error
	GetInventory(storeID, productID string) (*model.InventoryRecord, error)
}

type TaskType int

const (
	TaskInventorySyncCheck TaskType = iota
	TaskCobrandSync
	TaskOverdueCheck
)

type Task struct {
	Type      TaskType
	EntityID  string
	StoreID   string
	Scheduled time.Time
}

type AsyncWorker struct {
	tasks     chan Task
	quit      chan struct{}
	wg        sync.WaitGroup
	repo      Repo
	systemUserID   string
	systemUserName string
}

func NewAsyncWorker(repo Repo, systemUserID, systemUserName string) *AsyncWorker {
	return &AsyncWorker{
		tasks:          make(chan Task, 100),
		quit:           make(chan struct{}),
		repo:           repo,
		systemUserID:   systemUserID,
		systemUserName: systemUserName,
	}
}

func (w *AsyncWorker) Start() {
	w.wg.Add(1)
	go func() {
		defer w.wg.Done()
		for {
			select {
			case task := <-w.tasks:
				w.processTask(task)
			case <-w.quit:
				return
			}
		}
	}()
	w.wg.Add(1)
	go func() {
		defer w.wg.Done()
		ticker := time.NewTicker(1 * time.Hour)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				w.EnqueueOverdueCheck()
			case <-w.quit:
				return
			}
		}
	}()
	log.Println("async worker started")
}

func (w *AsyncWorker) Stop() {
	close(w.quit)
	w.wg.Wait()
	log.Println("async worker stopped")
}

func (w *AsyncWorker) EnqueueInventorySyncCheck(storeID string) {
	select {
	case w.tasks <- Task{Type: TaskInventorySyncCheck, StoreID: storeID, Scheduled: time.Now()}:
		log.Printf("enqueued inventory sync check for store %s", storeID)
	default:
		log.Printf("task queue full, dropping inventory sync check for store %s", storeID)
	}
}

func (w *AsyncWorker) EnqueueCobrandSync(productID string) {
	select {
	case w.tasks <- Task{Type: TaskCobrandSync, EntityID: productID, Scheduled: time.Now()}:
		log.Printf("enqueued cobrand sync for product %s", productID)
	default:
		log.Printf("task queue full, dropping cobrand sync for product %s", productID)
	}
}

func (w *AsyncWorker) EnqueueOverdueCheck() {
	select {
	case w.tasks <- Task{Type: TaskOverdueCheck, Scheduled: time.Now()}:
		log.Println("enqueued overdue rectification check")
	default:
		log.Println("task queue full, dropping overdue check")
	}
}

func (w *AsyncWorker) processTask(task Task) {
	switch task.Type {
	case TaskInventorySyncCheck:
		w.processInventorySync(task.StoreID)
	case TaskCobrandSync:
		w.processCobrandSync(task.EntityID)
	case TaskOverdueCheck:
		w.processOverdueCheck()
	}
}

func (w *AsyncWorker) processInventorySync(storeID string) {
	if w.repo == nil {
		log.Printf("[worker] repo not available, skipping inventory sync")
		return
	}
	discrepancies, err := w.repo.ListInventoryRecordsWithDiscrepancy(storeID)
	if err != nil {
		log.Printf("[worker] failed to list inventory discrepancies: %v", err)
		return
	}
	if len(discrepancies) == 0 {
		log.Printf("[worker] no inventory discrepancies found for store %s", storeID)
		return
	}
	log.Printf("[worker] found %d inventory discrepancies for store %s, resolving...", len(discrepancies), storeID)
	for _, d := range discrepancies {
		oldQty := d.Quantity
		oldSys := d.SystemQty
		diff := oldQty - oldSys
		now := time.Now()
		d.SystemQty = oldQty
		d.LastCheckedAt = &now
		if err := w.repo.UpsertInventory(&d); err != nil {
			log.Printf("[worker] failed to resolve inventory discrepancy for product %s: %v", d.ProductID, err)
			continue
		}
		var oldJSON, newJSON *string
		if b, err := json.Marshal(map[string]int{"quantity": oldQty, "system_quantity": oldSys}); err == nil {
			s := string(b)
			oldJSON = &s
		}
		if b, err := json.Marshal(map[string]int{"quantity": d.Quantity, "system_quantity": d.SystemQty}); err == nil {
			s := string(b)
			newJSON = &s
		}
		audit := &model.AuditLog{
			EntityType:   "inventory",
			EntityID:     d.ID,
			Action:       "update",
			OldValue:     oldJSON,
			NewValue:     newJSON,
			OperatorID:   w.systemUserID,
			OperatorName: w.systemUserName,
			Note:         formatDiffNote(diff, oldSys, oldQty),
		}
		if err := w.repo.CreateAuditLog(audit); err != nil {
			log.Printf("[worker] failed to create audit log for inventory sync: %v", err)
		}
	}
	log.Printf("[worker] resolved %d inventory discrepancies for store %s", len(discrepancies), storeID)
}

func (w *AsyncWorker) processCobrandSync(productID string) {
	log.Printf("[worker] processing cobrand product sync for product: %s", productID)
	time.Sleep(100 * time.Millisecond)
}

func (w *AsyncWorker) processOverdueCheck() {
	if w.repo == nil {
		log.Printf("[worker] repo not available, skipping overdue check")
		return
	}
	rects, err := w.repo.ListOverdueRectifications()
	if err != nil {
		log.Printf("[worker] failed to list overdue rectifications: %v", err)
		return
	}
	if len(rects) == 0 {
		log.Println("[worker] no overdue rectifications found")
		return
	}
	log.Printf("[worker] found %d overdue rectifications", len(rects))
	for _, r := range rects {
		if r.DueDate == nil {
			continue
		}
		daysOverdue := int(time.Since(*r.DueDate).Hours() / 24)
		assigneeName := "未指定"
		if r.AssigneeName != "" {
			assigneeName = r.AssigneeName
		}
		note := fmt.Sprintf("整改已逾期 %d 天，责任人 %s，门店 %s，请尽快处理", daysOverdue, assigneeName, r.StoreName)
		audit := &model.AuditLog{
			EntityType:   "rectification",
			EntityID:     r.ID,
			Action:       "status_change",
			OperatorID:   w.systemUserID,
			OperatorName: w.systemUserName,
			Note:         note,
		}
		if err := w.repo.CreateAuditLog(audit); err != nil {
			log.Printf("[worker] failed to create audit log for overdue rectification: %v", err)
		}
		log.Printf("[worker] overdue rectification %s: %d days overdue, assignee=%s, store=%s",
			r.ID, daysOverdue, assigneeName, r.StoreName)
	}
}

func formatDiffNote(diff, oldSys, newSys int) string {
	if diff > 0 {
		return fmt.Sprintf("系统自动同步: 系统库存少%d件，校正为实际库存 %d→%d", diff, oldSys, newSys)
	}
	return fmt.Sprintf("系统自动同步: 系统库存多%d件，校正为实际库存 %d→%d", -diff, oldSys, newSys)
}
