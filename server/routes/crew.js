const express = require('express');
const db = require('../database');
const { ROLES, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { status, berth_plan_id, documents_status } = req.query;
  let query = `
    SELECT cc.*, bp.ship_name, bp.arrival_date
    FROM crew_changes cc
    LEFT JOIN berth_plans bp ON cc.berth_plan_id = bp.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND cc.status = ?';
    params.push(status);
  }
  if (berth_plan_id) {
    query += ' AND cc.berth_plan_id = ?';
    params.push(berth_plan_id);
  }
  if (documents_status) {
    query += ' AND cc.documents_status = ?';
    params.push(documents_status);
  }
  query += ' ORDER BY cc.id DESC';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/', requireRole(ROLES.FIELD_COORDINATOR), (req, res) => {
  const { berth_plan_id, service_id, type, crew_name, rank, nationality, arrival_flight, departure_flight, visa_expiry, notes } = req.body;
  
  db.run(
    'INSERT INTO crew_changes (berth_plan_id, service_id, type, crew_name, rank, nationality, arrival_flight, departure_flight, visa_expiry, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [berth_plan_id, service_id, type, crew_name, rank, nationality, arrival_flight, departure_flight, visa_expiry, notes],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      if (visa_expiry) {
        db.run(
          'INSERT INTO alerts (type, title, description, related_type, related_id, priority, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
          ['document', `签证到期提醒: ${crew_name}`, `${rank} 的签证将于 ${visa_expiry} 到期`, 'crew', this.lastID, 'high', visa_expiry]
        );
      }
      
      res.status(201).json({ id: this.lastID });
    }
  );
});

router.put('/:id', requireRole(ROLES.FIELD_COORDINATOR, ROLES.DOCUMENT_SPECIALIST), (req, res) => {
  const { status, documents_status, notes } = req.body;

  db.run(
    'UPDATE crew_changes SET status = ?, documents_status = ?, notes = ? WHERE id = ?',
    [status, documents_status, notes, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });

      if (documents_status === 'approved') {
        db.run(
          "UPDATE alerts SET status = 'resolved' WHERE related_type = 'crew' AND related_id = ? AND type = 'document' AND status = 'pending'",
          [req.params.id],
          (alertErr) => {
            if (alertErr) console.error('Alert update failed:', alertErr);
          }
        );
      }

      res.json({ updated: this.changes });
    }
  );
});

module.exports = router;
