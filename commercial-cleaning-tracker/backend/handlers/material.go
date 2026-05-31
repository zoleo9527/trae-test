package handlers

import (
	"net/http"
	"time"

	"github.com/cleaning-tracker/backend/config"
	"github.com/cleaning-tracker/backend/models"
	"github.com/gofiber/fiber/v2"
)

type CreateMaterialRequest struct {
	ShiftID uint `json:"shiftId"`
	Items   string `json:"items"`
	TotalQty int `json:"totalQty"`
	Remark  string `json:"remark"`
}

func CreateMaterialRequisition(c *fiber.Ctx) error {
	var req CreateMaterialRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	material := models.MaterialRequisition{
		ShiftID:     req.ShiftID,
		RequesterID: GetCurrentUserID(c),
		Items:       req.Items,
		TotalQty:    req.TotalQty,
		Status:      models.MaterialPending,
		RequestTime: time.Now(),
		Remark:      req.Remark,
	}

	if err := config.DB.Create(&material).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create material requisition"})
	}

	return c.JSON(material)
}

func ApproveMaterialRequisition(c *fiber.Ctx) error {
	id := c.Params("id")
	var material models.MaterialRequisition

	if err := config.DB.First(&material, id).Error; err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "Material requisition not found"})
	}

	var req struct {
		Status models.MaterialStatus `json:"status"`
		Remark string                `json:"remark"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	now := time.Now()
	userID := GetCurrentUserID(c)

	material.Status = req.Status
	material.ApprovedBy = &userID
	material.ApproveTime = &now
	if req.Remark != "" {
		material.Remark = req.Remark
	}

	if req.Status == models.MaterialIssued {
		material.IssueTime = &now
	}

	if err := config.DB.Save(&material).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update material requisition"})
	}

	return c.JSON(material)
}

func GetMaterialRequisitions(c *fiber.Ctx) error {
	var materials []models.MaterialRequisition
	query := config.DB.Preload("Requester").Preload("Approver")

	status := c.Query("status")
	if status != "" {
		query = query.Where("status = ?", status)
	}

	requesterID := c.Query("requesterId")
	if requesterID != "" {
		query = query.Where("requester_id = ?", requesterID)
	}

	shiftID := c.Query("shiftId")
	if shiftID != "" {
		query = query.Where("shift_id = ?", shiftID)
	}

	if err := query.Order("created_at desc").Find(&materials).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch material requisitions"})
	}

	return c.JSON(materials)
}

type CreateFollowUpRequest struct {
	ProjectID       *uint              `json:"projectId"`
	RectificationID *uint              `json:"rectificationId"`
	Type            models.FollowUpType `json:"type"`
	Title           string             `json:"title"`
	Content         string             `json:"content"`
	AssigneeID      uint               `json:"assigneeId"`
	DueDate         time.Time          `json:"dueDate"`
}

func CreateFollowUp(c *fiber.Ctx) error {
	var req CreateFollowUpRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	followUp := models.FollowUp{
		ProjectID:       req.ProjectID,
		RectificationID: req.RectificationID,
		Type:            req.Type,
		Title:           req.Title,
		Content:         req.Content,
		AssigneeID:      req.AssigneeID,
		DueDate:         req.DueDate,
		Status:          models.FollowUpPending,
		CreatedBy:       GetCurrentUserID(c),
	}

	if err := config.DB.Create(&followUp).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create follow-up"})
	}

	return c.JSON(followUp)
}

func CompleteFollowUp(c *fiber.Ctx) error {
	id := c.Params("id")
	var followUp models.FollowUp

	if err := config.DB.First(&followUp, id).Error; err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "Follow-up not found"})
	}

	var req struct {
		Result string `json:"result"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	now := time.Now()
	followUp.Status = models.FollowUpDone
	followUp.Result = req.Result
	followUp.CompletedTime = &now

	if err := config.DB.Save(&followUp).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to complete follow-up"})
	}

	return c.JSON(followUp)
}

func GetFollowUps(c *fiber.Ctx) error {
	var followUps []models.FollowUp
	query := config.DB.Preload("Assignee").Preload("Creator").Preload("Project")

	status := c.Query("status")
	if status != "" {
		query = query.Where("status = ?", status)
	}

	assigneeID := c.Query("assigneeId")
	if assigneeID != "" {
		query = query.Where("assignee_id = ?", assigneeID)
	}

	projectID := c.Query("projectId")
	if projectID != "" {
		query = query.Where("project_id = ?", projectID)
	}

	if err := query.Order("due_date asc").Find(&followUps).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch follow-ups"})
	}

	return c.JSON(followUps)
}

func GetTraceChain(c *fiber.Ctx) error {
	var shifts []models.Shift

	query := config.DB.Preload("Worker").Preload("Schedule.Project").
		Preload("CheckIns").Preload("Inspections.Rectification").
		Preload("MaterialReqs")

	projectID := c.Query("projectId")
	if projectID != "" {
		query = query.Joins("JOIN schedules ON schedules.id = shifts.schedule_id").
			Where("schedules.project_id = ?", projectID)
	}

	startDate := c.Query("startDate")
	if startDate != "" {
		query = query.Where("date >= ?", startDate)
	}

	endDate := c.Query("endDate")
	if endDate != "" {
		query = query.Where("date <= ?", endDate)
	}

	workerID := c.Query("workerId")
	if workerID != "" {
		query = query.Where("worker_id = ?", workerID)
	}

	if err := query.Order("date desc").Find(&shifts).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch trace chain"})
	}

	var projectIDs []uint
	projectSet := make(map[uint]bool)
	for _, shift := range shifts {
		if !projectSet[shift.Schedule.ProjectID] {
			projectSet[shift.Schedule.ProjectID] = true
			projectIDs = append(projectIDs, shift.Schedule.ProjectID)
		}
	}

	var rectIDs []uint
	rectSet := make(map[uint]bool)
	for _, shift := range shifts {
		for _, insp := range shift.Inspections {
			if insp.Rectification != nil && !rectSet[insp.Rectification.ID] {
				rectSet[insp.Rectification.ID] = true
				rectIDs = append(rectIDs, insp.Rectification.ID)
			}
		}
	}

	var projectFollowUps []models.FollowUp
	if len(projectIDs) > 0 {
		config.DB.Where("project_id IN ?", projectIDs).Find(&projectFollowUps)
	}

	var rectFollowUps []models.FollowUp
	if len(rectIDs) > 0 {
		config.DB.Where("rectification_id IN ?", rectIDs).Find(&rectFollowUps)
	}

	projectFollowUpMap := make(map[uint][]models.FollowUp)
	for _, fu := range projectFollowUps {
		if fu.ProjectID != nil {
			projectFollowUpMap[*fu.ProjectID] = append(projectFollowUpMap[*fu.ProjectID], fu)
		}
	}

	rectFollowUpMap := make(map[uint][]models.FollowUp)
	for _, fu := range rectFollowUps {
		if fu.RectificationID != nil {
			rectFollowUpMap[*fu.RectificationID] = append(rectFollowUpMap[*fu.RectificationID], fu)
		}
	}

	result := make([]models.TraceChain, 0, len(shifts))
	for _, shift := range shifts {
		tc := models.TraceChain{
			ID:          shift.ID,
			ShiftID:     shift.ID,
			ShiftDate:   shift.Date,
			WorkerName:  shift.Worker.Name,
			ProjectName: shift.Schedule.Project.Name,
			ProjectID:   shift.Schedule.ProjectID,
		}

		if len(shift.CheckIns) > 0 {
			tc.CheckInStatus = string(shift.CheckIns[0].Status)
		} else {
			tc.CheckInStatus = "missing"
		}

		if len(shift.Inspections) > 0 {
			tc.InspectionResult = string(shift.Inspections[0].Result)
			if shift.Inspections[0].Rectification != nil {
				tc.HasRect = true
				tc.RectStatus = string(shift.Inspections[0].Rectification.Status)
				tc.RectID = &shift.Inspections[0].Rectification.ID
			}
		}

		if len(shift.MaterialReqs) > 0 {
			tc.MaterialStatus = string(shift.MaterialReqs[0].Status)
		}

		followUpTypes := make(map[string]bool)
		followUpCount := 0

		if fus, ok := projectFollowUpMap[shift.Schedule.ProjectID]; ok {
			for _, fu := range fus {
				followUpTypes[string(fu.Type)] = true
				followUpCount++
			}
		}

		for _, insp := range shift.Inspections {
			if insp.Rectification != nil {
				if fus, ok := rectFollowUpMap[insp.Rectification.ID]; ok {
					for _, fu := range fus {
						followUpTypes[string(fu.Type)] = true
						followUpCount++
					}
				}
			}
		}

		if followUpCount > 0 {
			tc.HasFollowUp = true
			tc.FollowUpCount = followUpCount
			for t := range followUpTypes {
				tc.FollowUpTypes = append(tc.FollowUpTypes, t)
			}
		}

		result = append(result, tc)
	}

	return c.JSON(result)
}

func GetDashboardStats(c *fiber.Ctx) error {
	var totalShifts int64
	config.DB.Model(&models.Shift{}).Count(&totalShifts)

	var missingCheckIns int64
	config.DB.Model(&models.CheckIn{}).Where("status = ?", models.CheckInMissing).Count(&missingCheckIns)

	var lateCheckIns int64
	config.DB.Model(&models.CheckIn{}).Where("status = ?", models.CheckInLate).Count(&lateCheckIns)

	var pendingRects int64
	config.DB.Model(&models.Rectification{}).Where("status IN ?", []models.RectificationStatus{models.RectOpen, models.RectAssigned, models.RectInProgress}).Count(&pendingRects)

	var pendingMaterials int64
	config.DB.Model(&models.MaterialRequisition{}).Where("status = ?", models.MaterialPending).Count(&pendingMaterials)

	var pendingFollowUps int64
	config.DB.Model(&models.FollowUp{}).Where("status = ?", models.FollowUpPending).Count(&pendingFollowUps)

	var avgScore float64
	config.DB.Model(&models.Inspection{}).Select("AVG(score)").Scan(&avgScore)

	return c.JSON(fiber.Map{
		"totalShifts":       totalShifts,
		"missingCheckIns":   missingCheckIns,
		"lateCheckIns":      lateCheckIns,
		"pendingRects":      pendingRects,
		"pendingMaterials":  pendingMaterials,
		"pendingFollowUps":  pendingFollowUps,
		"avgInspectionScore": avgScore,
	})
}
