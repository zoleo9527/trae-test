const { db } = require('../db')
const config = require('../config')

function getDashboard(userId, role, storeId) {
  const today = new Date().toISOString().slice(0, 10)
  const now = new Date().toISOString()

  let storeFilter = ''
  const params = []
  if (role !== config.roles.ADMIN && storeId) {
    storeFilter = 'WHERE store_id = ?'
    params.push(storeId)
  }

  const appointmentStats = db.prepare(`
    SELECT status, COUNT(*) AS count
    FROM appointments
    ${storeFilter}
    GROUP BY status
  `).all(...params)

  const orderStats = db.prepare(`
    SELECT status, COUNT(*) AS count
    FROM orders
    ${storeFilter}
    GROUP BY status
  `).all(...params)

  const todayAppointments = db.prepare(`
    SELECT a.*, c.name AS customer_name, c.phone AS customer_phone
    FROM appointments a
    LEFT JOIN customers c ON a.customer_id = c.id
    WHERE a.scheduled_date = ? ${role !== config.roles.ADMIN && storeId ? 'AND a.store_id = ?' : ''}
    ORDER BY a.scheduled_time ASC
    LIMIT 20
  `).all(today, ...(role !== config.roles.ADMIN && storeId ? [storeId] : []))

  const overdueAppointments = db.prepare(`
    SELECT a.*, c.name AS customer_name
    FROM appointments a
    LEFT JOIN customers c ON a.customer_id = c.id
    WHERE a.status = ? ${role !== config.roles.ADMIN && storeId ? 'AND a.store_id = ?' : ''}
    ORDER BY a.scheduled_date ASC
    LIMIT 10
  `).all(config.appointmentStatus.OVERDUE, ...(role !== config.roles.ADMIN && storeId ? [storeId] : []))

  const lensShortageOrders = db.prepare(`
    SELECT o.*, c.name AS customer_name, s.name AS store_name
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN stores s ON o.store_id = s.id
    WHERE o.status = ?
    ORDER BY o.created_at DESC
    LIMIT 10
  `).all(config.orderStatus.LENS_SHORTAGE)

  const pendingReworks = db.prepare(`
    SELECT r.*, o.order_no, c.name AS customer_name, s.name AS store_name
    FROM reworks r
    LEFT JOIN orders o ON r.order_id = o.id
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN stores s ON o.store_id = s.id
    WHERE r.status = ?
    ORDER BY r.requested_at DESC
    LIMIT 10
  `).all(config.reworkStatus.PENDING)

  const pendingRefunds = db.prepare(`
    SELECT rf.*, o.order_no, c.name AS customer_name, s.name AS store_name
    FROM refunds rf
    LEFT JOIN orders o ON rf.order_id = o.id
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN stores s ON o.store_id = s.id
    WHERE rf.status = ?
    ORDER BY rf.requested_at DESC
    LIMIT 10
  `).all(config.refundStatus.PENDING)

  const myAssigned = {}
  if (role === config.roles.OPTICIAN) {
    myAssigned.appointments = db.prepare(`
      SELECT a.*, c.name AS customer_name
      FROM appointments a
      LEFT JOIN customers c ON a.customer_id = c.id
      WHERE a.optician_id = ? AND a.status IN (?, ?, ?)
      ORDER BY a.scheduled_date ASC, a.scheduled_time ASC
      LIMIT 10
    `).all(userId, config.appointmentStatus.CONFIRMED, config.appointmentStatus.IN_PROGRESS, config.appointmentStatus.OVERDUE)
  }
  if (role === config.roles.PROCESSOR) {
    myAssigned.orders = db.prepare(`
      SELECT o.*, c.name AS customer_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.processor_id = ? AND o.status IN (?, ?, ?)
      ORDER BY o.created_at DESC
      LIMIT 10
    `).all(userId, config.orderStatus.LENS_ALLOCATED, config.orderStatus.PROCESSING, config.orderStatus.QUALITY_CHECK)
  }

  return {
    summary: {
      appointment_stats: appointmentStats,
      order_stats: orderStats,
      overdue_count: overdueAppointments.length,
      lens_shortage_count: lensShortageOrders.length,
      pending_rework_count: pendingReworks.length,
      pending_refund_count: pendingRefunds.length
    },
    today_appointments: todayAppointments,
    overdue_appointments: overdueAppointments,
    lens_shortage_orders: lensShortageOrders,
    pending_reworks: pendingReworks,
    pending_refunds: pendingRefunds,
    my_assigned: myAssigned,
    generated_at: now
  }
}

function getStoreStats() {
  const stores = db.prepare('SELECT id, name FROM stores').all()
  const result = []
  for (const store of stores) {
    const orderStats = db.prepare(`
      SELECT status, COUNT(*) AS count FROM orders WHERE store_id = ? GROUP BY status
    `).all(store.id)
    const aptStats = db.prepare(`
      SELECT status, COUNT(*) AS count FROM appointments WHERE store_id = ? GROUP BY status
    `).all(store.id)
    result.push({
      store_id: store.id,
      store_name: store.name,
      orders: orderStats,
      appointments: aptStats
    })
  }
  return result
}

module.exports = { getDashboard, getStoreStats }
