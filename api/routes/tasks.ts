import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'
import dayjs from 'dayjs'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const db = getDb()
  const { type, status, assignee } = req.query

  let sql = `SELECT t.*, p.name as plot_name, p.area as plot_area
    FROM tasks t LEFT JOIN plots p ON t.plot_id = p.id WHERE 1=1`
  const params: unknown[] = []

  if (type) {
    sql += ' AND t.type = ?'
    params.push(type)
  }
  if (status) {
    sql += ' AND t.status = ?'
    params.push(status)
  }
  if (assignee) {
    sql += ' AND t.assignee = ?'
    params.push(assignee)
  }

  sql += ' ORDER BY t.created_at DESC'

  const rows = db.prepare(sql).all(...params)
  res.json({ success: true, data: rows })
})

router.get('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const task = db.prepare(
    `SELECT t.*, p.name as plot_name, p.area as plot_area
     FROM tasks t LEFT JOIN plots p ON t.plot_id = p.id WHERE t.id = ?`
  ).get(req.params.id)

  if (!task) {
    res.json({ success: false, error: 'Task not found' })
    return
  }

  const notes = db.prepare('SELECT * FROM task_notes WHERE task_id = ? ORDER BY created_at').all(req.params.id)
  const diseaseReport = db.prepare('SELECT * FROM disease_reports WHERE task_id = ?').get(req.params.id)

  res.json({ success: true, data: { ...task, notes, diseaseReport } })
})

router.post('/', (req: Request, res: Response) => {
  const db = getDb()
  const { plot_id, transfer_id, type, title, assignee, priority, due_date } = req.body

  if (!plot_id || !type || !title || !assignee) {
    res.json({ success: false, error: 'Missing required fields' })
    return
  }

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const result = db.prepare(
    'INSERT INTO tasks (plot_id, transfer_id, type, title, status, assignee, priority, due_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(plot_id, transfer_id || null, type, title, '待处理', assignee, priority || '普通', due_date || null, now)

  res.json({ success: true, data: { id: result.lastInsertRowid } })
})

router.put('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const { title, assignee, priority, due_date, type } = req.body

  const result = db.prepare(
    `UPDATE tasks SET title = COALESCE(?, title), assignee = COALESCE(?, assignee),
     priority = COALESCE(?, priority), due_date = COALESCE(?, due_date), type = COALESCE(?, type) WHERE id = ?`
  ).run(title, assignee, priority, due_date, type, req.params.id)

  if (result.changes === 0) {
    res.json({ success: false, error: 'Task not found' })
    return
  }
  res.json({ success: true, data: { updated: true } })
})

router.post('/:id/status', (req: Request, res: Response) => {
  const db = getDb()
  const { status } = req.body

  if (!status) {
    res.json({ success: false, error: 'Missing required field: status' })
    return
  }

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const completedAt = ['已完成', '已关闭'].includes(status) ? now : null

  const result = db.prepare(
    'UPDATE tasks SET status = ?, completed_at = COALESCE(?, completed_at) WHERE id = ?'
  ).run(status, completedAt, req.params.id)

  if (result.changes === 0) {
    res.json({ success: false, error: 'Task not found' })
    return
  }
  res.json({ success: true, data: { updated: true } })
})

router.post('/:id/notes', (req: Request, res: Response) => {
  const db = getDb()
  const { content, author } = req.body

  if (!content || !author) {
    res.json({ success: false, error: 'Missing required fields: content, author' })
    return
  }

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const result = db.prepare(
    'INSERT INTO task_notes (task_id, content, author, created_at) VALUES (?, ?, ?, ?)'
  ).run(req.params.id, content, author, now)

  res.json({ success: true, data: { id: result.lastInsertRowid } })
})

export default router
