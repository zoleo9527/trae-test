const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
  try {
    const { assigned_staff_id, level } = req.query;
    let sql = 'SELECT * FROM customers WHERE 1=1';
    const params = [];
    
    if (assigned_staff_id) {
      sql += ' AND assigned_staff_id = ?';
      params.push(assigned_staff_id);
    }
    if (level) {
      sql += ' AND level = ?';
      params.push(level);
    }
    sql += ' ORDER BY updated_at DESC';
    
    const customers = db.prepare(sql).all(...params);
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: '客户不存在' });
    }
    
    const trials = db.prepare(`
      SELECT t.*, p.name as product_name, s.name as staff_name
      FROM trial_records t
      JOIN tea_products p ON t.product_id = p.id
      JOIN staff s ON t.assigned_staff_id = s.id
      WHERE t.customer_id = ?
      ORDER BY t.trial_date DESC
    `).all(req.params.id);
    
    const orders = db.prepare(`
      SELECT o.*, p.name as product_name, s.name as creator_name
      FROM orders o
      JOIN tea_products p ON o.product_id = p.id
      JOIN staff s ON o.created_by = s.id
      WHERE o.customer_id = ?
      ORDER BY o.created_at DESC
    `).all(req.params.id);
    
    const remarks = db.prepare(`
      SELECT r.*, s.name as creator_name
      FROM remarks r
      JOIN staff s ON r.created_by = s.id
      WHERE r.related_type = 'customer' AND r.related_id = ?
      ORDER BY r.created_at DESC
    `).all(req.params.id);
    
    res.json({ ...customer, trials, orders, remarks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, company, phone, address, level, source, assigned_staff_id } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();
    
    db.prepare(
      'INSERT INTO customers (id, name, company, phone, address, level, source, assigned_staff_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, name, company, phone, address, level || 'potential', source, assigned_staff_id, now, now);
    
    res.status(201).json({ id, name, company, phone, address, level, source, assigned_staff_id });
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
    ).run(id, 'customer', req.params.id, content, created_by, is_supplement ? 1 : 0, now);
    
    res.status(201).json({ id, content, created_by, created_at: now });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
