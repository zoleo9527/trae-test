package service

import (
	"camp-management/internal/async"
	"camp-management/internal/model"
	"camp-management/internal/repository"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/xuri/excelize/v2"
)

type ExportService struct {
	repos        *repository.Repositories
	taskQueue    *async.TaskQueue
	auditService *AuditService
}

func NewExportService(repos *repository.Repositories, taskQueue *async.TaskQueue, auditService *AuditService) *ExportService {
	service := &ExportService{
		repos:        repos,
		taskQueue:    taskQueue,
		auditService: auditService,
	}
	service.registerTaskHandlers()
	return service
}

func (s *ExportService) registerTaskHandlers() {
	s.taskQueue.RegisterHandler(async.TaskTypeExportCampers, s.handleExportCampersTask)
	s.taskQueue.RegisterHandler(async.TaskTypeExportRegistrations, s.handleExportRegistrationsTask)
}

type ExportCampersPayload struct {
	CampID  uuid.UUID `json:"camp_id"`
	Keyword string    `json:"keyword"`
}

func (s *ExportService) ExportCampersAsync(campID uuid.UUID, keyword string, userID uuid.UUID) (*async.Task, error) {
	payload := ExportCampersPayload{
		CampID:  campID,
		Keyword: keyword,
	}
	return s.taskQueue.Submit(async.TaskTypeExportCampers, payload, userID)
}

func (s *ExportService) handleExportCampersTask(task *async.Task) error {
	var payload ExportCampersPayload
	if err := json.Unmarshal(task.Payload, &payload); err != nil {
		return err
	}

	campers, _, err := s.repos.Camper.Search(payload.CampID, payload.Keyword, nil, 1, 10000)
	if err != nil {
		return err
	}

	f := excelize.NewFile()
	defer f.Close()

	sheetName := "营员名单"
	f.SetSheetName("Sheet1", sheetName)

	headers := []string{"姓名", "性别", "年龄", "出生日期", "身份证号", "健康备注", "饮食需求", "紧急联系人", "紧急电话", "关系", "状态", "房间号", "床号"}
	for i, header := range headers {
		cell := fmt.Sprintf("%s1", string(rune('A'+i)))
		f.SetCellValue(sheetName, cell, header)
	}

	for i, camper := range campers {
		row := i + 2
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), camper.Name)
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), camper.Gender)
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), camper.Age)
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), camper.BirthDate.Format("2006-01-02"))
		f.SetCellValue(sheetName, fmt.Sprintf("E%d", row), camper.IDCard)
		f.SetCellValue(sheetName, fmt.Sprintf("F%d", row), camper.HealthNotes)
		f.SetCellValue(sheetName, fmt.Sprintf("G%d", row), camper.DietaryNeeds)
		f.SetCellValue(sheetName, fmt.Sprintf("H%d", row), camper.EmergencyName)
		f.SetCellValue(sheetName, fmt.Sprintf("I%d", row), camper.EmergencyPhone)
		f.SetCellValue(sheetName, fmt.Sprintf("J%d", row), camper.Relationship)
		f.SetCellValue(sheetName, fmt.Sprintf("K%d", row), camper.Status)
		if camper.Room != nil {
			f.SetCellValue(sheetName, fmt.Sprintf("L%d", row), camper.Room.RoomNumber)
		}
		f.SetCellValue(sheetName, fmt.Sprintf("M%d", row), camper.BedNumber)
	}

	fileName := fmt.Sprintf("campers_%s.xlsx", payload.CampID.String()[:8])
	if err := f.SaveAs(fileName); err != nil {
		return err
	}

	task.Result = fmt.Sprintf("导出成功，共 %d 条记录，文件名：%s", len(campers), fileName)

	s.auditService.Log(task.CreatedBy, model.AuditActionExport, "camper", nil, nil,
		map[string]interface{}{"count": len(campers), "file_name": fileName, "camp_id": payload.CampID},
		nil, "", "", "导出营员名单")

	return nil
}

func (s *ExportService) handleExportRegistrationsTask(task *async.Task) error {
	var payload map[string]interface{}
	if err := json.Unmarshal(task.Payload, &payload); err != nil {
		return err
	}

	campID, _ := uuid.Parse(payload["camp_id"].(string))
	opts := repository.QueryOptions{
		Filters: []repository.QueryFilter{
			{Field: "camp_id", Operator: "eq", Value: campID},
		},
		Limit: 10000,
	}

	regs, _, err := s.repos.Registration.GetByCampID(campID, opts)
	if err != nil {
		return err
	}

	f := excelize.NewFile()
	defer f.Close()

	sheetName := "报名名单"
	f.SetSheetName("Sheet1", sheetName)

	headers := []string{"报名编号", "营员姓名", "金额", "已付金额", "支付方式", "状态", "来源", "备注", "创建时间"}
	for i, header := range headers {
		cell := fmt.Sprintf("%s1", string(rune('A'+i)))
		f.SetCellValue(sheetName, cell, header)
	}

	for i, reg := range regs {
		row := i + 2
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), reg.RegistrationNo)
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), reg.Camper.Name)
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), reg.Amount)
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), reg.PaidAmount)
		f.SetCellValue(sheetName, fmt.Sprintf("E%d", row), reg.PaymentMethod)
		f.SetCellValue(sheetName, fmt.Sprintf("F%d", row), reg.Status)
		f.SetCellValue(sheetName, fmt.Sprintf("G%d", row), reg.Source)
		f.SetCellValue(sheetName, fmt.Sprintf("H%d", row), reg.Notes)
		f.SetCellValue(sheetName, fmt.Sprintf("I%d", row), reg.CreatedAt.Format("2006-01-02 15:04:05"))
	}

	fileName := fmt.Sprintf("registrations_%s.xlsx", campID.String()[:8])
	if err := f.SaveAs(fileName); err != nil {
		return err
	}

	task.Result = fmt.Sprintf("导出成功，共 %d 条记录，文件名：%s", len(regs), fileName)

	s.auditService.Log(task.CreatedBy, model.AuditActionExport, "registration", nil, nil,
		map[string]interface{}{"count": len(regs), "file_name": fileName, "camp_id": campID},
		nil, "", "", "导出报名名单")

	return nil
}

func (s *ExportService) ExportRegistrationsAsync(campID uuid.UUID, userID uuid.UUID) (*async.Task, error) {
	payload := map[string]interface{}{
		"camp_id": campID.String(),
	}
	return s.taskQueue.Submit(async.TaskTypeExportRegistrations, payload, userID)
}

func (s *ExportService) GetTask(id uuid.UUID) *async.Task {
	return s.taskQueue.GetTask(id)
}

func (s *ExportService) GetTasksByUser(userID uuid.UUID) []*async.Task {
	return s.taskQueue.GetTasksByUser(userID)
}
