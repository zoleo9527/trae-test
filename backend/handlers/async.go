package handlers

import (
	"encoding/csv"
	"encoding/json"
	"gallery-system/database"
	"gallery-system/middleware"
	"gallery-system/models"
	"gallery-system/utils"
	"os"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
)

type CreateExportTaskRequest struct {
	Type       string            `json:"type"`
	Module     string            `json:"module"`
	Params     map[string]string `json:"params"`
	Title      string            `json:"title"`
}

func CreateExportTask(c *fiber.Ctx) error {
	claims := middleware.GetCurrentUser(c)

	var req CreateExportTaskRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "参数错误", err.Error())
	}

	paramsJSON, _ := json.Marshal(req.Params)

	task := models.AsyncTask{
		Type:        models.AsyncTaskType(req.Type),
		Title:       req.Title,
		Description: "导出" + req.Module + "数据",
		Params:      string(paramsJSON),
		Status:      models.TaskStatusPending,
		CreatedBy:   claims.UserID,
	}

	if err := database.DB.Create(&task).Error; err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "创建任务失败", err.Error())
	}

	go ProcessExportTask(task.ID, req.Module, req.Params)

	return utils.JSONResponse(c, fiber.StatusCreated, true, "导出任务已创建", task)
}

func ProcessExportTask(taskID uint, module string, params map[string]string) {
	var task models.AsyncTask
	database.DB.First(&task, taskID)

	task.Status = models.TaskStatusProcessing
	now := time.Now()
	task.StartedAt = &now
	database.DB.Save(&task)

	defer func() {
		if r := recover(); r != nil {
			task.Status = models.TaskStatusFailed
			task.ErrorMessage = "导出失败: " + strconv.FormatInt(int64(r.(int)), 10)
			database.DB.Save(&task)
		}
	}()

	var filePath string
	var err error

	switch module {
	case "tickets":
		filePath, err = ExportTickets(params)
	case "activities":
		filePath, err = ExportActivities(params)
	case "registrations":
		filePath, err = ExportRegistrations(params)
	case "exhibits":
		filePath, err = ExportExhibits(params)
	default:
		task.Status = models.TaskStatusFailed
		task.ErrorMessage = "不支持的导出模块"
		database.DB.Save(&task)
		return
	}

	if err != nil {
		task.Status = models.TaskStatusFailed
		task.ErrorMessage = err.Error()
		database.DB.Save(&task)
		return
	}

	completed := time.Now()
	task.Status = models.TaskStatusCompleted
	task.CompletedAt = &completed
	result, _ := json.Marshal(fiber.Map{"file_path": filePath})
	task.Result = string(result)
	database.DB.Save(&task)
}

func ExportTickets(params map[string]string) (string, error) {
	var tickets []models.Ticket
	query := database.DB.Model(&models.Ticket{})

	if startDate, ok := params["start_date"]; ok && startDate != "" {
		query = query.Where("created_at >= ?", startDate)
	}
	if endDate, ok := params["end_date"]; ok && endDate != "" {
		query = query.Where("created_at <= ?", endDate)
	}
	if status, ok := params["status"]; ok && status != "" {
		query = query.Where("status = ?", status)
	}

	query.Find(&tickets)

	filePath := "/tmp/tickets_export_" + time.Now().Format("20060102150405") + ".csv"
	file, err := os.Create(filePath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	writer.Write([]string{"票号", "类型", "价格", "访客姓名", "访客电话", "参观日期", "状态", "核销时间", "创建时间"})
	for _, t := range tickets {
		verifiedAt := ""
		if t.VerifiedAt != nil {
			verifiedAt = t.VerifiedAt.Format("2006-01-02 15:04:05")
		}
		writer.Write([]string{
			t.TicketNo,
			string(t.Type),
			strconv.FormatFloat(t.Price, 'f', 2, 64),
			t.VisitorName,
			t.VisitorPhone,
			t.VisitDate.Format("2006-01-02"),
			string(t.Status),
			verifiedAt,
			t.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	return filePath, nil
}

func ExportActivities(params map[string]string) (string, error) {
	var activities []models.Activity
	query := database.DB.Model(&models.Activity{})

	if startDate, ok := params["start_date"]; ok && startDate != "" {
		query = query.Where("start_date >= ?", startDate)
	}
	if status, ok := params["status"]; ok && status != "" {
		query = query.Where("status = ?", status)
	}

	query.Find(&activities)

	filePath := "/tmp/activities_export_" + time.Now().Format("20060102150405") + ".csv"
	file, err := os.Create(filePath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	writer.Write([]string{"活动编号", "标题", "类型", "地点", "开始时间", "结束时间", "状态", "最大人数", "创建时间"})
	for _, a := range activities {
		writer.Write([]string{
			a.ActivityNo,
			a.Title,
			a.Type,
			a.Location,
			a.StartDate.Format("2006-01-02 15:04:05"),
			a.EndDate.Format("2006-01-02 15:04:05"),
			string(a.Status),
			strconv.Itoa(a.MaxParticipants),
			a.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	return filePath, nil
}

func ExportRegistrations(params map[string]string) (string, error) {
	var registrations []models.ActivityRegistration
	query := database.DB.Model(&models.ActivityRegistration{})

	if activityID, ok := params["activity_id"]; ok && activityID != "" {
		query = query.Where("activity_id = ?", activityID)
	}
	if status, ok := params["status"]; ok && status != "" {
		query = query.Where("status = ?", status)
	}

	query.Preload("Activity").Find(&registrations)

	filePath := "/tmp/registrations_export_" + time.Now().Format("20060102150405") + ".csv"
	file, err := os.Create(filePath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	writer.Write([]string{"报名编号", "活动名称", "会员姓名", "会员电话", "人数", "状态", "报名时间", "签到时间"})
	for _, r := range registrations {
		checkinTime := ""
		if r.CheckinTime != nil {
			checkinTime = r.CheckinTime.Format("2006-01-02 15:04:05")
		}
		activityTitle := ""
		if r.Activity != nil {
			activityTitle = r.Activity.Title
		}
		writer.Write([]string{
			r.RegistrationNo,
			activityTitle,
			r.MemberName,
			r.MemberPhone,
			strconv.Itoa(r.Participants),
			string(r.Status),
			r.RegisteredAt.Format("2006-01-02 15:04:05"),
			checkinTime,
		})
	}

	return filePath, nil
}

func ExportExhibits(params map[string]string) (string, error) {
	var exhibits []models.Exhibit
	query := database.DB.Model(&models.Exhibit{})

	if category, ok := params["category"]; ok && category != "" {
		query = query.Where("category = ?", category)
	}
	if status, ok := params["status"]; ok && status != "" {
		query = query.Where("status = ?", status)
	}

	query.Find(&exhibits)

	filePath := "/tmp/exhibits_export_" + time.Now().Format("20060102150405") + ".csv"
	file, err := os.Create(filePath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	writer.Write([]string{"展品编号", "名称", "分类", "艺术家", "年代", "位置", "状态", "创建时间"})
	for _, e := range exhibits {
		writer.Write([]string{
			e.ExhibitNo,
			e.Name,
			e.Category,
			e.Artist,
			e.Year,
			e.Location,
			string(e.Status),
			e.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	return filePath, nil
}

func GetTaskList(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "20"))
	status := c.Query("status")
	taskType := c.Query("type")

	offset := (page - 1) * pageSize

	query := database.DB.Model(&models.AsyncTask{})

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if taskType != "" {
		query = query.Where("type = ?", taskType)
	}

	var total int64
	query.Count(&total)

	var tasks []models.AsyncTask
	if err := query.Preload("Creator").
		Order("created_at DESC").
		Offset(offset).Limit(pageSize).
		Find(&tasks).Error; err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "查询失败", err.Error())
	}

	return utils.PaginatedResult(c, tasks, page, pageSize, total)
}

func GetTaskDetail(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "ID格式错误", err.Error())
	}

	var task models.AsyncTask
	if err := database.DB.Preload("Creator").First(&task, id).Error; err != nil {
		return utils.JSONError(c, fiber.StatusNotFound, "任务不存在", err.Error())
	}

	return utils.JSONResponse(c, fiber.StatusOK, true, "", task)
}
