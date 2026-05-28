const express = require('express');
const router = express.Router();
const { all, get } = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const { role } = req.query;
    
    let whereClause = '1=1';
    let params = [];
    
    if (role) {
      whereClause = 'role = ?';
      params.push(role);
    }
    
    const users = await all(`
      SELECT id, username, name, role, department, created_at
      FROM users
      WHERE ${whereClause}
      ORDER BY name
    `, params);
    
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await get('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
