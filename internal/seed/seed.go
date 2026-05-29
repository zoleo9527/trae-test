package seed

import (
	"fmt"
	"log"
	"math/rand"
	"runner-platform/internal/database"
	"runner-platform/internal/models"
	"runner-platform/internal/utils"
	"time"

	"gorm.io/gorm"
)

func Seed() {
	log.Println("Starting seed data generation...")

	var userCount int64
	database.DB.Model(&models.User{}).Count(&userCount)
	if userCount > 0 {
		log.Println("Seed data already exists, skipping...")
		return
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		users := createUsers(tx)
		orders := createOrders(tx, users)
		refunds := createRefunds(tx, orders, users)
		appeals := createAppeals(tx, orders, refunds, users)
		subsidies := createSubsidies(tx, orders, refunds, appeals, users)
		createRemarks(tx, refunds, appeals, subsidies, users)
		createOperationLogs(tx, orders, refunds, appeals, subsidies, users)

		return nil
	})

	if err != nil {
		log.Fatalf("Failed to seed data: %v", err)
	}

	log.Println("Seed data completed successfully!")
}

func createUsers(tx *gorm.DB) map[string]*models.User {
	users := make(map[string]*models.User)

	passwordHash, _ := utils.HashPassword("123456")

	userData := []struct {
		username   string
		email      string
		phone      string
		realName   string
		role       models.Role
		department string
	}{
		{"admin", "admin@runner.com", "13800000001", "系统管理员", models.RoleAdmin, "技术部"},
		{"ops_manager", "ops@runner.com", "13800000002", "张明", models.RoleOpsManager, "运营部"},
		{"dispatcher_01", "dispatcher1@runner.com", "13800000003", "李华", models.RoleDispatcher, "调度中心"},
		{"dispatcher_02", "dispatcher2@runner.com", "13800000004", "王芳", models.RoleDispatcher, "调度中心"},
		{"cs_01", "cs1@runner.com", "13800000005", "赵晓", models.RoleCustomerService, "客服部"},
		{"cs_02", "cs2@runner.com", "13800000006", "孙婷", models.RoleCustomerService, "客服部"},
		{"user_01", "user1@runner.com", "13900000001", "陈伟", models.RoleUser, ""},
		{"user_02", "user2@runner.com", "13900000002", "刘洋", models.RoleUser, ""},
		{"user_03", "user3@runner.com", "13900000003", "周静", models.RoleUser, ""},
		{"runner_01", "runner1@runner.com", "13700000001", "吴强", models.RoleRunner, "配送组A"},
		{"runner_02", "runner2@runner.com", "13700000002", "郑凯", models.RoleRunner, "配送组A"},
		{"merchant_01", "merchant1@runner.com", "13600000001", "好又多超市", models.RoleMerchant, "商家"},
		{"merchant_02", "merchant2@runner.com", "13600000002", "美味餐厅", models.RoleMerchant, "商家"},
	}

	for _, data := range userData {
		user := &models.User{
			Username:     data.username,
			Email:        data.email,
			Phone:        data.phone,
			PasswordHash: passwordHash,
			RealName:     data.realName,
			Role:         data.role,
			Department:   data.department,
		}
		if err := tx.Create(user).Error; err != nil {
			log.Fatalf("Failed to create user %s: %v", data.username, err)
		}
		users[string(data.role)] = user
		users[data.username] = user
	}

	log.Printf("Created %d users", len(userData))
	return users
}

func createOrders(tx *gorm.DB, users map[string]*models.User) []*models.Order {
	var orders []*models.Order
	orderTypes := []string{"food", "grocery", "express", "other"}
	statuses := []models.OrderStatus{
		models.OrderStatusCompleted,
		models.OrderStatusCompleted,
		models.OrderStatusCompleted,
		models.OrderStatusRefunded,
		models.OrderStatusDelivering,
		models.OrderStatusCancelled,
	}

	normalUsers := []*models.User{users["user_01"], users["user_02"], users["user_03"]}
	runners := []*models.User{users["runner_01"], users["runner_02"]}
	merchants := []*models.User{users["merchant_01"], users["merchant_02"]}
	dispatchers := []*models.User{users["dispatcher_01"], users["dispatcher_02"]}

	for i := 0; i < 15; i++ {
		user := normalUsers[i%len(normalUsers)]
		merchant := merchants[i%len(merchants)]
		runner := runners[i%len(runners)]
		dispatcher := dispatchers[i%len(dispatchers)]
		status := statuses[i%len(statuses)]
		orderType := orderTypes[i%len(orderTypes)]

		goodsValue := float64(20 + rand.Intn(180))
		deliveryFee := float64(5 + rand.Intn(15))
		expectedTime := time.Now().AddDate(0, 0, -(i + 1)).Add(time.Hour * time.Duration(10+rand.Intn(8)))

		order := &models.Order{
			OrderNo:          utils.GenerateOrderNo("ORD"),
			UserID:           user.ID,
			RunnerID:         &runner.ID,
			MerchantID:       merchant.ID,
			Status:           status,
			OrderType:        orderType,
			GoodsDescription: getGoodsDescription(i, orderType),
			GoodsValue:       goodsValue,
			DeliveryFee:      deliveryFee,
			TotalAmount:      goodsValue + deliveryFee,
			PickupAddress:    getPickupAddress(i, merchant.RealName),
			DeliveryAddress:  getDeliveryAddress(i, user.RealName),
			ExpectedTime:     &expectedTime,
			Remark:           getOrderRemark(i, status),
		}

		if status == models.OrderStatusCompleted || status == models.OrderStatusRefunded {
			pickupTime := expectedTime.Add(time.Minute * time.Duration(-30+rand.Intn(60)))
			order.ActualPickupTime = &pickupTime
			deliveryTime := pickupTime.Add(time.Minute * time.Duration(25+rand.Intn(35)))
			order.ActualDeliveryTime = &deliveryTime

			if i%5 == 2 {
				order.TimeoutReason = "骑手遇交通拥堵，途中等待20分钟"
			}
		}

		if err := tx.Create(order).Error; err != nil {
			log.Fatalf("Failed to create order: %v", err)
		}

		assignment := &models.Assignment{
			OrderID:    order.ID,
			RunnerID:   runner.ID,
			AssignedBy: dispatcher.ID,
			AssignedAt: expectedTime.Add(-time.Hour),
			IsActive:   status != models.OrderStatusCancelled,
			Reason:     "系统智能派单",
		}
		if err := tx.Create(assignment).Error; err != nil {
			log.Fatalf("Failed to create assignment: %v", err)
		}

		orders = append(orders, order)
	}

	log.Printf("Created %d orders", len(orders))
	return orders
}

func createRefunds(tx *gorm.DB, orders []*models.Order, users map[string]*models.User) []*models.Refund {
	var refunds []*models.Refund
	reasons := []models.RefundReason{
		models.RefundReasonTimeout,
		models.RefundReasonDamaged,
		models.RefundReasonWrongItem,
		models.RefundReasonQualityIssue,
		models.RefundReasonOther,
	}
	statuses := []models.RefundStatus{
		models.RefundStatusCompleted,
		models.RefundStatusRejected,
		models.RefundStatusPending,
		models.RefundStatusReviewing,
		models.RefundStatusApproved,
	}
	originalStatuses := []models.OrderStatus{
		models.OrderStatusCompleted,
		models.OrderStatusCompleted,
		models.OrderStatusDelivering,
		models.OrderStatusCompleted,
		models.OrderStatusCompleted,
		models.OrderStatusCompleted,
	}

	refundOrders := []int{0, 3, 4, 7, 10, 12}
	csUsers := []*models.User{users["cs_01"], users["cs_02"]}
	opsUser := users["ops_manager"]

	for idx, orderIdx := range refundOrders {
		if orderIdx >= len(orders) {
			continue
		}
		order := orders[orderIdx]
		reason := reasons[idx%len(reasons)]
		status := statuses[idx%len(statuses)]
		reviewer := csUsers[idx%len(csUsers)]

		amount := order.TotalAmount
		if idx%3 == 1 {
			amount = order.TotalAmount * 0.5
		}

		originalStatus := originalStatuses[idx%len(originalStatuses)]

		refund := &models.Refund{
			RefundNo:             utils.GenerateRefundNo(),
			OrderID:              order.ID,
			UserID:               order.UserID,
			Status:               status,
			Reason:               reason,
			Amount:               amount,
			DeliveryFeeRefund:    order.DeliveryFee,
			GoodsValueRefund:     amount - order.DeliveryFee,
			Description:          getRefundDescription(idx, reason),
			EvidenceImages:       getEvidenceImages(idx),
			OriginalOrderStatus:  originalStatus,
		}

		if status != models.RefundStatusPending && status != models.RefundStatusReviewing {
			now := time.Now().AddDate(0, 0, -(idx + 1))
			refund.ReviewedBy = &reviewer.ID
			refund.ReviewedAt = &now

			if status == models.RefundStatusRejected {
				refund.RejectReason = getRejectReason(idx)
			}

			if status == models.RefundStatusCompleted || status == models.RefundStatusProcessing {
				refund.ProcessedBy = &opsUser.ID
				processTime := now.Add(time.Hour * 2)
				refund.ProcessedAt = &processTime
			}
		}

		if err := tx.Create(refund).Error; err != nil {
			log.Fatalf("Failed to create refund: %v", err)
		}

		refunds = append(refunds, refund)
	}

	log.Printf("Created %d refunds", len(refunds))
	return refunds
}

func createAppeals(tx *gorm.DB, orders []*models.Order, refunds []*models.Refund, users map[string]*models.User) []*models.Appeal {
	var appeals []*models.Appeal
	statuses := []models.AppealStatus{
		models.AppealStatusUpheld,
		models.AppealStatusRejected,
		models.AppealStatusPending,
		models.AppealStatusClosed,
	}

	csUsers := []*models.User{users["cs_01"], users["cs_02"]}
	opsUser := users["ops_manager"]

	appealData := []struct {
		orderIdx  int
		refundIdx int
		appealer  *models.User
	}{
		{0, 0, users["runner_01"]},
		{3, 1, users["user_02"]},
		{7, -1, users["merchant_01"]},
		{10, 3, users["runner_02"]},
	}

	for idx, data := range appealData {
		if data.orderIdx >= len(orders) {
			continue
		}

		order := orders[data.orderIdx]
		status := statuses[idx%len(statuses)]
		handler := csUsers[idx%len(csUsers)]

		appeal := &models.Appeal{
			AppealNo:     utils.GenerateAppealNo(),
			OrderID:      order.ID,
			AppealerID:   data.appealer.ID,
			AppealerType: string(data.appealer.Role),
			Status:       status,
			Title:        getAppealTitle(idx, data.appealer.Role),
			Content:      getAppealContent(idx, data.appealer.Role),
			Evidence:     getEvidenceImages(idx),
		}

		if data.refundIdx >= 0 && data.refundIdx < len(refunds) {
			appeal.RefundID = &refunds[data.refundIdx].ID
		}

		if status != models.AppealStatusPending && status != models.AppealStatusReviewing {
			now := time.Now().AddDate(0, 0, -(idx + 2))
			appeal.HandlerID = &handler.ID
			appeal.HandledAt = &now

			if status == models.AppealStatusUpheld {
				appeal.Result = getAppealResult(idx)
			} else if status == models.AppealStatusRejected {
				appeal.RejectReason = getAppealRejectReason(idx)
			}
		}

		if idx == 0 {
			appeal.HandlerID = &opsUser.ID
		}

		if err := tx.Create(appeal).Error; err != nil {
			log.Fatalf("Failed to create appeal: %v", err)
		}

		appeals = append(appeals, appeal)
	}

	log.Printf("Created %d appeals", len(appeals))
	return appeals
}

func createSubsidies(tx *gorm.DB, orders []*models.Order, refunds []*models.Refund, appeals []*models.Appeal, users map[string]*models.User) []*models.Subsidy {
	var subsidyList []*models.Subsidy
	statuses := []models.SubsidyStatus{
		models.SubsidyStatusPaid,
		models.SubsidyStatusApproved,
		models.SubsidyStatusPending,
		models.SubsidyStatusRejected,
	}

	opsUser := users["ops_manager"]

	subsidyData := []struct {
		orderIdx  int
		refundIdx int
		appealIdx int
		payee     *models.User
		payeeType string
		amount    float64
		reason    string
	}{
		{0, 0, -1, users["user_01"], "user", 50.00, "订单超时补偿"},
		{3, 1, 0, users["runner_01"], "runner", 30.00, "误判申诉通过，补贴骑手"},
		{10, 3, 3, users["merchant_01"], "merchant", 80.00, "商品破损商家损失补贴"},
		{12, -1, -1, users["user_03"], "user", 20.00, "服务质量问题补偿"},
	}

	for idx, data := range subsidyData {
		if data.orderIdx >= len(orders) {
			continue
		}

		order := orders[data.orderIdx]
		status := statuses[idx%len(statuses)]

		subsidy := &models.Subsidy{
			SubsidyNo:   utils.GenerateSubsidyNo(),
			OrderID:     order.ID,
			PayeeID:     data.payee.ID,
			PayeeType:   data.payeeType,
			Status:      status,
			Amount:      data.amount,
			Reason:      data.reason,
			Description: getSubsidyDescription(idx),
		}

		if data.refundIdx >= 0 && data.refundIdx < len(refunds) {
			subsidy.RefundID = &refunds[data.refundIdx].ID
		}
		if data.appealIdx >= 0 && data.appealIdx < len(appeals) {
			subsidy.AppealID = &appeals[data.appealIdx].ID
		}

		if status != models.SubsidyStatusPending {
			now := time.Now().AddDate(0, 0, -(idx + 3))
			subsidy.ApprovedBy = &opsUser.ID
			subsidy.ApprovedAt = &now

			if status == models.SubsidyStatusPaid {
				paidTime := now.Add(time.Hour * 24)
				subsidy.PaidAt = &paidTime
				subsidy.PaymentMethod = "alipay"
				subsidy.TransactionNo = "TXN" + time.Now().Format("20060102") + fmt.Sprintf("%03d", idx+1)
			}
		}

		if err := tx.Create(subsidy).Error; err != nil {
			log.Fatalf("Failed to create subsidy: %v", err)
		}

		subsidyList = append(subsidyList, subsidy)
	}

	log.Printf("Created %d subsidies", len(subsidyList))
	return subsidyList
}

func createRemarks(tx *gorm.DB, refunds []*models.Refund, appeals []*models.Appeal, subsidies []*models.Subsidy, users map[string]*models.User) {
	remarkAuthors := []*models.User{users["cs_01"], users["cs_02"], users["ops_manager"], users["dispatcher_01"]}

	for i, refund := range refunds {
		author := remarkAuthors[i%len(remarkAuthors)]
		remark := &models.Remark{
			TargetID:   refund.ID,
			TargetType: "refund",
			AuthorID:   author.ID,
			Content:    getRefundRemark(i, author.RealName),
			IsInternal: i%2 == 0,
		}
		if err := tx.Create(remark).Error; err != nil {
			log.Fatalf("Failed to create refund remark: %v", err)
		}
	}

	for i, appeal := range appeals {
		author := remarkAuthors[(i+2)%len(remarkAuthors)]
		remark := &models.Remark{
			TargetID:   appeal.ID,
			TargetType: "appeal",
			AuthorID:   author.ID,
			Content:    getAppealRemark(i, author.RealName),
			IsInternal: i%3 == 0,
		}
		if err := tx.Create(remark).Error; err != nil {
			log.Fatalf("Failed to create appeal remark: %v", err)
		}
	}

	for i, subsidy := range subsidies {
		author := remarkAuthors[(i+1)%len(remarkAuthors)]
		remark := &models.Remark{
			TargetID:   subsidy.ID,
			TargetType: "subsidy",
			AuthorID:   author.ID,
			Content:    getSubsidyRemark(i, author.RealName),
			IsInternal: i%2 == 0,
		}
		if err := tx.Create(remark).Error; err != nil {
			log.Fatalf("Failed to create subsidy remark: %v", err)
		}
	}

	log.Printf("Created remarks for refunds, appeals and subsidies")
}

func createOperationLogs(tx *gorm.DB, orders []*models.Order, refunds []*models.Refund, appeals []*models.Appeal, subsidies []*models.Subsidy, users map[string]*models.User) {
	actions := []models.OperationAction{
		models.ActionCreateRefund,
		models.ActionApproveRefund,
		models.ActionRejectRefund,
		models.ActionCreateAppeal,
		models.ActionUpheldAppeal,
		models.ActionRejectAppeal,
		models.ActionCreateSubsidy,
		models.ActionApproveSubsidy,
		models.ActionAssignOrder,
		models.ActionUpdateOrder,
	}

	operators := []*models.User{
		users["user_01"], users["cs_01"], users["ops_manager"],
		users["dispatcher_01"], users["cs_02"], users["ops_manager"],
	}

	for i, refund := range refunds {
		operator := operators[i%len(operators)]
		action := actions[i%len(actions)]

		logEntry := &models.OperationLog{
			Action:        action,
			TargetID:      refund.ID,
			TargetType:    "refund",
			OperatorID:    operator.ID,
			OperatorName:  operator.RealName,
			OperatorRole:  operator.Role,
			OldValue:      `{"status":"pending"}`,
			NewValue:      `{"status":"` + string(refund.Status) + `"}`,
			ChangedFields: []string{"status"},
			IPAddress:     "192.168.1.100",
			UserAgent:     "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
			Remark:        getOperationRemark(i),
		}
		if err := tx.Create(logEntry).Error; err != nil {
			log.Printf("Warning: Failed to create operation log: %v", err)
		}
	}

	for i, appeal := range appeals {
		operator := operators[(i+3)%len(operators)]
		action := models.ActionCreateAppeal
		if i%2 == 0 {
			action = models.ActionUpheldAppeal
		} else {
			action = models.ActionRejectAppeal
		}

		logEntry := &models.OperationLog{
			Action:        action,
			TargetID:      appeal.ID,
			TargetType:    "appeal",
			OperatorID:    operator.ID,
			OperatorName:  operator.RealName,
			OperatorRole:  operator.Role,
			OldValue:      `{"status":"pending"}`,
			NewValue:      `{"status":"` + string(appeal.Status) + `"}`,
			ChangedFields: []string{"status", "result"},
			IPAddress:     fmt.Sprintf("192.168.1.%d", 110+i),
			UserAgent:     "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
			Remark:        getOperationRemark(i + 10),
		}
		if err := tx.Create(logEntry).Error; err != nil {
			log.Printf("Warning: Failed to create appeal log: %v", err)
		}
	}

	for i, order := range orders[:5] {
		operator := users["dispatcher_01"]
		if i%2 == 0 {
			operator = users["dispatcher_02"]
		}

		logEntry := &models.OperationLog{
			Action:        models.ActionAssignOrder,
			TargetID:      order.ID,
			TargetType:    "order",
			OperatorID:    operator.ID,
			OperatorName:  operator.RealName,
			OperatorRole:  operator.Role,
			OldValue:      `{"status":"pending","runner_id":null}`,
			NewValue:      `{"status":"assigned","runner_id":"` + order.RunnerID.String() + `"}`,
			ChangedFields: []string{"status", "runner_id"},
			IPAddress:     fmt.Sprintf("10.0.0.%d", 10+i),
			UserAgent:     "DispatchSystem/2.0",
			Remark:        "自动派单",
		}
		if err := tx.Create(logEntry).Error; err != nil {
			log.Printf("Warning: Failed to create order log: %v", err)
		}
	}

	for i, subsidy := range subsidies {
		operator := users["ops_manager"]

		createLog := &models.OperationLog{
			Action:        models.ActionCreateSubsidy,
			TargetID:      subsidy.ID,
			TargetType:    "subsidy",
			OperatorID:    operator.ID,
			OperatorName:  operator.RealName,
			OperatorRole:  operator.Role,
			OldValue:      `null`,
			NewValue:      `{"status":"pending","amount":` + fmt.Sprintf("%.2f", subsidy.Amount) + `}`,
			ChangedFields: []string{"status", "amount"},
			IPAddress:     fmt.Sprintf("10.0.1.%d", 100+i),
			UserAgent:     "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
			Remark:        "创建补贴申请",
		}
		if err := tx.Create(createLog).Error; err != nil {
			log.Printf("Warning: Failed to create subsidy create log: %v", err)
		}

		if subsidy.Status == models.SubsidyStatusApproved || subsidy.Status == models.SubsidyStatusPaid {
			reviewLog := &models.OperationLog{
				Action:        models.ActionApproveSubsidy,
				TargetID:      subsidy.ID,
				TargetType:    "subsidy",
				OperatorID:    operator.ID,
				OperatorName:  operator.RealName,
				OperatorRole:  operator.Role,
				OldValue:      `{"status":"pending"}`,
				NewValue:      `{"status":"approved"}`,
				ChangedFields: []string{"status"},
				IPAddress:     fmt.Sprintf("10.0.1.%d", 110+i),
				UserAgent:     "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
				Remark:        "审核通过",
			}
			if err := tx.Create(reviewLog).Error; err != nil {
				log.Printf("Warning: Failed to create subsidy review log: %v", err)
			}
		}

		if subsidy.Status == models.SubsidyStatusRejected {
			rejectLog := &models.OperationLog{
				Action:        models.ActionRejectSubsidy,
				TargetID:      subsidy.ID,
				TargetType:    "subsidy",
				OperatorID:    operator.ID,
				OperatorName:  operator.RealName,
				OperatorRole:  operator.Role,
				OldValue:      `{"status":"pending"}`,
				NewValue:      `{"status":"rejected"}`,
				ChangedFields: []string{"status"},
				IPAddress:     fmt.Sprintf("10.0.1.%d", 120+i),
				UserAgent:     "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
				Remark:        "补贴驳回",
			}
			if err := tx.Create(rejectLog).Error; err != nil {
				log.Printf("Warning: Failed to create subsidy reject log: %v", err)
			}
		}

		if subsidy.Status == models.SubsidyStatusPaid {
			payLog := &models.OperationLog{
				Action:        models.ActionPaySubsidy,
				TargetID:      subsidy.ID,
				TargetType:    "subsidy",
				OperatorID:    operator.ID,
				OperatorName:  operator.RealName,
				OperatorRole:  operator.Role,
				OldValue:      `{"status":"approved"}`,
				NewValue:      `{"status":"paid","payment_method":"` + subsidy.PaymentMethod + `"}`,
				ChangedFields: []string{"status", "payment_method"},
				IPAddress:     fmt.Sprintf("10.0.1.%d", 130+i),
				UserAgent:     "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
				Remark:        "标记已付款",
			}
			if err := tx.Create(payLog).Error; err != nil {
				log.Printf("Warning: Failed to create subsidy pay log: %v", err)
			}
		}
	}

	log.Printf("Created operation logs")
}

func getGoodsDescription(i int, orderType string) string {
	descriptions := map[string][]string{
		"food":    {"宫保鸡丁套餐+米饭", "麻辣香锅双人份", "奶茶三杯", "披萨+鸡翅套餐"},
		"grocery": {"鸡蛋5斤+牛奶2箱", "水果礼盒", "日化用品套装", "米5kg+油5L"},
		"express": {"文件同城急送", "数码产品", "衣物包裹", "重要证件"},
		"other":   {"鲜花一束", "生日蛋糕", "药品代购", "超市代购"},
	}
	list, ok := descriptions[orderType]
	if !ok {
		return "商品配送"
	}
	return list[i%len(list)]
}

func getPickupAddress(i int, merchant string) string {
	addresses := []string{
		merchant + "（中关村店）：北京市海淀区中关村大街1号",
		merchant + "（望京店）：北京市朝阳区望京SOHO T1",
		merchant + "（国贸店）：北京市朝阳区建国门外大街1号",
	}
	return addresses[i%len(addresses)]
}

func getDeliveryAddress(i int, user string) string {
	addresses := []string{
		user + "：北京市海淀区中关村软件园二期15号楼",
		user + "：北京市朝阳区望京西园三区8号楼",
		user + "：北京市西城区金融街7号英蓝国际",
		user + "：北京市东城区东直门南大街1号",
	}
	return addresses[i%len(addresses)]
}

func getOrderRemark(i int, status models.OrderStatus) string {
	if status == models.OrderStatusRefunded {
		return "用户申请退款中"
	}
	if i%4 == 0 {
		return "请优先配送，用户有老人在家"
	}
	return ""
}

func getRefundDescription(i int, reason models.RefundReason) string {
	switch reason {
	case models.RefundReasonTimeout:
		return "订单预计送达时间为18:00，但实际19:30才送到，餐品已凉，影响用餐。骑手中途无联系，系统显示超时45分钟。"
	case models.RefundReasonDamaged:
		return "收到商品时包装破损，汤汁洒出约1/3，部分食品已无法食用。已拍摄照片和视频作为证据。"
	case models.RefundReasonWrongItem:
		return "订购的是A套餐，但收到的是B套餐，且少了一份饮料。与商家沟通后商家让联系平台处理。"
	case models.RefundReasonQualityIssue:
		return "食物有异味，疑似不新鲜。食用后出现肠胃不适，已就医。希望平台重视食品安全问题。"
	default:
		return "其他原因：因临时有事不在家，无法收货，申请全额退款。"
	}
}

func getEvidenceImages(i int) []string {
	images := [][]string{
		{"https://example.com/evidence/img1.jpg", "https://example.com/evidence/img2.jpg"},
		{"https://example.com/evidence/img3.jpg", "https://example.com/evidence/img4.jpg", "https://example.com/evidence/img5.jpg"},
		{"https://example.com/evidence/img6.jpg"},
	}
	return images[i%len(images)]
}

func getRejectReason(i int) string {
	reasons := []string{
		"经核实，骑手已在预计时间内完成配送，GPS轨迹显示正常。用户未及时接听电话导致延误，非骑手责任。",
		"商品在取餐时检查完好，配送过程无异常。用户提供的图片无法证明是配送期间造成的破损。",
		"系统记录显示出餐与订单一致，商家提供了出餐监控录像。可能是用户记错了订单内容。",
	}
	return reasons[i%len(reasons)]
}

func getAppealTitle(i int, role models.Role) string {
	switch role {
	case models.RoleRunner:
		return []string{"申诉：超时判定有误，实际已按时送达", "申诉：用户投诉不实，我有通话记录为证"}[i%2]
	case models.RoleUser:
		return []string{"申诉：退款被驳回不合理，要求重新审核", "申诉：客服处理态度差，问题未解决"}[i%2]
	case models.RoleMerchant:
		return []string{"申诉：平台判定商家责任有误，已提供证据", "申诉：补贴金额不足以覆盖损失"}[i%2]
	default:
		return "对处理结果有异议"
	}
}

func getAppealContent(i int, role models.Role) string {
	switch role {
	case models.RoleRunner:
		return "我是骑手吴强，订单RF2024052018300001判定我超时，但实际上我在17:58就到达了用户楼下，等了12分钟用户才下来取餐。GPS可以证明我到达时间是对的，超时是因为用户下楼慢，不是我的问题。这个罚款我不接受，希望能撤销对我的处罚。"
	case models.RoleUser:
		return "我是用户刘洋，我的退款申请被驳回了，但是我确实等了一个半小时才收到餐。平台说骑手按时送达，但我这里有和骑手的聊天记录，骑手自己都承认路上堵车了。现在餐也凉了，我也没吃上，凭什么不给我退款？"
	case models.RoleMerchant:
		return "我们是美味餐厅，订单ORD2024052018300007被判定商家出餐慢，但实际上我们在规定时间内就做好了，是骑手晚了20分钟才来取餐。有出餐记录和监控为证，不应该算在我们商家头上。"
	default:
		return "对处理结果有异议，提交申诉。"
	}
}

func getAppealResult(i int) string {
	results := []string{
		"经复核，骑手提供的GPS轨迹真实有效，判定为用户延误导致超时。撤销对骑手吴强的50元罚款，已扣除的费用将在3个工作日内返还。对用户致歉并赠送20元优惠券。",
		"申诉成立，用户提供的聊天记录属实。撤销原驳回决定，退款申请重新进入审核流程。对相关客服人员进行服务培训。",
	}
	return results[i%len(results)]
}

func getAppealRejectReason(i int) string {
	reasons := []string{
		"申诉人提供的证据不完整，无法证明其主张。建议补充监控录像或第三方证言后重新提交。",
		"经多方核实，原处理决定并无不当。商家出餐时间确实超出了承诺的15分钟，判定无误。",
	}
	return reasons[i%len(reasons)]
}

func getSubsidyDescription(i int) string {
	descriptions := []string{
		"用户首次遇到超时问题，为维护用户体验，给予全额订单金额50%的补偿。",
		"骑手因系统误判被罚款，经申诉核实后予以补发，同时给予10元激励金。",
		"商家因包装问题导致商品破损，但考虑到是合作老商户，承担50%损失，平台补贴另一半。",
		"用户反馈客服态度问题，经核实属实，给予用户20元诚意补偿。",
	}
	return descriptions[i%len(descriptions)]
}

func getRefundRemark(i int, author string) string {
	remarks := []string{
		author + "：已联系用户确认情况，用户表示理解，同意平台处理方案。",
		author + "：内部备注：该用户是平台高价值用户，建议优先处理，避免流失。",
		author + "：已与商家核对，商家承认出餐慢，商家承担60%责任。",
		author + "：内部备注：此订单涉及骑手投诉，需同步调度组跟进。",
		author + "：超时原因已核实为交通事故导致道路封闭，属于不可抗力。",
	}
	return remarks[i%len(remarks)]
}

func getAppealRemark(i int, author string) string {
	remarks := []string{
		author + "：已调阅当日所有相关记录，包括GPS轨迹、通话录音、聊天记录。",
		author + "：内部备注：此申诉涉及金额较大，建议运营经理终审。",
		author + "：已与双方电话沟通，初步达成和解意向。",
		author + "：内部备注：该骑手本月已有3次申诉，需关注其服务质量。",
	}
	return remarks[i%len(remarks)]
}

func getSubsidyRemark(i int, author string) string {
	remarks := []string{
		author + "：补贴金额已与财务确认，可以走支付流程。",
		author + "：内部备注：该补贴关联的申诉已通过，请尽快完成审批。",
		author + "：商家已确认收款账号，预计T+1到账。",
		author + "：内部备注：此补贴金额较小，建议走快速审批通道。",
	}
	return remarks[i%len(remarks)]
}

func getOperationRemark(i int) string {
	remarks := []string{
		"客服手动处理",
		"系统自动流转",
		"运营经理审批通过",
		"经多方核实后处理",
		"根据平台规则第3.2条处理",
		"用户电话沟通确认",
		"商家无异议",
		"骑手已签收补偿",
	}
	return remarks[i%len(remarks)]
}
