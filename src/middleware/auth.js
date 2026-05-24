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

function checkProjectAccess(user, projectId) {
  if (!projectId) return { allowed: true };
  if (user.role === 'admin' || user.role === 'service') {
    return { allowed: true };
  }

  const db = getDB();
  const project = db.prepare(
    'SELECT supervisor_id, manager_id FROM projects WHERE id = ?'
  ).get(projectId);

  if (!project) {
    return { allowed: false, error: '项目不存在', status: 404 };
  }

  if (user.role === 'supervisor' && project.supervisor_id === user.id) {
    return { allowed: true };
  }

  if (user.role === 'manager' && project.manager_id === user.id) {
    return { allowed: true };
  }

  return { allowed: false, error: '无权访问此项目', status: 403 };
}

export function canAccessProject(req, res, next) {
  const user = req.user;
  const projectId = req.params.projectId || req.body.project_id || req.params.id;

  const result = checkProjectAccess(user, projectId);
  if (!result.allowed) {
    return res.status(result.status || 403).json({ error: result.error });
  }

  return next();
}

export function canAccessComplaint(req, res, next) {
  const user = req.user;
  const complaintId = req.params.id || req.params.complaintId;

  if (user.role === 'admin' || user.role === 'service') {
    return next();
  }

  const db = getDB();
  const complaint = db.prepare(`
    SELECT p.supervisor_id, p.manager_id, c.handler_id
    FROM complaints c
    LEFT JOIN projects p ON c.project_id = p.id
    WHERE c.id = ?
  `).get(complaintId);

  if (!complaint) {
    return res.status(404).json({ error: '客诉不存在' });
  }

  if (user.role === 'supervisor' && complaint.supervisor_id === user.id) {
    return next();
  }

  if (user.role === 'manager' && (complaint.manager_id === user.id || complaint.handler_id === user.id)) {
    return next();
  }

  return res.status(403).json({ error: '无权访问此客诉' });
}

export function canAccessMilestone(req, res, next) {
  const user = req.user;
  const milestoneId = req.params.id || req.params.milestoneId;

  if (user.role === 'admin' || user.role === 'service') {
    return next();
  }

  const db = getDB();
  const milestone = db.prepare(`
    SELECT p.supervisor_id, p.manager_id
    FROM milestones m
    LEFT JOIN projects p ON m.project_id = p.id
    WHERE m.id = ?
  `).get(milestoneId);

  if (!milestone) {
    return res.status(404).json({ error: '节点不存在' });
  }

  if (user.role === 'supervisor' && milestone.supervisor_id === user.id) {
    return next();
  }

  if (user.role === 'manager' && milestone.manager_id === user.id) {
    return next();
  }

  return res.status(403).json({ error: '无权访问此节点' });
}

export function canAccessConfirmation(req, res, next) {
  const user = req.user;
  const confirmationId = req.params.id;

  if (user.role === 'admin' || user.role === 'service') {
    return next();
  }

  const db = getDB();
  const conf = db.prepare('SELECT type, ref_id FROM confirmations WHERE id = ?').get(confirmationId);

  if (!conf) {
    return res.status(404).json({ error: '签认单不存在' });
  }

  let projectId = null;

  if (conf.type === 'complaint') {
    const result = db.prepare(`
      SELECT p.supervisor_id, p.manager_id, c.handler_id
      FROM complaints c
      LEFT JOIN projects p ON c.project_id = p.id
      WHERE c.id = ?
    `).get(conf.ref_id);

    if (!result) {
      return res.status(404).json({ error: '关联客诉不存在' });
    }

    if (user.role === 'supervisor' && result.supervisor_id === user.id) {
      return next();
    }
    if (user.role === 'manager' && (result.manager_id === user.id || result.handler_id === user.id)) {
      return next();
    }
  } else if (conf.type === 'milestone') {
    const result = db.prepare(`
      SELECT p.supervisor_id, p.manager_id
      FROM milestones m
      LEFT JOIN projects p ON m.project_id = p.id
      WHERE m.id = ?
    `).get(conf.ref_id);

    if (!result) {
      return res.status(404).json({ error: '关联节点不存在' });
    }

    if (user.role === 'supervisor' && result.supervisor_id === user.id) {
      return next();
    }
    if (user.role === 'manager' && result.manager_id === user.id) {
      return next();
    }
  } else if (conf.type === 'cost' || conf.type === 'change') {
    const project = db.prepare(
      'SELECT supervisor_id, manager_id FROM projects WHERE id = ?'
    ).get(conf.ref_id);

    if (!project) {
      return res.status(404).json({ error: '关联项目不存在' });
    }

    if (user.role === 'supervisor' && project.supervisor_id === user.id) {
      return next();
    }
    if (user.role === 'manager' && project.manager_id === user.id) {
      return next();
    }
  }

  return res.status(403).json({ error: '无权访问此签认单' });
}

export function canAccessConfirmationByRef(req, res, next) {
  const user = req.user;
  const type = req.params.type;
  const refId = req.params.refId;

  if (user.role === 'admin' || user.role === 'service') {
    return next();
  }

  const db = getDB();

  if (type === 'complaint') {
    const result = db.prepare(`
      SELECT p.supervisor_id, p.manager_id, c.handler_id
      FROM complaints c
      LEFT JOIN projects p ON c.project_id = p.id
      WHERE c.id = ?
    `).get(refId);

    if (!result) {
      return res.status(404).json({ error: '关联客诉不存在' });
    }

    if (user.role === 'supervisor' && result.supervisor_id === user.id) {
      return next();
    }
    if (user.role === 'manager' && (result.manager_id === user.id || result.handler_id === user.id)) {
      return next();
    }
  } else if (type === 'milestone') {
    const result = db.prepare(`
      SELECT p.supervisor_id, p.manager_id
      FROM milestones m
      LEFT JOIN projects p ON m.project_id = p.id
      WHERE m.id = ?
    `).get(refId);

    if (!result) {
      return res.status(404).json({ error: '关联节点不存在' });
    }

    if (user.role === 'supervisor' && result.supervisor_id === user.id) {
      return next();
    }
    if (user.role === 'manager' && result.manager_id === user.id) {
      return next();
    }
  } else if (type === 'cost' || type === 'change') {
    const project = db.prepare(
      'SELECT supervisor_id, manager_id FROM projects WHERE id = ?'
    ).get(refId);

    if (!project) {
      return res.status(404).json({ error: '关联项目不存在' });
    }

    if (user.role === 'supervisor' && project.supervisor_id === user.id) {
      return next();
    }
    if (user.role === 'manager' && project.manager_id === user.id) {
      return next();
    }
  }

  return res.status(403).json({ error: '无权访问此签认单' });
}

export default {
  authenticate,
  requirePermission,
  requireRole,
  canAccessProject,
  canAccessComplaint,
  canAccessMilestone,
  canAccessConfirmation,
  canAccessConfirmationByRef
};
