import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../config/database.js';
import audit from './auditService.js';

const db = getDB();

function getNextVersion(type, refId) {
  const result = db.prepare(`
    SELECT COALESCE(MAX(version), 0) + 1 as next_version
    FROM confirmations
    WHERE type = ? AND ref_id = ?
  `).get(type, refId);
  return result.next_version;
}

function getProjectIdByRef(type, refId) {
  if (type === 'complaint') {
    const result = db.prepare('SELECT project_id FROM complaints WHERE id = ?').get(refId);
    return result?.project_id;
  } else if (type === 'milestone') {
    const result = db.prepare('SELECT project_id FROM milestones WHERE id = ?').get(refId);
    return result?.project_id;
  } else if (type === 'cost' || type === 'change') {
    return refId;
  }
  return null;
}

export function canAccessConfirmationRef(type, refId, user) {
  if (!type || !refId) return false;
  if (user.role === 'admin' || user.role === 'service') return true;

  const projectId = getProjectIdByRef(type, refId);
  if (!projectId) return false;

  const project = db.prepare(
    'SELECT supervisor_id, manager_id FROM projects WHERE id = ?'
  ).get(projectId);

  if (!project) return false;

  if (user.role === 'supervisor' && project.supervisor_id === user.id) {
    return true;
  }
  if (user.role === 'manager' && project.manager_id === user.id) {
    return true;
  }

  return false;
}

export function createConfirmation(data, creatorId, req = null) {
  const id = uuidv4();

  if (!data.type || !data.ref_id) {
    throw new Error('type 和 ref_id 不能为空');
  }

  const nextVersion = getNextVersion(data.type, data.ref_id);

  const stmt = db.prepare(`
    INSERT INTO confirmations (id, type, ref_id, title, content, version, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, data.type, data.ref_id, data.title, data.content || null, nextVersion, creatorId);

  audit.log('create', 'confirmation', id, creatorId, null, {
    type: data.type,
    refId: data.ref_id,
    title: data.title,
    version: nextVersion
  }, req);

  return getConfirmationById(id);
}

export function createNewVersion(type, refId, data, creatorId, req = null) {
  if (!type || !refId) {
    throw new Error('type 和 ref_id 不能为空');
  }

  const oldConf = getLatestConfirmation(type, refId);
  const currentVersion = oldConf ? oldConf.version : 0;
  const nextVersion = currentVersion + 1;
  const id = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO confirmations (id, type, ref_id, title, content, version, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    type,
    refId,
    data.title || oldConf?.title,
    data.content || null,
    nextVersion,
    creatorId
  );

  audit.log('new_version', 'confirmation', id, creatorId,
    { type, refId, version: currentVersion },
    { type, refId, version: nextVersion },
    req
  );

  return getConfirmationById(id);
}

export function getConfirmationById(id) {
  return db.prepare(`
    SELECT c.*,
      u.name as confirmer_name,
      cr.name as creator_name
    FROM confirmations c
    LEFT JOIN users u ON c.confirmer_id = u.id
    LEFT JOIN users cr ON c.created_by = cr.id
    WHERE c.id = ?
  `).get(id);
}

export function getConfirmationsByRef(type, refId) {
  return db.prepare(`
    SELECT c.*,
      u.name as confirmer_name,
      cr.name as creator_name
    FROM confirmations c
    LEFT JOIN users u ON c.confirmer_id = u.id
    LEFT JOIN users cr ON c.created_by = cr.id
    WHERE c.type = ? AND c.ref_id = ?
    ORDER BY c.version DESC
  `).all(type, refId);
}

export function getLatestConfirmation(type, refId) {
  return db.prepare(`
    SELECT c.*,
      u.name as confirmer_name,
      cr.name as creator_name
    FROM confirmations c
    LEFT JOIN users u ON c.confirmer_id = u.id
    LEFT JOIN users cr ON c.created_by = cr.id
    WHERE c.type = ? AND c.ref_id = ?
    ORDER BY c.version DESC
    LIMIT 1
  `).get(type, refId);
}

export function getConfirmationList(params = {}, user = null) {
  let sql = `
    SELECT c.*,
      u.name as confirmer_name,
      cr.name as creator_name
    FROM confirmations c
    LEFT JOIN users u ON c.confirmer_id = u.id
    LEFT JOIN users cr ON c.created_by = cr.id
    WHERE 1=1
  `;
  const values = [];

  if (user && user.role !== 'admin' && user.role !== 'service') {
    if (user.role === 'supervisor') {
      sql += ` AND (
        (c.type = 'complaint' AND EXISTS (SELECT 1 FROM complaints k LEFT JOIN projects p ON k.project_id = p.id WHERE k.id = c.ref_id AND p.supervisor_id = ?))
        OR (c.type = 'milestone' AND EXISTS (SELECT 1 FROM milestones m LEFT JOIN projects p ON m.project_id = p.id WHERE m.id = c.ref_id AND p.supervisor_id = ?))
        OR (c.type IN ('cost', 'change') AND EXISTS (SELECT 1 FROM projects p WHERE p.id = c.ref_id AND p.supervisor_id = ?))
      )`;
      values.push(user.id, user.id, user.id);
    } else if (user.role === 'manager') {
      sql += ` AND (
        (c.type = 'complaint' AND EXISTS (SELECT 1 FROM complaints k LEFT JOIN projects p ON k.project_id = p.id WHERE k.id = c.ref_id AND p.manager_id = ?))
        OR (c.type = 'milestone' AND EXISTS (SELECT 1 FROM milestones m LEFT JOIN projects p ON m.project_id = p.id WHERE m.id = c.ref_id AND p.manager_id = ?))
        OR (c.type IN ('cost', 'change') AND EXISTS (SELECT 1 FROM projects p WHERE p.id = c.ref_id AND p.manager_id = ?))
      )`;
      values.push(user.id, user.id, user.id);
    }
  }

  if (params.type) {
    sql += ' AND c.type = ?';
    values.push(params.type);
  }
  if (params.status) {
    sql += ' AND c.status = ?';
    values.push(params.status);
  }
  if (params.ref_id) {
    sql += ' AND c.ref_id = ?';
    values.push(params.ref_id);
  }

  sql += ' ORDER BY c.created_at DESC';

  if (params.limit) {
    sql += ' LIMIT ?';
    values.push(params.limit);
  }

  return db.prepare(sql).all(...values);
}

export function confirm(id, confirmerId, req = null) {
  const oldConf = getConfirmationById(id);
  if (!oldConf) {
    throw new Error('签认单不存在');
  }
  if (oldConf.status !== 'pending') {
    throw new Error('只能签认待确认的签认单');
  }

  db.prepare(`
    UPDATE confirmations 
    SET status = 'confirmed', confirmer_id = ?, confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(confirmerId, id);

  const newConf = getConfirmationById(id);
  audit.log('confirm', 'confirmation', id, confirmerId,
    { status: oldConf.status, type: oldConf.type, refId: oldConf.ref_id, version: oldConf.version },
    { status: 'confirmed', confirmerId },
    req
  );

  return newConf;
}

export function reject(id, confirmerId, reason = null, req = null) {
  const oldConf = getConfirmationById(id);
  if (!oldConf) {
    throw new Error('签认单不存在');
  }
  if (oldConf.status !== 'pending') {
    throw new Error('只能拒绝待确认的签认单');
  }

  db.prepare(`
    UPDATE confirmations 
    SET status = 'rejected', confirmer_id = ?, confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(confirmerId, id);

  const newConf = getConfirmationById(id);
  audit.log('reject', 'confirmation', id, confirmerId,
    { status: oldConf.status, type: oldConf.type, refId: oldConf.ref_id, version: oldConf.version, reason },
    { status: 'rejected', confirmerId },
    req
  );

  return newConf;
}

export function getVersionHistory(type, refId) {
  return db.prepare(`
    SELECT c.*,
      u.name as confirmer_name,
      cr.name as creator_name
    FROM confirmations c
    LEFT JOIN users u ON c.confirmer_id = u.id
    LEFT JOIN users cr ON c.created_by = cr.id
    WHERE c.type = ? AND c.ref_id = ?
    ORDER BY c.version
  `).all(type, refId);
}

export default {
  createConfirmation,
  createNewVersion,
  getConfirmationById,
  getConfirmationsByRef,
  getLatestConfirmation,
  getConfirmationList,
  confirm,
  reject,
  getVersionHistory,
  canAccessConfirmationRef
};
