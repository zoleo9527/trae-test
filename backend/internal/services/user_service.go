package services

import (
	"tea-distribution/internal/db"
	"tea-distribution/internal/models"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserService struct{}

func NewUserService() *UserService {
	return &UserService{}
}

func (s *UserService) Login(username, password string) (*models.User, error) {
	var user models.User
	if err := db.DB.Where("username = ? AND status = 'active'", username).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, models.AppErrNotFound("用户名或密码错误")
		}
		return nil, models.AppErrInternal("登录失败")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, models.AppErrValidationFailed("用户名或密码错误")
	}

	return &user, nil
}

func (s *UserService) GetByID(id uuid.UUID) (*models.User, error) {
	var user models.User
	if err := db.DB.First(&user, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, models.AppErrNotFound("用户不存在")
		}
		return nil, models.AppErrInternal("查询用户失败")
	}
	return &user, nil
}

func (s *UserService) List(role string) ([]models.User, error) {
	var users []models.User
	query := db.DB
	if role != "" {
		query = query.Where("role = ?", role)
	}
	if err := query.Find(&users).Error; err != nil {
		return nil, models.AppErrInternal("查询用户列表失败")
	}
	return users, nil
}

func (s *UserService) Create(user *models.User, password string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return models.AppErrInternal("密码加密失败")
	}
	user.Password = string(hashedPassword)

	if err := db.DB.Create(user).Error; err != nil {
		return models.AppErrInternal("创建用户失败")
	}
	return nil
}

func (s *UserService) HashPassword(password string) (string, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashed), nil
}
