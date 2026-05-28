package handler

import (
	"camp-management/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type Handlers struct {
	Auth         *AuthHandler
	Camp         *CampHandler
	Camper       *CamperHandler
	Room         *RoomHandler
	Registration *RegistrationHandler
	Activity     *ActivityHandler
	Medical      *MedicalHandler
	Supply       *SupplyHandler
	Audit        *AuditHandler
	Task         *TaskHandler
	Export       *ExportHandler
}

func NewHandlers(services *service.Services) *Handlers {
	return &Handlers{
		Auth:         NewAuthHandler(services.Auth),
		Camp:         NewCampHandler(services.Camp, services.Auth),
		Camper:       NewCamperHandler(services.Camper, services.Auth),
		Room:         NewRoomHandler(services.Room, services.Auth),
		Registration: NewRegistrationHandler(services.Registration, services.Auth),
		Activity:     NewActivityHandler(services.Activity, services.Auth),
		Medical:      NewMedicalHandler(services.Medical, services.Auth),
		Supply:       NewSupplyHandler(services.Supply, services.Auth),
		Audit:        NewAuditHandler(services.Audit, services.Auth),
		Task:         NewTaskHandler(services),
		Export:       NewExportHandler(services.Export, services.Auth),
	}
}

func HandleError(c *fiber.Ctx, err error) error {
	if se, ok := err.(*service.ServiceError); ok {
		status := fiber.StatusInternalServerError
		switch se.Code {
		case "INVALID_CREDENTIALS", "INVALID_TOKEN":
			status = fiber.StatusUnauthorized
		case "FORBIDDEN":
			status = fiber.StatusForbidden
		case "NOT_FOUND", "CAMP_NOT_FOUND", "CAMPER_NOT_FOUND", "ROOM_NOT_FOUND", "ACTIVITY_NOT_FOUND", "REGISTRATION_NOT_FOUND", "RECORD_NOT_FOUND", "REQUEST_NOT_FOUND":
			status = fiber.StatusNotFound
		case "INVALID_STATUS", "ALREADY_ASSIGNED", "GENDER_MISMATCH", "ALREADY_RESOLVED", "ALREADY_NOTIFIED":
			status = fiber.StatusConflict
		case "INVALID_MAX_CAMPERS", "INVALID_BIRTH_DATE", "INVALID_START_TIME", "INVALID_END_TIME":
			status = fiber.StatusBadRequest
		case "CAMP_FULL", "ROOM_FULL", "CAMP_CAPACITY_EXCEEDED", "ROOM_CAPACITY_EXCEEDED":
			status = fiber.StatusConflict
		}
		return c.Status(status).JSON(fiber.Map{
			"code":    se.Code,
			"message": se.Message,
		})
	}
	return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
		"code":    "INTERNAL_ERROR",
		"message": "服务器内部错误",
	})
}

func ParseUUIDParam(c *fiber.Ctx, param string) (uuid.UUID, error) {
	idStr := c.Params(param)
	id, err := uuid.Parse(idStr)
	if err != nil {
		return uuid.Nil, service.NewServiceError("INVALID_ID", "无效的ID格式", err)
	}
	return id, nil
}

type PageResult struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"page_size"`
	TotalPages int         `json:"total_pages"`
}

func NewPageResult(data interface{}, total int64, page, pageSize int) *PageResult {
	totalPages := int(total) / pageSize
	if int(total)%pageSize > 0 {
		totalPages++
	}
	return &PageResult{
		Data:       data,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}
}
