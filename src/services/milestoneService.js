import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../config/database.js';
import audit from './auditService.js';
import { getProjectById } from './projectService.js';

const db = getDB();

const DEFAULT_MILESTONES = [
  { name: '开工交底', days: 0 },
  { name: '水电验收', days: 15 },
  { name: '泥木验收', days: 30 },
  { name: '油漆验收', days: 45 },
  { name: '竣工验收', days: 60 }
];

export function createMilestone(data, creatorId, req = null) {
  const id = uuidv4();

  const project = getProjectById(data.project_id);
  if (!project) {
    throw new Error('项目不存在');
  }

  const stmt = db.prepare(`
    INSERT INTO milestones (id, project_id, name, description, planned_date, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, data.project_id, data.name, data.description || null, data.planned_date || null, data.status || 'pending', creatorId);

  audit.log('create', 'milestone', id, creatorId, null, {
    projectId: data.project_id,
    name: data.name,
    plannedDate: data.planned_date
  }, req);

  return getMilestoneById(id);
}

export function createDefaultMilestones(projectId, startDate, creatorId, req = null) {
  const baseDate = new Date(startDate);
  const milestones = [];

  for (const tmpl of DEFAULT_MILESTONES) {
    const plannedDate = new Date(baseDate);
    plannedDate.setDate(plannedDate.getDate() + tmpl.days);
    
    const id = uuidv4();
    db.prepare(`
      INSERT INTO milestones (id, project_id, name, planned_date, status, created_by)
      VALUES (?, ?, ?, ?, 'pending', ?)
    `).run(id, projectId, tmpl.name, plannedDate.toISOString().split('T')[0], creatorId);

    audit.log('create', 'milestone', id, creatorId, null, {
      projectId,
      name: tmpl.name,
      plannedDate: plannedDate.toISOString().split('T')[0]
    }, req);

    milestones.push(getMilestoneById(id));
  }

  return milestones;
}

export function getMilestoneById(id) {
  return db.prepare(`
    SELECT m.*,
      p.name as project_name, p.project_no,
      c.name as creator_name
    FROM milestones m
    LEFT JOIN projects p ON m.project_id = p.id
    LEFT JOIN users c ON m.created_by = c.id
    WHERE m.id = ?
  `).get(id);
}

export function getMilestonesByProject(projectId) {
  return db.prepare(`
    SELECT m.*,
      c.name as creator_name
    FROM milestones m
    LEFT JOIN users c ON m.created_by = c.id
    WHERE m.project_id = ?
    ORDER BY m.planned_date
  `).all(projectId);
}

export function getMilestoneList(params = {}, user = null) {
  let sql = `
    SELECT m.*,
      p.name as project_name, p.project_no,
      c.name as creator_name
    FROM milestones m
    LEFT JOIN projects p ON m.project_id = p.id
    LEFT JOIN users c ON m.created_by = c.id
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

  if (params.project_id) {
    sql += ' AND m.project_id = ?';
    values.push(params.project_id);
  }
  if (params.status) {
    sql += ' AND m.status = ?';
    values.push(params.status);
  }

  sql += ' ORDER BY m.planned_date';

  if (params.limit) {
    sql += ' LIMIT ?';
    values.push(params.limit);
  }

  return db.prepare(sql).all(...values);
}

export function updateMilestone(id, updates, updaterId, req = null) {
  const oldMilestone = getMilestoneById(id);
  if (!oldMilestone) {
    throw new Error('节点不存在');
  }

  const fields = [];
  const values = [];

  const allowedFields = ['name', 'description', 'planned_date', 'actual_date', 'status'];
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      fields.push(`${field} = ?`);
      values.push(updates[field]);
    }
  }

  if (fields.length === 0) return oldMilestone;

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  db.prepare(`UPDATE milestones SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  const newMilestone = getMilestoneById(id);
  audit.log('update', 'milestone', id, updaterId, oldMilestone, newMilestone, req);

  return newMilestone;
}

export function completeMilestone(id, actualDate, completerId, req = null) {
  const oldMilestone = getMilestoneById(id);
  if (!oldMilestone) {
    throw new Error('节点不存在');
  }

  db.prepare(`
    UPDATE milestones 
    SET status = 'completed', actual_date = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(actualDate || new Date().toISOString().split('T')[0], id);

  const newMilestone = getMilestoneById(id);
  audit.log('complete', 'milestone', id, completerId,
    { status: oldMilestone.status, actual_date: oldMilestone.actual_date },
    { status: 'completed', actual_date: actualDate },
    req
  );

  return newMilestone;
}

export function checkDelayedMilestones() {
  const today = new Date().toISOString().split('T')[0];
  
  const delayed = db.prepare(`
    SELECT m.*, p.name as project_name, p.supervisor_id, p.manager_id
    FROM milestones m
    LEFT JOIN projects p ON m.project_id = p.id
    WHERE m.status IN ('pending', 'in_progress')
      AND m.planned_date < ?
  `).all(today);

  for (const m of delayed) {
    db.prepare("UPDATE milestones SET status = 'delayed', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(m.id);
  }

  return delayed;
}

export function getUpcomingMilestones(days = 7, user = null) {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + days);

  let sql = `
    SELECT m.*, p.name as project_name, p.project_no, p.address
    FROM milestones m
    LEFT JOIN projects p ON m.project_id = p.id
    WHERE m.status IN ('pending', 'in_progress')
      AND m.planned_date >= ?
      AND m.planned_date <= ?
  `;
  const values = [today.toISOString().split('T')[0], endDate.toISOString().split('T')[0]];

  if (user && user.role !== 'admin' && user.role !== 'service') {
    if (user.role === 'supervisor') {
      sql += ' AND p.supervisor_id = ?';
      values.push(user.id);
    } else if (user.role === 'manager') {
      sql += ' AND p.manager_id = ?';
      values.push(user.id);
    }
  }

  sql += ' ORDER BY m.planned_date';

  return db.prepare(sql).all(...values);
}

export default {
  createMilestone,
  createDefaultMilestones,
  getMilestoneById,
  getMilestonesByProject,
  getMilestoneList,
  updateMilestone,
  completeMilestone,
  checkDelayedMilestones,
  getUpcomingMilestones,
  DEFAULT_MILESTONES
};
