package handler

import (
	"camp-system/internal/auth"
	"camp-system/internal/database"
	"camp-system/internal/model"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct{}

func NewAuthHandler() *AuthHandler {
	return &AuthHandler{}
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string      `json:"token"`
	User  interface{} `json:"user"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	var user model.User
	if err := database.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
		return
	}

	if user.Status != "active" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "账号已禁用"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
		return
	}

	token, err := auth.GenerateToken(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "生成token失败"})
		return
	}

	loginLog := &model.UserLoginLog{
		UserID:    user.ID,
		IPAddress: c.ClientIP(),
		UserAgent: c.Request.UserAgent(),
		Success:   true,
	}
	loginLog.CreatedBy = user.ID
	database.DB.Create(loginLog)

	c.JSON(http.StatusOK, LoginResponse{
		Token: token,
		User: gin.H{
			"id":       user.ID,
			"username": user.Username,
			"name":     user.Name,
			"role":     user.Role,
			"camp_ids": user.CampIDs,
			"permissions": auth.GetRolePermissions(user.Role),
		},
	})
}

func (h *AuthHandler) GetCurrentUser(c *gin.Context) {
	userCtx := auth.GetCurrentUser(c)
	if userCtx == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未认证"})
		return
	}

	var user model.User
	if err := database.DB.Where("id = ?", userCtx.UserID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":          user.ID,
		"username":    user.Username,
		"name":        user.Name,
		"role":        user.Role,
		"phone":       user.Phone,
		"email":       user.Email,
		"camp_ids":    user.CampIDs,
		"permissions": auth.GetRolePermissions(user.Role),
	})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "登出成功"})
}
