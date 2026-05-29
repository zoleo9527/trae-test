package service

import (
	"autoparts/internal/config"
	"autoparts/internal/dto"
	"autoparts/internal/model"
	apperrors "autoparts/pkg/errors"
)

type CustomerService struct {
	auditService *AuditService
}

func NewCustomerService() *CustomerService {
	return &CustomerService{
		auditService: NewAuditService(),
	}
}

func (s *CustomerService) Create(user *model.User, req *dto.CreateCustomerRequest, ip string) (*model.Customer, error) {
	customer := &model.Customer{
		Name:         req.Name,
		Phone:        req.Phone,
		LicensePlate: req.LicensePlate,
		CarModel:     req.CarModel,
		IsCredit:     req.IsCredit,
		CreditDays:   req.CreditDays,
		Remark:       req.Remark,
	}

	if err := config.DB.Create(customer).Error; err != nil {
		return nil, apperrors.NewInternalError("创建客户失败", err)
	}

	s.auditService.LogCreate(user, "customer", customer.ID, customer.Name, customer, ip)

	return customer, nil
}

func (s *CustomerService) Update(user *model.User, id uint, req *dto.UpdateCustomerRequest, ip string) (*model.Customer, error) {
	customer, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	if req.Name != nil {
		customer.Name = *req.Name
	}
	if req.Phone != nil {
		customer.Phone = *req.Phone
	}
	if req.LicensePlate != nil {
		customer.LicensePlate = *req.LicensePlate
	}
	if req.CarModel != nil {
		customer.CarModel = *req.CarModel
	}
	if req.IsCredit != nil {
		customer.IsCredit = *req.IsCredit
	}
	if req.CreditDays != nil {
		customer.CreditDays = *req.CreditDays
	}
	if req.Remark != nil {
		customer.Remark = *req.Remark
	}

	if err := config.DB.Save(customer).Error; err != nil {
		return nil, apperrors.NewInternalError("更新客户失败", err)
	}

	s.auditService.LogUpdate(user, "customer", customer.ID, customer.Name, "info", nil, customer, ip)

	return customer, nil
}

func (s *CustomerService) GetByID(id uint) (*model.Customer, error) {
	var customer model.Customer
	if err := config.DB.First(&customer, id).Error; err != nil {
		return nil, apperrors.NewNotFoundError("客户不存在")
	}
	return &customer, nil
}

func (s *CustomerService) Delete(user *model.User, id uint, ip string) error {
	customer, err := s.GetByID(id)
	if err != nil {
		return err
	}

	if err := config.DB.Delete(customer).Error; err != nil {
		return apperrors.NewInternalError("删除客户失败", err)
	}

	s.auditService.LogDelete(user, "customer", customer.ID, customer.Name, ip)

	return nil
}

func (s *CustomerService) List(filter *dto.CustomerFilter) ([]model.Customer, int64, error) {
	var customers []model.Customer
	var total int64

	query := config.DB.Model(&model.Customer{})

	if filter.Name != nil && *filter.Name != "" {
		query = query.Where("name LIKE ?", "%"+*filter.Name+"%")
	}
	if filter.Phone != nil && *filter.Phone != "" {
		query = query.Where("phone LIKE ?", "%"+*filter.Phone+"%")
	}
	if filter.LicensePlate != nil && *filter.LicensePlate != "" {
		query = query.Where("license_plate LIKE ?", "%"+*filter.LicensePlate+"%")
	}
	if filter.IsCredit != nil {
		query = query.Where("is_credit = ?", *filter.IsCredit)
	}

	query.Count(&total)

	page := filter.Page
	if page < 1 {
		page = 1
	}
	pageSize := filter.PageSize
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	err := query.Order("created_at DESC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&customers).Error

	return customers, total, err
}
