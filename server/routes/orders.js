const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');

router.get('/', (req, res) => {
  try {
    const { status, customer_id, created_by } = req.query;
    let sql = `
      SELECT o.*, c.name as customer_name, c.company, c.phone,
             p.name as product_name, p.category, p.spec,
             s1.name as creator_name,
             s2.name as approver_name,
             s3.name as shipper_name
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      JOIN tea_products p ON o.product_id = p.id
      JOIN staff s1 ON o.created_by = s1.id
      LEFT JOIN staff s2 ON o.approved_by = s2.id
      LEFT JOIN staff s3 ON o.shipped_by = s3.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      sql += ' AND o.status = ?';
      params.push(status);
    }
    if (customer_id) {
      sql += ' AND o.customer_id = ?';
      params.push(customer_id);
    }
    if (created_by) {
      sql += ' AND o.created_by = ?';
      params.push(created_by);
    }
    sql += ' ORDER BY o.created_at DESC';
    
    const orders = db.prepare(sql).all(...params);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const order = db.prepare(`
      SELECT o.*, c.name as customer_name, c.company, c.phone, c.address,
             p.name as product_name, p.category, p.spec, p.unit_price,
             s1.name as creator_name,
             s2.name as approver_name,
             s3.name as shipper_name
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      JOIN tea_products p ON o.product_id = p.id
      JOIN staff s1 ON o.created_by = s1.id
      LEFT JOIN staff s2 ON o.approved_by = s2.id
      LEFT JOIN staff s3 ON o.shipped_by = s3.id
      WHERE o.id = ?
    `).get(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    
    const approvals = db.prepare(`
      SELECT a.*, s.name as approver_name
      FROM approval_records a
      JOIN staff s ON a.approver_id = s.id
      WHERE a.order_id = ?
      ORDER BY a.created_at DESC
    `).all(req.params.id);
    
    const exceptions = db.prepare(`
      SELECT e.*, s1.name as reporter_name, s2.name as handler_name
      FROM exception_records e
      JOIN staff s1 ON e.reported_by = s1.id
      LEFT JOIN staff s2 ON e.handled_by = s2.id
      WHERE e.related_type = 'order' AND e.related_id = ?
      ORDER BY e.created_at DESC
    `).all(req.params.id);
    
    const remarks = db.prepare(`
      SELECT r.*, s.name as creator_name
      FROM remarks r
      JOIN staff s ON r.created_by = s.id
      WHERE r.related_type = 'order' AND r.related_id = ?
      ORDER BY r.created_at DESC
    `).all(req.params.id);
    
    res.json({ ...order, approvals, exceptions, remarks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { customer_id, product_id, quantity, unit_price, discount_rate, warehouse, delivery_address, created_by } = req.body;
    
    const total_amount = quantity * unit_price;
    const final_amount = total_amount * (1 - discount_rate);
    
    const id = uuidv4();
    const order_no = 'ORD' + dayjs().format('YYYYMMDDHHmmss');
    const now = new Date().toISOString();
    
    db.prepare(
      'INSERT INTO orders (id, order_no, customer_id, product_id, quantity, unit_price, total_amount, discount_rate, final_amount, warehouse, delivery_address, status, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, order_no, customer_id, product_id, quantity, unit_price, total_amount, discount_rate, final_amount, warehouse, delivery_address, 'pending_approval', created_by, now, now);
    
    res.status(201).json({ id, order_no, customer_id, product_id, quantity, total_amount, final_amount, status: 'pending_approval' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/remarks', (req, res) => {
  try {
    const { content, created_by, is_supplement } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();
    
    db.prepare(
      'INSERT INTO remarks (id, related_type, related_id, content, created_by, is_supplement, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, 'order', req.params.id, content, created_by, is_supplement ? 1 : 0, now);
    
    res.status(201).json({ id, content, created_by, created_at: now });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/exceptions', (req, res) => {
  try {
    const { exception_type, description, reported_by } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();
    
    db.prepare(
      'INSERT INTO exception_records (id, related_type, related_id, exception_type, description, reported_by, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, 'order', req.params.id, exception_type, description, reported_by, 'pending', now);
    
    res.status(201).json({ id, exception_type, description, reported_by, status: 'pending' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
