package service

import (
	appErrors "watch-after-sales/backend/errors"
	"watch-after-sales/backend/dto"
	"watch-after-sales/backend/model"

	"gorm.io/gorm"
)

type UserService struct {
	db *gorm.DB
}

func NewUserService(db *gorm.DB) *UserService {
	return &UserService{db: db}
}

func (s *UserService) List() ([]dto.UserResponse, *appErrors.AppError) {
	var users []model.User
	if err := s.db.Order("display_name ASC").Find(&users).Error; err != nil {
		return nil, appErrors.NewInternalError("failed to query users")
	}

	result := make([]dto.UserResponse, len(users))
	for i, user := range users {
		result[i] = dto.UserResponse{
			ID:          user.ID,
			Username:    user.Username,
			Role:        string(user.Role),
			DisplayName: user.DisplayName,
		}
	}
	return result, nil
}

func (s *UserService) GetByID(id uint) (*dto.UserResponse, *appErrors.AppError) {
	var user model.User
	if err := s.db.First(&user, id).Error; err != nil {
		return nil, appErrors.NewNotFoundError("user not found")
	}
	return &dto.UserResponse{
		ID:          user.ID,
		Username:    user.Username,
		Role:        string(user.Role),
		DisplayName: user.DisplayName,
	}, nil
}
