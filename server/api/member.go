package api

import (
	"net/http"
	"strconv"
	"time"

	"carwash-system/middleware"
	"carwash-system/models"

	"github.com/gofiber/fiber/v2"
)

func GetMembers(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "20"))
	keyword := c.Query("keyword")
	status := c.Query("status")
	level := c.Query("level")
	expiring := c.Query("expiring")

	query := models.DB.Model(&models.Member{})

	if keyword != "" {
		query = query.Where("phone LIKE ? OR name LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if level != "" {
		query = query.Where("level = ?", level)
	}
	if expiring == "true" {
		query = query.Where("membership_expire_at BETWEEN ? AND ?", time.Now(), time.Now().AddDate(0, 0, 30))
	}

	var total int64
	query.Count(&total)

	var members []models.Member
	query.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&members)

	return c.JSON(fiber.Map{
		"items": members,
		"total": total,
		"page":  page,
		"size":  pageSize,
	})
}

func GetMemberDetail(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))
	var member models.Member
	if err := models.DB.First(&member, id).Error; err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "会员不存在"})
	}
	return c.JSON(member)
}

func CreateMember(c *fiber.Ctx) error {
	var member models.Member
	if err := c.BodyParser(&member); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "参数错误"})
	}

	member.Status = "active"
	if err := models.DB.Create(&member).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "创建失败"})
	}

	return c.JSON(member)
}

func UpdateMember(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))
	var member models.Member
	if err := models.DB.First(&member, id).Error; err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "会员不存在"})
	}

	if err := c.BodyParser(&member); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "参数错误"})
	}

	models.DB.Save(&member)
	return c.JSON(member)
}

type BatchRenewRequest struct {
	MemberIDs []uint  `json:"member_ids"`
	PackageID uint    `json:"package_id"`
	Amount    float64 `json:"amount"`
	Remark    string  `json:"remark"`
}

func BatchRenewMembership(c *fiber.Ctx) error {
	var req BatchRenewRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "参数错误"})
	}

	user := middleware.GetCurrentUser(c)
	var pkg models.MembershipPackage
	models.DB.First(&pkg, req.PackageID)

	successCount := 0
	for _, memberID := range req.MemberIDs {
		var member models.Member
		if err := models.DB.First(&member, memberID).Error; err != nil {
			continue
		}

		if member.MembershipExpireAt.After(time.Now()) {
			member.MembershipExpireAt = member.MembershipExpireAt.AddDate(0, 0, pkg.Duration)
		} else {
			member.MembershipExpireAt = time.Now().AddDate(0, 0, pkg.Duration)
		}
		member.Status = "active"
		models.DB.Save(&member)

		orderNo := "ME" + time.Now().Format("20060102") + strconv.Itoa(int(time.Now().UnixNano())%1000000)
		now := time.Now()
		order := models.MembershipOrder{
			MemberID:       memberID,
			PackageID:      req.PackageID,
			OrderNo:        orderNo,
			Amount:         req.Amount,
			PaymentMethod:  "manual",
			Status:         "paid",
			ExtendDuration: pkg.Duration,
			OperatorID:     user.UserID,
			Remark:         req.Remark,
			PaymentTime:    &now,
		}
		models.DB.Create(&order)

		successCount++
	}

	return c.JSON(fiber.Map{
		"success": true,
		"count":   successCount,
	})
}

func GetMemberLogs(c *fiber.Ctx) error {
	memberID, _ := strconv.Atoi(c.Params("id"))

	var orders []models.MembershipOrder
	models.DB.Where("member_id = ?", memberID).Preload("Package").Preload("Operator").
		Order("created_at DESC").Limit(20).Find(&orders)

	var logs []map[string]interface{}
	for _, order := range orders {
		logs = append(logs, map[string]interface{}{
			"type":       "membership",
			"action":     "renew",
			"title":      "续费" + order.Package.Name,
			"amount":     order.Amount,
			"operator":   order.Operator.Name,
			"status":     order.Status,
			"created_at": order.CreatedAt,
		})
	}

	return c.JSON(logs)
}

func GetPackages(c *fiber.Ctx) error {
	var packages []models.MembershipPackage
	models.DB.Order("sort_order ASC").Find(&packages)
	return c.JSON(packages)
}

func CreatePackage(c *fiber.Ctx) error {
	var pkg models.MembershipPackage
	if err := c.BodyParser(&pkg); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "参数错误"})
	}
	pkg.Status = "active"
	models.DB.Create(&pkg)
	return c.JSON(pkg)
}

func UpdatePackage(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))
	var pkg models.MembershipPackage
	if err := models.DB.First(&pkg, id).Error; err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "套餐不存在"})
	}
	if err := c.BodyParser(&pkg); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "参数错误"})
	}
	models.DB.Save(&pkg)
	return c.JSON(pkg)
}

func DeletePackage(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))
	models.DB.Delete(&models.MembershipPackage{}, id)
	return c.JSON(fiber.Map{"success": true})
}

func GetMembershipOrders(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "20"))
	status := c.Query("status")

	query := models.DB.Model(&models.MembershipOrder{}).Preload("Member").Preload("Package").Preload("Operator")
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	query.Count(&total)

	var orders []models.MembershipOrder
	query.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&orders)

	return c.JSON(fiber.Map{
		"items": orders,
		"total": total,
		"page":  page,
		"size":  pageSize,
	})
}

func GetOrderDetail(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))
	var order models.MembershipOrder
	if err := models.DB.Preload("Member").Preload("Package").Preload("Operator").First(&order, id).Error; err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "订单不存在"})
	}
	return c.JSON(order)
}

func CreateOrder(c *fiber.Ctx) error {
	var order models.MembershipOrder
	if err := c.BodyParser(&order); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "参数错误"})
	}
	user := middleware.GetCurrentUser(c)
	order.OperatorID = user.UserID
	order.Status = "paid"
	now := time.Now()
	order.PaymentTime = &now
	models.DB.Create(&order)
	return c.JSON(order)
}
