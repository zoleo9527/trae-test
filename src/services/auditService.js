import { getDB } from '../config/database.js';

const db = getDB();

const logAction = db.prepare(`
  INSERT INTO audit_logs (action, module, ref_id, user_id, old_value, new_value, ip_address, user_agent)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

export function log(action, module, refId, userId, oldValue = null, newValue = null, req = null) {
  const ip = req?.ip || req?.connection?.remoteAddress || null;
  const userAgent = req?.headers?.['user-agent'] || null;
  
  logAction.run(
    action,
    module,
    refId,
    userId,
    oldValue ? JSON.stringify(oldValue) : null,
    newValue ? JSON.stringify(newValue) : null,
    ip,
    userAgent
  );
}

export function getLogsByRef(module, refId, limit = 100) {
  return db.prepare(`
    SELECT a.*, u.name as user_name, u.role as user_role
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE a.module = ? AND a.ref_id = ?
    ORDER BY a.created_at DESC
    LIMIT ?
  `).all(module, refId, limit);
}

export function getLogsByUser(userId, limit = 100) {
  return db.prepare(`
    SELECT a.*, u.name as user_name
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE a.user_id = ?
    ORDER BY a.created_at DESC
    LIMIT ?
  `).all(userId, limit);
}

export function getLogsByModule(module, limit = 100) {
  return db.prepare(`
    SELECT a.*, u.name as user_name, u.role as user_role
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE a.module = ?
    ORDER BY a.created_at DESC
    LIMIT ?
  `).all(module, limit);
}

export function searchLogs(params = {}, limit = 100) {
  let sql = `
    SELECT a.*, u.name as user_name, u.role as user_role
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE 1=1
  `;
  const values = [];

  if (params.module) {
    sql += ' AND a.module = ?';
    values.push(params.module);
  }
  if (params.action) {
    sql += ' AND a.action = ?';
    values.push(params.action);
  }
  if (params.userId) {
    sql += ' AND a.user_id = ?';
    values.push(params.userId);
  }
  if (params.startDate) {
    sql += ' AND a.created_at >= ?';
    values.push(params.startDate);
  }
  if (params.endDate) {
    sql += ' AND a.created_at <= ?';
    values.push(params.endDate);
  }

  sql += ' ORDER BY a.created_at DESC LIMIT ?';
  values.push(limit);

  return db.prepare(sql).all(...values);
}

export default { log, getLogsByRef, getLogsByUser, getLogsByModule, searchLogs };
