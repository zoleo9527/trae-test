const express = require('express');
const { db } = require('./database');
const { authMiddleware, permissionMiddleware, hashPassword } = require('./auth');

const router = express.Router();

function logOperation(module, operation, recordId, userId, userName, content, oldValue = null, newValue = null) {
  db.prepare('INSERT INTO operation_logs (module, operation, record_id, operator_id, operator_name, content, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(module, operation, recordId, userId, userName, content, oldValue, newValue);
}

router.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const user = db.prepare('SELECT id, username, name, role, phone, created_at FROM users WHERE username = ? AND password = ?')
    .get(username, hashPassword(password));

  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = require('./auth').generateToken(user);
  logOperation('auth', 'login', null, user.id, user.name, '用户登录');
  
  res.json({ user, token });
});

router.get('/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

router.get('/users', authMiddleware, permissionMiddleware('user:view'), (req, res) => {
  const users = db.prepare('SELECT id, username, name, role, phone, created_at FROM users').all();
  res.json(users);
});

router.get('/products', authMiddleware, permissionMiddleware('product:view'), (req, res) => {
  const { category, keyword } = req.query;
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];
  
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (keyword) {
    sql += ' AND (name LIKE ? OR sku LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  
  const products = db.prepare(sql).all(...params);
  res.json(products);
});

router.get('/products/:id', authMiddleware, permissionMiddleware('product:view'), (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) {
    return res.status(404).json({ error: '产品不存在' });
  }
  const batches = db.prepare(`
    SELECT b.*, w.name as warehouse_name 
    FROM inventory_batches b 
    LEFT JOIN warehouses w ON b.warehouse_id = w.id 
    WHERE b.product_id = ? AND b.available_quantity > 0
    ORDER BY b.production_date ASC
  `).all(req.params.id);
  
  const priceHistory = db.prepare(`
    SELECT pa.*, u.name as approver_name 
    FROM price_adjustments pa 
    LEFT JOIN users u ON pa.approver_id = u.id 
    WHERE pa.product_id = ? 
    ORDER BY pa.created_at DESC
  `).all(req.params.id);
  
  res.json({ product, batches, priceHistory });
});

router.get('/warehouses', authMiddleware, (req, res) => {
  const warehouses = db.prepare(`
    SELECT w.*, u.name as manager_name 
    FROM warehouses w 
    LEFT JOIN users u ON w.manager_id = u.id
  `).all();
  res.json(warehouses);
});

router.get('/inventory', authMiddleware, permissionMiddleware('inventory:view'), (req, res) => {
  const { warehouseId, productId, lowStock } = req.query;
  const user = req.user;
  let sql = `
    SELECT 
      p.id as product_id,
      p.sku,
      p.name,
      p.category,
      p.spec,
      p.unit,
      p.base_price,
      w.id as warehouse_id,
      w.name as warehouse_name,
      SUM(b.available_quantity) as total_quantity,
      SUM(b.available_quantity * b.unit_price) as total_value
    FROM inventory_batches b
    LEFT JOIN products p ON b.product_id = p.id
    LEFT JOIN warehouses w ON b.warehouse_id = w.id
    WHERE b.available_quantity > 0
  `;
  const params = [];
  
  if (user.role !== 'manager') {
    sql += ' AND b.warehouse_id IN (SELECT id FROM warehouses WHERE manager_id = ?)';
    params.push(user.id);
  }
  
  if (warehouseId) {
    sql += ' AND b.warehouse_id = ?';
    params.push(warehouseId);
  }
  if (productId) {
    sql += ' AND b.product_id = ?';
    params.push(productId);
  }
  
  sql += ' GROUP BY p.id, w.id';
  
  if (lowStock === 'true') {
    sql += ' HAVING total_quantity < 20';
  }
  
  sql += ' ORDER BY total_quantity ASC';
  
  const inventory = db.prepare(sql).all(...params);
  res.json(inventory);
});

router.get('/inventory/batches', authMiddleware, permissionMiddleware('inventory:view'), (req, res) => {
  const { warehouseId, productId, expiringSoon } = req.query;
  const user = req.user;
  let sql = `
    SELECT 
      b.*,
      p.name as product_name,
      p.sku,
      p.category,
      p.spec,
      p.unit,
      w.name as warehouse_name
    FROM inventory_batches b
    LEFT JOIN products p ON b.product_id = p.id
    LEFT JOIN warehouses w ON b.warehouse_id = w.id
    WHERE 1=1
  `;
  const params = [];
  
  if (user.role !== 'manager') {
    sql += ' AND b.warehouse_id IN (SELECT id FROM warehouses WHERE manager_id = ?)';
    params.push(user.id);
  }
  
  if (warehouseId) {
    sql += ' AND b.warehouse_id = ?';
    params.push(warehouseId);
  }
  if (productId) {
    sql += ' AND b.product_id = ?';
    params.push(productId);
  }
  if (expiringSoon === 'true') {
    sql += ' AND b.expiry_date <= DATE("now", "+6 month")';
  }
  
  sql += ' ORDER BY b.expiry_date ASC';
  
  const batches = db.prepare(sql).all(...params);
  res.json(batches);
});

router.get('/stock-take', authMiddleware, permissionMiddleware('stock_take:view'), (req, res) => {
  const { status, warehouseId } = req.query;
  const user = req.user;
  let sql = `
    SELECT 
      sp.*,
      w.name as warehouse_name,
      uc.name as creator_name,
      ue.name as executor_name,
      ur.name as reviewer_name,
      COUNT(si.id) as item_count,
      SUM(CASE WHEN si.check_result = 'shortage' THEN 1 ELSE 0 END) as shortage_count
    FROM stock_take_plans sp
    LEFT JOIN warehouses w ON sp.warehouse_id = w.id
    LEFT JOIN users uc ON sp.creator_id = uc.id
    LEFT JOIN users ue ON sp.executor_id = ue.id
    LEFT JOIN users ur ON sp.reviewer_id = ur.id
    LEFT JOIN stock_take_items si ON sp.id = si.plan_id
    WHERE 1=1
  `;
  const params = [];
  
  if (user.role !== 'manager') {
    sql += ' AND sp.warehouse_id IN (SELECT id FROM warehouses WHERE manager_id = ?)';
    params.push(user.id);
  }
  
  if (status) {
    sql += ' AND sp.status = ?';
    params.push(status);
  }
  if (warehouseId) {
    sql += ' AND sp.warehouse_id = ?';
    params.push(warehouseId);
  }
  
  sql += ' GROUP BY sp.id ORDER BY sp.created_at DESC';
  
  const plans = db.prepare(sql).all(...params);
  res.json(plans);
});

router.get('/stock-take/:id', authMiddleware, permissionMiddleware('stock_take:view'), (req, res) => {
  const plan = db.prepare(`
    SELECT 
      sp.*,
      w.name as warehouse_name,
      uc.name as creator_name,
      ue.name as executor_name,
      ur.name as reviewer_name
    FROM stock_take_plans sp
    LEFT JOIN warehouses w ON sp.warehouse_id = w.id
    LEFT JOIN users uc ON sp.creator_id = uc.id
    LEFT JOIN users ue ON sp.executor_id = ue.id
    LEFT JOIN users ur ON sp.reviewer_id = ur.id
    WHERE sp.id = ?
  `).get(req.params.id);
  
  if (!plan) {
    return res.status(404).json({ error: '盘点计划不存在' });
  }
  
  const items = db.prepare(`
    SELECT 
      si.*,
      p.name as product_name,
      p.sku,
      p.category,
      p.spec,
      p.unit,
      b.batch_no,
      b.production_date,
      b.expiry_date
    FROM stock_take_items si
    LEFT JOIN products p ON si.product_id = p.id
    LEFT JOIN inventory_batches b ON si.batch_id = b.id
    WHERE si.plan_id = ?
    ORDER BY si.product_id, si.id
  `).all(req.params.id);
  
  const relatedLosses = db.prepare(`
    SELECT lr.*, u.name as reporter_name
    FROM loss_reports lr
    LEFT JOIN users u ON lr.reporter_id = u.id
    WHERE lr.related_stock_take_id = ?
  `).all(req.params.id);
  
  const logs = db.prepare(`
    SELECT * FROM operation_logs 
    WHERE module = 'stock_take' AND record_id = ? 
    ORDER BY created_at DESC
  `).all(req.params.id);
  
  res.json({ plan, items, relatedLosses, logs });
});

router.post('/stock-take', authMiddleware, permissionMiddleware('stock_take:create'), (req, res) => {
  const { warehouse_id, title, type, planned_date, executor_id, remark, product_ids } = req.body;
  
  const planNo = `PD${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
  
  const result = db.prepare(`
    INSERT INTO stock_take_plans (plan_no, warehouse_id, title, type, planned_date, creator_id, executor_id, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(planNo, warehouse_id, title, type, planned_date, req.user.id, executor_id, remark);
  
  const planId = result.lastInsertRowid;
  
  if (product_ids && product_ids.length > 0) {
    const itemInsert = db.prepare(`
      INSERT INTO stock_take_items (plan_id, product_id, batch_id, system_quantity, unit_price, check_result, remark)
      VALUES (?, ?, ?, ?, ?, 'pending', '待盘点')
    `);
    
    const placeholders = product_ids.map(() => '?').join(',');
    const batches = db.prepare(`
      SELECT id, product_id, available_quantity, unit_price
      FROM inventory_batches 
      WHERE product_id IN (${placeholders}) AND warehouse_id = ? AND available_quantity > 0
      ORDER BY product_id, id
    `).all(...product_ids, warehouse_id);
    
    batches.forEach(batch => {
      itemInsert.run(planId, batch.product_id, batch.id, batch.available_quantity, batch.unit_price);
    });
  }
  
  logOperation('stock_take', 'create', planId, req.user.id, req.user.name, `创建盘点计划: ${planNo}`);
  
  res.json({ id: planId, plan_no: planNo });
});

router.put('/stock-take/:id/start', authMiddleware, permissionMiddleware('stock_take:execute'), (req, res) => {
  const plan = db.prepare('SELECT * FROM stock_take_plans WHERE id = ?').get(req.params.id);
  if (!plan) return res.status(404).json({ error: '盘点计划不存在' });
  if (plan.status !== 'pending') return res.status(400).json({ error: '只能开始待执行的盘点' });
  
  db.prepare(`
    UPDATE stock_take_plans 
    SET status = 'in_progress', start_time = DATETIME('now') 
    WHERE id = ?
  `).run(req.params.id);
  
  logOperation('stock_take', 'start', req.params.id, req.user.id, req.user.name, '开始执行盘点', 'pending', 'in_progress');
  
  res.json({ success: true });
});

router.put('/stock-take/:id/complete', authMiddleware, permissionMiddleware('stock_take:execute'), (req, res) => {
  const plan = db.prepare('SELECT * FROM stock_take_plans WHERE id = ?').get(req.params.id);
  if (!plan) return res.status(404).json({ error: '盘点计划不存在' });
  if (plan.status !== 'in_progress') return res.status(400).json({ error: '只能完成进行中的盘点' });
  
  db.prepare(`
    UPDATE stock_take_plans 
    SET status = 'completed', end_time = DATETIME('now') 
    WHERE id = ?
  `).run(req.params.id);
  
  logOperation('stock_take', 'complete', req.params.id, req.user.id, req.user.name, '完成盘点', 'in_progress', 'completed');
  
  res.json({ success: true });
});

router.put('/stock-take/:id/items/:itemId', authMiddleware, permissionMiddleware('stock_take:execute'), (req, res) => {
  const { actual_quantity, remark } = req.body;
  
  const item = db.prepare('SELECT * FROM stock_take_items WHERE id = ?').get(req.params.itemId);
  if (!item) return res.status(404).json({ error: '盘点明细不存在' });
  
  const difference = actual_quantity - item.system_quantity;
  const difference_amount = difference * item.unit_price;
  const check_result = difference < 0 ? 'shortage' : (difference > 0 ? 'overage' : 'normal');
  
  db.prepare(`
    UPDATE stock_take_items 
    SET actual_quantity = ?, difference = ?, difference_amount = ?, check_result = ?, remark = ?
    WHERE id = ?
  `).run(actual_quantity, difference, difference_amount, check_result, remark || item.remark, req.params.itemId);
  
  res.json({ success: true });
});

router.get('/loss-reports', authMiddleware, permissionMiddleware('loss_report:view'), (req, res) => {
  const { status, loss_type, warehouseId } = req.query;
  const user = req.user;
  let sql = `
    SELECT 
      lr.*,
      w.name as warehouse_name,
      ur.name as reporter_name,
      uv.name as reviewer_name,
      ua.name as approver_name,
      sp.plan_no as related_plan_no
    FROM loss_reports lr
    LEFT JOIN warehouses w ON lr.warehouse_id = w.id
    LEFT JOIN users ur ON lr.reporter_id = ur.id
    LEFT JOIN users uv ON lr.reviewer_id = uv.id
    LEFT JOIN users ua ON lr.approver_id = ua.id
    LEFT JOIN stock_take_plans sp ON lr.related_stock_take_id = sp.id
    WHERE 1=1
  `;
  const params = [];
  
  if (user.role !== 'manager') {
    sql += ' AND lr.warehouse_id IN (SELECT id FROM warehouses WHERE manager_id = ?)';
    params.push(user.id);
  }
  
  if (status) {
    sql += ' AND lr.status = ?';
    params.push(status);
  }
  if (loss_type) {
    sql += ' AND lr.loss_type = ?';
    params.push(loss_type);
  }
  if (warehouseId) {
    sql += ' AND lr.warehouse_id = ?';
    params.push(warehouseId);
  }
  
  sql += ' ORDER BY lr.created_at DESC';
  
  const reports = db.prepare(sql).all(...params);
  res.json(reports);
});

router.get('/loss-reports/:id', authMiddleware, permissionMiddleware('loss_report:view'), (req, res) => {
  const report = db.prepare(`
    SELECT 
      lr.*,
      w.name as warehouse_name,
      ur.name as reporter_name,
      uv.name as reviewer_name,
      ua.name as approver_name,
      sp.plan_no as related_plan_no
    FROM loss_reports lr
    LEFT JOIN warehouses w ON lr.warehouse_id = w.id
    LEFT JOIN users ur ON lr.reporter_id = ur.id
    LEFT JOIN users uv ON lr.reviewer_id = uv.id
    LEFT JOIN users ua ON lr.approver_id = ua.id
    LEFT JOIN stock_take_plans sp ON lr.related_stock_take_id = sp.id
    WHERE lr.id = ?
  `).get(req.params.id);
  
  if (!report) {
    return res.status(404).json({ error: '损耗报告不存在' });
  }
  
  const items = db.prepare(`
    SELECT 
      li.*,
      p.name as product_name,
      p.sku,
      p.category,
      p.spec,
      p.unit,
      b.batch_no,
      u.name as responsible_person_name
    FROM loss_items li
    LEFT JOIN products p ON li.product_id = p.id
    LEFT JOIN inventory_batches b ON li.batch_id = b.id
    LEFT JOIN users u ON li.responsible_person_id = u.id
    WHERE li.report_id = ?
    ORDER BY li.id
  `).all(req.params.id);
  
  const logs = db.prepare(`
    SELECT * FROM operation_logs 
    WHERE module = 'loss_report' AND record_id = ? 
    ORDER BY created_at DESC
  `).all(req.params.id);
  
  res.json({ report, items, logs });
});

router.post('/loss-reports', authMiddleware, permissionMiddleware('loss_report:create'), (req, res) => {
  const { warehouse_id, title, loss_type, loss_reason, related_stock_take_id, remark, items } = req.body;
  
  const reportNo = `SS${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
  
  const total_quantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const total_amount = items.reduce((sum, item) => sum + item.amount, 0);
  
  const result = db.prepare(`
    INSERT INTO loss_reports (report_no, warehouse_id, title, loss_type, loss_reason, total_quantity, total_amount, reporter_id, related_stock_take_id, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(reportNo, warehouse_id, title, loss_type, loss_reason, total_quantity, total_amount, req.user.id, related_stock_take_id, remark);
  
  const reportId = result.lastInsertRowid;
  
  const itemInsert = db.prepare(`
    INSERT INTO loss_items (report_id, batch_id, product_id, quantity, unit_price, amount, responsibility, responsible_person_id, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  items.forEach(item => {
    itemInsert.run(reportId, item.batch_id || null, item.product_id, item.quantity, item.unit_price, item.amount, item.responsibility, item.responsible_person_id || null, item.remark);
  });
  
  logOperation('loss_report', 'create', reportId, req.user.id, req.user.name, `创建损耗报告: ${reportNo}`);
  
  res.json({ id: reportId, report_no: reportNo });
});

router.put('/loss-reports/:id/review', authMiddleware, permissionMiddleware('loss_report:review'), (req, res) => {
  const report = db.prepare('SELECT * FROM loss_reports WHERE id = ?').get(req.params.id);
  if (!report) return res.status(404).json({ error: '损耗报告不存在' });
  if (report.status !== 'pending') return res.status(400).json({ error: '只能审核待审核的报告' });
  
  db.prepare(`
    UPDATE loss_reports 
    SET status = 'reviewed', reviewer_id = ?, reviewed_at = DATETIME('now') 
    WHERE id = ?
  `).run(req.user.id, req.params.id);
  
  logOperation('loss_report', 'review', req.params.id, req.user.id, req.user.name, '审核损耗报告', 'pending', 'reviewed');
  
  res.json({ success: true });
});

router.put('/loss-reports/:id/approve', authMiddleware, permissionMiddleware('loss_report:approve'), (req, res) => {
  const report = db.prepare('SELECT * FROM loss_reports WHERE id = ?').get(req.params.id);
  if (!report) return res.status(404).json({ error: '损耗报告不存在' });
  if (report.status !== 'reviewed') return res.status(400).json({ error: '只能审批已审核的报告' });
  
  db.exec('BEGIN TRANSACTION');
  
  try {
    db.prepare(`
      UPDATE loss_reports 
      SET status = 'approved', approver_id = ?, approved_at = DATETIME('now') 
      WHERE id = ?
    `).run(req.user.id, req.params.id);
    
    const items = db.prepare('SELECT * FROM loss_items WHERE report_id = ?').all(req.params.id);
    
    items.forEach(item => {
      if (item.batch_id) {
        db.prepare(`
          UPDATE inventory_batches 
          SET available_quantity = available_quantity - ?,
              quantity = quantity - ?
          WHERE id = ?
        `).run(item.quantity, item.quantity, item.batch_id);
      }
    });
    
    db.exec('COMMIT');
    
    logOperation('loss_report', 'approve', req.params.id, req.user.id, req.user.name, '审批损耗报告，已调整库存', 'reviewed', 'approved');
    
    res.json({ success: true });
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
});

router.get('/dashboard/summary', authMiddleware, (req, res) => {
  const user = req.user;
  const warehouseFilter = user.role === 'manager' ? '' : 'AND b.warehouse_id IN (SELECT id FROM warehouses WHERE manager_id = ?)';
  const warehouseParams = user.role === 'manager' ? [] : [user.id];
  
  const totalInventory = db.prepare(`
    SELECT 
      COUNT(DISTINCT product_id) as product_count,
      SUM(available_quantity) as total_quantity,
      SUM(available_quantity * unit_price) as total_value
    FROM inventory_batches b
    WHERE 1=1 ${warehouseFilter}
  `).get(...warehouseParams);
  
  const lowStock = db.prepare(`
    SELECT COUNT(*) as count
    FROM (
      SELECT product_id, warehouse_id, SUM(available_quantity) as qty
      FROM inventory_batches b
      WHERE 1=1 ${warehouseFilter}
      GROUP BY product_id, warehouse_id
      HAVING qty < 20
    )
  `).get(...warehouseParams);
  
  const expiring = db.prepare(`
    SELECT COUNT(*) as count
    FROM inventory_batches b
    WHERE expiry_date <= DATE("now", "+6 month") AND available_quantity > 0
    ${warehouseFilter}
  `).get(...warehouseParams);
  
  const planFilter = user.role === 'manager' ? '' : 'AND warehouse_id IN (SELECT id FROM warehouses WHERE manager_id = ?)';
  const pendingTake = db.prepare(`SELECT COUNT(*) as count FROM stock_take_plans WHERE status IN ('pending', 'in_progress') ${planFilter}`).get(...warehouseParams);
  const pendingLoss = db.prepare(`SELECT COUNT(*) as count FROM loss_reports WHERE status IN ('pending', 'reviewed') ${planFilter}`).get(...warehouseParams);
  
  const thisMonthLoss = db.prepare(`
    SELECT 
      COALESCE(SUM(total_quantity), 0) as total_quantity,
      COALESCE(SUM(total_amount), 0) as total_amount
    FROM loss_reports 
    WHERE status = 'approved' AND strftime('%Y-%m', approved_at) = strftime('%Y-%m', 'now')
    ${planFilter}
  `).get(...warehouseParams);
  
  const lossByType = db.prepare(`
    SELECT 
      loss_type,
      COUNT(*) as report_count,
      SUM(total_quantity) as total_quantity,
      SUM(total_amount) as total_amount
    FROM loss_reports 
    WHERE status = 'approved' ${planFilter}
    GROUP BY loss_type
  `).all(...warehouseParams);
  
  const lossByResponsibility = db.prepare(`
    SELECT 
      li.responsibility,
      COUNT(*) as item_count,
      SUM(li.quantity) as total_quantity,
      SUM(li.amount) as total_amount
    FROM loss_items li
    LEFT JOIN loss_reports lr ON li.report_id = lr.id
    WHERE lr.status = 'approved' ${planFilter}
    GROUP BY li.responsibility
  `).all(...warehouseParams);
  
  const recentActivities = db.prepare(`
    SELECT * FROM operation_logs 
    ORDER BY created_at DESC 
    LIMIT 20
  `).all();
  
  res.json({
    totalInventory,
    lowStock: lowStock.count,
    expiring: expiring.count,
    pendingTake: pendingTake.count,
    pendingLoss: pendingLoss.count,
    thisMonthLoss,
    lossByType,
    lossByResponsibility,
    recentActivities
  });
});

router.get('/dashboard/inventory-by-category', authMiddleware, (req, res) => {
  const data = db.prepare(`
    SELECT 
      p.category,
      COUNT(DISTINCT p.id) as product_count,
      SUM(b.available_quantity) as total_quantity,
      SUM(b.available_quantity * b.unit_price) as total_value
    FROM inventory_batches b
    LEFT JOIN products p ON b.product_id = p.id
    WHERE b.available_quantity > 0
    GROUP BY p.category
  `).all();
  
  res.json(data);
});

router.get('/dashboard/inventory-by-warehouse', authMiddleware, (req, res) => {
  const data = db.prepare(`
    SELECT 
      w.id,
      w.name,
      COUNT(DISTINCT b.product_id) as product_count,
      SUM(b.available_quantity) as total_quantity,
      SUM(b.available_quantity * b.unit_price) as total_value
    FROM inventory_batches b
    LEFT JOIN warehouses w ON b.warehouse_id = w.id
    WHERE b.available_quantity > 0
    GROUP BY w.id
  `).all();
  
  res.json(data);
});

router.get('/dashboard/loss-trend', authMiddleware, (req, res) => {
  const data = db.prepare(`
    SELECT 
      strftime('%Y-%m', lr.approved_at) as month,
      COUNT(*) as report_count,
      SUM(lr.total_quantity) as total_quantity,
      SUM(lr.total_amount) as total_amount
    FROM loss_reports lr
    WHERE lr.status = 'approved' AND lr.approved_at IS NOT NULL
    GROUP BY month
    ORDER BY month DESC
    LIMIT 6
  `).all();
  
  res.json(data);
});

router.get('/operation-logs', authMiddleware, permissionMiddleware('log:view'), (req, res) => {
  const { module, recordId, limit = 50 } = req.query;
  let sql = 'SELECT * FROM operation_logs WHERE 1=1';
  const params = [];
  
  if (module) {
    sql += ' AND module = ?';
    params.push(module);
  }
  if (recordId) {
    sql += ' AND record_id = ?';
    params.push(recordId);
  }
  
  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);
  
  const logs = db.prepare(sql).all(...params);
  res.json(logs);
});

router.get('/price-adjustments', authMiddleware, permissionMiddleware('price:view'), (req, res) => {
  const { productId, status } = req.query;
  let sql = `
    SELECT 
      pa.*,
      p.name as product_name,
      p.sku,
      u.name as approver_name
    FROM price_adjustments pa
    LEFT JOIN products p ON pa.product_id = p.id
    LEFT JOIN users u ON pa.approver_id = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (productId) {
    sql += ' AND pa.product_id = ?';
    params.push(productId);
  }
  if (status) {
    sql += ' AND pa.status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY pa.created_at DESC';
  
  const adjustments = db.prepare(sql).all(...params);
  res.json(adjustments);
});

router.get('/stock-out', authMiddleware, (req, res) => {
  const { status, type } = req.query;
  let sql = `
    SELECT 
      sor.*,
      w.name as warehouse_name,
      wt.name as target_warehouse_name,
      uc.name as creator_name,
      ur.name as reviewer_name
    FROM stock_out_records sor
    LEFT JOIN warehouses w ON sor.warehouse_id = w.id
    LEFT JOIN warehouses wt ON sor.target_warehouse_id = wt.id
    LEFT JOIN users uc ON sor.creator_id = uc.id
    LEFT JOIN users ur ON sor.reviewer_id = ur.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    sql += ' AND sor.status = ?';
    params.push(status);
  }
  if (type) {
    sql += ' AND sor.type = ?';
    params.push(type);
  }
  
  sql += ' ORDER BY sor.created_at DESC';
  
  const records = db.prepare(sql).all(...params);
  res.json(records);
});

module.exports = router;
