package services

import (
	"errors"

	"github.com/google/uuid"
	"water-delivery-service/internal/database"
	"water-delivery-service/internal/models"
	"water-delivery-service/internal/utils"
	"water-delivery-service/pkg/dto"
	"water-delivery-service/pkg/types"
)

type AuthService struct{}

func NewAuthService() *AuthService {
	return &AuthService{}
}

func (s *AuthService) Login(req *dto.LoginRequest) (*dto.LoginResponse, error) {
	var user models.User
	err := database.DB.Where("username = ? AND is_active = true", req.Username).First(&user).Error
	if err != nil {
		return nil, errors.New("invalid username or password")
	}

	if !utils.CheckPasswordHash(req.Password, user.PasswordHash) {
		return nil, errors.New("invalid username or password")
	}

	token, err := utils.GenerateJWT(user.ID, user.Username, user.Role, user.StationID)
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	var stationName *string
	if user.StationID != nil {
		var station models.WaterStation
		database.DB.Select("name").Where("id = ?", *user.StationID).First(&station)
		stationName = &station.Name
	}

	return &dto.LoginResponse{
		AccessToken: token,
		TokenType:   "Bearer",
		ExpiresIn:   86400,
		User: dto.UserInfo{
			ID:        user.ID,
			Username:  user.Username,
			FullName:  user.FullName,
			Phone:     user.Phone,
			Role:      user.Role,
			StationID: user.StationID,
		},
	}, nil
}

func (s *AuthService) GetUserByID(userID uuid.UUID) (*models.User, error) {
	var user models.User
	err := database.DB.Where("id = ? AND is_active = true", userID).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (s *AuthService) GetUsersByRole(role types.Role, stationID *uuid.UUID) ([]models.User, error) {
	var users []models.User
	query := database.DB.Where("role = ? AND is_active = true", role)
	if stationID != nil {
		query = query.Where("station_id = ?", *stationID)
	}
	err := query.Find(&users).Error
	return users, err
}

func (s *AuthService) GetUserName(userID uuid.UUID) string {
	var user models.User
	database.DB.Select("full_name").Where("id = ?", userID).First(&user)
	return user.FullName
}
