const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', (req, res) => {
  const { project_id, status, rectification_status } = req.query;
  let sql = `
    SELECT i.*, p.name as project_name, u.name as inspector_name
    FROM quality_inspections i
    LEFT JOIN projects p ON i.project_id = p.id
    LEFT JOIN users u ON i.inspector_id = u.id
    WHERE 1=1
  `;
  const params = [];
  if (project_id) {
    sql += ' AND i.project_id = ?';
    params.push(project_id);
  }
  if (status) {
    sql += ' AND i.status = ?';
    params.push(status);
  }
  if (rectification_status) {
    sql += ' AND i.rectification_status = ?';
    params.push(rectification_status);
  }
  sql += ' ORDER BY i.inspection_date DESC';
  db.all(sql, params, (err, inspections) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(inspections);
  });
});

router.get('/pending-rectification', (req, res) => {
  db.all(`
    SELECT i.*, p.name as project_name, p.client_name, u.name as inspector_name
    FROM quality_inspections i
    LEFT JOIN projects p ON i.project_id = p.id
    LEFT JOIN users u ON i.inspector_id = u.id
    WHERE i.rectification_status = 'pending'
    ORDER BY i.rectification_deadline ASC
  `, (err, inspections) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(inspections);
  });
});

router.post('/batch-rectification', (req, res) => {
  const { ids, status, remark, processed_by } = req.body;
  const placeholders = ids.map(() => '?').join(',');
  
  db.all(`
    SELECT id, rectification_status, project_id
    FROM quality_inspections 
    WHERE id IN (${placeholders})
  `, ids, (err, oldInsps) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    db.run(`
      UPDATE quality_inspections 
      SET rectification_status = ? 
      WHERE id IN (${placeholders})
    `, [status, ...ids], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const historyData = oldInsps.map(i => [
        'inspection', i.id, i.rectification_status, status, remark, processed_by
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

router.get('/:id/comments', (req, res) => {
  const { id } = req.params;
  db.all(`
    SELECT c.*, u.name as creator_name
    FROM comments c
    LEFT JOIN users u ON c.created_by = u.id
    WHERE c.related_type = 'inspection' AND c.related_id = ?
    ORDER BY c.created_at DESC
  `, [id], (err, comments) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(comments);
  });
});

router.post('/:id/comments', (req, res) => {
  const { id } = req.params;
  const { content, created_by } = req.body;
  db.run(`
    INSERT INTO comments (related_type, related_id, content, created_by)
    VALUES (?, ?, ?, ?)
  `, ['inspection', id, content, created_by], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, message: '评论添加成功' });
  });
});

module.exports = router;
