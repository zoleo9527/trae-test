const express = require('express')
const { authRequired, requireRole } = require('../middleware/auth')
const { auditMiddleware } = require('../middleware/audit')
const service = require('../services/reworkRefundService')
const config = require('../config')
const { db } = require('../db')
const { PermissionError, NotFoundError } = require('../errors')

function requireReworkAccess(req, _res, next) {
  if (!req.user) return next()
  if (req.user.role === config.roles.ADMIN) return next()
  const rw = db.prepare(`
    SELECT o.store_id FROM reworks r
    LEFT JOIN orders o ON r.order_id = o.id
    WHERE r.id = ?
  `).get(req.params.id)
  if (!rw) throw new NotFoundError('返修单不存在')
  if (rw.store_id !== req.user.store_id) throw new PermissionError('无权限访问其他门店返修单')
  next()
}

function requireRefundAccess(req, _res, next) {
  if (!req.user) return next()
  if (req.user.role === config.roles.ADMIN) return next()
  const rf = db.prepare(`
    SELECT o.store_id FROM refunds rf
    LEFT JOIN orders o ON rf.order_id = o.id
    WHERE rf.id = ?
  `).get(req.params.id)
  if (!rf) throw new NotFoundError('退款单不存在')
  if (rf.store_id !== req.user.store_id) throw new PermissionError('无权限访问其他门店退款单')
  next()
}

const router = express.Router()

router.get('/reworks', authRequired, (req, res, next) => {
  try {
    const filters = {
      store_id: req.query.store_id || (req.user.role !== config.roles.ADMIN ? req.user.store_id : null),
      status: req.query.status,
      order_id: req.query.order_id,
      source: req.query.source,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset) : undefined
    }
    res.json(service.listReworks(filters))
  } catch (e) { next(e) }
})

router.get('/reworks/:id', authRequired, requireReworkAccess, (req, res, next) => {
  try {
    res.json(service.getRework(req.params.id))
  } catch (e) { next(e) }
})

router.post('/reworks', authRequired, requireRole(config.roles.ADMIN, config.roles.STORE_MANAGER, config.roles.OPTICIAN, config.roles.SERVICE), auditMiddleware('create', 'rework'), (req, res, next) => {
  try {
    res.status(201).json(service.createRework(req.body, req.user.id))
  } catch (e) { next(e) }
})

router.post('/reworks/:id/:action', authRequired, requireReworkAccess, requireRole(config.roles.ADMIN, config.roles.STORE_MANAGER), auditMiddleware('process', 'rework'), (req, res, next) => {
  try {
    const { action } = req.params
    res.json(service.processRework(req.params.id, action, req.user.id, req.body))
  } catch (e) { next(e) }
})

router.get('/refunds', authRequired, (req, res, next) => {
  try {
    const filters = {
      store_id: req.query.store_id || (req.user.role !== config.roles.ADMIN ? req.user.store_id : null),
      status: req.query.status,
      order_id: req.query.order_id,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset) : undefined
    }
    res.json(service.listRefunds(filters))
  } catch (e) { next(e) }
})

router.get('/refunds/:id', authRequired, requireRefundAccess, (req, res, next) => {
  try {
    res.json(service.getRefund(req.params.id))
  } catch (e) { next(e) }
})

router.post('/refunds', authRequired, requireRole(config.roles.ADMIN, config.roles.STORE_MANAGER, config.roles.SERVICE), auditMiddleware('create', 'refund'), (req, res, next) => {
  try {
    res.status(201).json(service.createRefund(req.body, req.user.id))
  } catch (e) { next(e) }
})

router.post('/refunds/:id/:action', authRequired, requireRefundAccess, requireRole(config.roles.ADMIN, config.roles.STORE_MANAGER), auditMiddleware('process', 'refund'), (req, res, next) => {
  try {
    const { action } = req.params
    res.json(service.processRefund(req.params.id, action, req.user.id, req.body))
  } catch (e) { next(e) }
})

module.exports = router
