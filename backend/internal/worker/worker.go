package worker

import (
	"log"
	"sync"
	"time"
)

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
	tasks chan Task
	quit  chan struct{}
	wg    sync.WaitGroup
}

func NewAsyncWorker() *AsyncWorker {
	return &AsyncWorker{
		tasks: make(chan Task, 100),
		quit:  make(chan struct{}),
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
		log.Printf("[worker] processing inventory sync check for store: %s", task.StoreID)
	case TaskCobrandSync:
		log.Printf("[worker] processing cobrand product sync for product: %s", task.EntityID)
	case TaskOverdueCheck:
		log.Println("[worker] processing overdue rectification check")
	}
	time.Sleep(100 * time.Millisecond)
}
