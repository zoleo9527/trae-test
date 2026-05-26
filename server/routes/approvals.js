const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
  try {
    const { status, approver_id } = req.query;
    let sql = `
      SELECT a.*, o.order_no, o.final_amount, o.status as order_status,
             c.name as customer_name,
             p.name as product_name,
             s.name as approver_name
      FROM approval_records a
      JOIN orders o ON a.order_id = o.id
      JOIN customers c ON o.customer_id = c.id
      JOIN tea_products p ON o.product_id = p.id
      JOIN staff s ON a.approver_id = s.id
      WHERE 1=1
    `;
    const params = [];
    
    if (approver_id) {
      sql += ' AND a.approver_id = ?';
      params.push(approver_id);
    }
    sql += ' ORDER BY a.created_at DESC';
    
    const approvals = db.prepare(sql).all(...params);
    res.json(approvals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:orderId/approve', (req, res) => {
  try {
    const { approver_id } = req.body;
    const now = new Date().toISOString();
    const approvalId = uuidv4();
    
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    if (order.status !== 'pending_approval') {
      return res.status(400).json({ error: '订单状态不正确，无法审批' });
    }
    
    db.prepare(`
      UPDATE orders 
      SET status = 'approved', approved_by = ?, approved_at = ?, updated_at = ?
      WHERE id = ?
    `).run(approver_id, now, now, req.params.orderId);
    
    db.prepare(`
      INSERT INTO approval_records (id, order_id, approver_id, action, created_at)
      VALUES (?, ?, ?, 'approve', ?)
    `).run(approvalId, req.params.orderId, approver_id, now);
    
    res.json({ success: true, message: '审批通过', order_id: req.params.orderId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:orderId/reject', (req, res) => {
  try {
    const { approver_id, reason } = req.body;
    const now = new Date().toISOString();
    const approvalId = uuidv4();
    
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    if (order.status !== 'pending_approval') {
      return res.status(400).json({ error: '订单状态不正确，无法审批' });
    }
    
    db.prepare(`
      UPDATE orders 
      SET status = 'rejected', approved_by = ?, approved_at = ?, updated_at = ?
      WHERE id = ?
    `).run(approver_id, now, now, req.params.orderId);
    
    db.prepare(`
      INSERT INTO approval_records (id, order_id, approver_id, action, reason, created_at)
      VALUES (?, ?, ?, 'reject', ?, ?)
    `).run(approvalId, req.params.orderId, approver_id, reason, now);
    
    res.json({ success: true, message: '已驳回', order_id: req.params.orderId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:orderId/ship', (req, res) => {
  try {
    const { shipper_id, batch_no } = req.body;
    const now = new Date().toISOString();
    
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    if (order.status !== 'approved') {
      return res.status(400).json({ error: '订单未审批，无法发货' });
    }
    
    db.prepare(`
      UPDATE orders 
      SET status = 'shipped', shipped_by = ?, shipped_at = ?, batch_no = ?, updated_at = ?
      WHERE id = ?
    `).run(shipper_id, now, batch_no, now, req.params.orderId);
    
    res.json({ success: true, message: '发货完成', order_id: req.params.orderId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:orderId/receive', (req, res) => {
  try {
    const now = new Date().toISOString();
    
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    if (order.status !== 'shipped') {
      return res.status(400).json({ error: '订单未发货，无法确认收货' });
    }
    
    db.prepare(`
      UPDATE orders 
      SET status = 'completed', received_at = ?, updated_at = ?
      WHERE id = ?
    `).run(now, now, req.params.orderId);
    
    res.json({ success: true, message: '收货确认完成', order_id: req.params.orderId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/exceptions/:exceptionId', (req, res) => {
  try {
    const { status, handled_by, resolution } = req.body;
    const now = new Date().toISOString();
    
    db.prepare(`
      UPDATE exception_records 
      SET status = ?, handled_by = ?, handled_at = ?, resolution = ?
      WHERE id = ?
    `).run(status, handled_by, now, resolution, req.params.exceptionId);
    
    res.json({ success: true, exception_id: req.params.exceptionId, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
