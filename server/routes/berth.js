const express = require('express');
const db = require('../database');
const { ROLES, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { status, startDate, endDate, shipName } = req.query;
  let query = 'SELECT * FROM berth_plans WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (startDate) {
    query += ' AND arrival_date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND arrival_date <= ?';
    params.push(endDate);
  }
  if (shipName) {
    query += ' AND ship_name LIKE ?';
    params.push(`%${shipName}%`);
  }
  query += ' ORDER BY arrival_date DESC';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.get('/:id', (req, res) => {
  db.get('SELECT * FROM berth_plans WHERE id = ?', [req.params.id], (err, plan) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!plan) return res.status(404).json({ error: 'Not found' });

    db.all('SELECT * FROM services WHERE berth_plan_id = ?', [req.params.id], (err, services) => {
      if (err) return res.status(500).json({ error: err.message });
      
      db.all('SELECT * FROM crew_changes WHERE berth_plan_id = ?', [req.params.id], (err, crewChanges) => {
        if (err) return res.status(500).json({ error: err.message });
        
        db.all('SELECT * FROM supplies WHERE berth_plan_id = ?', [req.params.id], (err, supplies) => {
          if (err) return res.status(500).json({ error: err.message });
          
          db.all('SELECT * FROM advance_payments WHERE berth_plan_id = ?', [req.params.id], (err, payments) => {
            if (err) return res.status(500).json({ error: err.message });
            
            db.all(`
              SELECT c.*, u.name as from_name 
              FROM communications c 
              LEFT JOIN users u ON c.from_user = u.id 
              WHERE c.related_type = 'berth' AND c.related_id = ? 
              ORDER BY c.created_at DESC
            `, [req.params.id], (err, communications) => {
              if (err) return res.status(500).json({ error: err.message });
              
              res.json({
                ...plan,
                services,
                crewChanges,
                supplies,
                payments,
                communications
              });
            });
          });
        });
      });
    });
  });
});

router.post('/', requireRole(ROLES.AGENT_MANAGER, ROLES.FIELD_COORDINATOR), (req, res) => {
  const { ship_name, arrival_date, departure_date, berth_number, purpose, agent_id } = req.body;

  db.get('SELECT id FROM ships WHERE name = ?', [ship_name], (err, ship) => {
    if (err) return res.status(500).json({ error: err.message });

    const insertPlan = (resolvedShipId) => {
      db.run(
        'INSERT INTO berth_plans (ship_id, ship_name, arrival_date, departure_date, berth_number, purpose, agent_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [resolvedShipId, ship_name, arrival_date, departure_date, berth_number, purpose, agent_id],
        function(err2) {
          if (err2) return res.status(500).json({ error: err2.message });
          res.status(201).json({ id: this.lastID });
        }
      );
    };

    if (ship) {
      insertPlan(ship.id);
    } else {
      db.run(
        'INSERT INTO ships (name) VALUES (?)',
        [ship_name],
        function(err3) {
          if (err3) return res.status(500).json({ error: err3.message });
          insertPlan(this.lastID);
        }
      );
    }
  });
});

router.put('/:id', requireRole(ROLES.AGENT_MANAGER, ROLES.FIELD_COORDINATOR), (req, res) => {
  const { arrival_date, departure_date, berth_number, status, purpose, agent_id } = req.body;
  
  db.run(
    'UPDATE berth_plans SET arrival_date = ?, departure_date = ?, berth_number = ?, status = ?, purpose = ?, agent_id = ? WHERE id = ?',
    [arrival_date, departure_date, berth_number, status, purpose, agent_id, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

router.post('/:id/services', requireRole(ROLES.AGENT_MANAGER, ROLES.FIELD_COORDINATOR), (req, res) => {
  const { type, title, description } = req.body;
  const berth_plan_id = req.params.id;
  
  db.run(
    'INSERT INTO services (berth_plan_id, type, title, description, requested_by) VALUES (?, ?, ?, ?, ?)',
    [berth_plan_id, type, title, description, req.user.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

router.post('/:id/communications', (req, res) => {
  const { subject, content, direction } = req.body;
  
  db.run(
    'INSERT INTO communications (related_type, related_id, from_user, subject, content, direction) VALUES (?, ?, ?, ?, ?, ?)',
    ['berth', req.params.id, req.user.id, subject, content, direction || 'internal'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

module.exports = router;
