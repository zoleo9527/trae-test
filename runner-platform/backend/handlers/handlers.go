package handlers

import (
	"strconv"
	"time"

	"runner-platform/backend/database"
	"runner-platform/backend/models"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
)

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "请求参数错误"})
	}

	var user models.User
	if err := database.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "用户名或密码错误"})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "用户名或密码错误"})
	}

	token := strconv.Itoa(int(user.ID)) + "|" + user.Role

	return c.JSON(fiber.Map{
		"token": token,
		"user":  user,
	})
}

func GetCurrentUser(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, _ := strconv.Atoi(userIDStr)

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "用户不存在"})
	}

	return c.JSON(user)
}

func GetOrders(c *fiber.Ctx) error {
	status := c.Query("status")
	userRole := c.Locals("userRole").(string)
	userIDStr := c.Locals("userID").(string)
	userID, _ := strconv.Atoi(userIDStr)
	var orders []models.Order

	query := database.DB.Preload("Runner").Preload("Appeal").Preload("Subsidy")

	if status != "" {
		query = query.Where("status = ?", status)
	}

	switch userRole {
	case "runner":
		query = query.Where("runner_id = ?", uint(userID))
	case "customer_service":
		query = query.Where("status IN ?", []string{"timeout", "appealing"})
	}

	query.Order("id desc").Find(&orders)
	return c.JSON(orders)
}

func GetOrder(c *fiber.Ctx) error {
	id := c.Params("id")
	userRole := c.Locals("userRole").(string)
	userIDStr := c.Locals("userID").(string)
	userID, _ := strconv.Atoi(userIDStr)
	var order models.Order

	if err := database.DB.Preload("Runner").Preload("Appeal").Preload("Subsidy").First(&order, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "订单不存在"})
	}

	if userRole == "runner" {
		if order.RunnerID == nil || *order.RunnerID != uint(userID) {
			return c.Status(403).JSON(fiber.Map{"error": "无权查看该订单"})
		}
	}

	if userRole == "customer_service" && order.Status != "timeout" && order.Status != "appealing" {
		return c.Status(403).JSON(fiber.Map{"error": "无权查看该订单"})
	}

	return c.JSON(order)
}

func CreateOrder(c *fiber.Ctx) error {
	var order models.Order
	if err := c.BodyParser(&order); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "请求参数错误"})
	}

	order.Status = "pending"
	order.OrderNo = "DD" + time.Now().Format("20060102150405")

	database.DB.Create(&order)

	database.DB.Create(&models.TimelineEvent{
		OrderID: order.ID,
		Type:    "created",
		Content: "订单创建成功",
	})

	return c.JSON(order)
}

func AssignOrder(c *fiber.Ctx) error {
	id := c.Params("id")
	var order models.Order

	if err := database.DB.First(&order, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "订单不存在"})
	}

	if order.Status != "pending" {
		return c.Status(400).JSON(fiber.Map{"error": "只有待分配状态的订单才能分配骑手"})
	}

	var body struct {
		RunnerID uint `json:"runner_id"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "请求参数错误"})
	}

	order.RunnerID = &body.RunnerID
	order.Status = "assigned"
	database.DB.Save(&order)

	var runner models.User
	database.DB.First(&runner, body.RunnerID)

	database.DB.Create(&models.TimelineEvent{
		OrderID: order.ID,
		Type:    "assigned",
		Content: "订单已分配给" + runner.Name,
	})

	return c.JSON(order)
}

func UpdateOrderStatus(c *fiber.Ctx) error {
	id := c.Params("id")
	userRole := c.Locals("userRole").(string)
	userIDStr := c.Locals("userID").(string)
	userID, _ := strconv.Atoi(userIDStr)
	var order models.Order

	if err := database.DB.First(&order, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "订单不存在"})
	}

	if userRole == "runner" {
		if order.RunnerID == nil || *order.RunnerID != uint(userID) {
			return c.Status(403).JSON(fiber.Map{"error": "无权操作该订单"})
		}
	}

	var body struct {
		Status string `json:"status"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "请求参数错误"})
	}

	validTransitions := map[string][]string{
		"pending":    {"assigned", "cancelled"},
		"assigned":   {"picked_up", "cancelled"},
		"picked_up":  {"delivering", "cancelled"},
		"delivering": {"delivered", "timeout", "cancelled"},
		"timeout":    {"appealing", "cancelled"},
		"appealing":  {"resolved", "cancelled"},
	}

	allowed, ok := validTransitions[order.Status]
	if !ok {
		return c.Status(400).JSON(fiber.Map{"error": "当前订单状态不允许变更"})
	}

	validNext := false
	for _, s := range allowed {
		if s == body.Status {
			validNext = true
			break
		}
	}
	if !validNext {
		return c.Status(400).JSON(fiber.Map{"error": "不允许从 " + getStatusText(order.Status) + " 变更为 " + getStatusText(body.Status)})
	}

	roleAllowed := false
	switch userRole {
	case "manager":
		roleAllowed = true
	case "dispatcher":
		roleAllowed = body.Status == "assigned" || body.Status == "cancelled"
	case "customer_service":
		roleAllowed = body.Status == "timeout" || body.Status == "appealing"
	case "runner":
		roleAllowed = body.Status == "picked_up" || body.Status == "delivered"
	}
	if !roleAllowed {
		return c.Status(403).JSON(fiber.Map{"error": "当前角色无权执行此操作"})
	}

	order.Status = body.Status
	database.DB.Save(&order)

	database.DB.Create(&models.TimelineEvent{
		OrderID: order.ID,
		Type:    body.Status,
		Content: "订单状态更新为: " + getStatusText(body.Status),
	})

	return c.JSON(order)
}

func PickupOrder(c *fiber.Ctx) error {
	id := c.Params("id")
	userIDStr := c.Locals("userID").(string)
	userID, _ := strconv.Atoi(userIDStr)
	var order models.Order

	if err := database.DB.First(&order, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "订单不存在"})
	}

	if order.RunnerID == nil || *order.RunnerID != uint(userID) {
		return c.Status(403).JSON(fiber.Map{"error": "无权操作该订单"})
	}

	if order.Status != "assigned" {
		return c.Status(400).JSON(fiber.Map{"error": "只有待取餐状态的订单才能确认取餐"})
	}

	order.Status = "delivering"
	database.DB.Save(&order)

	database.DB.Create(&models.TimelineEvent{
		OrderID: order.ID,
		Type:    "picked_up",
		Content: "骑手已取餐",
	})

	return c.JSON(order)
}

func DeliverOrder(c *fiber.Ctx) error {
	id := c.Params("id")
	userIDStr := c.Locals("userID").(string)
	userID, _ := strconv.Atoi(userIDStr)
	var order models.Order

	if err := database.DB.First(&order, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "订单不存在"})
	}

	if order.RunnerID == nil || *order.RunnerID != uint(userID) {
		return c.Status(403).JSON(fiber.Map{"error": "无权操作该订单"})
	}

	if order.Status != "delivering" {
		return c.Status(400).JSON(fiber.Map{"error": "只有配送中的订单才能确认送达"})
	}

	order.Status = "delivered"
	database.DB.Save(&order)

	database.DB.Create(&models.TimelineEvent{
		OrderID: order.ID,
		Type:    "delivered",
		Content: "订单已送达",
	})

	return c.JSON(order)
}

func GetAppeals(c *fiber.Ctx) error {
	status := c.Query("status")
	userRole := c.Locals("userRole").(string)
	userIDStr := c.Locals("userID").(string)
	userID, _ := strconv.Atoi(userIDStr)
	var appeals []models.Appeal

	query := database.DB.Preload("Order").Preload("Runner").Preload("Reviewer").Preload("Subsidy")

	if status != "" {
		query = query.Where("status = ?", status)
	}

	switch userRole {
	case "runner":
		query = query.Where("runner_id = ?", uint(userID))
	case "customer_service":
		query = query.Joins("JOIN orders ON orders.id = appeals.order_id").
			Where("orders.status IN ?", []string{"timeout", "appealing"})
	}

	query.Order("id desc").Find(&appeals)
	return c.JSON(appeals)
}

func GetAppeal(c *fiber.Ctx) error {
	id := c.Params("id")
	userRole := c.Locals("userRole").(string)
	userIDStr := c.Locals("userID").(string)
	userID, _ := strconv.Atoi(userIDStr)
	var appeal models.Appeal

	if err := database.DB.Preload("Order").Preload("Runner").Preload("Reviewer").Preload("Subsidy").First(&appeal, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "申诉不存在"})
	}

	if userRole == "runner" && appeal.RunnerID != uint(userID) {
		return c.Status(403).JSON(fiber.Map{"error": "无权查看该申诉"})
	}

	if userRole == "customer_service" && appeal.Order.Status != "timeout" && appeal.Order.Status != "appealing" {
		return c.Status(403).JSON(fiber.Map{"error": "无权查看该申诉"})
	}

	return c.JSON(appeal)
}

func CreateAppeal(c *fiber.Ctx) error {
	userRole := c.Locals("userRole").(string)
	userIDStr := c.Locals("userID").(string)
	userID, _ := strconv.Atoi(userIDStr)

	var appeal models.Appeal
	if err := c.BodyParser(&appeal); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "请求参数错误"})
	}

	var order models.Order
	if err := database.DB.First(&order, appeal.OrderID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "订单不存在"})
	}

	if userRole == "runner" {
		if order.RunnerID == nil || *order.RunnerID != uint(userID) {
			return c.Status(403).JSON(fiber.Map{"error": "只能对本人订单发起申诉"})
		}
		if order.Status != "delivering" && order.Status != "timeout" {
			return c.Status(400).JSON(fiber.Map{"error": "该订单状态不允许申诉"})
		}
		appeal.RunnerID = *order.RunnerID
	}

	if userRole == "customer_service" {
		if order.Status != "timeout" && order.Status != "appealing" {
			return c.Status(400).JSON(fiber.Map{"error": "只能对超时或申诉中的订单发起申诉"})
		}
		if order.RunnerID == nil {
			return c.Status(400).JSON(fiber.Map{"error": "该订单未分配骑手，无法申诉"})
		}
		appeal.RunnerID = *order.RunnerID
	}

	appeal.Status = "pending"
	database.DB.Create(&appeal)

	order.Status = "appealing"
	database.DB.Save(&order)

	var operatorText string
	if userRole == "customer_service" {
		var operator models.User
		database.DB.First(&operator, userID)
		operatorText = "客服(" + operator.Name + ")代提申诉: " + appeal.Reason
	} else {
		operatorText = "骑手提交申诉: " + appeal.Reason
	}

	database.DB.Create(&models.TimelineEvent{
		OrderID: appeal.OrderID,
		Type:    "appeal_created",
		Content: operatorText,
	})

	return c.JSON(appeal)
}

func ReviewAppeal(c *fiber.Ctx) error {
	id := c.Params("id")
	var appeal models.Appeal

	if err := database.DB.First(&appeal, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "申诉不存在"})
	}

	var body struct {
		Status     string  `json:"status"`
		ReviewNote string  `json:"review_note"`
		Subsidy    float64 `json:"subsidy"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "请求参数错误"})
	}

	userIDStr := c.Locals("userID").(string)
	userID, _ := strconv.Atoi(userIDStr)
	reviewerID := uint(userID)

	appeal.Status = body.Status
	appeal.ReviewNote = body.ReviewNote
	appeal.ReviewerID = &reviewerID
	database.DB.Save(&appeal)

	var order models.Order
	database.DB.First(&order, appeal.OrderID)

	if body.Status == "approved" {
		order.Status = "resolved"
		database.DB.Save(&order)

		if body.Subsidy > 0 {
			subsidy := models.Subsidy{
				AppealID: &appeal.ID,
				OrderID:  appeal.OrderID,
				RunnerID: appeal.RunnerID,
				Amount:   body.Subsidy,
				Reason:   "申诉通过补贴: " + body.ReviewNote,
				Status:   "pending",
			}
			database.DB.Create(&subsidy)
		}

		database.DB.Create(&models.TimelineEvent{
			OrderID: appeal.OrderID,
			Type:    "appeal_approved",
			Content: "申诉已通过，备注: " + body.ReviewNote,
		})
	} else {
		order.Status = "timeout"
		database.DB.Save(&order)

		database.DB.Create(&models.TimelineEvent{
			OrderID: appeal.OrderID,
			Type:    "appeal_rejected",
			Content: "申诉被驳回，备注: " + body.ReviewNote,
		})
	}

	return c.JSON(appeal)
}

func GetSubsidies(c *fiber.Ctx) error {
	status := c.Query("status")
	userRole := c.Locals("userRole").(string)
	userIDStr := c.Locals("userID").(string)
	userID, _ := strconv.Atoi(userIDStr)
	var subsidies []models.Subsidy

	query := database.DB.Preload("Order").Preload("Runner").Preload("Appeal")

	if status != "" {
		query = query.Where("status = ?", status)
	}

	switch userRole {
	case "runner":
		query = query.Where("runner_id = ?", uint(userID))
	case "customer_service":
		query = query.Joins("JOIN orders ON orders.id = subsidies.order_id").
			Where("orders.status IN ?", []string{"timeout", "appealing"})
	}

	query.Order("id desc").Find(&subsidies)
	return c.JSON(subsidies)
}

func GetSubsidy(c *fiber.Ctx) error {
	id := c.Params("id")
	userRole := c.Locals("userRole").(string)
	userIDStr := c.Locals("userID").(string)
	userID, _ := strconv.Atoi(userIDStr)
	var subsidy models.Subsidy

	if err := database.DB.Preload("Order").Preload("Runner").Preload("Appeal").First(&subsidy, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "补贴不存在"})
	}

	if userRole == "runner" && subsidy.RunnerID != uint(userID) {
		return c.Status(403).JSON(fiber.Map{"error": "无权查看该补贴"})
	}

	if userRole == "customer_service" && subsidy.Order.Status != "timeout" && subsidy.Order.Status != "appealing" {
		return c.Status(403).JSON(fiber.Map{"error": "无权查看该补贴"})
	}

	return c.JSON(subsidy)
}

func CalculateSubsidy(c *fiber.Ctx) error {
	var body struct {
		Type      string  `json:"type"`
		BaseFee   float64 `json:"base_fee"`
		DelayTime int     `json:"delay_time"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "请求参数错误"})
	}

	var amount float64

	switch body.Type {
	case "timeout":
		if body.DelayTime >= 30 {
			amount = body.BaseFee * 0.5
		} else if body.DelayTime >= 15 {
			amount = body.BaseFee * 0.3
		} else {
			amount = body.BaseFee * 0.1
		}
	case "merchant_error":
		amount = 15.0
	case "customer_cancel":
		amount = body.BaseFee * 0.8
	default:
		amount = 10.0
	}

	return c.JSON(fiber.Map{
		"amount": amount,
		"reason": "根据规则计算",
	})
}

func GetRunners(c *fiber.Ctx) error {
	var runners []models.User
	database.DB.Where("role = ?", "runner").Find(&runners)
	return c.JSON(runners)
}

func GetOrderTimeline(c *fiber.Ctx) error {
	orderId := c.Params("orderId")
	userRole := c.Locals("userRole").(string)
	userIDStr := c.Locals("userID").(string)
	userID, _ := strconv.Atoi(userIDStr)

	var order models.Order
	if err := database.DB.First(&order, orderId).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "订单不存在"})
	}

	if userRole == "runner" {
		if order.RunnerID == nil || *order.RunnerID != uint(userID) {
			return c.Status(403).JSON(fiber.Map{"error": "无权查看该订单时间线"})
		}
	}

	if userRole == "customer_service" && order.Status != "timeout" && order.Status != "appealing" {
		return c.Status(403).JSON(fiber.Map{"error": "无权查看该订单时间线"})
	}

	var events []models.TimelineEvent
	database.DB.Where("order_id = ?", orderId).Order("created_at asc").Find(&events)
	return c.JSON(events)
}

func getStatusText(status string) string {
	statusMap := map[string]string{
		"pending":    "待分配",
		"assigned":   "已分配",
		"picked_up":  "已取餐",
		"delivering": "配送中",
		"delivered":  "已送达",
		"timeout":    "已超时",
		"appealing":  "申诉中",
		"resolved":   "已解决",
		"cancelled":  "已取消",
	}
	if text, ok := statusMap[status]; ok {
		return text
	}
	return status
}
