const express = require('express');
const db = require('../database');

const router = express.Router();

router.get('/', (req, res) => {
  const { status, priority, type } = req.query;
  let query = 'SELECT * FROM alerts WHERE (user_id = ? OR user_id IS NULL)';
  const params = [req.user.id];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (priority) {
    query += ' AND priority = ?';
    params.push(priority);
  }
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  query += ' ORDER BY priority DESC, due_date ASC';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.put('/:id', (req, res) => {
  const { status } = req.body;
  
  db.run(
    'UPDATE alerts SET status = ? WHERE id = ?',
    [status, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

router.get('/summary', (req, res) => {
  db.all(`
    SELECT 
      type,
      priority,
      status,
      COUNT(*) as count
    FROM alerts
    WHERE (user_id = ? OR user_id IS NULL)
    GROUP BY type, priority, status
  `, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const summary = {
      total: 0,
      pending: 0,
      byType: {},
      byPriority: { high: 0, normal: 0, low: 0 }
    };
    
    rows.forEach(row => {
      summary.total += row.count;
      if (row.status === 'pending') {
        summary.pending += row.count;
      }
      if (!summary.byType[row.type]) {
        summary.byType[row.type] = 0;
      }
      summary.byType[row.type] += row.count;
      summary.byPriority[row.priority] += row.count;
    });
    
    res.json(summary);
  });
});

module.exports = router;
