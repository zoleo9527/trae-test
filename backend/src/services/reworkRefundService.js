const { db } = require('../db')
const config = require('../config')
const { v4: uuidv4 } = require('uuid')
const { ValidationError, NotFoundError, StateConflictError } = require('../errors')
const orderService = require('./orderService')

function listReworks(filters = {}) {
  const where = []
  const params = []
  if (filters.store_id) {
    where.push('o.store_id = ?')
    params.push(filters.store_id)
  }
  if (filters.status) {
    where.push('r.status = ?')
    params.push(filters.status)
  }
  if (filters.order_id) {
    where.push('r.order_id = ?')
    params.push(filters.order_id)
  }
  if (filters.source) {
    where.push('r.source = ?')
    params.push(filters.source)
  }

  const whereSql = where.length > 0 ? 'WHERE ' + where.join(' AND ') : ''
  const limit = filters.limit ? 'LIMIT ?' : ''
  if (filters.limit) params.push(filters.limit)
  const offset = filters.offset ? 'OFFSET ?' : ''
  if (filters.offset) params.push(filters.offset)

  return db.prepare(`
    SELECT r.*, o.order_no, o.status AS order_status,
           c.name AS customer_name, s.name AS store_name,
           u.full_name AS requested_by_name,
           a.full_name AS approved_by_name
    FROM reworks r
    LEFT JOIN orders o ON r.order_id = o.id
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN stores s ON o.store_id = s.id
    LEFT JOIN users u ON r.requested_by = u.id
    LEFT JOIN users a ON r.approved_by = a.id
    ${whereSql}
    ORDER BY r.requested_at DESC
    ${limit} ${offset}
  `).all(...params)
}

function getRework(id) {
  const row = db.prepare(`
    SELECT r.*, o.order_no, o.status AS order_status,
           c.name AS customer_name, s.name AS store_name,
           u.full_name AS requested_by_name
    FROM reworks r
    LEFT JOIN orders o ON r.order_id = o.id
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN stores s ON o.store_id = s.id
    LEFT JOIN users u ON r.requested_by = u.id
    WHERE r.id = ?
  `).get(id)
  if (!row) throw new NotFoundError('返修单不存在')
  return row
}

function createRework(data, userId) {
  if (!data.order_id) throw new ValidationError('订单ID必填')
  if (!data.reason) throw new ValidationError('返修原因必填')

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(data.order_id)
  if (!order) throw new NotFoundError('订单不存在')

  const terminalStatuses = [config.orderStatus.REFUNDED, config.orderStatus.CANCELLED]
  if (terminalStatuses.includes(order.status)) {
    throw new StateConflictError('订单已终态，不可发起返修', { current_status: order.status })
  }

  const id = uuidv4()
  db.prepare(`
    INSERT INTO reworks (id, order_id, processing_record_id, reason, rework_type, status, requested_by, requested_at, source, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime(\"now\"), ?, ?)
  `).run(id, data.order_id, data.processing_record_id || null, data.reason,
    data.rework_type || 'general', config.reworkStatus.PENDING, userId,
    data.source || 'manual', data.remarks || null)

  orderService.recordStatusHistory(data.order_id, order.status, config.orderStatus.RETURNED, userId, '返修发起: ' + data.reason)
  db.prepare('UPDATE orders SET status = ?, updated_at = datetime(\"now\") WHERE id = ?').run(config.orderStatus.RETURNED, data.order_id)

  return getRework(id)
}

function processRework(id, action, userId, data = {}) {
  const rework = db.prepare('SELECT * FROM reworks WHERE id = ?').get(id)
  if (!rework) throw new NotFoundError('返修单不存在')

  const actions = {
    approve: {
      from: [config.reworkStatus.PENDING],
      to: config.reworkStatus.APPROVED,
      postProcess: () => {
        db.prepare('UPDATE orders SET status = ?, updated_at = datetime(\"now\") WHERE id = ?').run(config.orderStatus.PROCESSING, rework.order_id)
        orderService.recordStatusHistory(rework.order_id, config.orderStatus.RETURNED, config.orderStatus.PROCESSING, userId, '返修已批准')
        db.prepare(`
          INSERT INTO processing_records (id, order_id, processor_id, processing_type, status, started_at, remarks)
          VALUES (?, ?, ?, ?, ?, datetime(\"now\"), ?)
        `).run(uuidv4(), rework.order_id, data.processor_id || null, 'rework', 'in_progress', '返修加工: ' + (data.remarks || ''))
      }
    },
    reject: {
      from: [config.reworkStatus.PENDING],
      to: config.reworkStatus.REJECTED,
      postProcess: () => {
        db.prepare('UPDATE orders SET status = ?, updated_at = datetime(\"now\") WHERE id = ?').run(config.orderStatus.READY, rework.order_id)
        orderService.recordStatusHistory(rework.order_id, config.orderStatus.RETURNED, config.orderStatus.READY, userId, '返修被拒绝: ' + (data.reason || ''))
      }
    },
    complete: {
      from: [config.reworkStatus.APPROVED, config.reworkStatus.REPROCESSING],
      to: config.reworkStatus.COMPLETED,
      postProcess: () => {
        db.prepare('UPDATE orders SET status = ?, updated_at = datetime(\"now\") WHERE id = ?').run(config.orderStatus.READY, rework.order_id)
        orderService.recordStatusHistory(rework.order_id, config.orderStatus.PROCESSING, config.orderStatus.READY, userId, '返修完成')
      }
    }
  }

  const rule = actions[action]
  if (!rule) throw new ValidationError(`非法操作: ${action}`)
  if (!rule.from.includes(rework.status)) {
    throw new StateConflictError(`返修单状态 ${rework.status} 不允许 ${action}`, {
      current_status: rework.status,
      allowed_from: rule.from
    })
  }

  const tx = db.transaction(() => {
    db.prepare(`UPDATE reworks SET status = ?, approved_by = ?, approved_at = datetime(\"now\"), completed_at = datetime(\"now\") WHERE id = ?`)
      .run(rule.to, userId, id)
    if (rule.postProcess) rule.postProcess()
  })

  tx()
  return getRework(id)
}

function listRefunds(filters = {}) {
  const where = []
  const params = []
  if (filters.store_id) {
    where.push('o.store_id = ?')
    params.push(filters.store_id)
  }
  if (filters.status) {
    where.push('rf.status = ?')
    params.push(filters.status)
  }
  if (filters.order_id) {
    where.push('rf.order_id = ?')
    params.push(filters.order_id)
  }

  const whereSql = where.length > 0 ? 'WHERE ' + where.join(' AND ') : ''
  const limit = filters.limit ? 'LIMIT ?' : ''
  if (filters.limit) params.push(filters.limit)
  const offset = filters.offset ? 'OFFSET ?' : ''
  if (filters.offset) params.push(filters.offset)

  return db.prepare(`
    SELECT rf.*, o.order_no, o.status AS order_status, o.total_amount,
           c.name AS customer_name, s.name AS store_name,
           u.full_name AS requested_by_name
    FROM refunds rf
    LEFT JOIN orders o ON rf.order_id = o.id
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN stores s ON o.store_id = s.id
    LEFT JOIN users u ON rf.requested_by = u.id
    ${whereSql}
    ORDER BY rf.requested_at DESC
    ${limit} ${offset}
  `).all(...params)
}

function getRefund(id) {
  const row = db.prepare(`
    SELECT rf.*, o.order_no, o.status AS order_status, o.total_amount,
           c.name AS customer_name, s.name AS store_name,
           u.full_name AS requested_by_name
    FROM refunds rf
    LEFT JOIN orders o ON rf.order_id = o.id
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN stores s ON o.store_id = s.id
    LEFT JOIN users u ON rf.requested_by = u.id
    WHERE rf.id = ?
  `).get(id)
  if (!row) throw new NotFoundError('退款单不存在')
  return row
}

function createRefund(data, userId) {
  if (!data.order_id) throw new ValidationError('订单ID必填')
  if (!data.reason) throw new ValidationError('退款原因必填')
  if (!data.amount || data.amount <= 0) throw new ValidationError('退款金额必须大于0')

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(data.order_id)
  if (!order) throw new NotFoundError('订单不存在')

  if (data.amount > order.total_amount) {
    throw new ValidationError('退款金额不能超过订单总金额')
  }

  if (order.status === config.orderStatus.REFUNDED) {
    throw new StateConflictError('订单已退款，不可重复退款')
  }

  if (order.status === config.orderStatus.CANCELLED) {
    throw new StateConflictError('订单已取消，不可退款')
  }

  const id = uuidv4()
  db.prepare(`
    INSERT INTO refunds (id, order_id, rework_id, reason, amount, refund_method, status, requested_by, requested_at, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime(\"now\"), ?)
  `).run(id, data.order_id, data.rework_id || null, data.reason, data.amount,
    data.refund_method || null, config.refundStatus.PENDING, userId, data.remarks || null)

  orderService.recordStatusHistory(data.order_id, order.status, config.orderStatus.REFUNDING, userId, '发起退款: ' + data.reason)
  db.prepare('UPDATE orders SET status = ?, updated_at = datetime(\"now\") WHERE id = ?').run(config.orderStatus.REFUNDING, data.order_id)

  return getRefund(id)
}

function processRefund(id, action, userId, data = {}) {
  const refund = db.prepare('SELECT * FROM refunds WHERE id = ?').get(id)
  if (!refund) throw new NotFoundError('退款单不存在')

  const actions = {
    approve: {
      from: [config.refundStatus.PENDING],
      to: config.refundStatus.APPROVED
    },
    reject: {
      from: [config.refundStatus.PENDING, config.refundStatus.APPROVED],
      to: config.refundStatus.REJECTED
    },
    complete: {
      from: [config.refundStatus.APPROVED],
      to: config.refundStatus.COMPLETED
    }
  }

  const rule = actions[action]
  if (!rule) throw new ValidationError(`非法操作: ${action}`)
  if (!rule.from.includes(refund.status)) {
    throw new StateConflictError(`退款单状态 ${refund.status} 不允许 ${action}`, {
      current_status: refund.status,
      allowed_from: rule.from
    })
  }

  const tx = db.transaction(() => {
    db.prepare(`UPDATE refunds SET status = ?, approved_by = ?, approved_at = datetime(\"now\"), completed_at = datetime(\"now\") WHERE id = ?`)
      .run(rule.to, userId, id)

    if (action === 'complete') {
      db.prepare('UPDATE orders SET status = ?, updated_at = datetime(\"now\") WHERE id = ?').run(config.orderStatus.REFUNDED, refund.order_id)
      orderService.recordStatusHistory(refund.order_id, config.orderStatus.REFUNDING, config.orderStatus.REFUNDED, userId, '退款完成')
    } else if (action === 'reject') {
      db.prepare('UPDATE orders SET status = ?, updated_at = datetime(\"now\") WHERE id = ?').run(config.orderStatus.READY, refund.order_id)
      orderService.recordStatusHistory(refund.order_id, config.orderStatus.REFUNDING, config.orderStatus.READY, userId, '退款被拒绝: ' + (data.reason || ''))
    }
  })

  tx()
  return getRefund(id)
}

module.exports = {
  listReworks,
  getRework,
  createRework,
  processRework,
  listRefunds,
  getRefund,
  createRefund,
  processRefund
}
