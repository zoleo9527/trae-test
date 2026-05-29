import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { limit = 50 } = req.query

    const actions = db.prepare(`
      SELECT a.*, fr.roll_number, fr.customer_name
      FROM actions a
      LEFT JOIN film_rolls fr ON a.roll_id = fr.id
      ORDER BY a.created_at DESC
      LIMIT ?
    `).all(Number(limit))

    res.json({ success: true, data: actions })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { roll_id, action_type, operator_id, operator_role, detail } = req.body

    if (!roll_id || !action_type || !operator_id) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const id = uuidv4()
    const now = new Date().toISOString()

    db.prepare(`
      INSERT INTO actions (id, roll_id, action_type, operator_id, operator_role, detail, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, roll_id, action_type, operator_id, operator_role || 'owner', detail || '', now)

    const action = db.prepare('SELECT * FROM actions WHERE id = ?').get(id)
    res.status(201).json({ success: true, data: action })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.post('/develop', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { roll_id, operator_id, operator_role } = req.body

    if (!roll_id || !operator_id) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const tx = db.transaction(() => {
      const id = uuidv4()
      const now = new Date().toISOString()

      db.prepare(`
        INSERT INTO actions (id, roll_id, action_type, operator_id, operator_role, detail, created_at)
        VALUES (?, ?, 'develop', ?, ?, '开始冲扫', ?)
      `).run(id, roll_id, operator_id, operator_role || 'developer', now)

      db.prepare('UPDATE film_rolls SET status = ? WHERE id = ?').run('developing', roll_id)

      return db.prepare('SELECT * FROM actions WHERE id = ?').get(id)
    })

    const action = tx()
    res.status(201).json({ success: true, data: action })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/calendar', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { month } = req.query

    if (!month) {
      res.status(400).json({ success: false, error: '缺少月份参数' })
      return
    }

    const actions = db.prepare(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as action_count,
        GROUP_CONCAT(DISTINCT roll_id) as roll_ids_str
      FROM actions
      WHERE strftime('%Y-%m', created_at) = ?
      GROUP BY DATE(created_at)
      ORDER BY date
    `).all(month)

    const result = actions.map((a: any) => ({
      date: a.date,
      action_count: a.action_count,
      roll_ids: a.roll_ids_str ? a.roll_ids_str.split(',') : [],
    }))

    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/daily/:date', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { date } = req.params

    const actions = db.prepare(`
      SELECT a.*, fr.roll_number, fr.customer_name
      FROM actions a
      LEFT JOIN film_rolls fr ON a.roll_id = fr.id
      WHERE DATE(a.created_at) = ?
      ORDER BY a.created_at ASC
    `).all(date)

    res.json({ success: true, data: actions })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

export default router
