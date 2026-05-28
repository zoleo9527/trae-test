const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    bcrypt.compare(password, user.password, (err, isValid) => {
      if (err || !isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token = generateToken(user);
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          email: user.email,
          phone: user.phone,
        },
      });
    });
  });
});

router.post('/register', (req, res) => {
  const { username, password, name, role, email, phone } = req.body;

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    db.run(
      'INSERT INTO users (username, password, name, role, email, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hash, name, role, email, phone],
      function (err) {
        if (err) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(201).json({ id: this.lastID, username, name, role });
      }
    );
  });
});

router.get('/me', (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
