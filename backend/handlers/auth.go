package handlers

import (
	"gallery-system/config"
	"gallery-system/database"
	"gallery-system/middleware"
	"gallery-system/models"
	"gallery-system/utils"

	"github.com/gofiber/fiber/v2"
)

type LoginRequest struct {
	Username string `json:"username" validate:"required"`
	Password string `json:"password" validate:"required"`
}

type LoginResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

func Login(cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req LoginRequest
		if err := c.BodyParser(&req); err != nil {
			return utils.JSONError(c, fiber.StatusBadRequest, "请求参数错误", err.Error())
		}

		var user models.User
		if err := database.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
			return utils.JSONError(c, fiber.StatusUnauthorized, "用户名或密码错误", "用户不存在")
		}

		if user.Status != "active" {
			return utils.JSONError(c, fiber.StatusUnauthorized, "账户已禁用", "请联系管理员")
		}

		if !user.CheckPassword(req.Password) {
			_ = utils.CreateAuditLog(
				"auth", "login_failed", "user", &user.ID, user.Username,
				user.ID, user.Name, string(user.Role), nil, nil,
				c.IP(), c.Get("User-Agent"), "密码错误",
			)
			return utils.JSONError(c, fiber.StatusUnauthorized, "用户名或密码错误", "密码不匹配")
		}

		token, err := utils.GenerateToken(cfg, user.ID, user.Username, string(user.Role))
		if err != nil {
			return utils.JSONError(c, fiber.StatusInternalServerError, "生成Token失败", err.Error())
		}

		_ = utils.CreateAuditLog(
			"auth", "login_success", "user", &user.ID, user.Username,
			user.ID, user.Name, string(user.Role), nil, nil,
			c.IP(), c.Get("User-Agent"), "",
		)

		return utils.JSONResponse(c, fiber.StatusOK, true, "登录成功", LoginResponse{
			Token: token,
			User:  user,
		})
	}
}

func GetCurrentUserProfile(c *fiber.Ctx) error {
	claims := middleware.GetCurrentUser(c)
	if claims == nil {
		return utils.JSONError(c, fiber.StatusUnauthorized, "未授权", "用户未登录")
	}

	var user models.User
	if err := database.DB.First(&user, claims.UserID).Error; err != nil {
		return utils.JSONError(c, fiber.StatusNotFound, "用户不存在", err.Error())
	}

	return utils.JSONResponse(c, fiber.StatusOK, true, "", user)
}

func ChangePassword(c *fiber.Ctx) error {
	claims := middleware.GetCurrentUser(c)
	if claims == nil {
		return utils.JSONError(c, fiber.StatusUnauthorized, "未授权", "用户未登录")
	}

	var req struct {
		OldPassword string `json:"old_password"`
		NewPassword string `json:"new_password"`
	}

	if err := c.BodyParser(&req); err != nil {
		return utils.JSONError(c, fiber.StatusBadRequest, "参数错误", err.Error())
	}

	var user models.User
	if err := database.DB.First(&user, claims.UserID).Error; err != nil {
		return utils.JSONError(c, fiber.StatusNotFound, "用户不存在", err.Error())
	}

	if !user.CheckPassword(req.OldPassword) {
		return utils.JSONError(c, fiber.StatusBadRequest, "原密码错误", "")
	}

	if err := user.HashPassword(req.NewPassword); err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "密码加密失败", err.Error())
	}

	if err := database.DB.Save(&user).Error; err != nil {
		return utils.JSONError(c, fiber.StatusInternalServerError, "保存失败", err.Error())
	}

	_ = utils.CreateAuditLog(
		"auth", "change_password", "user", &user.ID, user.Username,
		user.ID, user.Name, string(user.Role), nil, nil,
		c.IP(), c.Get("User-Agent"), "",
	)

	return utils.JSONResponse(c, fiber.StatusOK, true, "密码修改成功", nil)
}
