import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'
import dayjs from 'dayjs'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const db = getDb()
  const { status, transfer_id } = req.query

  let sql = `SELECT f.*, t.customer_name as transfer_customer, t.species as transfer_species
    FROM followups f LEFT JOIN transfers t ON f.transfer_id = t.id WHERE 1=1`
  const params: unknown[] = []

  if (status) {
    sql += ' AND f.status = ?'
    params.push(status)
  }
  if (transfer_id) {
    sql += ' AND f.transfer_id = ?'
    params.push(transfer_id)
  }

  sql += ' ORDER BY f.followup_at DESC'

  const rows = db.prepare(sql).all(...params)
  res.json({ success: true, data: rows })
})

router.post('/', (req: Request, res: Response) => {
  const db = getDb()
  const { transfer_id, customer_name, contact_result, satisfaction, issue_description, followup_by, followup_at, status } = req.body

  if (!transfer_id || !customer_name || !followup_by) {
    res.json({ success: false, error: 'Missing required fields: transfer_id, customer_name, followup_by' })
    return
  }

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const result = db.prepare(
    'INSERT INTO followups (transfer_id, customer_name, contact_result, satisfaction, issue_description, followup_by, followup_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(transfer_id, customer_name, contact_result || null, satisfaction || null, issue_description || null, followup_by, followup_at || now, status || '待回访')

  res.json({ success: true, data: { id: result.lastInsertRowid } })
})

router.put('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const { contact_result, satisfaction, issue_description, status } = req.body

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

  const getFollowup = db.prepare('SELECT transfer_id FROM followups WHERE id = ?')
  const updateFollowup = db.prepare(
    `UPDATE followups SET 
      contact_result = COALESCE(?, contact_result),
      satisfaction = COALESCE(?, satisfaction),
      issue_description = COALESCE(?, issue_description),
      status = COALESCE(?, status),
      followup_at = COALESCE(?, followup_at)
     WHERE id = ?`
  )
  const updateTransfer = db.prepare(
    'UPDATE transfers SET status = ?, updated_at = ? WHERE id = ?'
  )

  db.transaction(() => {
    const followup = getFollowup.get(req.params.id) as { transfer_id: number } | undefined
    if (!followup) {
      return
    }

    const result = updateFollowup.run(contact_result, satisfaction, issue_description, status, now, req.params.id)
    if (result.changes === 0) {
      return
    }

    if (status === '已完成') {
      updateTransfer.run('已完成', now, followup.transfer_id)
    }
  })()

  res.json({ success: true, data: { updated: true } })
})

export default router
