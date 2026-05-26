const express = require('express')
const { authRequired, requireRole } = require('../middleware/auth')
const config = require('../config')
const service = require('../services/auditService')

const router = express.Router()

router.get('/', authRequired, requireRole(config.roles.ADMIN), (req, res, next) => {
  try {
    const filters = {
      action: req.query.action,
      resource_type: req.query.resource_type,
      resource_id: req.query.resource_id,
      user_id: req.query.user_id,
      status: req.query.status,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset) : undefined
    }
    res.json(service.listAuditLogs(filters))
  } catch (e) { next(e) }
})

router.get('/actions', authRequired, requireRole(config.roles.ADMIN), (req, res, next) => {
  try {
    res.json(service.getAuditActions())
  } catch (e) { next(e) }
})

router.get('/:id', authRequired, requireRole(config.roles.ADMIN), (req, res, next) => {
  try {
    res.json(service.getAuditLog(req.params.id))
  } catch (e) { next(e) }
})

module.exports = router
