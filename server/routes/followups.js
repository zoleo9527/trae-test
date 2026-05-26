const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
  try {
    const { status, assigned_staff_id, scheduled_date, trial_id } = req.query;
    let sql = `
      SELECT f.*, c.name as customer_name, c.company, c.phone,
             t.trial_date, p.name as product_name,
             s.name as staff_name
      FROM followup_tasks f
      JOIN customers c ON f.customer_id = c.id
      JOIN trial_records t ON f.trial_id = t.id
      JOIN tea_products p ON t.product_id = p.id
      JOIN staff s ON f.assigned_staff_id = s.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      sql += ' AND f.status = ?';
      params.push(status);
    }
    if (assigned_staff_id) {
      sql += ' AND f.assigned_staff_id = ?';
      params.push(assigned_staff_id);
    }
    if (scheduled_date) {
      sql += ' AND f.scheduled_date = ?';
      params.push(scheduled_date);
    }
    if (trial_id) {
      sql += ' AND f.trial_id = ?';
      params.push(trial_id);
    }
    sql += ' ORDER BY f.scheduled_date ASC, f.sort_order ASC, f.scheduled_time ASC';
    
    const followups = db.prepare(sql).all(...params);
    res.json(followups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/calendar', (req, res) => {
  try {
    const { start_date, end_date, assigned_staff_id } = req.query;
    let sql = `
      SELECT f.*, c.name as customer_name, c.company,
             p.name as product_name,
             s.name as staff_name
      FROM followup_tasks f
      JOIN customers c ON f.customer_id = c.id
      JOIN trial_records t ON f.trial_id = t.id
      JOIN tea_products p ON t.product_id = p.id
      JOIN staff s ON f.assigned_staff_id = s.id
      WHERE f.scheduled_date >= ? AND f.scheduled_date <= ?
    `;
    const params = [start_date, end_date];
    
    if (assigned_staff_id) {
      sql += ' AND f.assigned_staff_id = ?';
      params.push(assigned_staff_id);
    }
    sql += ' ORDER BY f.scheduled_date ASC, f.sort_order ASC, f.scheduled_time ASC';
    
    const followups = db.prepare(sql).all(...params);
    res.json(followups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const followup = db.prepare(`
      SELECT f.*, c.name as customer_name, c.company, c.phone, c.address,
             t.trial_date, t.feedback as trial_feedback,
             p.name as product_name,
             s.name as staff_name
      FROM followup_tasks f
      JOIN customers c ON f.customer_id = c.id
      JOIN trial_records t ON f.trial_id = t.id
      JOIN tea_products p ON t.product_id = p.id
      JOIN staff s ON f.assigned_staff_id = s.id
      WHERE f.id = ?
    `).get(req.params.id);
    
    if (!followup) {
      return res.status(404).json({ error: '回访任务不存在' });
    }
    
    res.json(followup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { trial_id, customer_id, assigned_staff_id, scheduled_date, scheduled_time, followup_type } = req.body;

    const trial = db.prepare('SELECT customer_id FROM trial_records WHERE id = ?').get(trial_id);
    if (!trial) {
      return res.status(400).json({ error: '试饮记录不存在' });
    }
    if (trial.customer_id !== customer_id) {
      return res.status(400).json({ error: '试饮记录与所选客户不匹配' });
    }

    const maxSortOrder = db.prepare(`
      SELECT COALESCE(MAX(sort_order), -1) as max_order 
      FROM followup_tasks 
      WHERE scheduled_date = ? AND assigned_staff_id = ?
    `).get(scheduled_date, assigned_staff_id);
    const sort_order = maxSortOrder.max_order + 1;

    const id = uuidv4();
    const now = new Date().toISOString();
    
    db.prepare(
      'INSERT INTO followup_tasks (id, trial_id, customer_id, assigned_staff_id, scheduled_date, scheduled_time, followup_type, status, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, trial_id, customer_id, assigned_staff_id, scheduled_date, scheduled_time, followup_type, 'pending', sort_order, now, now);
    
    res.status(201).json({ id, trial_id, customer_id, assigned_staff_id, scheduled_date, scheduled_time, followup_type, status: 'pending', sort_order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { status, actual_date, content, result, next_followup_date, scheduled_date, scheduled_time, assigned_staff_id, sort_order } = req.body;
    const now = new Date().toISOString();
    
    let sql = 'UPDATE followup_tasks SET updated_at = ?';
    const params = [now];
    
    if (status !== undefined) {
      sql += ', status = ?';
      params.push(status);
    }
    if (actual_date !== undefined) {
      sql += ', actual_date = ?';
      params.push(actual_date);
    }
    if (content !== undefined) {
      sql += ', content = ?';
      params.push(content);
    }
    if (result !== undefined) {
      sql += ', result = ?';
      params.push(result);
    }
    if (next_followup_date !== undefined) {
      sql += ', next_followup_date = ?';
      params.push(next_followup_date);
    }
    if (scheduled_date !== undefined) {
      sql += ', scheduled_date = ?';
      params.push(scheduled_date);
    }
    if (scheduled_time !== undefined) {
      sql += ', scheduled_time = ?';
      params.push(scheduled_time);
    }
    if (assigned_staff_id !== undefined) {
      sql += ', assigned_staff_id = ?';
      params.push(assigned_staff_id);
    }
    if (sort_order !== undefined) {
      sql += ', sort_order = ?';
      params.push(sort_order);
    }
    
    sql += ' WHERE id = ?';
    params.push(req.params.id);
    
    db.prepare(sql).run(...params);
    res.json({ id: req.params.id, status, content, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM followup_tasks WHERE id = ?').run(req.params.id);
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/reorder', (req, res) => {
  try {
    const { items } = req.body;
    const now = new Date().toISOString();

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'items必须是数组' });
    }

    const updateStmt = db.prepare(`
      UPDATE followup_tasks 
      SET scheduled_date = ?, sort_order = ?, updated_at = ?
      WHERE id = ?
    `);

    const updateMany = db.transaction((updates) => {
      for (const item of updates) {
        updateStmt.run(item.scheduled_date, item.sort_order, now, item.id);
      }
    });

    updateMany(items);
    res.json({ success: true, updated: items.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
