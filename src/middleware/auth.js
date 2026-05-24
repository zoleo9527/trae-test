import jwt from 'jsonwebtoken';
import { getDB } from '../config/database.js';

const ROLE_PERMISSIONS = {
  admin: ['*'],
  supervisor: [
    'project:view', 'project:update',
    'complaint:view', 'complaint:create', 'complaint:update', 'complaint:assign',
    'milestone:view', 'milestone:create', 'milestone:update',
    'reminder:view', 'reminder:create',
    'confirmation:view', 'confirmation:confirm',
    'audit:view'
  ],
  manager: [
    'project:view',
    'complaint:view', 'complaint:create', 'complaint:update', 'complaint:process',
    'milestone:view',
    'reminder:view',
    'confirmation:view', 'confirmation:confirm',
    'audit:view'
  ],
  service: [
    'project:view',
    'complaint:view', 'complaint:create',
    'milestone:view',
    'reminder:view',
    'audit:view'
  ]
};

export function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDB();
    const user = db.prepare('SELECT id, username, name, role, phone, email FROM users WHERE id = ?').get(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: '无效的认证令牌' });
  }
}

export function requirePermission(permission) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: '未认证' });
    }

    const permissions = ROLE_PERMISSIONS[user.role] || [];
    if (permissions.includes('*') || permissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({ error: '权限不足' });
  };
}

export function requireRole(...roles) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: '未认证' });
    }

    if (roles.includes(user.role)) {
      return next();
    }

    return res.status(403).json({ error: '角色权限不足' });
  };
}

export function canAccessProject(req, res, next) {
  const user = req.user;
  const projectId = req.params.projectId || req.body.project_id;

  if (!projectId) {
    return next();
  }

  if (user.role === 'admin' || user.role === 'service') {
    return next();
  }

  const db = getDB();
  const project = db.prepare(
    'SELECT supervisor_id, manager_id FROM projects WHERE id = ?'
  ).get(projectId);

  if (!project) {
    return res.status(404).json({ error: '项目不存在' });
  }

  if (user.role === 'supervisor' && project.supervisor_id === user.id) {
    return next();
  }

  if (user.role === 'manager' && project.manager_id === user.id) {
    return next();
  }

  return res.status(403).json({ error: '无权访问此项目' });
}

export default { authenticate, requirePermission, requireRole, canAccessProject };
