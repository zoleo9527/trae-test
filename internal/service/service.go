package service

import (
	"camp-management/internal/async"
	"camp-management/internal/repository"
	"errors"
	"fmt"
)

var (
	ErrValidation     = errors.New("validation error")
	ErrUnauthorized   = errors.New("unauthorized")
	ErrForbidden      = errors.New("forbidden")
	ErrNotFound       = errors.New("not found")
	ErrConflict       = errors.New("status conflict")
	ErrCapacity       = errors.New("capacity exceeded")
	ErrInvalidInput   = errors.New("invalid input")
)

type ServiceError struct {
	Code    string
	Message string
	Err     error
}

func (e *ServiceError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.Err)
	}
	return e.Message
}

func NewServiceError(code, message string, err error) *ServiceError {
	return &ServiceError{Code: code, Message: message, Err: err}
}

type Services struct {
	Auth         *AuthService
	Camp         *CampService
	Camper       *CamperService
	Room         *RoomService
	Registration *RegistrationService
	Activity     *ActivityService
	Medical      *MedicalService
	Supply       *SupplyService
	Audit        *AuditService
	Export       *ExportService
}

func NewServices(repos *repository.Repositories, taskQueue *async.TaskQueue) *Services {
	auditService := NewAuditService(repos.Audit)
	
	return &Services{
		Auth:         NewAuthService(repos.User, auditService),
		Camp:         NewCampService(repos.Camp, auditService),
		Camper:       NewCamperService(repos.Camper, repos.Camp, repos.Room, auditService, taskQueue),
		Room:         NewRoomService(repos.Room, repos.Camper, auditService),
		Registration: NewRegistrationService(repos.Registration, repos.Camper, repos.Camp, auditService),
		Activity:     NewActivityService(repos.Activity, repos.Attendance, repos.Camper, auditService),
		Medical:      NewMedicalService(repos.Medical, repos.Camper, auditService, taskQueue),
		Supply:       NewSupplyService(repos.Supply, repos.Camper, auditService),
		Audit:        auditService,
		Export:       NewExportService(repos, taskQueue),
	}
}
