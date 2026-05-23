const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');
const { authenticateToken, requireRoles } = require('../middleware/auth');
const { logOperation } = require('../utils/logger');

const router = express.Router();

const REPAIR_STATUS = {
  received: { label: '已收单', color: 'orange' },
  in_progress: { label: '处理中', color: 'blue' },
  completed: { label: '已完成', color: 'green' },
  picked_up: { label: '已取货', color: 'purple' },
  cancelled: { label: '已取消', color: 'default' }
};

const REPAIR_TYPE = {
  resize: '改圈',
  polish: '抛光翻新',
  repair: '维修',
  remake: '重做',
  modify: '改款'
};

router.get('/', authenticateToken, (req, res) => {
  const userStoreId = req.user.store_id;
  const isAdmin = req.user.role === 'admin';

  const whereClause = isAdmin ? '1=1' : 'r.store_id = ?';
  const params = isAdmin ? [] : [userStoreId];

  const repairs = db.prepare(`
    SELECT r.*,
           p.sku, p.name as product_name, p.category, p.retail_price,
           s.name as store_name,
           u.name as received_by_name,
           pu.name as picked_up_by_name
    FROM repair_orders r
    JOIN products p ON r.product_id = p.id
    JOIN stores s ON r.store_id = s.id
    LEFT JOIN users u ON r.received_by = u.id
    LEFT JOIN users pu ON r.picked_up_by = pu.id
    WHERE ${whereClause}
    ORDER BY r.created_at DESC
  `).all(...params);

  res.json(repairs);
});

router.get('/:id', authenticateToken, (req, res) => {
  const repair = db.prepare(`
    SELECT r.*,
           p.sku, p.name as product_name, p.category, p.material, p.retail_price, p.status as product_status,
           s.name as store_name,
           u.name as received_by_name,
           pu.name as picked_up_by_name
    FROM repair_orders r
    JOIN products p ON r.product_id = p.id
    JOIN stores s ON r.store_id = s.id
    LEFT JOIN users u ON r.received_by = u.id
    LEFT JOIN users pu ON r.picked_up_by = pu.id
    WHERE r.id = ?
  `).get(req.params.id);

  if (!repair) {
    return res.status(404).json({ error: '返修记录不存在' });
  }

  const logs = db.prepare(`
    SELECT * FROM operation_logs
    WHERE ref_type = 'repair' AND ref_id = ?
    ORDER BY created_at DESC
  `).all(req.params.id);

  res.json({ ...repair, logs });
});

router.post('/', authenticateToken, requireRoles('sales_associate', 'store_manager', 'after_sales'), (req, res) => {
  const { product_id, repair_type, customer_name, customer_phone, description, agreed_price } = req.body;

  if (!product_id || !repair_type || !description) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
  if (!product) {
    return res.status(404).json({ error: '货品不存在' });
  }

  const storeId = req.user.store_id;
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(db.prepare('SELECT COUNT(*) as count FROM repair_orders WHERE DATE(created_at) = DATE("now")').get().count + 1).padStart(3, '0');
  const orderNo = `RPR-${dateStr}-${seq}`;

  const id = uuidv4();
  db.prepare(`
    INSERT INTO repair_orders 
    (id, order_no, product_id, store_id, repair_type, customer_name, customer_phone, 
     description, agreed_price, status, received_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'received', ?)
  `).run(id, orderNo, product_id, storeId, repair_type, customer_name || null, customer_phone || null, 
        description, agreed_price || 0, req.user.id);

  logOperation({
    operationType: 'create',
    refType: 'repair',
    refId: id,
    operatorId: req.user.id,
    operatorName: req.user.name,
    action: '创建返修单',
    toStatus: 'received',
    remarks: `类型: ${REPAIR_TYPE[repair_type] || repair_type}, 货品: ${product.name}`
  });

  res.status(201).json({ id, order_no: orderNo, success: true });
});

router.post('/:id/start', authenticateToken, requireRoles('after_sales', 'store_manager'), (req, res) => {
  const repairId = req.params.id;

  const repair = db.prepare('SELECT * FROM repair_orders WHERE id = ?').get(repairId);
  if (!repair) {
    return res.status(404).json({ error: '返修记录不存在' });
  }

  if (repair.status !== 'received') {
    return res.status(400).json({ error: '只能开始处理已收单的返修' });
  }

  db.prepare(`
    UPDATE repair_orders 
    SET status = 'in_progress'
    WHERE id = ?
  `).run(repairId);

  logOperation({
    operationType: 'update',
    refType: 'repair',
    refId: repairId,
    operatorId: req.user.id,
    operatorName: req.user.name,
    action: '开始处理返修',
    fromStatus: 'received',
    toStatus: 'in_progress'
  });

  res.json({ success: true, status: 'in_progress' });
});

router.post('/:id/complete', authenticateToken, requireRoles('after_sales', 'store_manager'), (req, res) => {
  const { repair_result } = req.body;
  const repairId = req.params.id;

  const repair = db.prepare('SELECT * FROM repair_orders WHERE id = ?').get(repairId);
  if (!repair) {
    return res.status(404).json({ error: '返修记录不存在' });
  }

  if (repair.status !== 'in_progress') {
    return res.status(400).json({ error: '只能完成处理中的返修' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE repair_orders 
    SET status = 'completed'
    WHERE id = ?
  `).run(repairId);

  logOperation({
    operationType: 'update',
    refType: 'repair',
    refId: repairId,
    operatorId: req.user.id,
    operatorName: req.user.name,
    action: '完成返修',
    fromStatus: 'in_progress',
    toStatus: 'completed',
    remarks: repair_result
  });

  res.json({ success: true, status: 'completed' });
});

router.post('/:id/pickup', authenticateToken, requireRoles('after_sales', 'store_manager'), (req, res) => {
  const repairId = req.params.id;

  const repair = db.prepare('SELECT * FROM repair_orders WHERE id = ?').get(repairId);
  if (!repair) {
    return res.status(404).json({ error: '返修记录不存在' });
  }

  if (repair.status !== 'completed') {
    return res.status(400).json({ error: '只能取货已完成的返修' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE repair_orders 
    SET status = 'picked_up', picked_up_by = ?, picked_up_at = ?
    WHERE id = ?
  `).run(req.user.id, now, repairId);

  logOperation({
    operationType: 'update',
    refType: 'repair',
    refId: repairId,
    operatorId: req.user.id,
    operatorName: req.user.name,
    action: '客户取货',
    fromStatus: 'completed',
    toStatus: 'picked_up'
  });

  res.json({ success: true, status: 'picked_up' });
});

module.exports = router;
