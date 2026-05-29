package services

import (
	"errors"
	"runner-platform/internal/config"
	"runner-platform/internal/database"
	"runner-platform/internal/models"
	"runner-platform/internal/schemas"
	"runner-platform/internal/utils"

	"github.com/google/uuid"
)

type AuthService struct{}

func NewAuthService() *AuthService {
	return &AuthService{}
}

func (s *AuthService) Login(req *schemas.LoginRequest) (*schemas.LoginResponse, error) {
	var user models.User
	if err := database.DB.Where("username = ? OR email = ? OR phone = ?", req.Username, req.Username, req.Username).First(&user).Error; err != nil {
		return nil, errors.New("invalid credentials")
	}

	if user.Status != 1 {
		return nil, errors.New("account is disabled")
	}

	if !utils.CheckPasswordHash(req.Password, user.PasswordHash) {
		return nil, errors.New("invalid credentials")
	}

	token, err := utils.GenerateToken(&user)
	if err != nil {
		return nil, err
	}

	return &schemas.LoginResponse{
		AccessToken: token,
		TokenType:   "Bearer",
		ExpiresIn:   config.AppConfig.JWT.ExpireHours * 3600,
		User: &schemas.UserInfo{
			ID:       user.ID.String(),
			Username: user.Username,
			RealName: user.RealName,
			Role:     string(user.Role),
			Email:    user.Email,
			Phone:    user.Phone,
		},
	}, nil
}

func (s *AuthService) GetUserByID(id uuid.UUID) (*models.User, error) {
	var user models.User
	if err := database.DB.Where("id = ?", id).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (s *AuthService) ChangePassword(userID uuid.UUID, req *schemas.ChangePasswordRequest) error {
	var user models.User
	if err := database.DB.Where("id = ?", userID).First(&user).Error; err != nil {
		return errors.New("user not found")
	}

	if !utils.CheckPasswordHash(req.OldPassword, user.PasswordHash) {
		return errors.New("old password is incorrect")
	}

	newHash, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		return err
	}

	user.PasswordHash = newHash
	return database.DB.Save(&user).Error
}

func (s *AuthService) GetUsersByRole(role models.Role) ([]models.User, error) {
	var users []models.User
	if err := database.DB.Where("role = ? AND status = 1", role).Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}
