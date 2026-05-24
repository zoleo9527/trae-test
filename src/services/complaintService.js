import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../config/database.js';
import audit from './auditService.js';
import { getProjectById } from './projectService.js';

const db = getDB();

const STATUS_FLOW = {
  pending: ['assigned', 'closed'],
  assigned: ['processing', 'closed'],
  processing: ['verified', 'closed'],
  verified: ['completed', 'processing'],
  completed: ['closed'],
  closed: []
};

export function createComplaint(data, reporterId, req = null) {
  const id = uuidv4();
  const complaintNo = generateComplaintNo();

  const project = getProjectById(data.project_id);
  if (!project) {
    throw new Error('项目不存在');
  }

  const stmt = db.prepare(`
    INSERT INTO complaints (id, complaint_no, project_id, title, description, category, priority, reporter_id, handler_id, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id, complaintNo, data.project_id, data.title, data.description,
    data.category, data.priority || 'normal',
    reporterId, data.handler_id || null, data.due_date || null
  );

  audit.log('create', 'complaint', id, reporterId, null, {
    complaintNo,
    title: data.title,
    category: data.category,
    priority: data.priority || 'normal'
  }, req);

  recordVersion(id, 'status', null, 'pending', reporterId, '新建客诉');

  return getComplaintById(id);
}

function generateComplaintNo() {
  const date = new Date();
  const prefix = `KS${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const count = db.prepare("SELECT COUNT(*) as count FROM complaints WHERE complaint_no LIKE ?").get(`${prefix}%`).count;
  return `${prefix}${String(count + 1).padStart(4, '0')}`;
}

function recordVersion(complaintId, fieldName, oldValue, newValue, changedBy, reason = null) {
  if (oldValue === newValue) return;

  const versionStmt = db.prepare(`
    SELECT COALESCE(MAX(version), 0) + 1 as next_version
    FROM complaint_versions
    WHERE complaint_id = ?
  `);
  const { next_version } = versionStmt.get(complaintId);

  db.prepare(`
    INSERT INTO complaint_versions (complaint_id, version, field_name, old_value, new_value, changed_by, change_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(complaintId, next_version, fieldName, oldValue, newValue, changedBy, reason);
}

export function getComplaintById(id) {
  return db.prepare(`
    SELECT c.*,
      p.name as project_name, p.project_no, p.address as project_address,
      p.owner_name, p.owner_phone,
      r.name as reporter_name, r.role as reporter_role,
      h.name as handler_name, h.role as handler_role, h.phone as handler_phone
    FROM complaints c
    LEFT JOIN projects p ON c.project_id = p.id
    LEFT JOIN users r ON c.reporter_id = r.id
    LEFT JOIN users h ON c.handler_id = h.id
    WHERE c.id = ?
  `).get(id);
}

export function getComplaintList(params = {}, user = null) {
  let sql = `
    SELECT c.*,
      p.name as project_name, p.project_no,
      r.name as reporter_name,
      h.name as handler_name
    FROM complaints c
    LEFT JOIN projects p ON c.project_id = p.id
    LEFT JOIN users r ON c.reporter_id = r.id
    LEFT JOIN users h ON c.handler_id = h.id
    WHERE 1=1
  `;
  const values = [];

  if (user && user.role !== 'admin' && user.role !== 'service') {
    if (user.role === 'supervisor') {
      sql += ' AND p.supervisor_id = ?';
      values.push(user.id);
    } else if (user.role === 'manager') {
      sql += ' AND (c.handler_id = ? OR p.manager_id = ?)';
      values.push(user.id, user.id);
    }
  }

  if (params.project_id) {
    sql += ' AND c.project_id = ?';
    values.push(params.project_id);
  }
  if (params.status) {
    sql += ' AND c.status = ?';
    values.push(params.status);
  }
  if (params.category) {
    sql += ' AND c.category = ?';
    values.push(params.category);
  }
  if (params.priority) {
    sql += ' AND c.priority = ?';
    values.push(params.priority);
  }
  if (params.handler_id) {
    sql += ' AND c.handler_id = ?';
    values.push(params.handler_id);
  }
  if (params.keyword) {
    sql += ' AND (c.title LIKE ? OR c.complaint_no LIKE ?)';
    const kw = `%${params.keyword}%`;
    values.push(kw, kw);
  }

  sql += " ORDER BY CASE c.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END, c.created_at DESC";

  if (params.limit) {
    sql += ' LIMIT ?';
    values.push(params.limit);
  }

  return db.prepare(sql).all(...values);
}

export function updateComplaint(id, updates, updaterId, req = null, reason = null) {
  const oldComplaint = getComplaintById(id);
  if (!oldComplaint) {
    throw new Error('客诉不存在');
  }

  const fields = [];
  const values = [];

  const trackFields = ['title', 'description', 'category', 'priority', 'status', 'handler_id', 'due_date'];
  for (const field of trackFields) {
    if (updates[field] !== undefined && updates[field] !== oldComplaint[field]) {
      fields.push(`${field} = ?`);
      values.push(updates[field]);
      recordVersion(id, field, oldComplaint[field], updates[field], updaterId, reason);
    }
  }

  if (fields.length === 0) return oldComplaint;

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  db.prepare(`UPDATE complaints SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  const newComplaint = getComplaintById(id);
  audit.log('update', 'complaint', id, updaterId, oldComplaint, newComplaint, req);

  return newComplaint;
}

export function updateStatus(id, newStatus, updaterId, req = null, reason = null) {
  const oldComplaint = getComplaintById(id);
  if (!oldComplaint) {
    throw new Error('客诉不存在');
  }

  const allowedTransitions = STATUS_FLOW[oldComplaint.status] || [];
  if (!allowedTransitions.includes(newStatus)) {
    throw new Error(`状态不能从 ${oldComplaint.status} 转换为 ${newStatus}`);
  }

  db.prepare('UPDATE complaints SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, id);

  recordVersion(id, 'status', oldComplaint.status, newStatus, updaterId, reason);

  const newComplaint = getComplaintById(id);
  audit.log('status_change', 'complaint', id, updaterId,
    { status: oldComplaint.status },
    { status: newStatus, reason },
    req
  );

  return newComplaint;
}

export function assignHandler(id, handlerId, assignerId, req = null, reason = null) {
  const oldComplaint = getComplaintById(id);
  if (!oldComplaint) {
    throw new Error('客诉不存在');
  }

  db.prepare('UPDATE complaints SET handler_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(handlerId, 'assigned', id);

  recordVersion(id, 'handler_id', oldComplaint.handler_id, handlerId, assignerId, reason);
  recordVersion(id, 'status', oldComplaint.status, 'assigned', assignerId, '分配处理人');

  const newComplaint = getComplaintById(id);
  audit.log('assign', 'complaint', id, assignerId,
    { handler_id: oldComplaint.handler_id, status: oldComplaint.status },
    { handler_id: handlerId, status: 'assigned' },
    req
  );

  return newComplaint;
}

export function addComment(complaintId, userId, content, attachments = null, req = null) {
  const stmt = db.prepare(`
    INSERT INTO complaint_comments (complaint_id, user_id, content, attachments)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(complaintId, userId, content, attachments ? JSON.stringify(attachments) : null);

  audit.log('comment', 'complaint', complaintId, userId, null, { content: content.substring(0, 50) }, req);

  return db.prepare(`
    SELECT cc.*, u.name as user_name, u.role as user_role
    FROM complaint_comments cc
    LEFT JOIN users u ON cc.user_id = u.id
    WHERE cc.id = ?
  `).get(result.lastInsertRowid);
}

export function getComments(complaintId) {
  return db.prepare(`
    SELECT cc.*, u.name as user_name, u.role as user_role
    FROM complaint_comments cc
    LEFT JOIN users u ON cc.user_id = u.id
    WHERE cc.complaint_id = ?
    ORDER BY cc.created_at DESC
  `).all(complaintId);
}

export function getVersionHistory(complaintId) {
  return db.prepare(`
    SELECT cv.*, u.name as changed_by_name, u.role as changed_by_role
    FROM complaint_versions cv
    LEFT JOIN users u ON cv.changed_by = u.id
    WHERE cv.complaint_id = ?
    ORDER BY cv.version DESC, cv.changed_at DESC
  `).all(complaintId);
}

export function getComplaintDetail(id) {
  const complaint = getComplaintById(id);
  if (!complaint) return null;

  const comments = getComments(id);
  const versions = getVersionHistory(id);
  const auditLogs = audit.getLogsByRef('complaint', id);

  return {
    complaint,
    comments,
    versions,
    auditLogs
  };
}

export function getComplaintStats(user = null) {
  let whereClause = 'WHERE 1=1';
  const values = [];

  if (user && user.role !== 'admin' && user.role !== 'service') {
    if (user.role === 'supervisor') {
      whereClause = `
        LEFT JOIN projects p ON c.project_id = p.id
        WHERE p.supervisor_id = ?
      `;
      values.push(user.id);
    } else if (user.role === 'manager') {
      whereClause = 'WHERE c.handler_id = ?';
      values.push(user.id);
    }
  }

  const statusStats = db.prepare(`
    SELECT c.status, COUNT(*) as count
    FROM complaints c
    ${whereClause}
    GROUP BY c.status
  `).all(...values);

  const priorityStats = db.prepare(`
    SELECT c.priority, COUNT(*) as count
    FROM complaints c
    ${whereClause}
    GROUP BY c.priority
  `).all(...values);

  const categoryStats = db.prepare(`
    SELECT c.category, COUNT(*) as count
    FROM complaints c
    ${whereClause}
    GROUP BY c.category
  `).all(...values);

  const total = statusStats.reduce((sum, s) => sum + s.count, 0);
  const open = statusStats.filter(s => !['completed', 'closed'].includes(s.status)).reduce((sum, s) => sum + s.count, 0);

  return {
    total,
    open,
    completed: statusStats.find(s => s.status === 'completed')?.count || 0,
    closed: statusStats.find(s => s.status === 'closed')?.count || 0,
    byStatus: statusStats,
    byPriority: priorityStats,
    byCategory: categoryStats
  };
}

export default {
  createComplaint,
  getComplaintById,
  getComplaintList,
  updateComplaint,
  updateStatus,
  assignHandler,
  addComment,
  getComments,
  getVersionHistory,
  getComplaintDetail,
  getComplaintStats,
  STATUS_FLOW
};
