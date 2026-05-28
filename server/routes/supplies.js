const express = require('express');
const db = require('../database');
const { ROLES, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { status, berth_plan_id, category } = req.query;
  let query = `
    SELECT s.*, bp.ship_name, bp.arrival_date
    FROM supplies s
    LEFT JOIN berth_plans bp ON s.berth_plan_id = bp.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND s.status = ?';
    params.push(status);
  }
  if (berth_plan_id) {
    query += ' AND s.berth_plan_id = ?';
    params.push(berth_plan_id);
  }
  if (category) {
    query += ' AND s.category = ?';
    params.push(category);
  }
  query += ' ORDER BY s.id DESC';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/', requireRole(ROLES.FIELD_COORDINATOR), (req, res) => {
  const { berth_plan_id, service_id, category, items, estimated_cost, delivery_date, notes } = req.body;
  
  db.run(
    'INSERT INTO supplies (berth_plan_id, service_id, category, items, estimated_cost, delivery_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [berth_plan_id, service_id, category, JSON.stringify(items), estimated_cost, delivery_date, notes],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      if (delivery_date) {
        db.run(
          'INSERT INTO alerts (type, title, description, related_type, related_id, priority, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
          ['supply', `补给交付提醒: ${category}`, `预计交付日期: ${delivery_date}`, 'supply', this.lastID, 'normal', delivery_date]
        );
      }
      
      res.status(201).json({ id: this.lastID });
    }
  );
});

router.put('/:id', requireRole(ROLES.FIELD_COORDINATOR), (req, res) => {
  const { status, delivery_date, notes } = req.body;
  
  db.run(
    'UPDATE supplies SET status = ?, delivery_date = ?, notes = ? WHERE id = ?',
    [status, delivery_date, notes, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

module.exports = router;
