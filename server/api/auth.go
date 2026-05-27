package api

import (
	"net/http"
	"time"

	"carwash-system/middleware"
	"carwash-system/models"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "参数错误"})
	}

	var user models.User
	if err := models.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "用户名或密码错误"})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "用户名或密码错误"})
	}

	claims := middleware.Claims{
		UserID:   user.ID,
		Username: user.Username,
		Role:     user.Role,
		Name:     user.Name,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(middleware.JWTSecret)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "生成Token失败"})
	}

	return c.JSON(fiber.Map{
		"token": tokenString,
		"user":  user,
	})
}

func GetCurrentUserInfo(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)
	return c.JSON(user)
}

func GetDashboardStats(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)

	var pendingRepairs int64
	repairQuery := models.DB.Model(&models.RepairOrder{}).Where("status IN ?", []string{"pending", "processing"})
	if user.Role == "inspector" {
		repairQuery = repairQuery.Where("handler_id = ? OR status = ?", user.UserID, "pending")
	}
	repairQuery.Count(&pendingRepairs)

	var pendingRefunds int64
	refundQuery := models.DB.Model(&models.RefundRequest{}).Where("status = ?", "pending")
	if user.Role == "service" {
		refundQuery = refundQuery.Where("applicant_id = ?", user.UserID)
	}
	refundQuery.Count(&pendingRefunds)

	var rejectedItems int64
	models.DB.Model(&models.RepairOrder{}).Where("status = ?", "rejected").Count(&rejectedItems)
	models.DB.Model(&models.RefundRequest{}).Where("status = ?", "rejected").Count(&rejectedItems)

	var needReview int64
	models.DB.Model(&models.MembershipOrder{}).Where("status = ?", "pending").Count(&needReview)

	var expiringMembers int64
	models.DB.Model(&models.Member{}).Where("membership_expire_at BETWEEN ? AND ?",
		time.Now(), time.Now().AddDate(0, 0, 7)).Count(&expiringMembers)

	var totalRevenue float64
	models.DB.Model(&models.MembershipOrder{}).Where("status = ?", "paid").
		Where("DATE(created_at) >= ?", time.Now().AddDate(0, 0, -30)).
		Select("COALESCE(SUM(amount), 0)").Scan(&totalRevenue)

	var activeMembers int64
	models.DB.Model(&models.Member{}).Where("status = ?", "active").Count(&activeMembers)

	var pendingActivities int64
	models.DB.Model(&models.Activity{}).Where("status = ?", "pending").Count(&pendingActivities)

	return c.JSON(fiber.Map{
		"pending_repairs":    pendingRepairs,
		"pending_refunds":    pendingRefunds,
		"rejected_items":     rejectedItems,
		"need_review":        needReview,
		"expiring_members":   expiringMembers,
		"total_revenue":      totalRevenue,
		"active_members":     activeMembers,
		"pending_activities": pendingActivities,
	})
}

func GetRecentActivity(c *fiber.Ctx) error {
	var logs []models.TicketLog
	models.DB.Preload("Operator").Order("created_at DESC").Limit(20).Find(&logs)
	return c.JSON(logs)
}
