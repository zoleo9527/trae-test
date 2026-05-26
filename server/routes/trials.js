const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
  try {
    const { status, assigned_staff_id } = req.query;
    let sql = `
      SELECT t.*, c.name as customer_name, c.company, c.phone, 
             p.name as product_name, p.category, p.spec,
             s.name as staff_name
      FROM trial_records t
      JOIN customers c ON t.customer_id = c.id
      JOIN tea_products p ON t.product_id = p.id
      JOIN staff s ON t.assigned_staff_id = s.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      sql += ' AND t.status = ?';
      params.push(status);
    }
    if (assigned_staff_id) {
      sql += ' AND t.assigned_staff_id = ?';
      params.push(assigned_staff_id);
    }
    sql += ' ORDER BY t.trial_date DESC';
    
    const trials = db.prepare(sql).all(...params);
    res.json(trials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const trial = db.prepare(`
      SELECT t.*, c.name as customer_name, c.company, c.phone, c.address,
             p.name as product_name, p.category, p.spec, p.unit_price,
             s.name as staff_name
      FROM trial_records t
      JOIN customers c ON t.customer_id = c.id
      JOIN tea_products p ON t.product_id = p.id
      JOIN staff s ON t.assigned_staff_id = s.id
      WHERE t.id = ?
    `).get(req.params.id);
    
    if (!trial) {
      return res.status(404).json({ error: '试饮记录不存在' });
    }
    
    const followups = db.prepare(`
      SELECT f.*, s.name as staff_name
      FROM followup_tasks f
      JOIN staff s ON f.assigned_staff_id = s.id
      WHERE f.trial_id = ?
      ORDER BY f.scheduled_date ASC
    `).all(req.params.id);
    
    const remarks = db.prepare(`
      SELECT r.*, s.name as creator_name
      FROM remarks r
      JOIN staff s ON r.created_by = s.id
      WHERE r.related_type = 'trial' AND r.related_id = ?
      ORDER BY r.created_at DESC
    `).all(req.params.id);
    
    res.json({ ...trial, followups, remarks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { customer_id, product_id, trial_quantity, trial_date, assigned_staff_id } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();
    
    db.prepare(
      'INSERT INTO trial_records (id, customer_id, product_id, trial_quantity, trial_date, assigned_staff_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, customer_id, product_id, trial_quantity, trial_date, assigned_staff_id, 'pending', now, now);
    
    res.status(201).json({ id, customer_id, product_id, trial_quantity, trial_date, assigned_staff_id, status: 'pending' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { status, feedback, satisfaction_score } = req.body;
    const now = new Date().toISOString();
    
    db.prepare(
      'UPDATE trial_records SET status = ?, feedback = ?, satisfaction_score = ?, updated_at = ? WHERE id = ?'
    ).run(status, feedback, satisfaction_score, now, req.params.id);
    
    res.json({ id: req.params.id, status, feedback, satisfaction_score });
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
    ).run(id, 'trial', req.params.id, content, created_by, is_supplement ? 1 : 0, now);
    
    res.status(201).json({ id, content, created_by, created_at: now });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
