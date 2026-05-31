package errors

import "net/http"

type AppError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Type    string `json:"type"`
}

func (e *AppError) Error() string {
	return e.Message
}

func NewValidationError(msg string) *AppError {
	return &AppError{Code: http.StatusBadRequest, Message: msg, Type: "validation"}
}

func NewUnauthorizedError(msg string) *AppError {
	return &AppError{Code: http.StatusUnauthorized, Message: msg, Type: "unauthorized"}
}

func NewForbiddenError(msg string) *AppError {
	return &AppError{Code: http.StatusForbidden, Message: msg, Type: "unauthorized"}
}

func NewConflictError(msg string) *AppError {
	return &AppError{Code: http.StatusConflict, Message: msg, Type: "conflict"}
}

func NewNotFoundError(msg string) *AppError {
	return &AppError{Code: http.StatusNotFound, Message: msg, Type: "not_found"}
}

func NewInternalError(msg string) *AppError {
	return &AppError{Code: http.StatusInternalServerError, Message: msg, Type: "internal"}
}

func MapHTTPStatus(err *AppError) int {
	return err.Code
}
