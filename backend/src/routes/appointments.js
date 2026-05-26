const express = require('express')
const { db } = require('../db')
const { authRequired, requireRole, requireStoreAccess } = require('../middleware/auth')
const { auditMiddleware } = require('../middleware/audit')
const service = require('../services/appointmentService')
const config = require('../config')

const router = express.Router()

router.get('/', authRequired, (req, res, next) => {
  try {
    const filters = {
      store_id: req.query.store_id || (req.user.role !== config.roles.ADMIN ? req.user.store_id : null),
      status: req.query.status,
      optician_id: req.query.optician_id,
      priority: req.query.priority,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      keyword: req.query.keyword,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset) : undefined
    }
    const result = service.listAppointments(filters)
    res.json(result)
  } catch (e) { next(e) }
})

router.get('/:id', authRequired, (req, res, next) => {
  try {
    res.json(service.getAppointment(req.params.id))
  } catch (e) { next(e) }
})

router.post('/', authRequired, auditMiddleware('create', 'appointment'), (req, res, next) => {
  try {
    const data = { ...req.body }
    if (req.user.role !== config.roles.ADMIN) {
      data.store_id = req.user.store_id
    }
    const result = service.createAppointment(data, req.user.id)
    res.status(201).json(result)
  } catch (e) { next(e) }
})

router.put('/:id', authRequired, auditMiddleware('update', 'appointment'), (req, res, next) => {
  try {
    res.json(service.updateAppointment(req.params.id, req.body, req.user.id))
  } catch (e) { next(e) }
})

router.post('/:id/transition', authRequired, auditMiddleware('transition', 'appointment'), (req, res, next) => {
  try {
    const { action } = req.body
    if (!action) throw new (require('../errors').ValidationError)('操作类型必填')
    res.json(service.transitionAppointment(req.params.id, action, req.user.id))
  } catch (e) { next(e) }
})

router.get('/my/tasks', authRequired, (req, res, next) => {
  try {
    res.json(service.getMyTasks(req.user.id, req.user.role, req.user.store_id))
  } catch (e) { next(e) }
})

module.exports = router
