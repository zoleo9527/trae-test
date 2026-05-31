package handlers

import (
	"net/http"
	"time"

	"github.com/cleaning-tracker/backend/config"
	"github.com/cleaning-tracker/backend/models"
	"github.com/gofiber/fiber/v2"
)

type CheckInRequest struct {
	ShiftID  uint   `json:"shiftId"`
	PhotoURL string `json:"photoUrl"`
	Location string `json:"location"`
	Remark   string `json:"remark"`
}

func CreateCheckIn(c *fiber.Ctx) error {
	var req CheckInRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	now := time.Now()
	checkIn := models.CheckIn{
		ShiftID:     req.ShiftID,
		WorkerID:    GetCurrentUserID(c),
		CheckInTime: &now,
		Status:      models.CheckInNormal,
		PhotoURL:    req.PhotoURL,
		Location:    req.Location,
		Remark:      req.Remark,
	}

	if err := config.DB.Create(&checkIn).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create check-in"})
	}

	return c.JSON(checkIn)
}

func CheckOut(c *fiber.Ctx) error {
	id := c.Params("id")
	var checkIn models.CheckIn

	if err := config.DB.First(&checkIn, id).Error; err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "Check-in not found"})
	}

	now := time.Now()
	checkIn.CheckOutTime = &now

	if err := config.DB.Save(&checkIn).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to check out"})
	}

	return c.JSON(checkIn)
}

func CorrectCheckIn(c *fiber.Ctx) error {
	id := c.Params("id")
	var checkIn models.CheckIn

	if err := config.DB.First(&checkIn, id).Error; err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "Check-in not found"})
	}

	var req struct {
		Status      models.CheckInStatus `json:"status"`
		CheckInTime *time.Time           `json:"checkInTime"`
		CheckOutTime *time.Time          `json:"checkOutTime"`
		CorrectNote string               `json:"correctNote"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	now := time.Now()
	userID := GetCurrentUserID(c)

	checkIn.IsCorrected = true
	checkIn.CorrectedBy = &userID
	checkIn.CorrectTime = &now
	checkIn.CorrectNote = req.CorrectNote

	if req.Status != "" {
		checkIn.Status = req.Status
	}
	if req.CheckInTime != nil {
		checkIn.CheckInTime = req.CheckInTime
	}
	if req.CheckOutTime != nil {
		checkIn.CheckOutTime = req.CheckOutTime
	}

	if err := config.DB.Save(&checkIn).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to correct check-in"})
	}

	return c.JSON(checkIn)
}

func GetCheckIns(c *fiber.Ctx) error {
	var checkIns []models.CheckIn
	query := config.DB.Preload("Worker").Preload("Corrector")

	shiftID := c.Query("shiftId")
	if shiftID != "" {
		query = query.Where("shift_id = ?", shiftID)
	}

	workerID := c.Query("workerId")
	if workerID != "" {
		query = query.Where("worker_id = ?", workerID)
	}

	status := c.Query("status")
	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Order("created_at desc").Find(&checkIns).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch check-ins"})
	}

	return c.JSON(checkIns)
}
