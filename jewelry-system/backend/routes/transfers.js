const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');
const { authenticateToken, requireRoles } = require('../middleware/auth');
const { logOperation, getLogs } = require('../utils/logger');

const router = express.Router();

function generateRequestNo() {
  const date = new Date();
  const prefix = 'TRF';
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${dateStr}-${random}`;
}

router.get('/', authenticateToken, (req, res) => {
  const { status, storeId, page = 1, pageSize = 20 } = req.query;
  const userStoreId = req.user.store_id;
  
  let query = `
    SELECT t.*, 
           p.sku, p.name as product_name, p.retail_price,
           fs.name as from_store_name,
           ts.name as to_store_name,
           ru.name as requester_name,
           au.name as approver_name
    FROM transfer_requests t
    LEFT JOIN products p ON t.product_id = p.id
    LEFT JOIN stores fs ON t.from_store_id = fs.id
    LEFT JOIN stores ts ON t.to_store_id = ts.id
    LEFT JOIN users ru ON t.requested_by = ru.id
    LEFT JOIN users au ON t.approved_by = au.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND t.status = ?';
    params.push(status);
  }
  
  if (storeId) {
    query += ' AND (t.from_store_id = ? OR t.to_store_id = ?)';
    params.push(storeId, storeId);
  } else if (req.user.role !== 'admin') {
    query += ' AND (t.from_store_id = ? OR t.to_store_id = ?)';
    params.push(userStoreId, userStoreId);
  }

  query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const transfers = db.prepare(query).all(...params);
  
  const countQuery = 'SELECT COUNT(*) as total FROM transfer_requests WHERE 1=1';
  const total = db.prepare(countQuery).get().total;

  res.json({ data: transfers, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', authenticateToken, (req, res) => {
  const transfer = db.prepare(`
    SELECT t.*, 
           p.sku, p.name as product_name, p.category, p.material, p.weight, p.cost_price, p.retail_price,
           fs.name as from_store_name,
           ts.name as to_store_name,
           ru.name as requester_name,
           au.name as approver_name,
           su.name as shipper_name,
           reu.name as receiver_name
    FROM transfer_requests t
    LEFT JOIN products p ON t.product_id = p.id
    LEFT JOIN stores fs ON t.from_store_id = fs.id
    LEFT JOIN stores ts ON t.to_store_id = ts.id
    LEFT JOIN users ru ON t.requested_by = ru.id
    LEFT JOIN users au ON t.approved_by = au.id
    LEFT JOIN users su ON t.shipped_by = su.id
    LEFT JOIN users reu ON t.received_by = reu.id
    WHERE t.id = ?
  `).get(req.params.id);

  if (!transfer) {
    return res.status(404).json({ error: '调货申请不存在' });
  }

  const logs = getLogs('transfer', req.params.id);
  res.json({ ...transfer, logs });
});

router.post('/', authenticateToken, requireRoles('sales_associate', 'store_manager'), (req, res) => {
  const { from_store_id, to_store_id, product_id, reason, priority = 'normal' } = req.body;

  if (!from_store_id || !to_store_id || !product_id || !reason) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
  if (!product) {
    return res.status(404).json({ error: '货品不存在' });
  }

  if (product.status !== 'in_stock') {
    return res.status(400).json({ error: '货品当前状态不可调货' });
  }

  if (product.current_store_id !== from_store_id) {
    return res.status(400).json({ error: '货品不在调出门店' });
  }

  if (from_store_id === to_store_id) {
    return res.status(400).json({ error: '调出和调入门店不能相同' });
  }

  const id = uuidv4();
  const requestNo = generateRequestNo();

  const stmt = db.prepare(`
    INSERT INTO transfer_requests 
    (id, request_no, from_store_id, to_store_id, product_id, requested_by, reason, priority, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `);

  stmt.run(id, requestNo, from_store_id, to_store_id, product_id, req.user.id, reason, priority);

  db.prepare('UPDATE products SET status = ? WHERE id = ?').run('allocated', product_id);

  logOperation({
    operationType: 'create',
    refType: 'transfer',
    refId: id,
    operatorId: req.user.id,
    operatorName: req.user.name,
    action: '创建调货申请',
    toStatus: 'pending',
    remarks: `申请单号: ${requestNo}`
  });

  res.status(201).json({ id, request_no: requestNo, status: 'pending' });
});

router.post('/:id/approve', authenticateToken, requireRoles('store_manager'), (req, res) => {
  const { rejection_reason } = req.body;
  const transferId = req.params.id;

  const transfer = db.prepare('SELECT * FROM transfer_requests WHERE id = ?').get(transferId);
  if (!transfer) {
    return res.status(404).json({ error: '调货申请不存在' });
  }

  if (transfer.status !== 'pending') {
    return res.status(400).json({ error: '当前状态不可审批' });
  }

  if (transfer.from_store_id !== req.user.store_id) {
    return res.status(403).json({ error: '只能审批本门店的调货申请' });
  }

  const status = rejection_reason ? 'rejected' : 'approved';
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE transfer_requests 
    SET status = ?, approved_by = ?, approved_at = ?, rejection_reason = ?
    WHERE id = ?
  `).run(status, req.user.id, now, rejection_reason || null, transferId);

  if (rejection_reason) {
    db.prepare('UPDATE products SET status = ? WHERE id = ?').run('in_stock', transfer.product_id);
  }

  logOperation({
    operationType: 'approve',
    refType: 'transfer',
    refId: transferId,
    operatorId: req.user.id,
    operatorName: req.user.name,
    action: rejection_reason ? '拒绝调货申请' : '批准调货申请',
    fromStatus: 'pending',
    toStatus: status,
    remarks: rejection_reason
  });

  res.json({ success: true, status });
});

router.post('/:id/ship', authenticateToken, requireRoles('sales_associate', 'store_manager'), (req, res) => {
  const transferId = req.params.id;

  const transfer = db.prepare('SELECT * FROM transfer_requests WHERE id = ?').get(transferId);
  if (!transfer) {
    return res.status(404).json({ error: '调货申请不存在' });
  }

  if (transfer.status !== 'approved') {
    return res.status(400).json({ error: '当前状态不可发货' });
  }

  if (transfer.from_store_id !== req.user.store_id) {
    return res.status(403).json({ error: '只能从本门店发货' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE transfer_requests 
    SET status = 'shipped', shipped_by = ?, shipped_at = ?
    WHERE id = ?
  `).run(req.user.id, now, transferId);

  logOperation({
    operationType: 'ship',
    refType: 'transfer',
    refId: transferId,
    operatorId: req.user.id,
    operatorName: req.user.name,
    action: '货品已发出',
    fromStatus: 'approved',
    toStatus: 'shipped'
  });

  res.json({ success: true, status: 'shipped' });
});

router.post('/:id/receive', authenticateToken, requireRoles('sales_associate', 'store_manager'), (req, res) => {
  const transferId = req.params.id;

  const transfer = db.prepare('SELECT * FROM transfer_requests WHERE id = ?').get(transferId);
  if (!transfer) {
    return res.status(404).json({ error: '调货申请不存在' });
  }

  if (transfer.status !== 'shipped') {
    return res.status(400).json({ error: '当前状态不可收货' });
  }

  if (transfer.to_store_id !== req.user.store_id) {
    return res.status(403).json({ error: '只能在调入门店收货' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE transfer_requests 
    SET status = 'received', received_by = ?, received_at = ?
    WHERE id = ?
  `).run(req.user.id, now, transferId);

  db.prepare('UPDATE products SET status = ?, current_store_id = ? WHERE id = ?')
    .run('in_stock', transfer.to_store_id, transfer.product_id);

  logOperation({
    operationType: 'receive',
    refType: 'transfer',
    refId: transferId,
    operatorId: req.user.id,
    operatorName: req.user.name,
    action: '货品已接收',
    fromStatus: 'shipped',
    toStatus: 'received'
  });

  res.json({ success: true, status: 'received' });
});

router.post('/:id/complete', authenticateToken, requireRoles('store_manager'), (req, res) => {
  const transferId = req.params.id;

  const transfer = db.prepare('SELECT * FROM transfer_requests WHERE id = ?').get(transferId);
  if (!transfer) {
    return res.status(404).json({ error: '调货申请不存在' });
  }

  if (transfer.status !== 'received') {
    return res.status(400).json({ error: '当前状态不可完成' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE transfer_requests 
    SET status = 'completed', completed_by = ?, completed_at = ?
    WHERE id = ?
  `).run(req.user.id, now, transferId);

  logOperation({
    operationType: 'complete',
    refType: 'transfer',
    refId: transferId,
    operatorId: req.user.id,
    operatorName: req.user.name,
    action: '调货完成',
    fromStatus: 'received',
    toStatus: 'completed'
  });

  res.json({ success: true, status: 'completed' });
});

router.post('/:id/cancel', authenticateToken, requireRoles('store_manager', 'sales_associate'), (req, res) => {
  const transferId = req.params.id;

  const transfer = db.prepare('SELECT * FROM transfer_requests WHERE id = ?').get(transferId);
  if (!transfer) {
    return res.status(404).json({ error: '调货申请不存在' });
  }

  if (!['pending', 'approved'].includes(transfer.status)) {
    return res.status(400).json({ error: '当前状态不可取消' });
  }

  if (transfer.requested_by !== req.user.id && transfer.from_store_id !== req.user.store_id) {
    return res.status(403).json({ error: '无权限取消此申请' });
  }

  db.prepare('UPDATE transfer_requests SET status = ? WHERE id = ?').run('cancelled', transferId);
  db.prepare('UPDATE products SET status = ? WHERE id = ?').run('in_stock', transfer.product_id);

  logOperation({
    operationType: 'cancel',
    refType: 'transfer',
    refId: transferId,
    operatorId: req.user.id,
    operatorName: req.user.name,
    action: '取消调货申请',
    fromStatus: transfer.status,
    toStatus: 'cancelled'
  });

  res.json({ success: true, status: 'cancelled' });
});

module.exports = router;
