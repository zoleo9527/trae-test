import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db.js'

const router = Router()

router.post('/', (req: Request, res: Response): void => {
  try {
    const { film_id, delivery_version } = req.body
    if (!film_id || !delivery_version) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const db = getDb()
    const film = db.prepare('SELECT id FROM film_rolls WHERE id = ?').get(film_id)
    if (!film) {
      res.status(404).json({ success: false, error: '胶卷不存在' })
      return
    }

    const id = uuidv4()
    const now = new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19)

    db.prepare(
      `INSERT INTO customer_confirmations (id, film_id, delivery_version, status, created_at)
       VALUES (?, ?, ?, '待确认', ?)`
    ).run(id, film_id, delivery_version, now)

    const confirmation = db.prepare('SELECT * FROM customer_confirmations WHERE id = ?').get(id)
    res.status(201).json({ success: true, data: confirmation })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { status } = req.query

    let sql = 'SELECT * FROM customer_confirmations WHERE 1=1'
    const params: unknown[] = []

    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }

    sql += ' ORDER BY created_at DESC'

    const confirmations = db.prepare(sql).all(...params)
    res.json({ success: true, data: confirmations })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.patch('/:id/confirm', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const confirmation = db.prepare('SELECT * FROM customer_confirmations WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!confirmation) {
      res.status(404).json({ success: false, error: '确认记录不存在' })
      return
    }

    const { customer_feedback } = req.body
    const now = new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19)

    db.prepare(
      `UPDATE customer_confirmations SET status = '已确认', customer_feedback = ?, confirmed_at = ? WHERE id = ?`
    ).run(customer_feedback || '', now, req.params.id)

    const updated = db.prepare('SELECT * FROM customer_confirmations WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.patch('/:id/reject', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const confirmation = db.prepare('SELECT * FROM customer_confirmations WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!confirmation) {
      res.status(404).json({ success: false, error: '确认记录不存在' })
      return
    }

    const { customer_feedback, reject_type } = req.body
    const now = new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19)

    const status = reject_type === '需返工' ? '需返工' : reject_type === '需赔付' ? '需赔付' : '不满意'

    db.prepare(
      `UPDATE customer_confirmations SET status = ?, customer_feedback = ?, confirmed_at = ? WHERE id = ?`
    ).run(status, customer_feedback || '', now, req.params.id)

    const updated = db.prepare('SELECT * FROM customer_confirmations WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.patch('/:id/compensate', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const confirmation = db.prepare('SELECT * FROM customer_confirmations WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!confirmation) {
      res.status(404).json({ success: false, error: '确认记录不存在' })
      return
    }

    const { compensation_amount, compensation_reason } = req.body
    if (!compensation_amount) {
      res.status(400).json({ success: false, error: '缺少赔付金额' })
      return
    }

    db.prepare(
      `UPDATE customer_confirmations SET compensation_amount = ?, compensation_reason = ?, status = '需赔付' WHERE id = ?`
    ).run(compensation_amount, compensation_reason || '', req.params.id)

    const updated = db.prepare('SELECT * FROM customer_confirmations WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

export default router
