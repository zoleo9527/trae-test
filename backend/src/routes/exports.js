const express = require('express')
const { authRequired, requireRole } = require('../middleware/auth')
const config = require('../config')
const service = require('../services/exportService')

const router = express.Router()

router.get('/orders', authRequired, requireRole(config.roles.ADMIN, config.roles.STORE_MANAGER), async (req, res, next) => {
  try {
    const filters = {
      store_id: req.query.store_id || (req.user.role !== config.roles.ADMIN ? req.user.store_id : null),
      status: req.query.status,
      date_from: req.query.date_from,
      date_to: req.query.date_to
    }
    const csv = await service.exportOrders(filters)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="orders_${Date.now()}.csv"`)
    res.send(csv)
  } catch (e) { next(e) }
})

router.get('/appointments', authRequired, requireRole(config.roles.ADMIN, config.roles.STORE_MANAGER), async (req, res, next) => {
  try {
    const filters = {
      store_id: req.query.store_id || (req.user.role !== config.roles.ADMIN ? req.user.store_id : null),
      status: req.query.status,
      date_from: req.query.date_from,
      date_to: req.query.date_to
    }
    const csv = await service.exportAppointments(filters)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="appointments_${Date.now()}.csv"`)
    res.send(csv)
  } catch (e) { next(e) }
})

router.get('/reworks', authRequired, requireRole(config.roles.ADMIN, config.roles.STORE_MANAGER), async (req, res, next) => {
  try {
    const filters = {
      store_id: req.query.store_id || (req.user.role !== config.roles.ADMIN ? req.user.store_id : null)
    }
    const csv = await service.exportReworks(filters)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="reworks_${Date.now()}.csv"`)
    res.send(csv)
  } catch (e) { next(e) }
})

module.exports = router
