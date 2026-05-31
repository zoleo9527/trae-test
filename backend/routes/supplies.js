const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', (req, res) => {
  const { project_id, low_stock } = req.query;
  let sql = `
    SELECT s.*, p.name as project_name
    FROM supplies s
    LEFT JOIN projects p ON s.project_id = p.id
    WHERE 1=1
  `;
  const params = [];
  if (project_id) {
    sql += ' AND s.project_id = ?';
    params.push(project_id);
  }
  if (low_stock === 'true') {
    sql += ' AND s.quantity < s.min_threshold';
  }
  db.all(sql, params, (err, supplies) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(supplies);
  });
});

router.get('/low-stock', (req, res) => {
  db.all(`
    SELECT s.*, p.name as project_name, p.client_name
    FROM supplies s
    LEFT JOIN projects p ON s.project_id = p.id
    WHERE s.quantity < s.min_threshold
    ORDER BY (s.quantity * 1.0 / s.min_threshold) ASC
  `, (err, supplies) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(supplies);
  });
});

router.get('/requests', (req, res) => {
  const { project_id, status } = req.query;
  let sql = `
    SELECT r.*, s.name as supply_name, s.unit, p.name as project_name,
           u1.name as requester_name, u2.name as approver_name
    FROM supply_requests r
    LEFT JOIN supplies s ON r.supply_id = s.id
    LEFT JOIN projects p ON r.project_id = p.id
    LEFT JOIN users u1 ON r.requested_by = u1.id
    LEFT JOIN users u2 ON r.approved_by = u2.id
    WHERE 1=1
  `;
  const params = [];
  if (project_id) {
    sql += ' AND r.project_id = ?';
    params.push(project_id);
  }
  if (status) {
    sql += ' AND r.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY r.created_at DESC';
  db.all(sql, params, (err, requests) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(requests);
  });
});

router.post('/requests/batch-process', (req, res) => {
  const { ids, status, remark, processed_by } = req.body;
  const placeholders = ids.map(() => '?').join(',');
  
  db.all(`
    SELECT id, status, project_id
    FROM supply_requests 
    WHERE id IN (${placeholders})
  `, ids, (err, oldReqs) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    db.run(`
      UPDATE supply_requests 
      SET status = ?, approved_by = ?
      WHERE id IN (${placeholders})
    `, [status, processed_by, ...ids], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const historyData = oldReqs.map(r => [
        'supply_request', r.id, r.status, status, remark, processed_by
      ]);
      
      const stmt = db.prepare(`
        INSERT INTO status_history (related_type, related_id, old_status, new_status, remark, changed_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      historyData.forEach(data => stmt.run(data));
      stmt.finalize();
      
      res.json({ message: `批量处理成功，共${ids.length}条记录` });
    });
  });
});

router.post('/requests', (req, res) => {
  const { project_id, supply_id, requested_quantity, requested_by, remark } = req.body;
  db.run(`
    INSERT INTO supply_requests (project_id, supply_id, requested_quantity, requested_by, remark)
    VALUES (?, ?, ?, ?, ?)
  `, [project_id, supply_id, requested_quantity, requested_by, remark], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, message: '申请提交成功' });
  });
});

module.exports = router;
