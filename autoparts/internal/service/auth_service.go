package service

import (
	"autoparts/internal/config"
	"autoparts/internal/dto"
	"autoparts/internal/model"
	"autoparts/internal/util"
	apperrors "autoparts/pkg/errors"
)

type AuthService struct {
	auditService *AuditService
}

func NewAuthService() *AuthService {
	return &AuthService{
		auditService: NewAuditService(),
	}
}

func (s *AuthService) Login(req *dto.LoginRequest, ip string) (*dto.LoginResponse, error) {
	var user model.User
	if err := config.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		return nil, apperrors.NewUnauthorizedError("用户名或密码错误")
	}

	if !user.IsActive {
		return nil, apperrors.NewForbiddenError("用户已被禁用")
	}

	if !util.CheckPassword(req.Password, user.Password) {
		return nil, apperrors.NewUnauthorizedError("用户名或密码错误")
	}

	token, err := util.GenerateToken(user.ID, user.Username, user.Role, config.AppConfigInstance.JWT.Secret, config.AppConfigInstance.JWT.ExpireHours)
	if err != nil {
		return nil, apperrors.NewInternalError("生成令牌失败", err)
	}

	s.auditService.Log(&user, model.AuditActionCreate, "auth", user.ID, user.Username, "", nil, nil, ip, "用户登录")

	return &dto.LoginResponse{
		Token: token,
		User: dto.UserInfo{
			ID:       user.ID,
			Username: user.Username,
			Name:     user.Name,
			Phone:    user.Phone,
			Role:     string(user.Role),
			IsActive: user.IsActive,
		},
	}, nil
}

func (s *AuthService) ChangePassword(user *model.User, req *dto.ChangePasswordRequest, ip string) error {
	if !util.CheckPassword(req.OldPassword, user.Password) {
		return apperrors.NewValidationError("原密码错误", nil)
	}

	newHash, err := util.HashPassword(req.NewPassword)
	if err != nil {
		return apperrors.NewInternalError("密码加密失败", err)
	}

	oldHash := user.Password
	user.Password = newHash

	if err := config.DB.Save(user).Error; err != nil {
		return apperrors.NewInternalError("更新密码失败", err)
	}

	s.auditService.LogUpdate(user, "user", user.ID, user.Username, "password", oldHash, "***", ip)

	return nil
}

func (s *AuthService) GetUserByID(id uint) (*model.User, error) {
	var user model.User
	if err := config.DB.First(&user, id).Error; err != nil {
		return nil, apperrors.NewNotFoundError("用户不存在")
	}
	return &user, nil
}
