const express = require('express')
const { authRequired } = require('../middleware/auth')
const service = require('../services/taskService')

const router = express.Router()

router.get('/dashboard', authRequired, (req, res, next) => {
  try {
    res.json(service.getDashboard(req.user.id, req.user.role, req.user.store_id))
  } catch (e) { next(e) }
})

router.get('/store-stats', authRequired, (req, res, next) => {
  try {
    res.json(service.getStoreStats())
  } catch (e) { next(e) }
})

module.exports = router
