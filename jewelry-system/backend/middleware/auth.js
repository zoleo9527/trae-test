const jwt = require('jsonwebtoken');
const { db } = require('../database');

const JWT_SECRET = 'jewelry_system_secret_2024';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '无效的认证令牌' });
    }
    
    const dbUser = db.prepare('SELECT id, username, name, role, store_id FROM users WHERE id = ?').get(user.id);
    if (!dbUser) {
      return res.status(403).json({ error: '用户不存在' });
    }
    
    req.user = dbUser;
    next();
  });
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
}

function requireStoreAccess(req, res, next) {
  const storeId = req.params.storeId || req.body.store_id;
  if (storeId && req.user.store_id !== storeId && req.user.role !== 'admin') {
    return res.status(403).json({ error: '无此门店操作权限' });
  }
  next();
}

module.exports = { authenticateToken, requireRoles, requireStoreAccess, JWT_SECRET };
