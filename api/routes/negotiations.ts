import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'
import dayjs from 'dayjs'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const db = getDb()
  const { status, type } = req.query

  let sql = `
    SELECT n.*, f.customer_name, f.issue_description,
      dr.disease_type, dr.severity
    FROM negotiations n
    LEFT JOIN followups f ON n.followup_id = f.id
    LEFT JOIN disease_reports dr ON n.disease_report_id = dr.id
    WHERE 1=1
  `
  const params: unknown[] = []

  if (status) {
    sql += ' AND n.status = ?'
    params.push(status)
  }
  if (type) {
    sql += ' AND n.type = ?'
    params.push(type)
  }

  sql += ' ORDER BY n.created_at DESC'

  const rows = db.prepare(sql).all(...params)

  const negotiations = rows.map((row: any) => {
    const notes = db.prepare('SELECT * FROM negotiation_notes WHERE negotiation_id = ? ORDER BY created_at').all(row.id)
    return { ...row, notes }
  })

  res.json(negotiations)
})

router.get('/:id', (req: Request, res: Response) => {
  const db = getDb()

  const negotiation = db.prepare(`
    SELECT n.*, f.customer_name, f.issue_description,
      dr.disease_type, dr.severity
    FROM negotiations n
    LEFT JOIN followups f ON n.followup_id = f.id
    LEFT JOIN disease_reports dr ON n.disease_report_id = dr.id
    WHERE n.id = ?
  `).get(req.params.id)

  if (!negotiation) {
    res.json({ success: false, error: 'Negotiation not found' })
    return
  }

  const notes = db.prepare('SELECT * FROM negotiation_notes WHERE negotiation_id = ? ORDER BY created_at').all(req.params.id)

  res.json({ ...negotiation, notes })
})

router.post('/', (req: Request, res: Response) => {
  const db = getDb()
  const { followup_id, disease_report_id, type, negotiated_by } = req.body

  if (!negotiated_by) {
    res.json({ success: false, error: 'Missing required field: negotiated_by' })
    return
  }

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const result = db.prepare(
    'INSERT INTO negotiations (followup_id, disease_report_id, type, status, negotiated_by, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(followup_id || null, disease_report_id || null, type || '补苗协商', '协商中', negotiated_by, now)

  res.json({ success: true, data: { id: result.lastInsertRowid } })
})

router.put('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const { status, result } = req.body

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const resolvedAt = status === '已解决' ? now : null

  const resultUpdate = db.prepare(
    'UPDATE negotiations SET status = COALESCE(?, status), result = COALESCE(?, result), resolved_at = COALESCE(?, resolved_at) WHERE id = ?'
  ).run(status, result, resolvedAt, req.params.id)

  if (resultUpdate.changes === 0) {
    res.json({ success: false, error: 'Negotiation not found' })
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
    'INSERT INTO negotiation_notes (negotiation_id, content, author, created_at) VALUES (?, ?, ?, ?)'
  ).run(req.params.id, content, author, now)

  res.json({ success: true, data: { id: result.lastInsertRowid } })
})

export default router
