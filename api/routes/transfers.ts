import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'
import dayjs from 'dayjs'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const db = getDb()
  const { status } = req.query

  let sql = `SELECT t.*, p.name as plot_name, p.area as plot_area
    FROM transfers t LEFT JOIN plots p ON t.plot_id = p.id WHERE 1=1`
  const params: unknown[] = []

  if (status) {
    sql += ' AND t.status = ?'
    params.push(status)
  }

  sql += ' ORDER BY t.updated_at DESC'

  const rows = db.prepare(sql).all(...params)
  res.json({ success: true, data: rows })
})

router.get('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const transfer = db.prepare(
    `SELECT t.*, p.name as plot_name, p.area as plot_area
     FROM transfers t LEFT JOIN plots p ON t.plot_id = p.id WHERE t.id = ?`
  ).get(req.params.id)

  if (!transfer) {
    res.json({ success: false, error: 'Transfer not found' })
    return
  }

  const notes = db.prepare('SELECT * FROM transfer_notes WHERE transfer_id = ? ORDER BY created_at').all(req.params.id)
  const loadingOrders = db.prepare(
    `SELECT lo.*, (SELECT json_group_array(json_object('id', li.id, 'species', li.species, 'planned_qty', li.planned_qty, 'actual_qty', li.actual_qty, 'difference_reason', li.difference_reason))
     FROM loading_items li WHERE li.loading_order_id = lo.id) as items
     FROM loading_orders lo WHERE lo.transfer_id = ? ORDER BY lo.created_at`
  ).all(req.params.id)
  const followups = db.prepare('SELECT * FROM followups WHERE transfer_id = ? ORDER BY followup_at').all(req.params.id)

  res.json({ success: true, data: { ...transfer, notes, loadingOrders, followups } })
})

router.post('/', (req: Request, res: Response) => {
  const db = getDb()
  const { plot_id, customer_name, species, quantity, created_by, expected_date } = req.body

  if (!plot_id || !customer_name || !species || !quantity || !created_by) {
    res.json({ success: false, error: 'Missing required fields' })
    return
  }

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const result = db.prepare(
    'INSERT INTO transfers (plot_id, customer_name, species, quantity, status, created_by, expected_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(plot_id, customer_name, species, quantity, '待审批', created_by, expected_date || null, now, now)

  res.json({ success: true, data: { id: result.lastInsertRowid } })
})

router.put('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const { customer_name, species, quantity, expected_date } = req.body
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

  const result = db.prepare(
    `UPDATE transfers SET customer_name = COALESCE(?, customer_name), species = COALESCE(?, species),
     quantity = COALESCE(?, quantity), expected_date = COALESCE(?, expected_date), updated_at = ? WHERE id = ?`
  ).run(customer_name, species, quantity, expected_date, now, req.params.id)

  if (result.changes === 0) {
    res.json({ success: false, error: 'Transfer not found' })
    return
  }
  res.json({ success: true, data: { updated: true } })
})

router.post('/:id/approve', (req: Request, res: Response) => {
  const db = getDb()
  const { approved_by, action } = req.body

  if (!approved_by || !action) {
    res.json({ success: false, error: 'Missing required fields: approved_by, action' })
    return
  }

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const newStatus = action === 'approve' ? '进行中' : '已拒绝'

  const result = db.prepare(
    'UPDATE transfers SET status = ?, approved_by = ?, updated_at = ? WHERE id = ?'
  ).run(newStatus, approved_by, now, req.params.id)

  if (result.changes === 0) {
    res.json({ success: false, error: 'Transfer not found' })
    return
  }
  res.json({ success: true, data: { updated: true } })
})

router.post('/:id/notes', (req: Request, res: Response) => {
  const db = getDb()
  const { content, author, type } = req.body

  if (!content || !author) {
    res.json({ success: false, error: 'Missing required fields: content, author' })
    return
  }

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const result = db.prepare(
    'INSERT INTO transfer_notes (transfer_id, content, author, type, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(req.params.id, content, author, type || '备注', now)

  res.json({ success: true, data: { id: result.lastInsertRowid } })
})

export default router
