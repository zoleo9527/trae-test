const { stringify } = require('csv-stringify')
const { db } = require('../db')
const config = require('../config')
const { ValidationError } = require('../errors')

async function exportOrders(filters = {}) {
  return new Promise((resolve, reject) => {
    const where = []
    const params = []
    if (filters.store_id) { where.push('o.store_id = ?'); params.push(filters.store_id) }
    if (filters.status) { where.push('o.status = ?'); params.push(filters.status) }
    if (filters.date_from) { where.push('DATE(o.created_at) >= ?'); params.push(filters.date_from) }
    if (filters.date_to) { where.push('DATE(o.created_at) <= ?'); params.push(filters.date_to) }

    const whereSql = where.length > 0 ? 'WHERE ' + where.join(' AND ') : ''

    const rows = db.prepare(`
      SELECT o.order_no, o.status, o.priority, o.total_amount, o.paid_amount, o.payment_status,
             o.created_at, o.updated_at, o.expected_date,
             c.name AS customer_name, c.phone AS customer_phone,
             s.name AS store_name,
             u.full_name AS optician_name,
             p.full_name AS processor_name,
             o.frame_brand, o.frame_model, o.frame_color, o.frame_price,
             o.lens_brand, o.lens_model, o.lens_type, o.lens_coating, o.lens_price,
             o.sphere_od, o.sphere_os, o.cylinder_od, o.cylinder_os, o.axis_od, o.axis_os, o.pd, o.add_power,
             o.notes
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN stores s ON o.store_id = s.id
      LEFT JOIN users u ON o.optician_id = u.id
      LEFT JOIN users p ON o.processor_id = p.id
      ${whereSql}
      ORDER BY o.created_at DESC
    `).all(...params)

    const columns = {
      order_no: '订单号',
      status: '状态',
      priority: '优先级',
      total_amount: '总金额',
      paid_amount: '已付金额',
      payment_status: '支付状态',
      created_at: '创建时间',
      updated_at: '更新时间',
      expected_date: '预计交付',
      customer_name: '客户姓名',
      customer_phone: '客户电话',
      store_name: '门店',
      optician_name: '验光师',
      processor_name: '加工师',
      frame_brand: '镜架品牌',
      frame_model: '镜架型号',
      frame_color: '镜架颜色',
      frame_price: '镜架价格',
      lens_brand: '镜片品牌',
      lens_model: '镜片型号',
      lens_type: '镜片类型',
      lens_coating: '镜片膜层',
      lens_price: '镜片价格',
      sphere_od: '右眼球镜',
      sphere_os: '左眼球镜',
      cylinder_od: '右眼柱镜',
      cylinder_os: '左眼柱镜',
      axis_od: '右眼光轴',
      axis_os: '左眼光轴',
      pd: '瞳距',
      add_power: 'ADD',
      notes: '备注'
    }

    stringify(rows, { header: true, columns, bom: true }, (err, output) => {
      if (err) reject(err)
      else resolve(output)
    })
  })
}

async function exportAppointments(filters = {}) {
  return new Promise((resolve, reject) => {
    const where = []
    const params = []
    if (filters.store_id) { where.push('a.store_id = ?'); params.push(filters.store_id) }
    if (filters.status) { where.push('a.status = ?'); params.push(filters.status) }
    if (filters.date_from) { where.push('a.scheduled_date >= ?'); params.push(filters.date_from) }
    if (filters.date_to) { where.push('a.scheduled_date <= ?'); params.push(filters.date_to) }

    const whereSql = where.length > 0 ? 'WHERE ' + where.join(' AND ') : ''

    const rows = db.prepare(`
      SELECT a.appointment_no, a.scheduled_date, a.scheduled_time, a.status, a.priority,
             a.notes, a.created_at,
             c.name AS customer_name, c.phone AS customer_phone, c.gender, c.age,
             s.name AS store_name,
             u.full_name AS optician_name
      FROM appointments a
      LEFT JOIN customers c ON a.customer_id = c.id
      LEFT JOIN stores s ON a.store_id = s.id
      LEFT JOIN users u ON a.optician_id = u.id
      ${whereSql}
      ORDER BY a.scheduled_date DESC, a.scheduled_time DESC
    `).all(...params)

    const columns = {
      appointment_no: '预约号',
      scheduled_date: '预约日期',
      scheduled_time: '预约时间',
      status: '状态',
      priority: '优先级',
      notes: '备注',
      created_at: '创建时间',
      customer_name: '客户姓名',
      customer_phone: '客户电话',
      gender: '性别',
      age: '年龄',
      store_name: '门店',
      optician_name: '验光师'
    }

    stringify(rows, { header: true, columns, bom: true }, (err, output) => {
      if (err) reject(err)
      else resolve(output)
    })
  })
}

async function exportReworks(filters = {}) {
  return new Promise((resolve, reject) => {
    const where = []
    const params = []
    if (filters.store_id) {
      where.push('o.store_id = ?')
      params.push(filters.store_id)
    }

    const whereSql = where.length > 0 ? 'WHERE ' + where.join(' AND ') : ''

    const rows = db.prepare(`
      SELECT o.order_no, r.reason, r.rework_type, r.status, r.source, r.remarks,
             r.requested_at, r.approved_at, r.completed_at,
             c.name AS customer_name, s.name AS store_name,
             u.full_name AS requested_by
      FROM reworks r
      LEFT JOIN orders o ON r.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN stores s ON o.store_id = s.id
      LEFT JOIN users u ON r.requested_by = u.id
      ${whereSql}
      ORDER BY r.requested_at DESC
    `).all(...params)

    const columns = {
      order_no: '订单号',
      reason: '返修原因',
      rework_type: '返修类型',
      status: '状态',
      source: '来源',
      remarks: '备注',
      requested_at: '申请时间',
      approved_at: '审批时间',
      completed_at: '完成时间',
      customer_name: '客户姓名',
      store_name: '门店',
      requested_by: '申请人'
    }

    stringify(rows, { header: true, columns, bom: true }, (err, output) => {
      if (err) reject(err)
      else resolve(output)
    })
  })
}

module.exports = { exportOrders, exportAppointments, exportReworks }
