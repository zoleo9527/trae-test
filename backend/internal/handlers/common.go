package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strconv"
	"time"
	"wedding-photo-backend/internal/models"
	"wedding-photo-backend/pkg/database"

	"github.com/gofiber/fiber/v2"
	"github.com/xuri/excelize/v2"
)

func logOperation(userID uint, action, resourceType string, resourceID uint, oldValue, newValue string) {
	log := models.OperationLog{
		UserID:       &userID,
		Action:       action,
		ResourceType: resourceType,
		ResourceID:   &resourceID,
		OldValue:     oldValue,
		NewValue:     newValue,
	}
	database.DB.Create(&log)
}

func logOperationDetail(userID uint, action, resourceType string, resourceID uint, oldData, newData interface{}, remark string) {
	oldValue, _ := json.Marshal(oldData)
	newValue, _ := json.Marshal(newData)

	log := models.OperationLog{
		UserID:       &userID,
		Action:       action,
		ResourceType: resourceType,
		ResourceID:   &resourceID,
		OldValue:     string(oldValue),
		NewValue:     string(newValue),
		Remark:       remark,
	}
	database.DB.Create(&log)
}

type ExportHandler struct{}

func NewExportHandler() *ExportHandler {
	return &ExportHandler{}
}

func (h *ExportHandler) ExportDispatches(c *fiber.Ctx) error {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	status := c.Query("status")

	query := database.DB.Model(&models.CostumeDispatch{}).Preload("Costume").Preload("Customer").Preload("Schedule")

	if startDate != "" {
		query = query.Where("created_at >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("created_at <= ?", endDate+" 23:59:59")
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var dispatches []models.CostumeDispatch
	query.Order("created_at DESC").Find(&dispatches)

	f := excelize.NewFile()
	sheetName := "服装调度记录"
	index, _ := f.NewSheet(sheetName)

	headers := []string{"ID", "客户名称", "服装名称", "档期日期", "状态", "预约取件时间", "实际取件时间", "预约归还时间", "实际归还时间", "损坏备注", "创建时间"}
	for i, header := range headers {
		cell := fmt.Sprintf("%s1", string(rune('A'+i)))
		f.SetCellValue(sheetName, cell, header)
	}

	for i, d := range dispatches {
		row := i + 2
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), d.ID)
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), d.Customer.Name)
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), d.Costume.Name)
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), d.Schedule.ScheduleDate.Format("2006-01-02"))
		f.SetCellValue(sheetName, fmt.Sprintf("E%d", row), getStatusText(d.Status))
		if d.ExpectedPickupAt != nil {
			f.SetCellValue(sheetName, fmt.Sprintf("F%d", row), d.ExpectedPickupAt.Format("2006-01-02 15:04"))
		}
		if d.ActualPickupAt != nil {
			f.SetCellValue(sheetName, fmt.Sprintf("G%d", row), d.ActualPickupAt.Format("2006-01-02 15:04"))
		}
		if d.ExpectedReturnAt != nil {
			f.SetCellValue(sheetName, fmt.Sprintf("H%d", row), d.ExpectedReturnAt.Format("2006-01-02 15:04"))
		}
		if d.ActualReturnAt != nil {
			f.SetCellValue(sheetName, fmt.Sprintf("I%d", row), d.ActualReturnAt.Format("2006-01-02 15:04"))
		}
		f.SetCellValue(sheetName, fmt.Sprintf("J%d", row), d.DamageRemark)
		f.SetCellValue(sheetName, fmt.Sprintf("K%d", row), d.CreatedAt.Format("2006-01-02 15:04:05"))
	}

	f.SetActiveSheet(index)
	f.DeleteSheet("Sheet1")

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "导出失败",
		})
	}

	filename := fmt.Sprintf("服装调度记录_%s.xlsx", time.Now().Format("20060102150405"))
	c.Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))

	return c.Send(buf.Bytes())
}

func (h *ExportHandler) ExportMaintenances(c *fiber.Ctx) error {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	status := c.Query("status")
	type_ := c.Query("type")

	query := database.DB.Model(&models.MaintenanceRecord{}).Preload("Costume").Preload("HandledBy")

	if startDate != "" {
		query = query.Where("created_at >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("created_at <= ?", endDate+" 23:59:59")
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if type_ != "" {
		query = query.Where("type = ?", type_)
	}

	var records []models.MaintenanceRecord
	query.Order("created_at DESC").Find(&records)

	f := excelize.NewFile()
	sheetName := "保养记录"
	index, _ := f.NewSheet(sheetName)

	headers := []string{"ID", "服装名称", "保养类型", "状态", "描述", "费用", "处理人", "开始时间", "完成时间", "创建时间"}
	for i, header := range headers {
		cell := fmt.Sprintf("%s1", string(rune('A'+i)))
		f.SetCellValue(sheetName, cell, header)
	}

	for i, r := range records {
		row := i + 2
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), r.ID)
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), r.Costume.Name)
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), getMaintenanceTypeText(r.Type))
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), getMaintenanceStatusText(r.Status))
		f.SetCellValue(sheetName, fmt.Sprintf("E%d", row), r.Description)
		f.SetCellValue(sheetName, fmt.Sprintf("F%d", row), r.Cost)
		if r.HandledBy != nil {
			f.SetCellValue(sheetName, fmt.Sprintf("G%d", row), r.HandledBy.Name)
		}
		if r.StartedAt != nil {
			f.SetCellValue(sheetName, fmt.Sprintf("H%d", row), r.StartedAt.Format("2006-01-02 15:04"))
		}
		if r.CompletedAt != nil {
			f.SetCellValue(sheetName, fmt.Sprintf("I%d", row), r.CompletedAt.Format("2006-01-02 15:04"))
		}
		f.SetCellValue(sheetName, fmt.Sprintf("J%d", row), r.CreatedAt.Format("2006-01-02 15:04:05"))
	}

	f.SetActiveSheet(index)
	f.DeleteSheet("Sheet1")

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "导出失败",
		})
	}

	filename := fmt.Sprintf("保养记录_%s.xlsx", time.Now().Format("20060102150405"))
	c.Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))

	return c.Send(buf.Bytes())
}

func (h *ExportHandler) ExportCostumes(c *fiber.Ctx) error {
	category := c.Query("category")
	status := c.Query("status")

	query := database.DB.Model(&models.Costume{})

	if category != "" {
		query = query.Where("category = ?", category)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var costumes []models.Costume
	query.Order("created_at DESC").Find(&costumes)

	f := excelize.NewFile()
	sheetName := "服装清单"
	index, _ := f.NewSheet(sheetName)

	headers := []string{"ID", "名称", "类别", "风格", "尺码", "颜色", "品牌", "采购价", "租赁价", "状态", "使用次数", "创建时间"}
	for i, header := range headers {
		cell := fmt.Sprintf("%s1", string(rune('A'+i)))
		f.SetCellValue(sheetName, cell, header)
	}

	for i, c := range costumes {
		row := i + 2
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), c.ID)
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), c.Name)
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), c.Category)
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), c.Style)
		f.SetCellValue(sheetName, fmt.Sprintf("E%d", row), c.Size)
		f.SetCellValue(sheetName, fmt.Sprintf("F%d", row), c.Color)
		f.SetCellValue(sheetName, fmt.Sprintf("G%d", row), c.Brand)
		f.SetCellValue(sheetName, fmt.Sprintf("H%d", row), c.PurchasePrice)
		f.SetCellValue(sheetName, fmt.Sprintf("I%d", row), c.RentalPrice)
		f.SetCellValue(sheetName, fmt.Sprintf("J%d", row), getCostumeStatusText(c.Status))
		f.SetCellValue(sheetName, fmt.Sprintf("K%d", row), c.TotalUseCount)
		f.SetCellValue(sheetName, fmt.Sprintf("L%d", row), c.CreatedAt.Format("2006-01-02 15:04:05"))
	}

	f.SetActiveSheet(index)
	f.DeleteSheet("Sheet1")

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "导出失败",
		})
	}

	filename := fmt.Sprintf("服装清单_%s.xlsx", time.Now().Format("20060102150405"))
	c.Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))

	return c.Send(buf.Bytes())
}

func getStatusText(status models.DispatchStatus) string {
	switch status {
	case models.DispatchStatusPending:
		return "待确认"
	case models.DispatchStatusConfirmed:
		return "已确认"
	case models.DispatchStatusPickedUp:
		return "已取件"
	case models.DispatchStatusReturned:
		return "已归还"
	case models.DispatchStatusCancelled:
		return "已取消"
	case models.DispatchStatusRescheduled:
		return "已改期"
	default:
		return string(status)
	}
}

func getCostumeStatusText(status models.CostumeStatus) string {
	switch status {
	case models.CostumeStatusAvailable:
		return "可用"
	case models.CostumeStatusReserved:
		return "已预约"
	case models.CostumeStatusLent:
		return "借出"
	case models.CostumeStatusCleaning:
		return "清洁中"
	case models.CostumeStatusRepairing:
		return "维修中"
	case models.CostumeStatusRetired:
		return "已淘汰"
	default:
		return string(status)
	}
}

func getMaintenanceTypeText(t models.MaintenanceType) string {
	switch t {
	case models.MaintenanceCleaning:
		return "清洁"
	case models.MaintenanceRepair:
		return "维修"
	case models.MaintenanceInspect:
		return "检查"
	default:
		return string(t)
	}
}

func getMaintenanceStatusText(s models.MaintenanceStatus) string {
	switch s {
	case models.MaintenanceStatusPending:
		return "待处理"
	case models.MaintenanceStatusDoing:
		return "处理中"
	case models.MaintenanceStatusDone:
		return "已完成"
	default:
		return string(s)
	}
}

type LogHandler struct{}

func NewLogHandler() *LogHandler {
	return &LogHandler{}
}

func (h *LogHandler) GetLogs(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "20"))
	resourceType := c.Query("resource_type")
	resourceID := c.Query("resource_id")
	action := c.Query("action")

	query := database.DB.Model(&models.OperationLog{}).Preload("User")

	if resourceType != "" {
		query = query.Where("resource_type = ?", resourceType)
	}
	if resourceID != "" {
		query = query.Where("resource_id = ?", resourceID)
	}
	if action != "" {
		query = query.Where("action = ?", action)
	}

	var total int64
	query.Count(&total)

	var logs []models.OperationLog
	offset := (page - 1) * pageSize
	query.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&logs)

	return c.JSON(fiber.Map{
		"success": true,
		"message": "获取成功",
		"data": fiber.Map{
			"list":      logs,
			"total":     total,
			"page":      page,
			"page_size": pageSize,
		},
	})
}

func PrettyJSON(v interface{}) string {
	b, _ := json.MarshalIndent(v, "", "  ")
	return string(b)
}
