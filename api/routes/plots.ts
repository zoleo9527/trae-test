import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'
import dayjs from 'dayjs'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const db = getDb()
  const { species, status, search } = req.query

  let sql = 'SELECT * FROM plots WHERE 1=1'
  const params: unknown[] = []

  if (species) {
    sql += ' AND species = ?'
    params.push(species)
  }
  if (status) {
    sql += ' AND status = ?'
    params.push(status)
  }
  if (search) {
    sql += ' AND (name LIKE ? OR area LIKE ? OR responsible_person LIKE ?)'
    const like = `%${search}%`
    params.push(like, like, like)
  }

  sql += ' ORDER BY updated_at DESC'

  const rows = db.prepare(sql).all(...params)
  res.json({ success: true, data: rows })
})

router.get('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const plot = db.prepare('SELECT * FROM plots WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!plot) {
    res.json({ success: false, error: 'Plot not found' })
    return
  }

  const inventory = db.prepare('SELECT * FROM plot_inventory WHERE plot_id = ?').all(req.params.id)
  const statusLogs = db.prepare('SELECT * FROM plot_status_log WHERE plot_id = ? ORDER BY created_at DESC').all(req.params.id)

  res.json({ success: true, data: { ...plot, inventory, statusLogs } })
})

router.post('/', (req: Request, res: Response) => {
  const db = getDb()
  const { name, area, species, status, responsible_person } = req.body

  if (!name || !area || !species || !responsible_person) {
    res.json({ success: false, error: 'Missing required fields' })
    return
  }

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const result = db.prepare(
    'INSERT INTO plots (name, area, species, status, responsible_person, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(name, area, species, status || '在养', responsible_person, now, now)

  res.json({ success: true, data: { id: result.lastInsertRowid } })
})

router.put('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const { name, area, species, status, responsible_person } = req.body
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

  const result = db.prepare(
    'UPDATE plots SET name = COALESCE(?, name), area = COALESCE(?, area), species = COALESCE(?, species), status = COALESCE(?, status), responsible_person = COALESCE(?, responsible_person), updated_at = ? WHERE id = ?'
  ).run(name, area, species, status, responsible_person, now, req.params.id)

  if (result.changes === 0) {
    res.json({ success: false, error: 'Plot not found' })
    return
  }
  res.json({ success: true, data: { updated: true } })
})

router.post('/:id/status', (req: Request, res: Response) => {
  const db = getDb()
  const { from_status, to_status, reason, operator, note } = req.body

  if (!from_status || !to_status || !operator) {
    res.json({ success: false, error: 'Missing required fields: from_status, to_status, operator' })
    return
  }

  const plot = db.prepare('SELECT * FROM plots WHERE id = ?').get(req.params.id)
  if (!plot) {
    res.json({ success: false, error: 'Plot not found' })
    return
  }

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

  const updatePlot = db.prepare('UPDATE plots SET status = ?, updated_at = ? WHERE id = ?')
  const insertLog = db.prepare(
    'INSERT INTO plot_status_log (plot_id, from_status, to_status, reason, operator, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )

  db.transaction(() => {
    updatePlot.run(to_status, now, req.params.id)
    insertLog.run(req.params.id, from_status, to_status, reason || null, operator, note || null, now)
  })()

  res.json({ success: true, data: { updated: true } })
})

router.post('/:id/notes', (req: Request, res: Response) => {
  const db = getDb()
  const { content, author } = req.body

  if (!content || !author) {
    res.json({ success: false, error: 'Missing required fields: content, author' })
    return
  }

  const plot = db.prepare('SELECT * FROM plots WHERE id = ?').get(req.params.id) as { id: number; status: string; [key: string]: unknown } | undefined
  if (!plot) {
    res.json({ success: false, error: 'Plot not found' })
    return
  }

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

  const insertLog = db.prepare(
    'INSERT INTO plot_status_log (plot_id, from_status, to_status, reason, operator, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )

  insertLog.run(req.params.id, plot.status, plot.status, '备注', author, content, now)

  res.json({ success: true, data: { updated: true } })
})

export default router
