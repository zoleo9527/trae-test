package handlers

import (
	"net/http"
	"time"

	"github.com/cleaning-tracker/backend/config"
	"github.com/cleaning-tracker/backend/models"
	"github.com/gofiber/fiber/v2"
)

type CreateInspectionRequest struct {
	ShiftID   uint                  `json:"shiftId"`
	Result    models.InspectionResult `json:"result"`
	Score     int                   `json:"score"`
	Items     string                `json:"items"`
	Problems  string                `json:"problems"`
	PhotoURLs string                `json:"photoUrls"`
	Remark    string                `json:"remark"`
}

func CreateInspection(c *fiber.Ctx) error {
	var req CreateInspectionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	inspection := models.Inspection{
		ShiftID:     req.ShiftID,
		InspectorID: GetCurrentUserID(c),
		InspectTime: time.Now(),
		Result:      req.Result,
		Score:       req.Score,
		Items:       req.Items,
		Problems:    req.Problems,
		PhotoURLs:   req.PhotoURLs,
		Remark:      req.Remark,
	}

	if err := config.DB.Create(&inspection).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create inspection"})
	}

	return c.JSON(inspection)
}

func GetInspections(c *fiber.Ctx) error {
	var inspections []models.Inspection
	query := config.DB.Preload("Inspector").Preload("Rectification.Assignee")

	shiftID := c.Query("shiftId")
	if shiftID != "" {
		query = query.Where("shift_id = ?", shiftID)
	}

	result := c.Query("result")
	if result != "" {
		query = query.Where("result = ?", result)
	}

	if err := query.Order("inspect_time desc").Find(&inspections).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch inspections"})
	}

	return c.JSON(inspections)
}

type CreateRectificationRequest struct {
	InspectionID uint      `json:"inspectionId"`
	AssigneeID   uint      `json:"assigneeId"`
	Deadline     time.Time `json:"deadline"`
	Description  string    `json:"description"`
	Actions      string    `json:"actions"`
}

func CreateRectification(c *fiber.Ctx) error {
	var req CreateRectificationRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	rect := models.Rectification{
		InspectionID: req.InspectionID,
		AssigneeID:   req.AssigneeID,
		Deadline:     req.Deadline,
		Status:       models.RectAssigned,
		Description:  req.Description,
		Actions:      req.Actions,
	}

	if err := config.DB.Create(&rect).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create rectification"})
	}

	return c.JSON(rect)
}

func CompleteRectification(c *fiber.Ctx) error {
	id := c.Params("id")
	var rect models.Rectification

	if err := config.DB.First(&rect, id).Error; err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "Rectification not found"})
	}

	var req struct {
		CompletedNote string `json:"completedNote"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	now := time.Now()
	rect.Status = models.RectDone
	rect.CompletedTime = &now
	rect.CompletedNote = req.CompletedNote

	if err := config.DB.Save(&rect).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to complete rectification"})
	}

	return c.JSON(rect)
}

func VerifyRectification(c *fiber.Ctx) error {
	id := c.Params("id")
	var rect models.Rectification

	if err := config.DB.First(&rect, id).Error; err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "Rectification not found"})
	}

	var req struct {
		VerifyNote string `json:"verifyNote"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	now := time.Now()
	userID := GetCurrentUserID(c)

	rect.Status = models.RectVerified
	rect.VerifiedBy = &userID
	rect.VerifiedTime = &now
	rect.VerifyNote = req.VerifyNote

	if err := config.DB.Save(&rect).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to verify rectification"})
	}

	return c.JSON(rect)
}

func GetRectifications(c *fiber.Ctx) error {
	var rects []models.Rectification
	query := config.DB.Preload("Assignee").Preload("Verifier").Preload("FollowUps")

	status := c.Query("status")
	if status != "" {
		query = query.Where("status = ?", status)
	}

	assigneeID := c.Query("assigneeId")
	if assigneeID != "" {
		query = query.Where("assignee_id = ?", assigneeID)
	}

	if err := query.Order("created_at desc").Find(&rects).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch rectifications"})
	}

	return c.JSON(rects)
}
