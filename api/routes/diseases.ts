import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'
import dayjs from 'dayjs'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const db = getDb()
  const { status, severity, plot_id } = req.query

  let sql = `
    SELECT dr.*, p.name as plot_name, p.area as plot_area,
      t.title as task_title, t.status as task_status, t.assignee
    FROM disease_reports dr
    LEFT JOIN plots p ON dr.plot_id = p.id
    LEFT JOIN tasks t ON dr.task_id = t.id
    WHERE 1=1
  `
  const params: unknown[] = []

  if (status) {
    sql += ' AND dr.status = ?'
    params.push(status)
  }
  if (severity) {
    sql += ' AND dr.severity = ?'
    params.push(severity)
  }
  if (plot_id) {
    sql += ' AND dr.plot_id = ?'
    params.push(plot_id)
  }

  sql += ' ORDER BY dr.reported_at DESC'

  const rows = db.prepare(sql).all(...params)
  res.json(rows)
})

router.get('/:id', (req: Request, res: Response) => {
  const db = getDb()

  const report = db.prepare(`
    SELECT dr.*, p.name as plot_name, p.area as plot_area,
      t.title as task_title, t.status as task_status, t.assignee
    FROM disease_reports dr
    LEFT JOIN plots p ON dr.plot_id = p.id
    LEFT JOIN tasks t ON dr.task_id = t.id
    WHERE dr.id = ?
  `).get(req.params.id)

  if (!report) {
    res.json({ success: false, error: 'Disease report not found' })
    return
  }

  res.json(report)
})

router.post('/', (req: Request, res: Response) => {
  const db = getDb()
  const { plot_id, task_id, disease_type, severity, description, reported_by } = req.body

  if (!plot_id || !disease_type || !reported_by) {
    res.json({ success: false, error: 'Missing required fields: plot_id, disease_type, reported_by' })
    return
  }

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const result = db.prepare(
    'INSERT INTO disease_reports (plot_id, task_id, disease_type, severity, description, reported_by, reported_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(plot_id, task_id || null, disease_type, severity || '轻度', description || null, reported_by, now, '待确认')

  res.json({ success: true, data: { id: result.lastInsertRowid } })
})

router.put('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const { status, severity, description } = req.body

  const result = db.prepare(
    'UPDATE disease_reports SET status = COALESCE(?, status), severity = COALESCE(?, severity), description = COALESCE(?, description) WHERE id = ?'
  ).run(status, severity, description, req.params.id)

  if (result.changes === 0) {
    res.json({ success: false, error: 'Disease report not found' })
    return
  }

  res.json({ success: true, data: { updated: true } })
})

router.post('/:id/confirm', (req: Request, res: Response) => {
  const db = getDb()
  const { confirmed_by } = req.body

  if (!confirmed_by) {
    res.json({ success: false, error: 'Missing required field: confirmed_by' })
    return
  }

  const result = db.prepare(
    'UPDATE disease_reports SET status = ? WHERE id = ?'
  ).run('处理中', req.params.id)

  if (result.changes === 0) {
    res.json({ success: false, error: 'Disease report not found' })
    return
  }

  res.json({ success: true, data: { updated: true } })
})

router.post('/:id/resolve', (req: Request, res: Response) => {
  const db = getDb()
  const { resolved_by, resolution } = req.body

  if (!resolved_by) {
    res.json({ success: false, error: 'Missing required field: resolved_by' })
    return
  }

  const result = db.prepare(
    'UPDATE disease_reports SET status = ? WHERE id = ?'
  ).run('已解决', req.params.id)

  if (result.changes === 0) {
    res.json({ success: false, error: 'Disease report not found' })
    return
  }

  res.json({ success: true, data: { updated: true } })
})

export default router
