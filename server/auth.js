const jwt = require('jsonwebtoken');
const md5 = require('md5');

const SECRET_KEY = 'tea-inventory-system-secret-2024';

const ROLES = {
  MANAGER: 'manager',
  SALES: 'sales',
  WAREHOUSE: 'warehouse'
};

const ROLE_PERMISSIONS = {
  [ROLES.MANAGER]: ['*'],
  [ROLES.SALES]: [
    'dashboard:view',
    'product:view',
    'inventory:view',
    'stock_take:view',
    'loss_report:view',
    'loss_report:create'
  ],
  [ROLES.WAREHOUSE]: [
    'dashboard:view',
    'product:view',
    'inventory:view',
    'inventory:adjust',
    'stock_take:view',
    'stock_take:execute',
    'loss_report:view',
    'loss_report:create',
    'loss_report:review'
  ]
};

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name
    },
    SECRET_KEY,
    { expiresIn: '24h' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (e) {
    return null;
  }
}

function hashPassword(password) {
  return md5(password);
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: '认证令牌无效或已过期' });
  }

  req.user = decoded;
  next();
}

function roleMiddleware(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }
    
    if (allowedRoles.includes(req.user.role) || req.user.role === ROLES.MANAGER) {
      next();
    } else {
      res.status(403).json({ error: '权限不足' });
    }
  };
}

function permissionMiddleware(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    const permissions = ROLE_PERMISSIONS[req.user.role] || [];
    if (permissions.includes('*') || permissions.includes(permission)) {
      next();
    } else {
      res.status(403).json({ error: '权限不足' });
    }
  };
}

module.exports = {
  SECRET_KEY,
  ROLES,
  ROLE_PERMISSIONS,
  generateToken,
  verifyToken,
  hashPassword,
  authMiddleware,
  roleMiddleware,
  permissionMiddleware
};
