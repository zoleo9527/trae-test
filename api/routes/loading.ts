import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'
import dayjs from 'dayjs'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const db = getDb()
  const { status, transfer_id } = req.query

  let sql = `SELECT lo.*, t.customer_name, t.species as transfer_species
    FROM loading_orders lo LEFT JOIN transfers t ON lo.transfer_id = t.id WHERE 1=1`
  const params: unknown[] = []

  if (status) {
    sql += ' AND lo.status = ?'
    params.push(status)
  }
  if (transfer_id) {
    sql += ' AND lo.transfer_id = ?'
    params.push(transfer_id)
  }

  sql += ' ORDER BY lo.created_at DESC'

  const rows = db.prepare(sql).all(...params)
  res.json({ success: true, data: rows })
})

router.get('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const order = db.prepare(
    `SELECT lo.*, t.customer_name, t.species as transfer_species
     FROM loading_orders lo LEFT JOIN transfers t ON lo.transfer_id = t.id WHERE lo.id = ?`
  ).get(req.params.id) as Record<string, unknown> | undefined

  if (!order) {
    res.json({ success: false, error: 'Loading order not found' })
    return
  }

  const items = db.prepare('SELECT * FROM loading_items WHERE loading_order_id = ?').all(req.params.id)

  res.json({ success: true, data: { ...order, items } })
})

router.post('/', (req: Request, res: Response) => {
  const db = getDb()
  const { transfer_id, vehicle_no, driver_name, created_by, items } = req.body

  if (!transfer_id || !created_by) {
    res.json({ success: false, error: 'Missing required fields: transfer_id, created_by' })
    return
  }

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

  const insertOrder = db.prepare(
    'INSERT INTO loading_orders (transfer_id, vehicle_no, driver_name, status, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const insertItem = db.prepare(
    'INSERT INTO loading_items (loading_order_id, species, planned_qty, actual_qty, difference_reason) VALUES (?, ?, ?, ?, ?)'
  )
  const updateTransfer = db.prepare(
    'UPDATE transfers SET status = ?, updated_at = ? WHERE id = ?'
  )

  let orderId: number | bigint

  db.transaction(() => {
    const result = insertOrder.run(transfer_id, vehicle_no || null, driver_name || null, '装车中', created_by, now)
    orderId = result.lastInsertRowid

    if (items && Array.isArray(items)) {
      for (const item of items) {
        insertItem.run(orderId, item.species, item.planned_qty || 0, item.actual_qty || 0, item.difference_reason || null)
      }
    }

    updateTransfer.run('运输中', now, transfer_id)
  })()

  res.json({ success: true, data: { id: orderId! } })
})

router.put('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const { vehicle_no, driver_name, status, items } = req.body

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const loadedAt = status === '已完成' ? now : null

  const getOrder = db.prepare('SELECT transfer_id FROM loading_orders WHERE id = ?')
  const updateOrder = db.prepare(
    `UPDATE loading_orders SET vehicle_no = COALESCE(?, vehicle_no), driver_name = COALESCE(?, driver_name),
     status = COALESCE(?, status), loaded_at = COALESCE(?, loaded_at) WHERE id = ?`
  )
  const updateItem = db.prepare(
    'UPDATE loading_items SET actual_qty = ?, difference_reason = ? WHERE id = ?'
  )
  const updateTransfer = db.prepare(
    'UPDATE transfers SET status = ?, updated_at = ? WHERE id = ?'
  )

  db.transaction(() => {
    const order = getOrder.get(req.params.id) as { transfer_id: number } | undefined
    if (!order) {
      return
    }

    const result = updateOrder.run(vehicle_no, driver_name, status, loadedAt, req.params.id)
    if (result.changes === 0) {
      return
    }

    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (item.id) {
          updateItem.run(item.actual_qty ?? 0, item.difference_reason || null, item.id)
        }
      }
    }

    if (status === '已完成') {
      updateTransfer.run('待跟进', now, order.transfer_id)
    }
  })()

  res.json({ success: true, data: { updated: true } })
})

export default router
