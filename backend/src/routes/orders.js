const express = require('express')
const { authRequired } = require('../middleware/auth')
const { auditMiddleware } = require('../middleware/audit')
const service = require('../services/orderService')
const config = require('../config')

const router = express.Router()

router.get('/', authRequired, (req, res, next) => {
  try {
    const filters = {
      store_id: req.query.store_id || (req.user.role !== config.roles.ADMIN ? req.user.store_id : null),
      status: req.query.status,
      status_in: req.query.status_in ? req.query.status_in.split(',') : undefined,
      processor_id: req.query.processor_id,
      optician_id: req.query.optician_id,
      priority: req.query.priority,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      keyword: req.query.keyword,
      has_rework: req.query.has_rework === 'true',
      has_refund: req.query.has_refund === 'true',
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset) : undefined
    }
    res.json(service.listOrders(filters))
  } catch (e) { next(e) }
})

router.get('/stats', authRequired, (req, res, next) => {
  try {
    const storeId = req.user.role !== config.roles.ADMIN ? req.user.store_id : null
    res.json(service.getOrderStats(storeId))
  } catch (e) { next(e) }
})

router.get('/:id', authRequired, (req, res, next) => {
  try {
    res.json(service.getOrder(req.params.id))
  } catch (e) { next(e) }
})

router.post('/', authRequired, auditMiddleware('create', 'order'), (req, res, next) => {
  try {
    const data = { ...req.body }
    if (req.user.role !== config.roles.ADMIN) {
      data.store_id = req.user.store_id
    }
    if (!data.optician_id && req.user.role === config.roles.OPTICIAN) {
      data.optician_id = req.user.id
    }
    const result = service.createOrder(data, req.user.id)
    res.status(201).json(result)
  } catch (e) { next(e) }
})

router.put('/:id', authRequired, auditMiddleware('update', 'order'), (req, res, next) => {
  try {
    res.json(service.updateOrder(req.params.id, req.body, req.user.id))
  } catch (e) { next(e) }
})

router.post('/:id/transition', authRequired, auditMiddleware('transition', 'order'), (req, res, next) => {
  try {
    const { action, ...extra } = req.body
    if (!action) throw new (require('../errors').ValidationError)('操作类型必填')
    res.json(service.transitionOrder(req.params.id, action, req.user.id, extra))
  } catch (e) { next(e) }
})

router.post('/:id/allocate-lens', authRequired, auditMiddleware('allocate_lens', 'order'), (req, res, next) => {
  try {
    res.json(service.allocateLens(req.params.id, req.body, req.user.id))
  } catch (e) { next(e) }
})

router.post('/allocations/:id/receive', authRequired, auditMiddleware('receive_lens', 'lens_allocation'), (req, res, next) => {
  try {
    res.json(service.receiveLens(req.params.id, req.user.id))
  } catch (e) { next(e) }
})

module.exports = router
