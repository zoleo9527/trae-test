package service

import (
	"floor-settlement/internal/dto"
	"floor-settlement/internal/model"
	"floor-settlement/internal/repository"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var jwtSecret []byte

func Init(secret string) {
	jwtSecret = []byte(secret)
}

type AuthService struct {
	userRepo *repository.UserRepository
}

func NewAuthService() *AuthService {
	return &AuthService{
		userRepo: &repository.UserRepository{},
	}
}

func (s *AuthService) Login(username, password string) (*dto.LoginResponse, error) {
	user, err := s.userRepo.FindByUsername(username)
	if err != nil {
		return nil, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, err
	}

	claims := jwt.MapClaims{
		"user_id":    user.ID.String(),
		"role":       user.Role,
		"project_id": nil,
		"team_id":    nil,
		"real_name":  user.RealName,
		"exp":        time.Now().Add(24 * time.Hour).Unix(),
	}
	if user.ProjectID != nil {
		claims["project_id"] = user.ProjectID.String()
	}
	if user.TeamID != nil {
		claims["team_id"] = user.TeamID.String()
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		return nil, err
	}

	return &dto.LoginResponse{
		Token: tokenString,
		User: dto.UserSummary{
			ID:        user.ID,
			Username:  user.Username,
			RealName:  user.RealName,
			Role:      user.Role,
			Phone:     user.Phone,
			ProjectID: user.ProjectID,
			TeamID:    user.TeamID,
		},
	}, nil
}

func (s *AuthService) ValidateToken(tokenString string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return jwtSecret, nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return nil, jwt.ErrTokenInvalidClaims
	}

	return claims, nil
}

func (s *AuthService) GetUserFromClaims(claims jwt.MapClaims) (*dto.UserSummary, error) {
	userID, err := uuid.Parse(claims["user_id"].(string))
	if err != nil {
		return nil, err
	}

	summary := &dto.UserSummary{
		ID:       userID,
		Username: "",
		RealName: claims["real_name"].(string),
		Role:     claims["role"].(string),
	}

	if projectIDStr, ok := claims["project_id"].(string); ok && projectIDStr != "" {
		pid, err := uuid.Parse(projectIDStr)
		if err == nil {
			summary.ProjectID = &pid
		}
	}

	if teamIDStr, ok := claims["team_id"].(string); ok && teamIDStr != "" {
		tid, err := uuid.Parse(teamIDStr)
		if err == nil {
			summary.TeamID = &tid
		}
	}

	user, err := s.userRepo.FindByID(userID)
	if err == nil {
		summary.Username = user.Username
		summary.Phone = user.Phone
	}

	return summary, nil
}

func (s *AuthService) HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 10)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}
