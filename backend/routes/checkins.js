const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', (req, res) => {
  const { project_id, status, start_date, end_date } = req.query;
  let sql = `
    SELECT c.*, s.schedule_date, s.project_id, s.shift_type, 
           u.name as cleaner_name, p.name as project_name
    FROM checkins c
    JOIN schedules s ON c.schedule_id = s.id
    LEFT JOIN users u ON s.cleaner_id = u.id
    LEFT JOIN projects p ON s.project_id = p.id
    WHERE 1=1
  `;
  const params = [];
  if (project_id) {
    sql += ' AND s.project_id = ?';
    params.push(project_id);
  }
  if (status) {
    sql += ' AND c.status = ?';
    params.push(status);
  }
  if (start_date) {
    sql += ' AND s.schedule_date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    sql += ' AND s.schedule_date <= ?';
    params.push(end_date);
  }
  sql += ' ORDER BY s.schedule_date DESC';
  db.all(sql, params, (err, checkins) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(checkins);
  });
});

router.get('/missed', (req, res) => {
  const { days = 7 } = req.query;
  db.all(`
    SELECT c.*, s.schedule_date, s.project_id, s.shift_type,
           u.name as cleaner_name, p.name as project_name, p.client_name
    FROM checkins c
    JOIN schedules s ON c.schedule_id = s.id
    LEFT JOIN users u ON s.cleaner_id = u.id
    LEFT JOIN projects p ON s.project_id = p.id
    WHERE c.status = 'missed'
    AND s.schedule_date >= date('now', '-' || ? || ' days')
    ORDER BY s.schedule_date DESC
  `, [days], (err, checkins) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(checkins);
  });
});

router.post('/batch-process', (req, res) => {
  const { ids, status, remark, processed_by } = req.body;
  
  const placeholders = ids.map(() => '?').join(',');
  
  db.all(`
    SELECT c.id, c.status, s.project_id
    FROM checkins c
    JOIN schedules s ON c.schedule_id = s.id
    WHERE c.id IN (${placeholders})
  `, ids, (err, oldCheckins) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    db.run(`
      UPDATE checkins SET status = ?, remark = COALESCE(?, remark) WHERE id IN (${placeholders})
    `, [status, remark, ...ids], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const historyData = oldCheckins.map(c => [
        'checkin', c.id, c.status, status, remark, processed_by
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
    WHERE c.related_type = 'checkin' AND c.related_id = ?
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
  `, ['checkin', id, content, created_by], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, message: '评论添加成功' });
  });
});

module.exports = router;
