package service

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"autoparts/internal/config"
	"autoparts/internal/dto"
	"autoparts/internal/model"
	"autoparts/internal/util"
	apperrors "autoparts/pkg/errors"
)

type TaskService struct {
	auditService *AuditService
}

func NewTaskService() *TaskService {
	return &TaskService{
		auditService: NewAuditService(),
	}
}

func (s *TaskService) CreateTask(user *model.User, taskType model.TaskType, title string, params interface{}, ip string) (*model.AsyncTask, error) {
	paramsJSON, _ := json.Marshal(params)

	task := &model.AsyncTask{
		TaskNo:      util.GenerateTaskNo(),
		Type:        taskType,
		Status:      model.TaskStatusPending,
		Title:       title,
		Params:      string(paramsJSON),
		CreatedByID: user.ID,
	}

	if err := config.DB.Create(task).Error; err != nil {
		return nil, apperrors.NewInternalError("创建任务失败", err)
	}

	s.auditService.LogCreate(user, "task", task.ID, task.TaskNo, task, ip)

	return task, nil
}

func (s *TaskService) GetTask(id uint) (*model.AsyncTask, error) {
	var task model.AsyncTask
	if err := config.DB.First(&task, id).Error; err != nil {
		return nil, apperrors.NewNotFoundError("任务不存在")
	}
	return &task, nil
}

func (s *TaskService) GetUserTasks(userID uint, page, pageSize int) ([]model.AsyncTask, int64, error) {
	var tasks []model.AsyncTask
	var total int64

	query := config.DB.Model(&model.AsyncTask{}).Where("created_by_id = ?", userID)
	query.Count(&total)

	err := query.Order("created_at DESC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&tasks).Error

	return tasks, total, err
}

func (s *TaskService) ExecuteTask(task *model.AsyncTask) error {
	task.Status = model.TaskStatusRunning
	now := time.Now()
	task.StartedAt = &now
	config.DB.Save(task)

	defer func() {
		if r := recover(); r != nil {
			task.Status = model.TaskStatusFailed
			task.ErrorMsg = fmt.Sprintf("panic: %v", r)
			task.FinishedAt = &now
			config.DB.Save(task)
		}
	}()

	var err error
	switch task.Type {
	case model.TaskTypeExportEnquiry:
		err = s.exportEnquiry(task)
	case model.TaskTypeExportQuote:
		err = s.exportQuote(task)
	case model.TaskTypeExportLock:
		err = s.exportLock(task)
	case model.TaskTypeCheckExpire:
		err = s.checkExpired(task)
	default:
		err = fmt.Errorf("unknown task type: %s", task.Type)
	}

	finishedAt := time.Now()
	task.FinishedAt = &finishedAt

	if err != nil {
		task.Status = model.TaskStatusFailed
		task.ErrorMsg = err.Error()
	} else {
		task.Status = model.TaskStatusCompleted
		task.Progress = 100
	}

	return config.DB.Save(task).Error
}

func (s *TaskService) exportEnquiry(task *model.AsyncTask) error {
	var filter dto.EnquiryFilter
	json.Unmarshal([]byte(task.Params), &filter)

	enquiryService := NewEnquiryService()
	filter.Page = 1
	filter.PageSize = 10000

	enquiries, _, err := enquiryService.List(&filter)
	if err != nil {
		return err
	}

	task.Total = len(enquiries)
	config.DB.Save(task)

	filename := fmt.Sprintf("enquiries_%s.csv", time.Now().Format("20060102150405"))
	filepath := filepath.Join("exports", filename)

	os.MkdirAll("exports", 0755)

	file, err := os.Create(filepath)
	if err != nil {
		return err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	header := []string{"询价单号", "客户名称", "车牌号", "车型", "状态", "是否加急", "优先级", "创建人", "创建时间", "备注"}
	writer.Write(header)

	for i, enquiry := range enquiries {
		row := []string{
			enquiry.EnquiryNo,
			enquiry.CustomerName,
			enquiry.LicensePlate,
			enquiry.CarModel,
			string(enquiry.Status),
			strconv.FormatBool(enquiry.IsUrgent),
			strconv.Itoa(enquiry.Priority),
			"",
			enquiry.CreatedAt.Format("2006-01-02 15:04:05"),
			enquiry.Remark,
		}
		writer.Write(row)

		task.Progress = (i + 1) * 100 / len(enquiries)
		if i%10 == 0 {
			config.DB.Save(task)
		}
	}

	task.FileURL = "/exports/" + filename
	return nil
}

func (s *TaskService) exportQuote(task *model.AsyncTask) error {
	var filter dto.QuoteFilter
	json.Unmarshal([]byte(task.Params), &filter)

	quoteService := NewQuoteService()
	filter.Page = 1
	filter.PageSize = 10000

	quotes, _, err := quoteService.List(&filter)
	if err != nil {
		return err
	}

	task.Total = len(quotes)
	config.DB.Save(task)

	filename := fmt.Sprintf("quotes_%s.csv", time.Now().Format("20060102150405"))
	filepath := filepath.Join("exports", filename)

	os.MkdirAll("exports", 0755)

	file, err := os.Create(filepath)
	if err != nil {
		return err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	header := []string{"报价单号", "询价单号", "客户名称", "状态", "总金额", "折扣", "最终金额", "有效期", "创建时间", "备注"}
	writer.Write(header)

	for i, quote := range quotes {
		row := []string{
			quote.QuoteNo,
			"",
			quote.CustomerName,
			string(quote.Status),
			fmt.Sprintf("%.2f", quote.TotalAmount),
			fmt.Sprintf("%.2f", quote.Discount),
			fmt.Sprintf("%.2f", quote.FinalAmount),
			quote.ExpireAt.Format("2006-01-02"),
			quote.CreatedAt.Format("2006-01-02 15:04:05"),
			quote.Remark,
		}
		writer.Write(row)

		task.Progress = (i + 1) * 100 / len(quotes)
		if i%10 == 0 {
			config.DB.Save(task)
		}
	}

	task.FileURL = "/exports/" + filename
	return nil
}

func (s *TaskService) exportLock(task *model.AsyncTask) error {
	var filter dto.LockOrderFilter
	json.Unmarshal([]byte(task.Params), &filter)

	var user model.User
	if err := config.DB.First(&user, task.CreatedByID).Error; err != nil {
		return err
	}

	lockService := NewLockService()
	filter.Page = 1
	filter.PageSize = 10000

	lockOrders, _, err := lockService.List(&user, &filter)
	if err != nil {
		return err
	}

	task.Total = len(lockOrders)
	config.DB.Save(task)

	filename := fmt.Sprintf("lock_orders_%s.csv", time.Now().Format("20060102150405"))
	filepath := filepath.Join("exports", filename)

	os.MkdirAll("exports", 0755)

	file, err := os.Create(filepath)
	if err != nil {
		return err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	header := []string{"锁库单号", "询价单号", "报价单号", "客户名称", "状态", "退货状态", "总金额", "过期时间", "创建时间", "备注"}
	writer.Write(header)

	for i, lock := range lockOrders {
		row := []string{
			lock.LockNo,
			"",
			"",
			lock.CustomerName,
			string(lock.Status),
			string(lock.ReturnStatus),
			fmt.Sprintf("%.2f", lock.TotalAmount),
			lock.ExpireAt.Format("2006-01-02"),
			lock.CreatedAt.Format("2006-01-02 15:04:05"),
			lock.Remark,
		}
		writer.Write(row)

		task.Progress = (i + 1) * 100 / len(lockOrders)
		if i%10 == 0 {
			config.DB.Save(task)
		}
	}

	task.FileURL = "/exports/" + filename
	return nil
}

func (s *TaskService) checkExpired(task *model.AsyncTask) error {
	quoteService := NewQuoteService()
	lockService := NewLockService()

	quoteService.CheckExpired()
	lockService.CheckExpired()

	task.Result = "过期检查完成"
	return nil
}

type TaskWorker struct {
	taskService *TaskService
	running     bool
}

func NewTaskWorker() *TaskWorker {
	return &TaskWorker{
		taskService: NewTaskService(),
		running:     false,
	}
}

func (w *TaskWorker) Start() {
	w.running = true
	go w.run()
}

func (w *TaskWorker) Stop() {
	w.running = false
}

func (w *TaskWorker) run() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for w.running {
		<-ticker.C
		w.processPendingTasks()
	}
}

func (w *TaskWorker) processPendingTasks() {
	var tasks []model.AsyncTask
	config.DB.Where("status = ?", model.TaskStatusPending).
		Order("created_at ASC").
		Limit(5).
		Find(&tasks)

	for _, task := range tasks {
		w.taskService.ExecuteTask(&task)
	}
}
