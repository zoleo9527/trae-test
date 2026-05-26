const { v4: uuidv4 } = require('uuid')
const { db } = require('../db')

function createAuditLog({ userId, action, resourceType, resourceId, oldValue, newValue, ipAddress, userAgent, status, errorMessage }) {
  const id = uuidv4()
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, old_value, new_value, ip_address, user_agent, status, error_message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId || null, action, resourceType || null, resourceId || null,
    oldValue ? JSON.stringify(oldValue) : null,
    newValue ? JSON.stringify(newValue) : null,
    ipAddress || null, userAgent || null, status || 'success', errorMessage || null)
  return id
}

function auditMiddleware(action, resourceType) {
  return (req, res, next) => {
    const userId = req.user?.id
    const ipAddress = req.ip
    const userAgent = req.headers['user-agent']
    const resourceId = req.params.id || req.params[Object.keys(req.params)[0]] || null
    const oldValue = req.resource ? { ...req.resource } : null
    req.auditContext = { userId, action, resourceType, resourceId, ipAddress, userAgent, oldValue }
    const originalJson = res.json.bind(res)
    res.json = function(data) {
      if (res.statusCode < 400) {
        createAuditLog({
          userId, action, resourceType, resourceId,
          oldValue,
          newValue: data && typeof data === 'object' ? { id: data.id } : null,
          ipAddress, userAgent, status: 'success'
        })
      }
      return originalJson(data)
    }
    next()
  }
}

module.exports = { auditMiddleware, createAuditLog }
