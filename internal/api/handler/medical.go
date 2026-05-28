package handler

import (
	"camp-management/internal/model"
	"camp-management/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type MedicalHandler struct {
	medicalService *service.MedicalService
	authService    *service.AuthService
}

func NewMedicalHandler(medicalService *service.MedicalService, authService *service.AuthService) *MedicalHandler {
	return &MedicalHandler{medicalService: medicalService, authService: authService}
}

func (h *MedicalHandler) Create(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(uuid.UUID)

	var req service.CreateMedicalRecordRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"code":    "INVALID_REQUEST",
			"message": "请求参数错误",
		})
	}

	record, err := h.medicalService.Create(req, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return c.Status(fiber.StatusCreated).JSON(record)
}

func (h *MedicalHandler) Get(c *fiber.Ctx) error {
	id, err := ParseUUIDParam(c, "id")
	if err != nil {
		return HandleError(c, err)
	}

	record, err := h.medicalService.GetByID(id)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(record)
}

func (h *MedicalHandler) GetByCampID(c *fiber.Ctx) error {
	campID, err := ParseUUIDParam(c, "campId")
	if err != nil {
		return HandleError(c, err)
	}

	statusStr := c.Query("status")
	var status *model.MedicalStatus
	if statusStr != "" {
		s := model.MedicalStatus(statusStr)
		status = &s
	}

	records, err := h.medicalService.GetByCampID(campID, status)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(records)
}

func (h *MedicalHandler) GetByCamperID(c *fiber.Ctx) error {
	camperID, err := ParseUUIDParam(c, "camperId")
	if err != nil {
		return HandleError(c, err)
	}

	records, err := h.medicalService.GetByCamperID(camperID)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(records)
}

func (h *MedicalHandler) Resolve(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(uuid.UUID)
	id, err := ParseUUIDParam(c, "id")
	if err != nil {
		return HandleError(c, err)
	}

	var req service.ResolveMedicalRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"code":    "INVALID_REQUEST",
			"message": "请求参数错误",
		})
	}

	record, err := h.medicalService.Resolve(id, req, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(record)
}

func (h *MedicalHandler) NotifyParent(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(uuid.UUID)
	id, err := ParseUUIDParam(c, "id")
	if err != nil {
		return HandleError(c, err)
	}

	record, err := h.medicalService.NotifyParent(id, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return c.JSON(record)
}
