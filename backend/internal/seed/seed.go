package seed

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/jmoiron/sqlx"
	"golang.org/x/crypto/bcrypt"
)

func Seed(db *sqlx.DB) error {
	tx, err := db.Beginx()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	var store1ID, store2ID, store3ID string
	err = tx.QueryRowx(`INSERT INTO stores (name, address, region, status) VALUES
		('南锣鼓巷旗舰店', '北京市东城区南锣鼓巷128号', '华北', 'active') RETURNING id`).Scan(&store1ID)
	if err != nil {
		return err
	}
	err = tx.QueryRowx(`INSERT INTO stores (name, address, region, status) VALUES
		('田子坊概念店', '上海市黄浦区泰康路210弄', '华东', 'active') RETURNING id`).Scan(&store2ID)
	if err != nil {
		return err
	}
	err = tx.QueryRowx(`INSERT INTO stores (name, address, region, status) VALUES
		('宽窄巷子体验店', '成都市青羊区宽巷子22号', '西南', 'active') RETURNING id`).Scan(&store3ID)
	if err != nil {
		return err
	}

	users := []struct {
		username, displayName, role, storeID string
	}{
		{"system", "系统自动同步", "admin", ""},
		{"admin", "系统管理员", "admin", ""},
		{"zhang_store", "张店长", "store_manager", store1ID},
		{"li_store", "李店长", "store_manager", store2ID},
		{"wang_plan", "王企划", "planning_specialist", ""},
		{"zhao_wh", "赵仓管", "warehouse_manager", ""},
		{"chen_store", "陈店长", "store_manager", store3ID},
	}
	userIDs := make(map[string]string)
	for _, u := range users {
		hash, _ := bcrypt.GenerateFromPassword([]byte("demo123"), bcrypt.DefaultCost)
		var id string
		storeID := u.storeID
		err := tx.QueryRowx(
			`INSERT INTO users (username, password_hash, display_name, role, store_id) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
			u.username, string(hash), u.displayName, u.role, storeID,
		).Scan(&id)
		if err != nil {
			log.Printf("skip user %s: %v", u.username, err)
			continue
		}
		userIDs[u.username] = id
	}

	products := []struct {
		name, sku, category string
		cobranded           bool
		partner, status     string
		storeID             string
	}{
		{"故宫联名书签套装", "GJ-SK-001", "文创文具", true, "故宫文创", "active", ""},
		{"敦煌飞天丝巾", "DH-SJ-001", "服饰配饰", true, "敦煌研究院", "active", ""},
		{"国潮笔记本A5", "GC-BJ-001", "文创文具", false, "", "active", ""},
		{"非遗手工剪纸礼盒", "FY-JZ-001", "非遗手作", true, "民间剪纸协会", "active", store1ID},
		{"限定联名徽章盲盒", "XD-HZ-001", "潮玩", true, "泡泡玛特", "active", ""},
		{"手绘明信片套装", "SH-MX-001", "文创文具", false, "", "active", store2ID},
		{"苏州园林折扇", "SZ-ZS-001", "非遗手作", true, "苏州博物馆", "inactive", ""},
		{"国风手机壳", "GF-SJ-001", "数码周边", false, "", "active", store3ID},
	}
	productIDs := make(map[string]string)
	for _, p := range products {
		var id string
		var storeID interface{}
		if p.storeID != "" {
			storeID = p.storeID
		}
		err := tx.QueryRowx(
			`INSERT INTO products (name, sku, category, is_cobranded, cobrand_partner, status, store_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
			p.name, p.sku, p.category, p.cobranded, p.partner, p.status, storeID,
		).Scan(&id)
		if err != nil {
			log.Printf("skip product %s: %v", p.sku, err)
			continue
		}
		productIDs[p.sku] = id
	}

	for sku, qty := range map[string]struct {
		s1, s2, s3 int
	}{
		"GJ-SK-001": {45, 32, 28},
		"DH-SJ-001": {18, 25, 12},
		"GC-BJ-001": {120, 85, 60},
		"FY-JZ-001": {8, 0, 0},
		"XD-HZ-001": {50, 40, 35},
		"SH-MX-001": {0, 65, 0},
		"SZ-ZS-001": {10, 5, 0},
		"GF-SJ-001": {0, 0, 30},
	} {
		pid := productIDs[sku]
		if pid == "" {
			continue
		}
		if qty.s1 > 0 {
			tx.MustExec(`INSERT INTO inventory_records (store_id, product_id, quantity, system_quantity, last_checked_at) VALUES ($1, $2, $3, $4, $5)`,
				store1ID, pid, qty.s1, qty.s1, time.Now().Add(-48*time.Hour))
		}
		if qty.s2 > 0 {
			tx.MustExec(`INSERT INTO inventory_records (store_id, product_id, quantity, system_quantity, last_checked_at) VALUES ($1, $2, $3, $4, $5)`,
				store2ID, pid, qty.s2, qty.s2, time.Now().Add(-36*time.Hour))
		}
		if qty.s3 > 0 {
			tx.MustExec(`INSERT INTO inventory_records (store_id, product_id, quantity, system_quantity, last_checked_at) VALUES ($1, $2, $3, $4, $5)`,
				store3ID, pid, qty.s3, qty.s3, time.Now().Add(-24*time.Hour))
		}
	}

	now := time.Now()
	insp1ID := insertInspection(tx, store1ID, userIDs["wang_plan"], "5月南锣鼓巷店常规巡店",
		"routine", "reviewed", "发现多处陈列问题和联名商品库存偏差", now.Add(-7*24*time.Hour))
	insp1Item1ID := insertInspectionItem(tx, insp1ID, "display", "故宫联名书签陈列位置偏后，未在主推台展示，影响联名推广效果", "high", "in_rectification", userIDs["zhang_store"])
	insp1Item2ID := insertInspectionItem(tx, insp1ID, "compliance", "非遗剪纸礼盒价签缺失，顾客投诉无法确认价格", "critical", "in_rectification", userIDs["zhang_store"])
	insp1Item3ID := insertInspectionItem(tx, insp1ID, "inventory", "限定联名徽章盲盒系统库存50实际仅38，偏差12件", "high", "in_rectification", userIDs["zhang_store"])
	_ = insertInspectionItem(tx, insp1ID, "cleaning", "入口展台玻璃有指纹和灰尘", "low", "open", userIDs["zhang_store"])

	insertPhoto(tx, insp1Item1ID, "/uploads/inspections/insp1_item1_before_1.jpg", "书签陈列在角落，不在主推区")
	insertPhoto(tx, insp1Item1ID, "/uploads/inspections/insp1_item1_before_2.jpg", "主推台摆放了非联名商品")

	insp2ID := insertInspection(tx, store2ID, userIDs["wang_plan"], "田子坊概念店联名商品专项巡店",
		"special", "submitted", "联名商品陈列和库存同步问题", now.Add(-3*24*time.Hour))
	insp2Item1ID := insertInspectionItem(tx, insp2ID, "display", "敦煌飞天丝巾与国潮笔记本混放，未按联名品牌分区", "medium", "open", userIDs["li_store"])
	_ = insertInspectionItem(tx, insp2ID, "inventory", "敦煌丝巾系统库存25实际22，偏差3条", "medium", "open", userIDs["li_store"])

	insertPhoto(tx, insp2Item1ID, "/uploads/inspections/insp2_item1_before_1.jpg", "敦煌和笔记本混放")

	insp3ID := insertInspection(tx, store3ID, userIDs["wang_plan"], "宽窄巷子店整改回查",
		"follow_up", "submitted", "回查上次巡店提出的陈列问题", now.Add(-1*24*time.Hour))
	_ = insertInspectionItem(tx, insp3ID, "display", "国风手机壳陈列架歪斜需要调整", "low", "open", userIDs["chen_store"])

	rect1ID := insertRectification(tx, insp1Item1ID, store1ID, "故宫联名书签陈列位置调整",
		"将故宫联名书签调整至主推台C位，非联名商品后移", "high", "in_progress",
		userIDs["zhang_store"], userIDs["wang_plan"], now.Add(-6*24*time.Hour))
	rect2ID := insertRectification(tx, insp1Item2ID, store1ID, "非遗剪纸礼盒价签补全",
		"补充非遗剪纸礼盒价签和促销信息牌", "critical", "verified",
		userIDs["zhang_store"], userIDs["wang_plan"], now.Add(-6*24*time.Hour))
	rect3ID := insertRectification(tx, insp1Item3ID, store1ID, "徽章盲盒库存盘点与系统校正",
		"盘点实际库存，校正系统数据，排查12件差异原因", "high", "in_progress",
		userIDs["zhao_wh"], userIDs["wang_plan"], now.Add(-5*24*time.Hour))

	insertRectPhoto(tx, rect1ID, "before", "/uploads/rectifications/rect1_before_1.jpg", "书签在角落陈列", userIDs["wang_plan"], now.Add(-6*24*time.Hour))
	insertRectPhoto(tx, rect1ID, "before", "/uploads/rectifications/rect1_before_2.jpg", "主推台非联名商品", userIDs["wang_plan"], now.Add(-6*24*time.Hour))
	insertRectPhoto(tx, rect1ID, "after", "/uploads/rectifications/rect1_after_1.jpg", "已调整到主推台C位", userIDs["zhang_store"], now.Add(-2*24*time.Hour))

	insertRectPhoto(tx, rect2ID, "before", "/uploads/rectifications/rect2_before_1.jpg", "价签缺失", userIDs["wang_plan"], now.Add(-6*24*time.Hour))
	insertRectPhoto(tx, rect2ID, "after", "/uploads/rectifications/rect2_after_1.jpg", "价签和促销牌已补全", userIDs["zhang_store"], now.Add(-4*24*time.Hour))

	insertComment(tx, rect1ID, userIDs["wang_plan"], "张店长，请尽快将书签调到主推位，联名推广本周就要上线了", now.Add(-6*24*time.Hour))
	insertComment(tx, rect1ID, userIDs["zhang_store"], "收到，明天调陈列。主推台目前放的笔记本需要挪到哪里？", now.Add(-5.5*24*time.Hour))
	insertComment(tx, rect1ID, userIDs["wang_plan"], "笔记本挪到B区文创文具架就行，主推台只留联名款", now.Add(-5*24*time.Hour))
	insertComment(tx, rect1ID, userIDs["zhang_store"], "已完成调整，照片已上传，请王企划确认", now.Add(-2*24*time.Hour))

	insertComment(tx, rect2ID, userIDs["zhang_store"], "价签已打印并放置，促销信息牌也一起补了", now.Add(-4*24*time.Hour))
	insertComment(tx, rect2ID, userIDs["wang_plan"], "确认，已验证通过", now.Add(-3.5*24*time.Hour))

	insertComment(tx, rect3ID, userIDs["zhao_wh"], "盘点发现12件差异，其中8件是上周末会员兑换未扣减系统库存，4件是调拨在途未入库", now.Add(-4*24*time.Hour))
	insertComment(tx, rect3ID, userIDs["wang_plan"], "请赵仓管核实兑换记录和调拨单，校正系统数据", now.Add(-3.5*24*time.Hour))
	insertComment(tx, rect3ID, userIDs["zhao_wh"], "兑换记录已核实，调拨单确认在途，系统数量校正中", now.Add(-2*24*time.Hour))

	seedAuditLogs(tx, userIDs, store1ID, store2ID, store3ID, insp1ID, insp1Item1ID, insp1Item2ID, insp1Item3ID,
		rect1ID, rect2ID, rect3ID, productIDs)

	repl1ID := insertReplenishment(tx, store1ID, userIDs["zhang_store"], "approved", "5月故宫联名商品补货", now.Add(-4*24*time.Hour))
	insertReplenishmentItem(tx, repl1ID, productIDs["GJ-SK-001"], 30, 25, 0)
	insertReplenishmentItem(tx, repl1ID, productIDs["XD-HZ-001"], 20, 15, 0)

	repl2ID := insertReplenishment(tx, store3ID, userIDs["chen_store"], "submitted", "宽窄巷子店补货申请", now.Add(-1*24*time.Hour))
	insertReplenishmentItem(tx, repl2ID, productIDs["DH-SJ-001"], 15, 0, 0)
	insertReplenishmentItem(tx, repl2ID, productIDs["XD-HZ-001"], 10, 0, 0)

	trans1ID := insertTransfer(tx, store2ID, store1ID, userIDs["zhao_wh"], "in_transit", "南锣鼓巷徽章缺货，从田子坊调拨", now.Add(-2*24*time.Hour))
	insertTransferItem(tx, trans1ID, productIDs["XD-HZ-001"], 10)

	tx.MustExec(`INSERT INTO member_redemptions (member_phone, product_id, store_id, quantity, status, fulfilled_by_id, fulfilled_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		"13800138001", productIDs["XD-HZ-001"], store1ID, 2, "fulfilled", userIDs["zhang_store"], now.Add(-30*time.Hour))
	tx.MustExec(`INSERT INTO member_redemptions (member_phone, product_id, store_id, quantity, status, fulfilled_by_id, fulfilled_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		"13900139002", productIDs["GJ-SK-001"], store1ID, 1, "fulfilled", userIDs["zhang_store"], now.Add(-28*time.Hour))
	tx.MustExec(`INSERT INTO member_redemptions (member_phone, product_id, store_id, quantity, status) VALUES ($1, $2, $3, $4, $5)`,
		"13700137003", productIDs["DH-SJ-001"], store2ID, 1, "pending")
	tx.MustExec(`INSERT INTO member_redemptions (member_phone, product_id, store_id, quantity, status) VALUES ($1, $2, $3, $4, $5)`,
		"13600136004", productIDs["GJ-SK-001"], store3ID, 3, "pending")

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit seed transaction: %w", err)
	}
	log.Println("seed data committed successfully")
	return nil
}

func insertInspection(tx *sqlx.Tx, storeID, inspectorID, title, inspType, status, notes string, inspectedAt time.Time) string {
	var id string
	tx.QueryRowx(`INSERT INTO inspections (store_id, inspector_id, title, inspection_type, status, notes, inspected_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
		storeID, inspectorID, title, inspType, status, notes, inspectedAt).Scan(&id)
	return id
}

func insertInspectionItem(tx *sqlx.Tx, inspectionID, category, description, severity, status, assigneeID string) string {
	var id string
	tx.QueryRowx(`INSERT INTO inspection_items (inspection_id, category, description, severity, status, assignee_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
		inspectionID, category, description, severity, status, assigneeID).Scan(&id)
	return id
}

func insertPhoto(tx *sqlx.Tx, itemID, url, caption string) {
	tx.MustExec(`INSERT INTO inspection_photos (inspection_item_id, url, caption, taken_at) VALUES ($1, $2, $3, $4)`,
		itemID, url, caption, time.Now().Add(-7*24*time.Hour))
}

func insertRectification(tx *sqlx.Tx, itemID, storeID, title, description, severity, status, assigneeID, verifierID string, dueDate time.Time) string {
	var id string
	resolvedAt := time.Now().Add(-3 * 24 * time.Hour)
	var resolvedAtPtr interface{}
	if status == "verified" || status == "closed" {
		resolvedAtPtr = resolvedAt
	}
	tx.QueryRowx(`INSERT INTO rectifications (inspection_item_id, store_id, title, description, severity, status, assignee_id, verifier_id, due_date, resolved_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
		itemID, storeID, title, description, severity, status, assigneeID, verifierID, dueDate.Add(7*24*time.Hour), resolvedAtPtr).Scan(&id)
	return id
}

func insertRectPhoto(tx *sqlx.Tx, rectID, photoType, url, caption, takenByID string, takenAt time.Time) {
	tx.MustExec(`INSERT INTO rectification_photos (rectification_id, photo_type, url, caption, taken_by_id, taken_at) VALUES ($1, $2, $3, $4, $5, $6)`,
		rectID, photoType, url, caption, takenByID, takenAt)
}

func insertComment(tx *sqlx.Tx, rectID, authorID, content string, createdAt time.Time) {
	tx.MustExec(`INSERT INTO rectification_comments (rectification_id, author_id, content, created_at) VALUES ($1, $2, $3, $4)`,
		rectID, authorID, content, createdAt)
}

func insertReplenishment(tx *sqlx.Tx, storeID, createdByID, status, notes string, createdAt time.Time) string {
	var id string
	tx.QueryRowx(`INSERT INTO replenishment_orders (store_id, created_by_id, status, notes, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
		storeID, createdByID, status, notes, createdAt).Scan(&id)
	return id
}

func insertReplenishmentItem(tx *sqlx.Tx, orderID, productID string, requested, approved, received int) {
	tx.MustExec(`INSERT INTO replenishment_items (order_id, product_id, requested_qty, approved_qty, received_qty) VALUES ($1, $2, $3, $4, $5)`,
		orderID, productID, requested, approved, received)
}

func insertTransfer(tx *sqlx.Tx, fromStoreID, toStoreID, createdByID, status, notes string, createdAt time.Time) string {
	var id string
	tx.QueryRowx(`INSERT INTO transfer_orders (from_store_id, to_store_id, created_by_id, status, notes, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
		fromStoreID, toStoreID, createdByID, status, notes, createdAt).Scan(&id)
	return id
}

func insertTransferItem(tx *sqlx.Tx, orderID, productID string, quantity int) {
	tx.MustExec(`INSERT INTO transfer_items (order_id, product_id, quantity) VALUES ($1, $2, $3)`,
		orderID, productID, quantity)
}

func seedAuditLogs(tx *sqlx.Tx, userIDs map[string]string, store1ID, store2ID, store3ID string,
	insp1ID, insp1Item1ID, insp1Item2ID, insp1Item3ID, rect1ID, rect2ID, rect3ID string,
	productIDs map[string]string) {
	now := time.Now()

	type auditEntry struct {
		entityType, entityID, action, operatorID, operatorName, note string
		oldValue, newValue                                           interface{}
		createdAt                                                    time.Time
	}

	logs := []auditEntry{
		{"inspection", insp1ID, "create", userIDs["wang_plan"], "王企划", "创建巡店记录", nil,
			map[string]string{"title": "5月南锣鼓巷店常规巡店", "status": "draft", "store_id": store1ID}, now.Add(-7 * 24 * time.Hour)},
		{"inspection", insp1ID, "status_change", userIDs["wang_plan"], "王企划", "状态变更为 submitted",
			map[string]string{"status": "draft"}, map[string]string{"status": "submitted"}, now.Add(-163 * time.Hour)},
		{"inspection", insp1ID, "status_change", userIDs["wang_plan"], "王企划", "状态变更为 reviewed",
			map[string]string{"status": "submitted"}, map[string]string{"status": "reviewed"}, now.Add(-3 * 24 * time.Hour)},

		{"inspection_item", insp1Item1ID, "create", userIDs["wang_plan"], "王企划", "创建巡店检查项", nil,
			map[string]string{"category": "display", "severity": "high"}, now.Add(-7 * 24 * time.Hour)},
		{"inspection_item", insp1Item1ID, "assign", userIDs["wang_plan"], "王企划", "指派责任人", nil,
			map[string]string{"assignee_id": userIDs["zhang_store"]}, now.Add(-7 * 24 * time.Hour)},
		{"inspection_item", insp1Item1ID, "status_change", userIDs["wang_plan"], "王企划", "检查项进入整改状态",
			map[string]string{"status": "open"}, map[string]string{"status": "in_rectification"}, now.Add(-6 * 24 * time.Hour)},

		{"inspection_item", insp1Item3ID, "create", userIDs["wang_plan"], "王企划", "创建巡店检查项", nil,
			map[string]string{"category": "inventory", "severity": "high"}, now.Add(-7 * 24 * time.Hour)},
		{"inspection_item", insp1Item3ID, "assign", userIDs["wang_plan"], "王企划", "指派责任人", nil,
			map[string]string{"assignee_id": userIDs["zhao_wh"]}, now.Add(-7 * 24 * time.Hour)},

		{"rectification", rect1ID, "create", userIDs["wang_plan"], "王企划", "创建整改单", nil,
			map[string]string{"title": "故宫联名书签陈列位置调整", "status": "pending"}, now.Add(-6 * 24 * time.Hour)},
		{"rectification", rect1ID, "assign", userIDs["wang_plan"], "王企划", "指派整改责任人", nil,
			map[string]string{"assignee_id": userIDs["zhang_store"]}, now.Add(-6 * 24 * time.Hour)},
		{"rectification", rect1ID, "status_change", userIDs["zhang_store"], "张店长", "整改状态从 pending 变更为 in_progress",
			map[string]string{"status": "pending"}, map[string]string{"status": "in_progress"}, now.Add(-5 * 24 * time.Hour)},

		{"rectification", rect2ID, "create", userIDs["wang_plan"], "王企划", "创建整改单", nil,
			map[string]string{"title": "非遗剪纸礼盒价签补全", "status": "pending"}, now.Add(-6 * 24 * time.Hour)},
		{"rectification", rect2ID, "status_change", userIDs["zhang_store"], "张店长", "整改状态从 pending 变更为 in_progress",
			map[string]string{"status": "pending"}, map[string]string{"status": "in_progress"}, now.Add(-5 * 24 * time.Hour)},
		{"rectification", rect2ID, "status_change", userIDs["zhang_store"], "张店长", "整改状态从 in_progress 变更为 submitted",
			map[string]string{"status": "in_progress"}, map[string]string{"status": "submitted"}, now.Add(-4 * 24 * time.Hour)},
		{"rectification", rect2ID, "status_change", userIDs["wang_plan"], "王企划", "整改状态从 submitted 变更为 verified",
			map[string]string{"status": "submitted"}, map[string]string{"status": "verified"}, now.Add(-3.5 * 24 * time.Hour)},

		{"rectification", rect3ID, "create", userIDs["wang_plan"], "王企划", "创建整改单", nil,
			map[string]string{"title": "徽章盲盒库存盘点与系统校正", "status": "pending"}, now.Add(-5 * 24 * time.Hour)},
		{"rectification", rect3ID, "assign", userIDs["wang_plan"], "王企划", "指派整改责任人", nil,
			map[string]string{"assignee_id": userIDs["zhao_wh"]}, now.Add(-5 * 24 * time.Hour)},
		{"rectification", rect3ID, "status_change", userIDs["zhao_wh"], "赵仓管", "整改状态从 pending 变更为 in_progress",
			map[string]string{"status": "pending"}, map[string]string{"status": "in_progress"}, now.Add(-4 * 24 * time.Hour)},

		{"product", productIDs["SZ-ZS-001"], "status_change", userIDs["wang_plan"], "王企划", "商品状态从 active 变更为 inactive",
			map[string]string{"status": "active"}, map[string]string{"status": "inactive"}, now.Add(-10 * 24 * time.Hour)},
	}

	for _, l := range logs {
		var oldJSON, newJSON interface{}
		if l.oldValue != nil {
			b, _ := json.Marshal(l.oldValue)
			s := string(b)
			oldJSON = s
		}
		if l.newValue != nil {
			b, _ := json.Marshal(l.newValue)
			s := string(b)
			newJSON = s
		}
		tx.MustExec(`INSERT INTO audit_logs (entity_type, entity_id, action, old_value, new_value, operator_id, operator_name, note, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
			l.entityType, l.entityID, l.action, oldJSON, newJSON, l.operatorID, l.operatorName, l.note, l.createdAt)
	}
}
