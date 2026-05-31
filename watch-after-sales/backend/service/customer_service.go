package service

import (
	appErrors "watch-after-sales/backend/errors"
	"watch-after-sales/backend/dto"
	"watch-after-sales/backend/model"

	"gorm.io/gorm"
)

type CustomerService struct {
	db *gorm.DB
}

func NewCustomerService(db *gorm.DB) *CustomerService {
	return &CustomerService{db: db}
}

func (s *CustomerService) List() ([]dto.CustomerResponse, *appErrors.AppError) {
	var customers []model.Customer
	if err := s.db.Order("name ASC").Find(&customers).Error; err != nil {
		return nil, appErrors.NewInternalError("failed to query customers")
	}

	result := make([]dto.CustomerResponse, len(customers))
	for i, c := range customers {
		result[i] = dto.CustomerResponse{
			ID:        c.ID,
			Name:      c.Name,
			Phone:     c.Phone,
			Email:     c.Email,
			Address:   c.Address,
			CreatedAt: c.CreatedAt,
			UpdatedAt: c.UpdatedAt,
		}
	}
	return result, nil
}

func (s *CustomerService) GetByID(id uint) (*dto.CustomerResponse, *appErrors.AppError) {
	var customer model.Customer
	if err := s.db.First(&customer, id).Error; err != nil {
		return nil, appErrors.NewNotFoundError("customer not found")
	}
	return &dto.CustomerResponse{
		ID:        customer.ID,
		Name:      customer.Name,
		Phone:     customer.Phone,
		Email:     customer.Email,
		Address:   customer.Address,
		CreatedAt: customer.CreatedAt,
		UpdatedAt: customer.UpdatedAt,
	}, nil
}

func (s *CustomerService) Create(req dto.CreateCustomerRequest, operatorID uint, operatorName string, auditService *AuditService) (*dto.CustomerResponse, *appErrors.AppError) {
	customer := model.Customer{
		Name:    req.Name,
		Phone:   req.Phone,
		Email:   req.Email,
		Address: req.Address,
	}

	if err := s.db.Create(&customer).Error; err != nil {
		return nil, appErrors.NewInternalError("failed to create customer")
	}

	auditService.Log("customer", customer.ID, "create", nil, toJSONMap(customer), operatorID, operatorName)

	return &dto.CustomerResponse{
		ID:        customer.ID,
		Name:      customer.Name,
		Phone:     customer.Phone,
		Email:     customer.Email,
		Address:   customer.Address,
		CreatedAt: customer.CreatedAt,
		UpdatedAt: customer.UpdatedAt,
	}, nil
}
