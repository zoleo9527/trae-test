package models

import "errors"

var (
	ErrValidationFailed    = errors.New("validation_failed")
	ErrPermissionDenied    = errors.New("permission_denied")
	ErrStatusConflict      = errors.New("status_conflict")
	ErrNotFound            = errors.New("not_found")
	ErrDuplicate           = errors.New("duplicate")
	ErrInsufficientStock   = errors.New("insufficient_stock")
	ErrBatchMixed          = errors.New("batch_mixed")
	ErrPriceConflict       = errors.New("price_conflict")
	ErrInvalidOperation    = errors.New("invalid_operation")
	ErrInternal            = errors.New("internal_error")
)

type AppError struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

func NewAppError(code, message string, details ...interface{}) *AppError {
	err := &AppError{
		Code:    code,
		Message: message,
	}
	if len(details) > 0 {
		err.Details = details[0]
	}
	return err
}

func (e *AppError) Error() string {
	return e.Message
}

var (
	AppErrValidationFailed = func(msg string, details ...interface{}) *AppError {
		return NewAppError("VALIDATION_FAILED", msg, details...)
	}
	AppErrPermissionDenied = func(msg string, details ...interface{}) *AppError {
		return NewAppError("PERMISSION_DENIED", msg, details...)
	}
	AppErrStatusConflict = func(msg string, details ...interface{}) *AppError {
		return NewAppError("STATUS_CONFLICT", msg, details...)
	}
	AppErrNotFound = func(msg string, details ...interface{}) *AppError {
		return NewAppError("NOT_FOUND", msg, details...)
	}
	AppErrInsufficientStock = func(msg string, details ...interface{}) *AppError {
		return NewAppError("INSUFFICIENT_STOCK", msg, details...)
	}
	AppErrBatchMixed = func(msg string, details ...interface{}) *AppError {
		return NewAppError("BATCH_MIXED", msg, details...)
	}
	AppErrPriceConflict = func(msg string, details ...interface{}) *AppError {
		return NewAppError("PRICE_CONFLICT", msg, details...)
	}
	AppErrInvalidOperation = func(msg string, details ...interface{}) *AppError {
		return NewAppError("INVALID_OPERATION", msg, details...)
	}
	AppErrInternal = func(msg string, details ...interface{}) *AppError {
		return NewAppError("INTERNAL_ERROR", msg, details...)
	}
)
