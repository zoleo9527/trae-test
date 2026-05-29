package dto

import "time"

type CreateCustomerRequest struct {
	Name         string `json:"name" validate:"required,max=100"`
	Phone        string `json:"phone" validate:"max=20"`
	LicensePlate string `json:"license_plate" validate:"max=20"`
	CarModel     string `json:"car_model" validate:"max=50"`
	IsCredit     bool   `json:"is_credit"`
	CreditDays   int    `json:"credit_days" validate:"min=0,max=365"`
	Remark       string `json:"remark"`
}

type UpdateCustomerRequest struct {
	Name         *string `json:"name" validate:"omitempty,max=100"`
	Phone        *string `json:"phone" validate:"omitempty,max=20"`
	LicensePlate *string `json:"license_plate" validate:"omitempty,max=20"`
	CarModel     *string `json:"car_model" validate:"omitempty,max=50"`
	IsCredit     *bool   `json:"is_credit"`
	CreditDays   *int    `json:"credit_days" validate:"omitempty,min=0,max=365"`
	Remark       *string `json:"remark"`
}

type CustomerFilter struct {
	Name         *string `json:"name"`
	Phone        *string `json:"phone"`
	LicensePlate *string `json:"license_plate"`
	IsCredit     *bool   `json:"is_credit"`
	Page         int     `json:"page" validate:"min=1"`
	PageSize     int     `json:"page_size" validate:"min=1,max=100"`
}

type CustomerResponse struct {
	ID           uint      `json:"id"`
	Name         string    `json:"name"`
	Phone        string    `json:"phone"`
	LicensePlate string    `json:"license_plate"`
	CarModel     string    `json:"car_model"`
	IsCredit     bool      `json:"is_credit"`
	CreditDays   int       `json:"credit_days"`
	Remark       string    `json:"remark"`
	CreatedAt    time.Time `json:"created_at"`
}
