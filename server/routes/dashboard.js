const express = require('express');
const router = express.Router();
const db = require('../db');
const dayjs = require('dayjs');

router.get('/stats', (req, res) => {
  try {
    const trialCount = db.prepare('SELECT COUNT(*) as count FROM trial_records').get();
    const pendingTrials = db.prepare("SELECT COUNT(*) as count FROM trial_records WHERE status = 'pending' OR status = 'in_progress'").get();
    
    const followupCount = db.prepare('SELECT COUNT(*) as count FROM followup_tasks').get();
    const pendingFollowups = db.prepare("SELECT COUNT(*) as count FROM followup_tasks WHERE status = 'pending'").get();
    const todayFollowups = db.prepare('SELECT COUNT(*) as count FROM followup_tasks WHERE scheduled_date = ?').get(dayjs().format('YYYY-MM-DD'));
    
    const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get();
    const pendingApprovals = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'pending_approval'").get();
    
    const customerCount = db.prepare('SELECT COUNT(*) as count FROM customers').get();
    
    const pendingExceptions = db.prepare("SELECT COUNT(*) as count FROM exception_records WHERE status = 'pending'").get();
    
    res.json({
      trials: { total: trialCount.count, pending: pendingTrials.count },
      followups: { total: followupCount.count, pending: pendingFollowups.count, today: todayFollowups.count },
      orders: { total: orderCount.count, pending_approval: pendingApprovals.count },
      customers: { total: customerCount.count },
      exceptions: { pending: pendingExceptions.count }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/products', (req, res) => {
  try {
    const products = db.prepare('SELECT * FROM tea_products ORDER BY created_at DESC').all();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/exceptions', (req, res) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT e.*, 
             CASE WHEN e.related_type = 'order' THEN o.order_no ELSE '' END as related_no,
             s1.name as reporter_name,
             s2.name as handler_name
      FROM exception_records e
      JOIN staff s1 ON e.reported_by = s1.id
      LEFT JOIN staff s2 ON e.handled_by = s2.id
      LEFT JOIN orders o ON e.related_type = 'order' AND e.related_id = o.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      sql += ' AND e.status = ?';
      params.push(status);
    }
    sql += ' ORDER BY e.created_at DESC';
    
    const exceptions = db.prepare(sql).all(...params);
    res.json(exceptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
