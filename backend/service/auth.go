package service

import (
	"instrument-rental/config"
	"instrument-rental/database"
	"instrument-rental/middleware"
	"instrument-rental/model"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthService struct {
	cfg *config.Config
}

func NewAuthService(cfg *config.Config) *AuthService { return &AuthService{cfg: cfg} }

type LoginInput struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type RegisterInput struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Name     string `json:"name"`
	Phone    string `json:"phone"`
	Role     string `json:"role"`
}

type AuthResponse struct {
	Token string     `json:"token"`
	User  model.User `json:"user"`
}

func (s *AuthService) Login(input *LoginInput) (*AuthResponse, error) {
	var user model.User
	if err := database.DB.Where("username = ? AND is_active = ?", input.Username, true).First(&user).Error; err != nil {
		return nil, err
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		return nil, gorm.ErrRecordNotFound
	}
	token, err := middleware.GenerateToken(user.ID, user.Username, string(user.Role), s.cfg)
	if err != nil {
		return nil, err
	}
	return &AuthResponse{Token: token, User: user}, nil
}

func (s *AuthService) Register(input *RegisterInput) (*model.User, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	user := &model.User{
		Username:     input.Username,
		PasswordHash: string(hash),
		Name:         input.Name,
		Phone:        input.Phone,
		Role:         model.Role(input.Role),
		IsActive:     true,
	}
	if err := database.DB.Create(user).Error; err != nil {
		return nil, err
	}
	return user, nil
}

func (s *AuthService) GetCurrentUser(userID uint) (*model.User, error) {
	var user model.User
	err := database.DB.First(&user, userID).Error
	return &user, err
}

func parseDate(s string) (time.Time, error) {
	return time.Parse("2006-01-02", s)
}
