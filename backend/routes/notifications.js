const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', (req, res) => {
  const { user_id, is_read, related_type, related_id, limit = 20 } = req.query;
  let sql = `
    SELECT n.* FROM notifications n
    WHERE 1=1
  `;
  const params = [];
  if (user_id) {
    sql += ' AND n.user_id = ?';
    params.push(user_id);
  }
  if (is_read !== undefined) {
    sql += ' AND n.is_read = ?';
    params.push(is_read === 'true' ? 1 : 0);
  }
  if (related_type) {
    sql += ' AND n.related_type = ?';
    params.push(related_type);
  }
  if (related_id) {
    sql += ' AND n.related_id = ?';
    params.push(related_id);
  }
  sql += ' ORDER BY n.created_at DESC LIMIT ?';
  params.push(limit);
  
  db.all(sql, params, (err, notifications) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(notifications);
  });
});

router.get('/unread-count', (req, res) => {
  const { user_id } = req.query;
  db.get(`
    SELECT COUNT(*) as count FROM notifications 
    WHERE user_id = ? AND is_read = 0
  `, [user_id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ count: result.count });
  });
});

router.put('/:id/read', (req, res) => {
  const { id } = req.params;
  db.run('UPDATE notifications SET is_read = 1 WHERE id = ?', [id], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: '已标记为已读' });
  });
});

router.get('/overview', (req, res) => {
  const overview = {
    missedCheckins: 0,
    pendingRectifications: 0,
    lowStockSupplies: 0,
    pendingFollowups: 0,
    pendingSupplyRequests: 0
  };
  
  db.serialize(() => {
    db.get(`SELECT COUNT(*) as count FROM checkins c
            JOIN schedules s ON c.schedule_id = s.id
            WHERE c.status = 'missed' 
            AND s.schedule_date >= date('now', '-7 days')`, 
      (err, result) => { if (result) overview.missedCheckins = result.count; }
    );
    
    db.get(`SELECT COUNT(*) as count FROM quality_inspections 
            WHERE rectification_status = 'pending'`, 
      (err, result) => { if (result) overview.pendingRectifications = result.count; }
    );
    
    db.get(`SELECT COUNT(*) as count FROM supplies 
            WHERE quantity < min_threshold`, 
      (err, result) => { if (result) overview.lowStockSupplies = result.count; }
    );
    
    db.get(`SELECT COUNT(*) as count FROM renewals 
            WHERE status = 'followup'`, 
      (err, result) => { if (result) overview.pendingFollowups = result.count; }
    );
    
    db.get(`SELECT COUNT(*) as count FROM supply_requests 
            WHERE status = 'pending'`, 
      (err, result) => { 
        if (result) overview.pendingSupplyRequests = result.count;
        res.json(overview);
      }
    );
  });
});

module.exports = router;
