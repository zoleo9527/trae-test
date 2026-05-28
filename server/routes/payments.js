const express = require('express');
const db = require('../database');
const { ROLES, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { status, berth_plan_id, supplier, overdue } = req.query;
  let query = `
    SELECT ap.*, 
           bp.ship_name, 
           bp.arrival_date,
           (SELECT SUM(amount) FROM collections WHERE advance_payment_id = ap.id) as collected_amount
    FROM advance_payments ap
    LEFT JOIN berth_plans bp ON ap.berth_plan_id = bp.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND ap.status = ?';
    params.push(status);
  }
  if (berth_plan_id) {
    query += ' AND ap.berth_plan_id = ?';
    params.push(berth_plan_id);
  }
  if (supplier) {
    query += ' AND ap.supplier LIKE ?';
    params.push(`%${supplier}%`);
  }
  if (overdue === 'true') {
    query += ' AND ap.due_date < DATE() AND ap.status != "settled"';
  }
  query += ' ORDER BY ap.created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const results = rows.map(row => ({
      ...row,
      collected_amount: row.collected_amount || 0,
      remaining_amount: row.amount - (row.collected_amount || 0)
    }));
    
    res.json(results);
  });
});

router.get('/:id', (req, res) => {
  db.get(`
    SELECT ap.*, bp.ship_name
    FROM advance_payments ap
    LEFT JOIN berth_plans bp ON ap.berth_plan_id = bp.id
    WHERE ap.id = ?
  `, [req.params.id], (err, payment) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!payment) return res.status(404).json({ error: 'Not found' });

    db.all('SELECT * FROM collections WHERE advance_payment_id = ? ORDER BY received_date DESC', [req.params.id], (err, collections) => {
      if (err) return res.status(500).json({ error: err.message });
      
      db.all(`
        SELECT c.*, u.name as from_name 
        FROM communications c 
        LEFT JOIN users u ON c.from_user = u.id 
        WHERE c.related_type = 'payment' AND c.related_id = ? 
        ORDER BY c.created_at DESC
      `, [req.params.id], (err, communications) => {
        if (err) return res.status(500).json({ error: err.message });
        
        res.json({
          ...payment,
          collections,
          communications
        });
      });
    });
  });
});

router.post('/', requireRole(ROLES.AGENT_MANAGER), (req, res) => {
  const { berth_plan_id, service_id, invoice_number, supplier, amount, currency, description, due_date } = req.body;
  
  db.run(
    'INSERT INTO advance_payments (berth_plan_id, service_id, invoice_number, supplier, amount, currency, description, due_date, paid_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [berth_plan_id, service_id, invoice_number, supplier, amount, currency || 'CNY', description, due_date, req.user.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      db.run(
        'INSERT INTO alerts (type, title, description, related_type, related_id, priority, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['payment', `垫付到期提醒: ${supplier}`, `${amount} ${currency} 将于 ${due_date} 到期`, 'payment', this.lastID, 'high', due_date],
        (alertErr) => {
          if (alertErr) console.error('Alert creation failed:', alertErr);
        }
      );
      
      res.status(201).json({ id: this.lastID });
    }
  );
});

router.put('/:id', requireRole(ROLES.AGENT_MANAGER), (req, res) => {
  const { status, paid_date } = req.body;
  
  db.run(
    'UPDATE advance_payments SET status = ?, paid_date = ? WHERE id = ?',
    [status, paid_date, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

router.post('/:id/collections', requireRole(ROLES.AGENT_MANAGER, ROLES.DOCUMENT_SPECIALIST), (req, res) => {
  const { amount, received_date, payer, payment_method, reference_number, notes } = req.body;
  
  db.run(
    'INSERT INTO collections (advance_payment_id, amount, received_date, payer, payment_method, reference_number, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [req.params.id, amount, received_date, payer, payment_method, reference_number, notes, 'confirmed'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      db.get('SELECT * FROM advance_payments WHERE id = ?', [req.params.id], (err, payment) => {
        if (err) return;
        
        db.get('SELECT SUM(amount) as total FROM collections WHERE advance_payment_id = ?', [req.params.id], (err, result) => {
          if (err) return;
          
          if (result.total >= payment.amount) {
            db.run('UPDATE advance_payments SET status = "settled" WHERE id = ?', [req.params.id]);
          }
        });
      });
      
      res.status(201).json({ id: this.lastID });
    }
  );
});

router.post('/:id/communications', requireRole(ROLES.AGENT_MANAGER, ROLES.DOCUMENT_SPECIALIST), (req, res) => {
  const { subject, content, direction } = req.body;
  
  db.run(
    'INSERT INTO communications (related_type, related_id, from_user, subject, content, direction) VALUES (?, ?, ?, ?, ?, ?)',
    ['payment', req.params.id, req.user.id, subject, content, direction || 'internal'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

module.exports = router;
