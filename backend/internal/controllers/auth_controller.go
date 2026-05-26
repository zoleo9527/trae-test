package controllers

import (
	"net/http"
	"tea-distribution/internal/auth"
	"tea-distribution/internal/services"

	"github.com/gofiber/fiber/v2"
)

type AuthController struct {
	userService *services.UserService
}

func NewAuthController() *AuthController {
	return &AuthController{
		userService: services.NewUserService(),
	}
}

type LoginRequest struct {
	Username string `json:"username" validate:"required"`
	Password string `json:"password" validate:"required"`
}

type LoginResponse struct {
	Token string      `json:"token"`
	User  interface{} `json:"user"`
}

func (ctrl *AuthController) Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"code":    "VALIDATION_FAILED",
			"message": "请求参数错误",
		})
	}

	user, err := ctrl.userService.Login(req.Username, req.Password)
	if err != nil {
		return c.Status(http.StatusUnauthorized).JSON(err)
	}

	token, err := auth.GenerateToken(user)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"code":    "INTERNAL_ERROR",
			"message": "生成令牌失败",
		})
	}

	return c.JSON(LoginResponse{
		Token: token,
		User: fiber.Map{
			"id":       user.ID,
			"username": user.Username,
			"name":     user.Name,
			"role":     user.Role,
			"phone":    user.Phone,
			"email":    user.Email,
		},
	})
}

func (ctrl *AuthController) GetCurrentUser(c *fiber.Ctx) error {
	user := auth.GetCurrentUser(c)
	if user == nil {
		return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
			"code":    "UNAUTHORIZED",
			"message": "未登录",
		})
	}

	return c.JSON(fiber.Map{
		"id":       user.UserID,
		"username": user.Username,
		"name":     user.Name,
		"role":     user.Role,
	})
}

func (ctrl *AuthController) Logout(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"message": "已退出登录",
	})
}
