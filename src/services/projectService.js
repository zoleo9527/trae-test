import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../config/database.js';
import audit from './auditService.js';

const db = getDB();

export function createProject(data, creatorId, req = null) {
  const id = uuidv4();
  const projectNo = generateProjectNo();

  const stmt = db.prepare(`
    INSERT INTO projects (id, project_no, name, address, owner_name, owner_phone, supervisor_id, manager_id, status, start_date, expected_end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id, projectNo, data.name, data.address, data.owner_name, data.owner_phone,
    data.supervisor_id || null, data.manager_id || null,
    data.status || 'ongoing', data.start_date || null, data.expected_end_date || null
  );

  audit.log('create', 'project', id, creatorId, null, { projectNo, name: data.name }, req);

  return getProjectById(id);
}

function generateProjectNo() {
  const date = new Date();
  const prefix = `XM${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const count = db.prepare("SELECT COUNT(*) as count FROM projects WHERE project_no LIKE ?").get(`${prefix}%`).count;
  return `${prefix}${String(count + 1).padStart(4, '0')}`;
}

export function getProjectById(id) {
  return db.prepare(`
    SELECT p.*,
      s.name as supervisor_name, s.phone as supervisor_phone,
      m.name as manager_name, m.phone as manager_phone
    FROM projects p
    LEFT JOIN users s ON p.supervisor_id = s.id
    LEFT JOIN users m ON p.manager_id = m.id
    WHERE p.id = ?
  `).get(id);
}

export function getProjectList(params = {}, user = null) {
  let sql = `
    SELECT p.*,
      s.name as supervisor_name,
      m.name as manager_name,
      (SELECT COUNT(*) FROM complaints c WHERE c.project_id = p.id AND c.status != 'closed') as open_complaints,
      (SELECT COUNT(*) FROM milestones ml WHERE ml.project_id = p.id AND ml.status = 'delayed') as delayed_milestones
    FROM projects p
    LEFT JOIN users s ON p.supervisor_id = s.id
    LEFT JOIN users m ON p.manager_id = m.id
    WHERE 1=1
  `;
  const values = [];

  if (user && user.role !== 'admin' && user.role !== 'service') {
    if (user.role === 'supervisor') {
      sql += ' AND p.supervisor_id = ?';
      values.push(user.id);
    } else if (user.role === 'manager') {
      sql += ' AND p.manager_id = ?';
      values.push(user.id);
    }
  }

  if (params.status) {
    sql += ' AND p.status = ?';
    values.push(params.status);
  }

  if (params.keyword) {
    sql += ' AND (p.name LIKE ? OR p.project_no LIKE ? OR p.owner_name LIKE ?)';
    const kw = `%${params.keyword}%`;
    values.push(kw, kw, kw);
  }

  sql += ' ORDER BY p.created_at DESC';

  if (params.limit) {
    sql += ' LIMIT ?';
    values.push(params.limit);
  }

  return db.prepare(sql).all(...values);
}

export function updateProject(id, updates, updaterId, req = null) {
  const oldProject = getProjectById(id);
  if (!oldProject) {
    throw new Error('项目不存在');
  }

  const fields = [];
  const values = [];

  const allowedFields = ['name', 'address', 'owner_name', 'owner_phone', 'supervisor_id', 'manager_id', 'status', 'start_date', 'expected_end_date'];
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      fields.push(`${field} = ?`);
      values.push(updates[field]);
    }
  }

  if (fields.length === 0) return oldProject;

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  const newProject = getProjectById(id);
  audit.log('update', 'project', id, updaterId, oldProject, newProject, req);

  return newProject;
}

export function getProjectStats(user = null) {
  let whereClause = 'WHERE 1=1';
  const values = [];

  if (user && user.role !== 'admin' && user.role !== 'service') {
    if (user.role === 'supervisor') {
      whereClause += ' AND supervisor_id = ?';
      values.push(user.id);
    } else if (user.role === 'manager') {
      whereClause += ' AND manager_id = ?';
      values.push(user.id);
    }
  }

  const stats = db.prepare(`
    SELECT
      status,
      COUNT(*) as count
    FROM projects
    ${whereClause}
    GROUP BY status
  `).all(...values);

  const total = stats.reduce((sum, s) => sum + s.count, 0);

  return {
    total,
    byStatus: stats,
    ongoing: stats.find(s => s.status === 'ongoing')?.count || 0,
    completed: stats.find(s => s.status === 'completed')?.count || 0,
    pending: stats.find(s => s.status === 'pending')?.count || 0
  };
}

export function getProjectDetail(id) {
  const project = getProjectById(id);
  if (!project) return null;

  const complaints = db.prepare(`
    SELECT c.*, u.name as handler_name
    FROM complaints c
    LEFT JOIN users u ON c.handler_id = u.id
    WHERE c.project_id = ?
    ORDER BY c.created_at DESC
  `).all(id);

  const milestones = db.prepare(`
    SELECT * FROM milestones WHERE project_id = ? ORDER BY planned_date
  `).all(id);

  const auditLogs = db.prepare(`
    SELECT a.*, u.name as user_name, u.role as user_role
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE a.module = 'project' AND a.ref_id = ?
    ORDER BY a.created_at DESC
    LIMIT 50
  `).all(id);

  return {
    project,
    complaints,
    milestones,
    auditLogs
  };
}

export default { createProject, getProjectById, getProjectList, updateProject, getProjectStats, getProjectDetail };
