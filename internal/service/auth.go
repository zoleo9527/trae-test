package service

import (
	"camp-management/internal/model"
	"camp-management/internal/repository"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	userRepo  *repository.UserRepository
	auditRepo *repository.AuditRepository
	jwtSecret string
}

func NewAuthService(userRepo *repository.UserRepository, auditService *AuditService) *AuthService {
	return &AuthService{
		userRepo:  userRepo,
		auditRepo: auditService.repo,
		jwtSecret: "camp-secret-key-2024-very-long-and-secure",
	}
}

type LoginRequest struct {
	Username string `json:"username" validate:"required"`
	Password string `json:"password" validate:"required"`
}

type LoginResponse struct {
	Token string      `json:"token"`
	User  *model.User `json:"user"`
	ExpiresAt time.Time `json:"expires_at"`
}

type JWTClaims struct {
	UserID   uuid.UUID      `json:"user_id"`
	Username string         `json:"username"`
	Role     model.UserRole `json:"role"`
	jwt.RegisteredClaims
}

func (s *AuthService) Login(req LoginRequest, ip, userAgent string) (*LoginResponse, error) {
	user, err := s.userRepo.GetByUsername(req.Username)
	if err != nil {
		if errors.Is(err, repository.ErrRecordNotFound) {
			return nil, NewServiceError("INVALID_CREDENTIALS", "用户名或密码错误", err)
		}
		return nil, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		s.auditRepo.Log(user.ID, model.AuditActionLogin, "user", nil, nil, nil, nil, ip, userAgent, "登录失败：密码错误")
		return nil, NewServiceError("INVALID_CREDENTIALS", "用户名或密码错误", err)
	}

	expiresAt := time.Now().Add(24 * time.Hour)
	claims := JWTClaims{
		UserID:   user.ID,
		Username: user.Username,
		Role:     user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "camp-management",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.jwtSecret))
	if err != nil {
		return nil, err
	}

	s.auditRepo.Log(user.ID, model.AuditActionLogin, "user", nil, nil, nil, nil, ip, userAgent, "登录成功")

	return &LoginResponse{
		Token:     tokenString,
		User:      user,
		ExpiresAt: expiresAt,
	}, nil
}

func (s *AuthService) ValidateToken(tokenString string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(s.jwtSecret), nil
	})

	if err != nil {
		return nil, NewServiceError("INVALID_TOKEN", "无效的token", err)
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, NewServiceError("INVALID_TOKEN", "无效的token", nil)
}

func (s *AuthService) GetUserByID(id uuid.UUID) (*model.User, error) {
	user, err := s.userRepo.GetByID(id)
	if err != nil {
		if errors.Is(err, repository.ErrRecordNotFound) {
			return nil, NewServiceError("USER_NOT_FOUND", "用户不存在", err)
		}
		return nil, err
	}
	return user, nil
}

func (s *AuthService) HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

func (s *AuthService) CheckPermission(user *model.User, requiredRoles ...model.UserRole) bool {
	return user.HasPermission(requiredRoles...)
}

func (s *AuthService) RequirePermission(user *model.User, requiredRoles ...model.UserRole) error {
	if !s.CheckPermission(user, requiredRoles...) {
		return NewServiceError("FORBIDDEN", "权限不足", ErrForbidden)
	}
	return nil
}
