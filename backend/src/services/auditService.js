const { db } = require('../db')
const { ValidationError } = require('../errors')

function listAuditLogs(filters = {}) {
  const where = []
  const params = []
  if (filters.action) { where.push('action = ?'); params.push(filters.action) }
  if (filters.resource_type) { where.push('resource_type = ?'); params.push(filters.resource_type) }
  if (filters.resource_id) { where.push('resource_id = ?'); params.push(filters.resource_id) }
  if (filters.user_id) { where.push('user_id = ?'); params.push(filters.user_id) }
  if (filters.status) { where.push('status = ?'); params.push(filters.status) }
  if (filters.date_from) { where.push('DATE(created_at) >= ?'); params.push(filters.date_from) }
  if (filters.date_to) { where.push('DATE(created_at) <= ?'); params.push(filters.date_to) }

  const whereSql = where.length > 0 ? 'WHERE ' + where.join(' AND ') : ''
  const limit = filters.limit ? 'LIMIT ?' : 'LIMIT 200'
  if (filters.limit) params.push(filters.limit)
  const offset = filters.offset ? 'OFFSET ?' : ''
  if (filters.offset) params.push(filters.offset)

  const rows = db.prepare(`
    SELECT al.*, u.username, u.full_name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ${whereSql}
    ORDER BY al.created_at DESC
    ${limit} ${offset}
  `).all(...params)

  const count = db.prepare(`SELECT COUNT(*) AS total FROM audit_logs ${whereSql}`).get(...params.slice(0, params.length - (filters.limit ? 1 : 0) - (filters.offset ? 1 : 0)))

  return { items: rows, total: count.total }
}

function getAuditLog(id) {
  const row = db.prepare(`
    SELECT al.*, u.username, u.full_name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.id = ?
  `).get(id)
  if (!row) throw new (require('../errors').NotFoundError)('审计记录不存在')
  return row
}

function getAuditActions() {
  const actions = db.prepare('SELECT DISTINCT action FROM audit_logs ORDER BY action').all().map(r => r.action)
  const resourceTypes = db.prepare('SELECT DISTINCT resource_type FROM audit_logs WHERE resource_type IS NOT NULL ORDER BY resource_type').all().map(r => r.resource_type)
  return { actions, resource_types: resourceTypes }
}

module.exports = { listAuditLogs, getAuditLog, getAuditActions }
