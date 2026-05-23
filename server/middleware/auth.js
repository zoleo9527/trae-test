const jwt = require('jsonwebtoken');

const JWT_SECRET = 'pv-ops-secret-key-2024';

const roles = {
  STATION_MANAGER: 'station_manager',
  ENGINEER: 'engineer',
  ADMIN_STAFF: 'admin_staff',
};

const rolePermissions = {
  [roles.STATION_MANAGER]: ['*'],
  [roles.ENGINEER]: ['work_order:view', 'work_order:edit', 'spare_parts:view', 'spare_parts:request', 'power_data:view'],
  [roles.ADMIN_STAFF]: ['grid_docs:*', 'payment:*', 'work_order:view', 'spare_parts:view', 'reports:*'],
};

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '令牌无效或已过期' });
    }
    req.user = user;
    next();
  });
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
}

function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role,
      name: user.name,
      stationId: user.stationId 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

module.exports = {
  authenticateToken,
  requireRole,
  generateToken,
  roles,
  rolePermissions,
  JWT_SECRET,
};
