const express = require('express');
const { Book, Channel, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/books', async (req, res) => {
  try {
    const { status, page = 1, pageSize = 50 } = req.query;

    const where = {};
    if (status) where.status = status;

    const { count, rows } = await Book.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize)
    });

    res.json({ total: count, data: rows });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({ error: '获取图书列表失败' });
  }
});

router.get('/channels', async (req, res) => {
  try {
    const { type, status, page = 1, pageSize = 50 } = req.query;

    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const { count, rows } = await Channel.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize)
    });

    res.json({ total: count, data: rows });
  } catch (error) {
    console.error('Get channels error:', error);
    res.status(500).json({ error: '获取渠道列表失败' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const { role } = req.query;

    const where = {};
    if (role) where.role = role;

    const users = await User.findAll({
      where,
      attributes: ['id', 'username', 'name', 'role', 'email', 'phone'],
      order: [['name', 'ASC']]
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

module.exports = router;
