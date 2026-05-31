package service

import (
	"time"

	appErrors "watch-after-sales/backend/errors"
	"watch-after-sales/backend/middleware"
	"watch-after-sales/backend/model"
	"watch-after-sales/backend/dto"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthService struct {
	db *gorm.DB
}

func NewAuthService(db *gorm.DB) *AuthService {
	return &AuthService{db: db}
}

func (s *AuthService) Login(username, password string) (*dto.LoginResponse, *appErrors.AppError) {
	var user model.User
	if err := s.db.Where("username = ?", username).First(&user).Error; err != nil {
		return nil, appErrors.NewUnauthorizedError("invalid username or password")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, appErrors.NewUnauthorizedError("invalid username or password")
	}

	token, err := middleware.GenerateToken(user.ID, user.Username, string(user.Role), user.DisplayName)
	if err != nil {
		return nil, appErrors.NewInternalError("failed to generate token")
	}

	return &dto.LoginResponse{
		Token:     token,
		ExpiresAt: time.Now().Add(24 * time.Hour),
		User: dto.UserResponse{
			ID:          user.ID,
			Username:    user.Username,
			Role:        string(user.Role),
			DisplayName: user.DisplayName,
		},
	}, nil
}
