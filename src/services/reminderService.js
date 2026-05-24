import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../config/database.js';
import audit from './auditService.js';

const db = getDB();

export function createReminder(data, creatorId, req = null) {
  const id = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO reminders (id, milestone_id, complaint_id, type, title, content, remind_at, recipient_id, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.milestone_id || null,
    data.complaint_id || null,
    data.type,
    data.title,
    data.content,
    data.remind_at,
    data.recipient_id,
    creatorId
  );

  audit.log('create', 'reminder', id, creatorId, null, {
    type: data.type,
    title: data.title,
    recipientId: data.recipient_id
  }, req);

  return getReminderById(id);
}

export function createMilestoneReminder(milestone, recipientId, daysBefore = 1, creatorId = null, req = null) {
  const remindDate = new Date(milestone.planned_date);
  remindDate.setDate(remindDate.getDate() - daysBefore);

  return createReminder({
    milestone_id: milestone.id,
    type: 'milestone',
    title: `节点提醒：${milestone.name}`,
    content: `项目【${milestone.project_name}】的节点【${milestone.name}】计划于 ${milestone.planned_date} 完成，请提前准备验收。`,
    remind_at: remindDate.toISOString(),
    recipient_id: recipientId
  }, creatorId || recipientId, req);
}

export function createComplaintDeadlineReminder(complaint, recipientId, daysBefore = 1, creatorId = null, req = null) {
  if (!complaint.due_date) return null;

  const remindDate = new Date(complaint.due_date);
  remindDate.setDate(remindDate.getDate() - daysBefore);

  return createReminder({
    complaint_id: complaint.id,
    type: 'deadline',
    title: `客诉到期提醒：${complaint.title}`,
    content: `客诉【${complaint.complaint_no}】将于 ${complaint.due_date} 到期，请及时处理。\n当前状态：${complaint.status}`,
    remind_at: remindDate.toISOString(),
    recipient_id: recipientId
  }, creatorId || recipientId, req);
}

export function getReminderById(id) {
  return db.prepare(`
    SELECT r.*,
      u.name as recipient_name, u.role as recipient_role,
      c.name as creator_name,
      m.name as milestone_name,
      k.title as complaint_title, k.complaint_no
    FROM reminders r
    LEFT JOIN users u ON r.recipient_id = u.id
    LEFT JOIN users c ON r.created_by = c.id
    LEFT JOIN milestones m ON r.milestone_id = m.id
    LEFT JOIN complaints k ON r.complaint_id = k.id
    WHERE r.id = ?
  `).get(id);
}

export function getRemindersByRecipient(recipientId, params = {}) {
  let sql = `
    SELECT r.*,
      c.name as creator_name,
      m.name as milestone_name,
      k.title as complaint_title, k.complaint_no
    FROM reminders r
    LEFT JOIN users c ON r.created_by = c.id
    LEFT JOIN milestones m ON r.milestone_id = m.id
    LEFT JOIN complaints k ON r.complaint_id = k.id
    WHERE r.recipient_id = ?
  `;
  const values = [recipientId];

  if (params.is_sent !== undefined) {
    sql += ' AND r.is_sent = ?';
    values.push(params.is_sent ? 1 : 0);
  }
  if (params.type) {
    sql += ' AND r.type = ?';
    values.push(params.type);
  }

  sql += ' ORDER BY r.remind_at DESC';

  if (params.limit) {
    sql += ' LIMIT ?';
    values.push(params.limit);
  }

  return db.prepare(sql).all(...values);
}

export function getPendingReminders(limit = 50) {
  const now = new Date().toISOString();
  return db.prepare(`
    SELECT r.*,
      u.name as recipient_name, u.phone as recipient_phone, u.email as recipient_email,
      m.name as milestone_name, m.project_id,
      k.title as complaint_title, k.complaint_no
    FROM reminders r
    LEFT JOIN users u ON r.recipient_id = u.id
    LEFT JOIN milestones m ON r.milestone_id = m.id
    LEFT JOIN complaints k ON r.complaint_id = k.id
    WHERE r.is_sent = 0 AND r.remind_at <= ?
    ORDER BY r.remind_at
    LIMIT ?
  `).all(now, limit);
}

export function markAsSent(reminderId) {
  db.prepare('UPDATE reminders SET is_sent = 1 WHERE id = ?').run(reminderId);
  return getReminderById(reminderId);
}

export function processPendingReminders() {
  const reminders = getPendingReminders(100);
  const sent = [];

  for (const reminder of reminders) {
    console.log(`发送提醒给 ${reminder.recipient_name}: ${reminder.title}`);
    markAsSent(reminder.id);
    sent.push(reminder);
  }

  return sent;
}

export function getUpcomingReminders(recipientId, hours = 24) {
  const now = new Date();
  const end = new Date(now.getTime() + hours * 60 * 60 * 1000);

  return db.prepare(`
    SELECT r.*,
      c.name as creator_name,
      m.name as milestone_name,
      k.title as complaint_title, k.complaint_no
    FROM reminders r
    LEFT JOIN users c ON r.created_by = c.id
    LEFT JOIN milestones m ON r.milestone_id = m.id
    LEFT JOIN complaints k ON r.complaint_id = k.id
    WHERE r.recipient_id = ?
      AND r.is_sent = 0
      AND r.remind_at >= ?
      AND r.remind_at <= ?
    ORDER BY r.remind_at
  `).all(recipientId, now.toISOString(), end.toISOString());
}

export function deleteReminder(id, deleterId, req = null) {
  const reminder = getReminderById(id);
  if (!reminder) {
    throw new Error('提醒不存在');
  }

  db.prepare('DELETE FROM reminders WHERE id = ?').run(id);
  audit.log('delete', 'reminder', id, deleterId, reminder, null, req);

  return true;
}

export default {
  createReminder,
  createMilestoneReminder,
  createComplaintDeadlineReminder,
  getReminderById,
  getRemindersByRecipient,
  getPendingReminders,
  markAsSent,
  processPendingReminders,
  getUpcomingReminders,
  deleteReminder
};
