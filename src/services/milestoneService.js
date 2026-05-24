import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../config/database.js';
import audit from './auditService.js';
import { getProjectById } from './projectService.js';
import reminderService from './reminderService.js';

const db = getDB();

const DEFAULT_MILESTONES = [
  { name: '开工交底', days: 0 },
  { name: '水电验收', days: 15 },
  { name: '泥木验收', days: 30 },
  { name: '油漆验收', days: 45 },
  { name: '竣工验收', days: 60 }
];

function getMilestoneRecipients(projectId) {
  const project = getProjectById(projectId);
  const recipients = [];
  if (project?.supervisor_id) recipients.push(project.supervisor_id);
  if (project?.manager_id) recipients.push(project.manager_id);
  return recipients;
}

function upsertMilestoneReminder(milestone, creatorId, req = null) {
  if (!milestone.planned_date || ['completed'].includes(milestone.status)) {
    const existing = db.prepare(`
      SELECT id FROM reminders 
      WHERE milestone_id = ? AND type = 'milestone' AND is_sent = 0
    `).all(milestone.id);
    for (const r of existing) {
      reminderService.deleteReminder(r.id, creatorId, req);
    }
    return null;
  }

  const project = getProjectById(milestone.project_id);
  const recipients = getMilestoneRecipients(milestone.project_id);
  
  if (recipients.length === 0) return null;

  const plannedDate = new Date(milestone.planned_date);
  const remindAt = new Date(plannedDate);
  remindAt.setDate(remindAt.getDate() - 3);

  const statusText = milestone.status === 'delayed' ? '【已逾期】' : '';
  const content = `项目【${milestone.project_name}】的节点【${milestone.name}】计划于 ${milestone.planned_date} 完成${statusText}，请提前准备验收。\n当前状态：${milestone.status}`;

  const results = [];
  for (const recipientId of recipients) {
    const existing = db.prepare(`
      SELECT id FROM reminders 
      WHERE milestone_id = ? AND type = 'milestone' AND recipient_id = ?
    `).get(milestone.id, recipientId);

    if (existing) {
      db.prepare(`
        UPDATE reminders 
        SET remind_at = ?, title = ?, content = ?
        WHERE id = ?
      `).run(
        remindAt.toISOString(),
        `${statusText}节点提醒：${milestone.name}`,
        content,
        existing.id
      );
      results.push(reminderService.getReminderById(existing.id));
    } else {
      results.push(reminderService.createReminder({
        milestone_id: milestone.id,
        type: 'milestone',
        title: `${statusText}节点提醒：${milestone.name}`,
        content,
        remind_at: remindAt.toISOString(),
        recipient_id: recipientId
      }, creatorId, req));
    }
  }

  return results;
}

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

  const milestone = getMilestoneById(id);
  upsertMilestoneReminder(milestone, creatorId, req);

  return milestone;
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

    const milestone = getMilestoneById(id);
    upsertMilestoneReminder(milestone, creatorId, req);
    milestones.push(milestone);
  }

  return milestones;
}

export function getMilestoneById(id) {
  return db.prepare(`
    SELECT m.*,
      p.name as project_name, p.project_no, p.supervisor_id, p.manager_id,
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

  if (updates.planned_date !== undefined || updates.status !== undefined) {
    upsertMilestoneReminder(newMilestone, updaterId, req);
  }

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

  upsertMilestoneReminder(newMilestone, completerId, req);

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
    const milestone = getMilestoneById(m.id);
    upsertMilestoneReminder(milestone, m.supervisor_id || m.manager_id);
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

export function getMilestoneDetail(id) {
  const milestone = getMilestoneById(id);
  if (!milestone) return null;

  const reminders = db.prepare(`
    SELECT r.*, u.name as recipient_name, u.role as recipient_role
    FROM reminders r
    LEFT JOIN users u ON r.recipient_id = u.id
    WHERE r.milestone_id = ?
    ORDER BY r.created_at DESC
  `).all(id);

  const auditLogs = audit.getLogsByRef('milestone', id);

  return {
    milestone,
    reminders,
    auditLogs
  };
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
  getMilestoneDetail,
  DEFAULT_MILESTONES
};
