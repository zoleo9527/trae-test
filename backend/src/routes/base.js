const express = require('express')
const { db } = require('../db')
const { authRequired } = require('../middleware/auth')
const { NotFoundError, ValidationError } = require('../errors')
const { v4: uuidv4 } = require('uuid')

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

router.post('/lens-sku', authRequired, (req, res, next) => {
  try {
    const { sku_code, brand, model, sphere_range, cylinder_range, add_power_range, description, stock } = req.body
    if (!sku_code || !brand || !model) throw new ValidationError('SKU编码、品牌、型号必填')
    const id = uuidv4()
    db.prepare(`
      INSERT INTO lens_sku (id, sku_code, brand, model, sphere_range, cylinder_range, add_power_range, description, stock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, sku_code, brand, model, sphere_range || null, cylinder_range || null, add_power_range || null, description || null, stock || 0)
    res.status(201).json(db.prepare('SELECT * FROM lens_sku WHERE id = ?').get(id))
  } catch (e) { next(e) }
})

router.get('/customers', authRequired, (req, res) => {
  const storeId = req.query.store_id
  const rows = storeId
    ? db.prepare('SELECT * FROM customers WHERE store_id = ? ORDER BY name').all(storeId)
    : db.prepare('SELECT * FROM customers ORDER BY name').all()
  res.json(rows)
})

router.post('/customers', authRequired, (req, res, next) => {
  try {
    const { name, phone, gender, age, store_id } = req.body
    if (!name) throw new ValidationError('客户姓名必填')
    const id = uuidv4()
    db.prepare(`
      INSERT INTO customers (id, name, phone, gender, age, store_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name, phone || null, gender || null, age || null, store_id || null)
    res.status(201).json(db.prepare('SELECT * FROM customers WHERE id = ?').get(id))
  } catch (e) { next(e) }
})

router.get('/optometry-records/:appointmentId', authRequired, (req, res) => {
  const rows = db.prepare(`
    SELECT orr.*, c.name AS customer_name, u.full_name AS optician_name
    FROM optometry_records orr
    LEFT JOIN customers c ON orr.customer_id = c.id
    LEFT JOIN users u ON orr.optician_id = u.id
    WHERE orr.appointment_id = ?
    ORDER BY orr.exam_date DESC
  `).all(req.params.appointmentId)
  res.json(rows)
})

router.post('/optometry-records', authRequired, (req, res, next) => {
  try {
    const data = req.body
    if (!data.appointment_id || !data.customer_id || !data.optician_id) {
      throw new ValidationError('预约ID、客户ID、验光师ID必填')
    }
    const id = uuidv4()
    db.prepare(`
      INSERT INTO optometry_records (id, appointment_id, customer_id, store_id, optician_id,
        sphere_od, sphere_os, cylinder_od, cylinder_os, axis_od, axis_os, pd, add_power, ipd,
        va_od, va_os, va_od_ph, va_os_ph,
        frame_brand, frame_model, frame_color, lens_sku_id, lens_brand, lens_model, coating,
        prescriptions, diagnosis, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.appointment_id, data.customer_id, data.store_id || null, data.optician_id,
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
