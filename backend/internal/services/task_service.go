package services

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"tea-distribution/internal/config"
	"tea-distribution/internal/db"
	"tea-distribution/internal/models"
	"time"

	"github.com/google/uuid"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

type TaskService struct {
	taskQueue   chan uuid.UUID
	workerCount int
	running     bool
}

var taskService *TaskService

func NewTaskService() *TaskService {
	if taskService == nil {
		taskService = &TaskService{
			taskQueue:   make(chan uuid.UUID, 100),
			workerCount: config.AppConfig.AsyncWorkerCount,
			running:     false,
		}
	}
	return taskService
}

func (s *TaskService) Start() {
	if s.running {
		return
	}
	s.running = true

	for i := 0; i < s.workerCount; i++ {
		go s.worker(i)
	}

	fmt.Printf("Async task service started with %d workers\n", s.workerCount)
}

func (s *TaskService) Stop() {
	s.running = false
	close(s.taskQueue)
}

func (s *TaskService) worker(id int) {
	for taskID := range s.taskQueue {
		s.processTask(taskID)
	}
}

func (s *TaskService) processTask(taskID uuid.UUID) {
	var task models.AsyncTask
	if err := db.DB.First(&task, taskID).Error; err != nil {
		return
	}

	now := time.Now()
	task.Status = models.TaskStatusRunning
	task.StartedAt = &now
	db.DB.Save(&task)

	var err error
	var filePath string

	switch task.TaskType {
	case models.TaskTypeExportOrders:
		filePath, err = s.exportOrders(&task)
	case models.TaskTypeExportShipments:
		filePath, err = s.exportShipments(&task)
	case models.TaskTypeSyncInventory:
		err = s.syncInventory(&task)
	default:
		err = fmt.Errorf("unknown task type: %s", task.TaskType)
	}

	now = time.Now()
	task.FinishedAt = &now

	if err != nil {
		task.Status = models.TaskStatusFailed
		task.ErrorMsg = err.Error()
	} else {
		task.Status = models.TaskStatusDone
		task.FilePath = filePath
	}

	db.DB.Save(&task)
}

func (s *TaskService) CreateTask(taskType string, payload interface{}, createdBy uuid.UUID) (*models.AsyncTask, error) {
	payloadJSON, _ := json.Marshal(payload)

	task := &models.AsyncTask{
		TaskType:  taskType,
		Status:    models.TaskStatusPending,
		Payload:   string(payloadJSON),
		CreatedBy: createdBy,
		Progress:  0,
	}

	if err := db.DB.Create(task).Error; err != nil {
		return nil, models.AppErrInternal("创建任务失败")
	}

	if s.running {
		s.taskQueue <- task.ID
	}

	return task, nil
}

func (s *TaskService) GetTask(id uuid.UUID) (*models.AsyncTask, error) {
	var task models.AsyncTask
	if err := db.DB.First(&task, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, models.AppErrNotFound("任务不存在")
		}
		return nil, models.AppErrInternal("查询任务失败")
	}
	return &task, nil
}

func (s *TaskService) ListTasks(createdBy uuid.UUID, status string, page, pageSize int) ([]models.AsyncTask, int64, error) {
	var tasks []models.AsyncTask
	var total int64

	query := db.DB.Model(&models.AsyncTask{})
	if createdBy != uuid.Nil {
		query = query.Where("created_by = ?", createdBy)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, models.AppErrInternal("查询任务列表失败")
	}

	offset := (page - 1) * pageSize
	if err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&tasks).Error; err != nil {
		return nil, 0, models.AppErrInternal("查询任务列表失败")
	}

	return tasks, total, nil
}

func (s *TaskService) exportOrders(task *models.AsyncTask) (string, error) {
	exportDir := config.AppConfig.ExportDir
	if err := os.MkdirAll(exportDir, 0755); err != nil {
		return "", err
	}

	fileName := fmt.Sprintf("orders_%s.xlsx", time.Now().Format("20060102150405"))
	filePath := filepath.Join(exportDir, fileName)

	f := excelize.NewFile()
	sheetName := "订单列表"
	f.SetSheetName("Sheet1", sheetName)

	headers := []string{"订单编号", "门店", "业务员", "状态", "总金额", "优惠金额", "实付金额", "是否活动", "创建时间"}
	for i, header := range headers {
		cell := fmt.Sprintf("%c1", 'A'+i)
		f.SetCellValue(sheetName, cell, header)
	}

	var payload ExportOrdersPayload
	if task.Payload != "" {
		json.Unmarshal([]byte(task.Payload), &payload)
	}

	query := db.DB.Preload("Store").Preload("Sales").Model(&models.Order{})

	if payload.StoreID != uuid.Nil {
		query = query.Where("store_id = ?", payload.StoreID)
	}
	if payload.SalesID != uuid.Nil {
		query = query.Where("sales_id = ?", payload.SalesID)
	}
	if payload.Status != "" {
		query = query.Where("status = ?", payload.Status)
	}
	if payload.StartDate != "" {
		query = query.Where("created_at >= ?", payload.StartDate)
	}
	if payload.EndDate != "" {
		query = query.Where("created_at <= ?", payload.EndDate)
	}
	if payload.Keyword != "" {
		keyword := "%" + payload.Keyword + "%"
		query = query.Joins("JOIN stores ON stores.id = orders.store_id").
			Where("orders.order_no LIKE ? OR stores.name LIKE ?", keyword, keyword)
	}

	var orders []models.Order
	query.Find(&orders)

	for i, order := range orders {
		row := i + 2
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), order.OrderNo)
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), order.Store.Name)
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), order.Sales.Name)
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), getStatusText(order.Status))
		f.SetCellValue(sheetName, fmt.Sprintf("E%d", row), order.TotalAmount)
		f.SetCellValue(sheetName, fmt.Sprintf("F%d", row), order.DiscountAmount)
		f.SetCellValue(sheetName, fmt.Sprintf("G%d", row), order.FinalAmount)
		f.SetCellValue(sheetName, fmt.Sprintf("H%d", row), map[bool]string{true: "是", false: "否"}[order.IsActivity])
		f.SetCellValue(sheetName, fmt.Sprintf("I%d", row), order.CreatedAt.Format("2006-01-02 15:04:05"))

		progress := (i + 1) * 100 / len(orders)
		db.DB.Model(&task).Update("progress", progress)
	}

	if err := f.SaveAs(filePath); err != nil {
		return "", err
	}

	return filePath, nil
}

func (s *TaskService) exportShipments(task *models.AsyncTask) (string, error) {
	exportDir := config.AppConfig.ExportDir
	if err := os.MkdirAll(exportDir, 0755); err != nil {
		return "", err
	}

	fileName := fmt.Sprintf("shipments_%s.xlsx", time.Now().Format("20060102150405"))
	filePath := filepath.Join(exportDir, fileName)

	f := excelize.NewFile()
	sheetName := "发货单列表"
	f.SetSheetName("Sheet1", sheetName)

	headers := []string{"发货单号", "关联分仓单", "门店", "状态", "总数量", "物流商", "物流单号", "发货时间", "签收时间"}
	for i, header := range headers {
		cell := fmt.Sprintf("%c1", 'A'+i)
		f.SetCellValue(sheetName, cell, header)
	}

	var payload ExportShipmentsPayload
	if task.Payload != "" {
		json.Unmarshal([]byte(task.Payload), &payload)
	}

	query := db.DB.Preload("Allocation.Order.Store").Model(&models.Shipment{})

	if payload.Status != "" {
		query = query.Where("status = ?", payload.Status)
	}
	if payload.StartDate != "" {
		query = query.Where("created_at >= ?", payload.StartDate)
	}
	if payload.EndDate != "" {
		query = query.Where("created_at <= ?", payload.EndDate)
	}

	var shipments []models.Shipment
	query.Find(&shipments)

	for i, shipment := range shipments {
		row := i + 2
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), shipment.ShipmentNo)
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), shipment.Allocation.AllocationNo)
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), shipment.Allocation.Order.Store.Name)
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), getShipmentStatusText(shipment.Status))
		f.SetCellValue(sheetName, fmt.Sprintf("E%d", row), shipment.TotalQty)
		f.SetCellValue(sheetName, fmt.Sprintf("F%d", row), shipment.Shipper)
		f.SetCellValue(sheetName, fmt.Sprintf("G%d", row), shipment.TrackingNo)
		if shipment.ShippedAt != nil {
			f.SetCellValue(sheetName, fmt.Sprintf("H%d", row), shipment.ShippedAt.Format("2006-01-02 15:04:05"))
		}
		if shipment.ReceivedAt != nil {
			f.SetCellValue(sheetName, fmt.Sprintf("I%d", row), shipment.ReceivedAt.Format("2006-01-02 15:04:05"))
		}

		progress := (i + 1) * 100 / len(shipments)
		db.DB.Model(&task).Update("progress", progress)
	}

	if err := f.SaveAs(filePath); err != nil {
		return "", err
	}

	return filePath, nil
}

func (s *TaskService) syncInventory(task *models.AsyncTask) error {
	var inventories []models.Inventory
	db.DB.Find(&inventories)

	for i, inv := range inventories {
		inv.AvailableQty = inv.Quantity - inv.LockedQty
		db.DB.Save(&inv)

		progress := (i + 1) * 100 / len(inventories)
		db.DB.Model(&task).Update("progress", progress)
	}

	return nil
}

func getStatusText(status string) string {
	statusMap := map[string]string{
		models.OrderStatusDraft:     "草稿",
		models.OrderStatusPending:   "待审批",
		models.OrderStatusApproved:  "已审批",
		models.OrderStatusAllocated: "已分仓",
		models.OrderStatusShipped:   "已发货",
		models.OrderStatusCompleted: "已完成",
		models.OrderStatusCancelled: "已取消",
		models.OrderStatusRejected:  "已驳回",
	}
	if text, ok := statusMap[status]; ok {
		return text
	}
	return status
}

func getShipmentStatusText(status string) string {
	statusMap := map[string]string{
		models.ShipmentStatusPending:   "待复核",
		models.ShipmentStatusReviewing: "复核中",
		models.ShipmentStatusAccepted:  "已签收",
		models.ShipmentStatusDisputed:  "有争议",
		models.ShipmentStatusResolved:  "已解决",
	}
	if text, ok := statusMap[status]; ok {
		return text
	}
	return status
}
