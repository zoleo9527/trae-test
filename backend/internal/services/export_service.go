package services

import (
	"encoding/json"
	"tea-distribution/internal/db"
	"tea-distribution/internal/models"

	"github.com/google/uuid"
)

type ExportService struct {
	taskService *TaskService
}

func NewExportService() *ExportService {
	return &ExportService{
		taskService: NewTaskService(),
	}
}

type ExportOrdersPayload struct {
	StoreID   uuid.UUID `json:"store_id"`
	SalesID   uuid.UUID `json:"sales_id"`
	Status    string    `json:"status"`
	StartDate string    `json:"start_date"`
	EndDate   string    `json:"end_date"`
	Keyword   string    `json:"keyword"`
}

type ExportShipmentsPayload struct {
	Status    string `json:"status"`
	StartDate string `json:"start_date"`
	EndDate   string `json:"end_date"`
}

func (s *ExportService) ExportOrders(payload *ExportOrdersPayload, createdBy uuid.UUID) (*models.AsyncTask, error) {
	task, err := s.taskService.CreateTask(models.TaskTypeExportOrders, payload, createdBy)
	if err != nil {
		return nil, err
	}
	return task, nil
}

func (s *ExportService) ExportShipments(payload *ExportShipmentsPayload, createdBy uuid.UUID) (*models.AsyncTask, error) {
	task, err := s.taskService.CreateTask(models.TaskTypeExportShipments, payload, createdBy)
	if err != nil {
		return nil, err
	}
	return task, nil
}

func (s *ExportService) GetExportTask(id uuid.UUID) (*models.AsyncTask, error) {
	return s.taskService.GetTask(id)
}

func (s *ExportService) ListExportTasks(createdBy uuid.UUID, status string, page, pageSize int) ([]models.AsyncTask, int64, error) {
	return s.taskService.ListTasks(createdBy, status, page, pageSize)
}

func (s *ExportService) GetOrdersForExport(payload *ExportOrdersPayload) ([]map[string]interface{}, error) {
	var orders []models.Order
	query := db.DB.Preload("Store").Preload("Sales").Preload("OrderItems.Product")

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

	if err := query.Find(&orders).Error; err != nil {
		return nil, err
	}

	var result []map[string]interface{}
	for _, order := range orders {
		orderJSON, _ := json.Marshal(order)
		var orderMap map[string]interface{}
		json.Unmarshal(orderJSON, &orderMap)
		result = append(result, orderMap)
	}

	return result, nil
}
