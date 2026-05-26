const { db } = require('../db')
const config = require('../config')
const { v4: uuidv4 } = require('uuid')
const { ValidationError, NotFoundError, StateConflictError, LensAllocationError, StockError } = require('../errors')
const { createAuditLog } = require('../middleware/audit')

function validateOrderInput(data) {
  const errors = {}
  if (!data.customer_id) errors.customer_id = '客户ID必填'
  if (!data.store_id) errors.store_id = '门店ID必填'
  if (data.priority && !Object.values(config.priority).includes(data.priority)) {
    errors.priority = '优先级非法'
  }
  if (data.total_amount !== undefined && data.total_amount < 0) {
    errors.total_amount = '金额不能为负'
  }
  return Object.keys(errors).length > 0 ? errors : null
}

function recordStatusHistory(orderId, oldStatus, newStatus, userId, reason) {
  db.prepare(`
    INSERT INTO order_status_history (id, order_id, old_status, new_status, changed_by, reason)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), orderId, oldStatus, newStatus, userId, reason || null)
}

function listOrders(filters = {}) {
  const where = []
  const params = []
  if (filters.store_id) { where.push('o.store_id = ?'); params.push(filters.store_id) }
  if (filters.status) { where.push('o.status = ?'); params.push(filters.status) }
  if (filters.status_in) {
    where.push(`o.status IN (${filters.status_in.map(() => '?').join(',')})`)
    params.push(...filters.status_in)
  }
  if (filters.processor_id) { where.push('o.processor_id = ?'); params.push(filters.processor_id) }
  if (filters.optician_id) { where.push('o.optician_id = ?'); params.push(filters.optician_id) }
  if (filters.priority) { where.push('o.priority = ?'); params.push(filters.priority) }
  if (filters.date_from) { where.push('o.created_at >= ?'); params.push(filters.date_from) }
  if (filters.date_to) { where.push('o.created_at <= ?'); params.push(filters.date_to) }
  if (filters.keyword) {
    where.push('(o.order_no LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)')
    const kw = `%${filters.keyword}%`
    params.push(kw, kw, kw)
  }
  if (filters.has_rework) {
    where.push('EXISTS (SELECT 1 FROM reworks r WHERE r.order_id = o.id)')
  }
  if (filters.has_refund) {
    where.push('EXISTS (SELECT 1 FROM refunds rf WHERE rf.order_id = o.id)')
  }

  const whereSql = where.length > 0 ? 'WHERE ' + where.join(' AND ') : ''
  const limit = filters.limit ? 'LIMIT ?' : ''
  if (filters.limit) params.push(filters.limit)
  const offset = filters.offset ? 'OFFSET ?' : ''
  if (filters.offset) params.push(filters.offset)

  const rows = db.prepare(`
    SELECT o.*, c.name AS customer_name, c.phone AS customer_phone,
           s.name AS store_name, u.full_name AS optician_name,
           p.full_name AS processor_name,
           (SELECT COUNT(*) FROM reworks r WHERE r.order_id = o.id) AS rework_count,
           (SELECT COUNT(*) FROM refunds rf WHERE rf.order_id = o.id) AS refund_count
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN stores s ON o.store_id = s.id
    LEFT JOIN users u ON o.optician_id = u.id
    LEFT JOIN users p ON o.processor_id = p.id
    ${whereSql}
    ORDER BY o.created_at DESC
    ${limit} ${offset}
  `).all(...params)

  const count = db.prepare(`
    SELECT COUNT(*) AS total
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    ${whereSql}
  `).get(...params.slice(0, params.length - (filters.limit ? 1 : 0) - (filters.offset ? 1 : 0)))

  return { items: rows, total: count.total }
}

function getOrder(id) {
  const order = db.prepare(`
    SELECT o.*, c.name AS customer_name, c.phone AS customer_phone, c.gender, c.age,
           s.name AS store_name, u.full_name AS optician_name,
           p.full_name AS processor_name,
           l.sku_code AS lens_sku_code
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN stores s ON o.store_id = s.id
    LEFT JOIN users u ON o.optician_id = u.id
    LEFT JOIN users p ON o.processor_id = p.id
    LEFT JOIN lens_sku l ON o.lens_sku_id = l.id
    WHERE o.id = ?
  `).get(id)
  if (!order) throw new NotFoundError('订单不存在')

  order.status_history = db.prepare(`
    SELECT * FROM order_status_history WHERE order_id = ? ORDER BY changed_at ASC
  `).all(id)

  order.reworks = db.prepare(`
    SELECT r.*, u.full_name AS requested_by_name
    FROM reworks r LEFT JOIN users u ON r.requested_by = u.id
    WHERE r.order_id = ? ORDER BY r.requested_at DESC
  `).all(id)

  order.refunds = db.prepare(`
    SELECT rf.*, u.full_name AS requested_by_name
    FROM refunds rf LEFT JOIN users u ON rf.requested_by = u.id
    WHERE rf.order_id = ? ORDER BY rf.requested_at DESC
  `).all(id)

  order.allocations = db.prepare(`
    SELECT la.*, l.sku_code, l.brand AS lens_brand, l.model AS lens_model,
           s_from.name AS from_store_name, s_to.name AS to_store_name
    FROM lens_allocations la
    LEFT JOIN lens_sku l ON la.lens_sku_id = l.id
    LEFT JOIN stores s_from ON la.from_store_id = s_from.id
    LEFT JOIN stores s_to ON la.to_store_id = s_to.id
    WHERE la.order_id = ? ORDER BY la.created_at DESC
  `).all(id)

  order.processing = db.prepare(`
    SELECT pr.*, u.full_name AS processor_name
    FROM processing_records pr LEFT JOIN users u ON pr.processor_id = u.id
    WHERE pr.order_id = ? ORDER BY pr.created_at DESC
  `).all(id)

  return order
}

function createOrder(data, userId) {
  const errors = validateOrderInput(data)
  if (errors) throw new ValidationError('订单参数校验失败', errors)

  const id = uuidv4()
  const orderNo = 'ORD' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000).toString().padStart(3, '0')

  db.prepare(`
    INSERT INTO orders (id, order_no, appointment_id, optometry_record_id, customer_id, store_id,
      optician_id, processor_id, frame_brand, frame_model, frame_color, frame_price,
      lens_sku_id, lens_brand, lens_model, lens_type, lens_coating, lens_price,
      sphere_od, sphere_os, cylinder_od, cylinder_os, axis_od, axis_os, pd, add_power,
      total_amount, paid_amount, discount, payment_method, payment_status,
      status, priority, expected_date, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, orderNo,
    data.appointment_id || null, data.optometry_record_id || null,
    data.customer_id, data.store_id,
    data.optician_id || null, data.processor_id || null,
    data.frame_brand || null, data.frame_model || null, data.frame_color || null, data.frame_price || 0,
    data.lens_sku_id || null, data.lens_brand || null, data.lens_model || null,
    data.lens_type || null, data.lens_coating || null, data.lens_price || 0,
    data.sphere_od ?? null, data.sphere_os ?? null,
    data.cylinder_od ?? null, data.cylinder_os ?? null,
    data.axis_od ?? null, data.axis_os ?? null,
    data.pd ?? null, data.add_power ?? null,
    data.total_amount || 0, data.paid_amount || 0, data.discount || 0,
    data.payment_method || null, data.payment_status || 'unpaid',
    config.orderStatus.PENDING,
    data.priority || config.priority.NORMAL,
    data.expected_date || null, data.notes || null, userId)

  recordStatusHistory(id, null, config.orderStatus.PENDING, userId, '订单创建')

  return getOrder(id)
}

function updateOrder(id, data, userId) {
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
  if (!existing) throw new NotFoundError('订单不存在')

  const terminalStatuses = [config.orderStatus.COMPLETED, config.orderStatus.DELIVERED, config.orderStatus.REFUNDED, config.orderStatus.CANCELLED]
  const isTerminal = terminalStatuses.includes(existing.status)

  const fields = []
  const params = []

  if (data.processor_id !== undefined && !isTerminal) {
    const proc = db.prepare('SELECT id FROM users WHERE id = ? AND role = ?').get(data.processor_id, config.roles.PROCESSOR)
    if (!proc) throw new ValidationError('加工师不存在')
    fields.push('processor_id = ?'); params.push(data.processor_id)
  }
  if (data.optician_id !== undefined && !isTerminal) {
    fields.push('optician_id = ?'); params.push(data.optician_id)
  }
  if (data.frame_brand !== undefined) { fields.push('frame_brand = ?'); params.push(data.frame_brand) }
  if (data.frame_model !== undefined) { fields.push('frame_model = ?'); params.push(data.frame_model) }
  if (data.frame_color !== undefined) { fields.push('frame_color = ?'); params.push(data.frame_color) }
  if (data.frame_price !== undefined) { fields.push('frame_price = ?'); params.push(data.frame_price) }
  if (data.lens_sku_id !== undefined && !isTerminal) { fields.push('lens_sku_id = ?'); params.push(data.lens_sku_id) }
  if (data.lens_brand !== undefined) { fields.push('lens_brand = ?'); params.push(data.lens_brand) }
  if (data.lens_model !== undefined) { fields.push('lens_model = ?'); params.push(data.lens_model) }
  if (data.lens_coating !== undefined) { fields.push('lens_coating = ?'); params.push(data.lens_coating) }
  if (data.lens_price !== undefined) { fields.push('lens_price = ?'); params.push(data.lens_price) }
  if (data.sphere_od !== undefined) { fields.push('sphere_od = ?'); params.push(data.sphere_od) }
  if (data.sphere_os !== undefined) { fields.push('sphere_os = ?'); params.push(data.sphere_os) }
  if (data.cylinder_od !== undefined) { fields.push('cylinder_od = ?'); params.push(data.cylinder_od) }
  if (data.cylinder_os !== undefined) { fields.push('cylinder_os = ?'); params.push(data.cylinder_os) }
  if (data.axis_od !== undefined) { fields.push('axis_od = ?'); params.push(data.axis_od) }
  if (data.axis_os !== undefined) { fields.push('axis_os = ?'); params.push(data.axis_os) }
  if (data.pd !== undefined) { fields.push('pd = ?'); params.push(data.pd) }
  if (data.add_power !== undefined) { fields.push('add_power = ?'); params.push(data.add_power) }
  if (data.total_amount !== undefined) { fields.push('total_amount = ?'); params.push(data.total_amount) }
  if (data.paid_amount !== undefined) { fields.push('paid_amount = ?'); params.push(data.paid_amount) }
  if (data.discount !== undefined) { fields.push('discount = ?'); params.push(data.discount) }
  if (data.payment_method !== undefined) { fields.push('payment_method = ?'); params.push(data.payment_method) }
  if (data.payment_status !== undefined) { fields.push('payment_status = ?'); params.push(data.payment_status) }
  if (data.priority !== undefined) { fields.push('priority = ?'); params.push(data.priority) }
  if (data.expected_date !== undefined) { fields.push('expected_date = ?'); params.push(data.expected_date) }
  if (data.notes !== undefined) { fields.push('notes = ?'); params.push(data.notes) }
  fields.push('updated_at = datetime(\"now\")')

  if (fields.length > 1) {
    params.push(id)
    db.prepare(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`).run(...params)
  }
  return getOrder(id)
}

function transitionOrder(id, action, userId, extraData = {}) {
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
  if (!existing) throw new NotFoundError('订单不存在')

  const transitions = {
    allocate_lens: {
      from: [config.orderStatus.PENDING],
      to: config.orderStatus.LENS_ALLOCATING,
      validate: (data) => {
        if (!data.lens_sku_id) throw new ValidationError('镜片SKU必填')
      }
    },
    confirm_lens: {
      from: [config.orderStatus.LENS_ALLOCATING],
      to: config.orderStatus.LENS_ALLOCATED,
      validate: () => {}
    },
    shortage_lens: {
      from: [config.orderStatus.LENS_ALLOCATING],
      to: config.orderStatus.LENS_SHORTAGE,
      validate: () => {}
    },
    start_processing: {
      from: [config.orderStatus.LENS_ALLOCATED],
      to: config.orderStatus.PROCESSING,
      validate: () => {}
    },
    start_quality_check: {
      from: [config.orderStatus.PROCESSING],
      to: config.orderStatus.QUALITY_CHECK,
      validate: () => {}
    },
    pass_quality: {
      from: [config.orderStatus.QUALITY_CHECK],
      to: config.orderStatus.READY,
      validate: () => {}
    },
    fail_quality: {
      from: [config.orderStatus.QUALITY_CHECK],
      to: config.orderStatus.PROCESSING,
      validate: (data) => {
        if (!data.reason) throw new ValidationError('不合格原因必填')
      }
    },
    deliver: {
      from: [config.orderStatus.READY],
      to: config.orderStatus.DELIVERED,
      validate: () => {}
    },
    complete: {
      from: [config.orderStatus.DELIVERED],
      to: config.orderStatus.COMPLETED,
      validate: () => {}
    },
    cancel: {
      from: [config.orderStatus.PENDING, config.orderStatus.LENS_ALLOCATING, config.orderStatus.LENS_SHORTAGE],
      to: config.orderStatus.CANCELLED,
      validate: () => {}
    }
  }

  const rule = transitions[action]
  if (!rule) throw new ValidationError(`非法操作: ${action}`)
  if (!rule.from.includes(existing.status)) {
    throw new StateConflictError(`订单状态 ${existing.status} 不允许执行 ${action}`, {
      current_status: existing.status,
      allowed_from: rule.from
    })
  }

  rule.validate(extraData)

  const tx = db.transaction(() => {
    db.prepare('UPDATE orders SET status = ?, updated_at = datetime(\"now\") WHERE id = ?').run(rule.to, id)
    recordStatusHistory(id, existing.status, rule.to, userId, extraData.reason)

    if (action === 'start_processing') {
      db.prepare(`
        INSERT INTO processing_records (id, order_id, processor_id, processing_type, status, started_at)
        VALUES (?, ?, ?, ?, ?, datetime(\"now\"))
      `).run(uuidv4(), id, existing.processor_id, 'standard', 'in_progress')
    }

    if (action === 'pass_quality' || action === 'fail_quality') {
      const pr = db.prepare('SELECT * FROM processing_records WHERE order_id = ? ORDER BY created_at DESC LIMIT 1').get(id)
      if (pr) {
        db.prepare(`
          UPDATE processing_records SET quality_check_by = ?, quality_check_result = ?, quality_check_notes = ?, completed_at = datetime(\"now\"), status = ?
          WHERE id = ?
        `).run(userId, action === 'pass_quality' ? 'pass' : 'fail', extraData.reason || null, 'completed', pr.id)
      }
    }

    if (action === 'fail_quality') {
      db.prepare(`
        INSERT INTO reworks (id, order_id, processing_record_id, reason, rework_type, status, requested_by, requested_at, source)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime(\"now\"), ?)
      `).run(uuidv4(), id, pr?.id || null, extraData.reason, 'quality', config.reworkStatus.PENDING, userId, 'quality_check')
    }
  })

  try {
    tx()
  } catch (e) {
    if (e.isOperational) throw e
    throw e
  }

  return getOrder(id)
}

function allocateLens(orderId, data, userId) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)
  if (!order) throw new NotFoundError('订单不存在')
  if (order.status !== config.orderStatus.LENS_ALLOCATING) {
    throw new StateConflictError('当前订单状态不允许镜片调拨', { current_status: order.status })
  }
  if (!data.lens_sku_id) throw new ValidationError('镜片SKU必填')

  const sku = db.prepare('SELECT * FROM lens_sku WHERE id = ?').get(data.lens_sku_id)
  if (!sku) throw new ValidationError('镜片SKU不存在')

  const allocId = uuidv4()
  const tx = db.transaction(() => {
    if (data.from_store_id && data.to_store_id) {
      db.prepare(`
        INSERT INTO lens_allocations (id, order_id, lens_sku_id, quantity, from_store_id, to_store_id, status, allocated_by, allocated_at, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime(\"now\"), ?)
      `).run(allocId, orderId, data.lens_sku_id, data.quantity || 1, data.from_store_id, data.to_store_id, 'pending', userId, data.notes || null)
    } else {
      if (sku.stock < (data.quantity || 1)) {
        throw new StockError('镜片库存不足', { sku_code: sku.sku_code, available: sku.stock, required: data.quantity || 1 })
      }
      db.prepare('UPDATE lens_sku SET stock = stock - ? WHERE id = ?').run(data.quantity || 1, data.lens_sku_id)
      db.prepare(`
        INSERT INTO lens_allocations (id, order_id, lens_sku_id, quantity, to_store_id, status, allocated_by, allocated_at, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime(\"now\"), ?)
      `).run(allocId, orderId, data.lens_sku_id, data.quantity || 1, order.store_id, 'allocated', userId, '直接出库')
    }

    db.prepare('UPDATE orders SET lens_sku_id = ?, updated_at = datetime(\"now\") WHERE id = ?').run(data.lens_sku_id, orderId)
  })

  try {
    tx()
  } catch (e) {
    if (e.isOperational) throw e
    throw new LensAllocationError('镜片调拨失败: ' + e.message)
  }

  return getOrder(orderId)
}

function receiveLens(allocationId, userId) {
  const alloc = db.prepare('SELECT * FROM lens_allocations WHERE id = ?').get(allocationId)
  if (!alloc) throw new NotFoundError('调拨记录不存在')
  if (alloc.status !== 'pending') throw new StateConflictError('调拨单已处理', { current_status: alloc.status })

  db.prepare('UPDATE lens_allocations SET status = ?, received_at = datetime(\"now\") WHERE id = ?').run('received', allocationId)
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(alloc.order_id)
  if (order) {
    createAuditLog({ userId, action: 'lens_received', resourceType: 'lens_allocation', resourceId: allocationId })
  }
  return getOrder(alloc.order_id)
}

function getOrderStats(storeId) {
  const where = storeId ? 'WHERE store_id = ?' : ''
  const params = storeId ? [storeId] : []

  const byStatus = db.prepare(`
    SELECT status, COUNT(*) AS count FROM orders ${where} GROUP BY status
  `).all(...params)

  const byPriority = db.prepare(`
    SELECT priority, COUNT(*) AS count FROM orders ${where} GROUP BY priority
  `).all(...params)

  const today = new Date().toISOString().slice(0, 10)
  const todayOrders = db.prepare(`
    SELECT COUNT(*) AS count FROM orders WHERE DATE(created_at) = ? ${storeId ? 'AND store_id = ?' : ''}
  `).get(today, ...(storeId ? [storeId] : []))

  const pendingLens = db.prepare(`
    SELECT COUNT(*) AS count FROM orders WHERE status = ? ${storeId ? 'AND store_id = ?' : ''}
  `).get(config.orderStatus.LENS_SHORTAGE, ...(storeId ? [storeId] : []))

  return { by_status: byStatus, by_priority: byPriority, today_count: todayOrders.count, lens_shortage: pendingLens.count }
}

module.exports = {
  listOrders,
  getOrder,
  createOrder,
  updateOrder,
  transitionOrder,
  allocateLens,
  receiveLens,
  getOrderStats,
  recordStatusHistory
}
