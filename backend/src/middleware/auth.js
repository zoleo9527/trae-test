const jwt = require('jsonwebtoken')
const config = require('../config')
const { AuthError, PermissionError, NotFoundError } = require('../errors')
const { db } = require('../db')

function authRequired(req, _res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthError('缺少有效的 Authorization header'))
  }
  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, config.jwtSecret)
    const user = db.prepare('SELECT id, username, full_name, role, store_id, is_active FROM users WHERE id = ?').get(payload.sub)
    if (!user || !user.is_active) {
      return next(new AuthError('用户不存在或已禁用'))
    }
    req.user = user
    next()
  } catch (_e) {
    return next(new AuthError('Token 无效或已过期'))
  }
}

function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new AuthError('请先登录'))
    if (!roles.includes(req.user.role)) {
      return next(new PermissionError(`当前角色 [${req.user.role}] 无权执行此操作`))
    }
    next()
  }
}

function requireStoreAccess(req, _res, next) {
  if (!req.user) return next(new AuthError('请先登录'))
  if (req.user.role === config.roles.ADMIN) return next()
  const storeId = req.params.storeId || req.body.store_id || req.query.store_id
  if (!storeId) return next()
  if (req.user.store_id !== storeId) {
    return next(new PermissionError('无权限访问其他门店数据'))
  }
  next()
}

function requireOwnership(resourceType, idField) {
  return (req, _res, next) => {
    if (!req.user) return next(new AuthError('请先登录'))
    if (req.user.role === config.roles.ADMIN) return next()
    const id = req.params[idField]
    const row = db.prepare(`SELECT * FROM ${resourceType} WHERE id = ?`).get(id)
    if (!row) return next(new NotFoundError('资源不存在'))
    if (req.user.role === config.roles.STORE_MANAGER) {
      if (row.store_id && row.store_id !== req.user.store_id) {
        return next(new PermissionError('无权限访问其他门店数据'))
      }
    } else if (row.optician_id && row.optician_id !== req.user.id && row.processor_id && row.processor_id !== req.user.id) {
      return next(new PermissionError('无权限访问非本人负责的数据'))
    }
    req.resource = row
    next()
  }
}

module.exports = { authRequired, requireRole, requireStoreAccess, requireOwnership }
