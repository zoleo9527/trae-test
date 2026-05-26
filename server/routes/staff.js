const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
  try {
    const staff = db.prepare('SELECT * FROM staff ORDER BY created_at DESC').all();
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const staff = db.prepare('SELECT * FROM staff WHERE id = ?').get(req.params.id);
    if (!staff) {
      return res.status(404).json({ error: '员工不存在' });
    }
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, role, phone } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();
    
    db.prepare(
      'INSERT INTO staff (id, name, role, phone, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, name, role, phone, now);
    
    res.status(201).json({ id, name, role, phone, created_at: now });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
