const { db } = require('../db')
const config = require('../config')
const { v4: uuidv4 } = require('uuid')
const { ValidationError, NotFoundError, StateConflictError, PermissionError } = require('../errors')

function validateAppointmentInput(data) {
  const errors = {}
  if (!data.customer_id) errors.customer_id = '客户ID必填'
  if (!data.store_id) errors.store_id = '门店ID必填'
  if (!data.scheduled_date) errors.scheduled_date = '预约日期必填'
  if (!data.scheduled_time) errors.scheduled_time = '预约时间必填'
  if (data.priority && !Object.values(config.priority).includes(data.priority)) {
    errors.priority = '优先级非法'
  }
  return Object.keys(errors).length > 0 ? errors : null
}

function listAppointments(filters = {}) {
  const where = []
  const params = []
  if (filters.store_id) { where.push('a.store_id = ?'); params.push(filters.store_id) }
  if (filters.status) { where.push('a.status = ?'); params.push(filters.status) }
  if (filters.optician_id) { where.push('a.optician_id = ?'); params.push(filters.optician_id) }
  if (filters.priority) { where.push('a.priority = ?'); params.push(filters.priority) }
  if (filters.date_from) { where.push('a.scheduled_date >= ?'); params.push(filters.date_from) }
  if (filters.date_to) { where.push('a.scheduled_date <= ?'); params.push(filters.date_to) }
  if (filters.keyword) {
    where.push('(a.appointment_no LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)')
    const kw = `%${filters.keyword}%`
    params.push(kw, kw, kw)
  }
  const whereSql = where.length > 0 ? 'WHERE ' + where.join(' AND ') : ''
  const limit = filters.limit ? 'LIMIT ?' : ''
  if (filters.limit) params.push(filters.limit)
  const offset = filters.offset ? 'OFFSET ?' : ''
  if (filters.offset) params.push(filters.offset)

  const rows = db.prepare(`
    SELECT a.*, c.name AS customer_name, c.phone AS customer_phone,
           s.name AS store_name, u.full_name AS optician_name
    FROM appointments a
    LEFT JOIN customers c ON a.customer_id = c.id
    LEFT JOIN stores s ON a.store_id = s.id
    LEFT JOIN users u ON a.optician_id = u.id
    ${whereSql}
    ORDER BY a.scheduled_date DESC, a.scheduled_time DESC
    ${limit} ${offset}
  `).all(...params)

  const count = db.prepare(`
    SELECT COUNT(*) AS total
    FROM appointments a
    LEFT JOIN customers c ON a.customer_id = c.id
    ${whereSql}
  `).get(...params.slice(0, where.length ? params.length - (filters.limit ? 1 : 0) - (filters.offset ? 1 : 0) : params.length))

  return { items: rows, total: count.total }
}

function getAppointment(id) {
  const row = db.prepare(`
    SELECT a.*, c.name AS customer_name, c.phone AS customer_phone, c.gender, c.age,
           s.name AS store_name, u.full_name AS optician_name,
           o.id AS optometry_record_id, o.sphere_od, o.sphere_os
    FROM appointments a
    LEFT JOIN customers c ON a.customer_id = c.id
    LEFT JOIN stores s ON a.store_id = s.id
    LEFT JOIN users u ON a.optician_id = u.id
    LEFT JOIN optometry_records o ON o.appointment_id = a.id
    WHERE a.id = ?
  `).get(id)
  if (!row) throw new NotFoundError('预约单不存在')
  return row
}

function createAppointment(data, userId) {
  const errors = validateAppointmentInput(data)
  if (errors) throw new ValidationError('预约单参数校验失败', errors)

  const store = db.prepare('SELECT id FROM stores WHERE id = ?').get(data.store_id)
  if (!store) throw new ValidationError('门店不存在')

  const customer = db.prepare('SELECT id FROM customers WHERE id = ?').get(data.customer_id)
  if (!customer) throw new ValidationError('客户不存在')

  if (data.optician_id) {
    const opt = db.prepare('SELECT id FROM users WHERE id = ? AND role = ?').get(data.optician_id, config.roles.OPTICIAN)
    if (!opt) throw new ValidationError('验光师不存在')
  }

  const id = uuidv4()
  const appointmentNo = 'APT' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  const status = data.status || config.appointmentStatus.PENDING

  db.prepare(`
    INSERT INTO appointments (id, appointment_no, customer_id, store_id, optician_id, scheduled_date, scheduled_time,
      status, priority, notes, source, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, appointmentNo, data.customer_id, data.store_id, data.optician_id || null,
    data.scheduled_date, data.scheduled_time, status,
    data.priority || config.priority.NORMAL, data.notes || null,
    data.source || 'system', userId)

  return getAppointment(id)
}

function updateAppointment(id, data, userId) {
  const existing = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id)
  if (!existing) throw new NotFoundError('预约单不存在')

  const terminalStatuses = [config.appointmentStatus.COMPLETED, config.appointmentStatus.CANCELLED, config.appointmentStatus.NO_SHOW]
  if (terminalStatuses.includes(existing.status) && data.status && !terminalStatuses.includes(data.status)) {
    throw new StateConflictError('预约单已终态，不可修改', { current_status: existing.status })
  }

  const fields = []
  const params = []
  if (data.scheduled_date) { fields.push('scheduled_date = ?'); params.push(data.scheduled_date) }
  if (data.scheduled_time) { fields.push('scheduled_time = ?'); params.push(data.scheduled_time) }
  if (data.optician_id !== undefined) { fields.push('optician_id = ?'); params.push(data.optician_id) }
  if (data.status) { fields.push('status = ?'); params.push(data.status) }
  if (data.priority) { fields.push('priority = ?'); params.push(data.priority) }
  if (data.notes !== undefined) { fields.push('notes = ?'); params.push(data.notes) }
  fields.push('updated_at = datetime(\"now\")')

  if (fields.length > 1) {
    params.push(id)
    db.prepare(`UPDATE appointments SET ${fields.join(', ')} WHERE id = ?`).run(...params)
  }
  return getAppointment(id)
}

function transitionAppointment(id, action, userId) {
  const existing = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id)
  if (!existing) throw new NotFoundError('预约单不存在')

  const transitions = {
    confirm: { from: [config.appointmentStatus.PENDING], to: config.appointmentStatus.CONFIRMED },
    start: { from: [config.appointmentStatus.CONFIRMED], to: config.appointmentStatus.IN_PROGRESS },
    complete: { from: [config.appointmentStatus.IN_PROGRESS], to: config.appointmentStatus.COMPLETED },
    cancel: { from: [config.appointmentStatus.PENDING, config.appointmentStatus.CONFIRMED], to: config.appointmentStatus.CANCELLED },
    no_show: { from: [config.appointmentStatus.CONFIRMED, config.appointmentStatus.IN_PROGRESS], to: config.appointmentStatus.NO_SHOW }
  }

  const rule = transitions[action]
  if (!rule) throw new ValidationError(`非法操作: ${action}`)
  if (!rule.from.includes(existing.status)) {
    throw new StateConflictError(`状态 ${existing.status} 不允许执行 ${action}`, { current_status: existing.status, allowed_from: rule.from })
  }

  db.prepare('UPDATE appointments SET status = ?, updated_at = datetime(\"now\") WHERE id = ?').run(rule.to, id)
  return getAppointment(id)
}

function checkOverdueAppointments() {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const nowTime = now.toTimeString().slice(0, 5)

  const result = db.prepare(`
    UPDATE appointments SET status = ?
    WHERE status IN (?, ?) AND scheduled_date < ?
       OR (scheduled_date = ? AND scheduled_time < ?)
  `).run(
    config.appointmentStatus.OVERDUE,
    config.appointmentStatus.PENDING,
    config.appointmentStatus.CONFIRMED,
    today,
    today,
    nowTime
  )
  return { updated: result.changes }
}

function getMyTasks(userId, role, storeId) {
  const today = new Date().toISOString().slice(0, 10)
  const tasks = {
    my_appointments: [],
    pending_appointments: [],
    overdue_appointments: [],
    processing_orders: [],
    pending_reworks: [],
    pending_refunds: []
  }

  if (role === config.roles.OPTICIAN) {
    tasks.my_appointments = db.prepare(`
      SELECT a.*, c.name AS customer_name
      FROM appointments a
      LEFT JOIN customers c ON a.customer_id = c.id
      WHERE a.optician_id = ? AND a.status IN (?, ?, ?) AND a.scheduled_date = ?
      ORDER BY a.scheduled_time ASC
    `).all(userId, config.appointmentStatus.CONFIRMED, config.appointmentStatus.IN_PROGRESS, config.appointmentStatus.OVERDUE, today)

    tasks.pending_appointments = db.prepare(`
      SELECT COUNT(*) AS count
      FROM appointments
      WHERE optician_id = ? AND status IN (?, ?)
    `).get(userId, config.appointmentStatus.PENDING, config.appointmentStatus.CONFIRMED)
  }

  if (role === config.roles.PROCESSOR) {
    tasks.processing_orders = db.prepare(`
      SELECT o.*, c.name AS customer_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.processor_id = ? AND o.status IN (?, ?, ?)
      ORDER BY o.created_at DESC
    `).all(userId, config.orderStatus.LENS_ALLOCATED, config.orderStatus.PROCESSING, config.orderStatus.QUALITY_CHECK)
  }

  tasks.overdue_appointments = db.prepare(`
    SELECT COUNT(*) AS count
    FROM appointments
    WHERE store_id = ? AND status = ?
  `).get(storeId, config.appointmentStatus.OVERDUE)

  tasks.pending_reworks = db.prepare(`
    SELECT COUNT(*) AS count
    FROM reworks
    WHERE status = ?
  `).get(config.reworkStatus.PENDING)

  tasks.pending_refunds = db.prepare(`
    SELECT COUNT(*) AS count
    FROM refunds
    WHERE status = ?
  `).get(config.refundStatus.PENDING)

  return tasks
}

module.exports = {
  listAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  transitionAppointment,
  checkOverdueAppointments,
  getMyTasks
}
