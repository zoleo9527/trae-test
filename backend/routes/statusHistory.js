const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', (req, res) => {
  const { related_type, related_id } = req.query;
  let sql = `
    SELECT h.*, u.name as changer_name
    FROM status_history h
    LEFT JOIN users u ON h.changed_by = u.id
    WHERE 1=1
  `;
  const params = [];
  if (related_type) {
    sql += ' AND h.related_type = ?';
    params.push(related_type);
  }
  if (related_id) {
    sql += ' AND h.related_id = ?';
    params.push(related_id);
  }
  sql += ' ORDER BY h.created_at DESC';
  db.all(sql, params, (err, history) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(history);
  });
});

module.exports = router;
