package controller

import (
	"autoparts/internal/dto"
	"autoparts/internal/service"
	"autoparts/internal/util"
	apperrors "autoparts/pkg/errors"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

type AuthController struct {
	authService *service.AuthService
	validate    *validator.Validate
}

func NewAuthController() *AuthController {
	return &AuthController{
		authService: service.NewAuthService(),
		validate:    validator.New(),
	}
}

func (c *AuthController) Login(ctx *fiber.Ctx) error {
	var req dto.LoginRequest
	if err := ctx.BodyParser(&req); err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "请求参数错误", err.Error())
	}

	if err := c.validate.Struct(&req); err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "参数验证失败", err.Error())
	}

	ip := ctx.IP()
	resp, err := c.authService.Login(&req, ip)
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			return util.Error(ctx, appErr.HTTPStatus(), string(appErr.Code), appErr.Message, appErr.Details)
		}
		return util.Error(ctx, fiber.StatusInternalServerError, string(apperrors.ErrCodeInternal), "登录失败", err.Error())
	}

	return util.Success(ctx, resp)
}

func (c *AuthController) GetProfile(ctx *fiber.Ctx) error {
	user := util.GetUserFromContext(ctx)
	if user == nil {
		return util.Error(ctx, fiber.StatusUnauthorized, string(apperrors.ErrCodeUnauthorized), "未授权", nil)
	}

	return util.Success(ctx, dto.UserInfo{
		ID:       user.ID,
		Username: user.Username,
		Name:     user.Name,
		Phone:    user.Phone,
		Role:     string(user.Role),
		IsActive: user.IsActive,
	})
}

func (c *AuthController) ChangePassword(ctx *fiber.Ctx) error {
	user := util.GetUserFromContext(ctx)
	if user == nil {
		return util.Error(ctx, fiber.StatusUnauthorized, string(apperrors.ErrCodeUnauthorized), "未授权", nil)
	}

	var req dto.ChangePasswordRequest
	if err := ctx.BodyParser(&req); err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "请求参数错误", err.Error())
	}

	if err := c.validate.Struct(&req); err != nil {
		return util.Error(ctx, fiber.StatusBadRequest, string(apperrors.ErrCodeValidation), "参数验证失败", err.Error())
	}

	ip := ctx.IP()
	if err := c.authService.ChangePassword(user, &req, ip); err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			return util.Error(ctx, appErr.HTTPStatus(), string(appErr.Code), appErr.Message, appErr.Details)
		}
		return util.Error(ctx, fiber.StatusInternalServerError, string(apperrors.ErrCodeInternal), "修改密码失败", err.Error())
	}

	return util.Success(ctx, nil)
}
