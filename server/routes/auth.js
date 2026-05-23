const express = require('express');
const { generateToken, authenticateToken, roles } = require('../middleware/auth');
const { users } = require('../data/database');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = generateToken(user);

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      roleName: user.roleName,
      stationId: user.stationId,
      stationName: user.stationName,
      avatar: user.avatar,
      phone: user.phone,
    },
  });
});

router.post('/logout', (req, res) => {
  res.json({ message: '退出登录成功' });
});

router.get('/profile', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.json({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    roleName: user.roleName,
    stationId: user.stationId,
    stationName: user.stationName,
    avatar: user.avatar,
    phone: user.phone,
    skills: user.skills,
  });
});

router.get('/users', authenticateToken, (req, res) => {
  const userList = users.map(u => ({
    id: u.id,
    name: u.name,
    role: u.role,
    roleName: u.roleName,
    avatar: u.avatar,
    phone: u.phone,
    skills: u.skills,
  }));
  res.json(userList);
});

router.get('/engineers', authenticateToken, (req, res) => {
  const engineers = users
    .filter(u => u.role === roles.ENGINEER)
    .map(u => ({
      id: u.id,
      name: u.name,
      role: u.role,
      roleName: u.roleName,
      avatar: u.avatar,
      phone: u.phone,
      skills: u.skills,
    }));
  res.json(engineers);
});

module.exports = router;
