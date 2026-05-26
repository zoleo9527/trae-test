const express = require('express')
const { db } = require('../db')
const { authRequired, requireRole, requireStoreAccess } = require('../middleware/auth')
const { NotFoundError, ValidationError, PermissionError } = require('../errors')
const { v4: uuidv4 } = require('uuid')
const config = require('../config')

const router = express.Router()

router.get('/stores', authRequired, (_req, res) => {
  res.json(db.prepare('SELECT * FROM stores ORDER BY name').all())
})

router.get('/stores/:id', authRequired, (req, res, next) => {
  try {
    const row = db.prepare('SELECT * FROM stores WHERE id = ?').get(req.params.id)
    if (!row) throw new NotFoundError('门店不存在')
    res.json(row)
  } catch (e) { next(e) }
})

router.get('/lens-sku', authRequired, (_req, res) => {
  res.json(db.prepare('SELECT * FROM lens_sku ORDER BY brand, model').all())
})

router.get('/lens-sku/:id', authRequired, (req, res, next) => {
  try {
    const row = db.prepare('SELECT * FROM lens_sku WHERE id = ?').get(req.params.id)
    if (!row) throw new NotFoundError('镜片SKU不存在')
    res.json(row)
  } catch (e) { next(e) }
})

router.post('/lens-sku', authRequired, requireRole(config.roles.ADMIN, config.roles.STORE_MANAGER), (req, res, next) => {
  try {
    const { sku_code, brand, model, sphere_range, cylinder_range, add_power_range, description, stock } = req.body
    if (!sku_code || !brand || !model) throw new ValidationError('SKU编码、品牌、型号必填')
    const existing = db.prepare('SELECT id FROM lens_sku WHERE sku_code = ?').get(sku_code)
    if (existing) throw new ValidationError('SKU编码已存在')
    const id = uuidv4()
    db.prepare(`
      INSERT INTO lens_sku (id, sku_code, brand, model, sphere_range, cylinder_range, add_power_range, description, stock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, sku_code, brand, model, sphere_range || null, cylinder_range || null, add_power_range || null, description || null, stock || 0)
    res.status(201).json(db.prepare('SELECT * FROM lens_sku WHERE id = ?').get(id))
  } catch (e) { next(e) }
})

router.get('/customers', authRequired, (req, res) => {
  const storeId = req.query.store_id || (req.user.role !== config.roles.ADMIN ? req.user.store_id : null)
  const rows = storeId
    ? db.prepare('SELECT * FROM customers WHERE store_id = ? ORDER BY name').all(storeId)
    : db.prepare('SELECT * FROM customers ORDER BY name').all()
  res.json(rows)
})

router.post('/customers', authRequired, (req, res, next) => {
  try {
    const { name, phone, gender, age, store_id } = req.body
    if (!name) throw new ValidationError('客户姓名必填')
    const finalStoreId = store_id || (req.user.role !== config.roles.ADMIN ? req.user.store_id : null)
    if (!finalStoreId) throw new ValidationError('门店ID必填')
    if (req.user.role !== config.roles.ADMIN && finalStoreId !== req.user.store_id) {
      throw new PermissionError('无权限为其他门店创建客户')
    }
    const id = uuidv4()
    db.prepare(`
      INSERT INTO customers (id, name, phone, gender, age, store_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name, phone || null, gender || null, age || null, finalStoreId)
    res.status(201).json(db.prepare('SELECT * FROM customers WHERE id = ?').get(id))
  } catch (e) { next(e) }
})

router.get('/optometry-records/:appointmentId', authRequired, (req, res, next) => {
  try {
    const apt = db.prepare('SELECT store_id FROM appointments WHERE id = ?').get(req.params.appointmentId)
    if (!apt) throw new NotFoundError('预约单不存在')
    if (req.user.role !== config.roles.ADMIN && apt.store_id !== req.user.store_id) {
      throw new PermissionError('无权限访问其他门店验光记录')
    }
    const rows = db.prepare(`
      SELECT orr.*, c.name AS customer_name, u.full_name AS optician_name
      FROM optometry_records orr
      LEFT JOIN customers c ON orr.customer_id = c.id
      LEFT JOIN users u ON orr.optician_id = u.id
      WHERE orr.appointment_id = ?
      ORDER BY orr.exam_date DESC
    `).all(req.params.appointmentId)
    res.json(rows)
  } catch (e) { next(e) }
})

router.post('/optometry-records', authRequired, requireRole(config.roles.ADMIN, config.roles.OPTICIAN), (req, res, next) => {
  try {
    const data = req.body
    if (!data.appointment_id || !data.customer_id || !data.optician_id) {
      throw new ValidationError('预约ID、客户ID、验光师ID必填')
    }
    if (req.user.role === config.roles.OPTICIAN && data.optician_id !== req.user.id) {
      throw new PermissionError('验光师只能创建自己的验光记录')
    }
    const apt = db.prepare('SELECT store_id FROM appointments WHERE id = ?').get(data.appointment_id)
    if (apt && req.user.role !== config.roles.ADMIN && apt.store_id !== req.user.store_id) {
      throw new PermissionError('无权限为其他门店创建验光记录')
    }
    const finalStoreId = data.store_id || (apt ? apt.store_id : (req.user.role !== config.roles.ADMIN ? req.user.store_id : null))
    const id = uuidv4()
    db.prepare(`
      INSERT INTO optometry_records (id, appointment_id, customer_id, store_id, optician_id,
        sphere_od, sphere_os, cylinder_od, cylinder_os, axis_od, axis_os, pd, add_power, ipd,
        va_od, va_os, va_od_ph, va_os_ph,
        frame_brand, frame_model, frame_color, lens_sku_id, lens_brand, lens_model, coating,
        prescriptions, diagnosis, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.appointment_id, data.customer_id, finalStoreId || null, data.optician_id,
      data.sphere_od ?? null, data.sphere_os ?? null,
      data.cylinder_od ?? null, data.cylinder_os ?? null,
      data.axis_od ?? null, data.axis_os ?? null,
      data.pd ?? null, data.add_power ?? null, data.ipd ?? null,
      data.va_od ?? null, data.va_os ?? null, data.va_od_ph ?? null, data.va_os_ph ?? null,
      data.frame_brand ?? null, data.frame_model ?? null, data.frame_color ?? null,
      data.lens_sku_id ?? null, data.lens_brand ?? null, data.lens_model ?? null, data.coating ?? null,
      data.prescriptions ?? null, data.diagnosis ?? null, data.remarks ?? null)
    res.status(201).json(db.prepare('SELECT * FROM optometry_records WHERE id = ?').get(id))
  } catch (e) { next(e) }
})

module.exports = router
