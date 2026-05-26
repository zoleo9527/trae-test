const express = require('express')
const { authRequired } = require('../middleware/auth')
const { auditMiddleware } = require('../middleware/audit')
const service = require('../services/reworkRefundService')
const config = require('../config')

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

router.get('/reworks/:id', authRequired, (req, res, next) => {
  try {
    res.json(service.getRework(req.params.id))
  } catch (e) { next(e) }
})

router.post('/reworks', authRequired, auditMiddleware('create', 'rework'), (req, res, next) => {
  try {
    res.status(201).json(service.createRework(req.body, req.user.id))
  } catch (e) { next(e) }
})

router.post('/reworks/:id/:action', authRequired, auditMiddleware('process', 'rework'), (req, res, next) => {
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

router.get('/refunds/:id', authRequired, (req, res, next) => {
  try {
    res.json(service.getRefund(req.params.id))
  } catch (e) { next(e) }
})

router.post('/refunds', authRequired, auditMiddleware('create', 'refund'), (req, res, next) => {
  try {
    res.status(201).json(service.createRefund(req.body, req.user.id))
  } catch (e) { next(e) }
})

router.post('/refunds/:id/:action', authRequired, auditMiddleware('process', 'refund'), (req, res, next) => {
  try {
    const { action } = req.params
    res.json(service.processRefund(req.params.id, action, req.user.id, req.body))
  } catch (e) { next(e) }
})

module.exports = router
