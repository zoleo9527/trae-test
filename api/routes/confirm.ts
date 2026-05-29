import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db.js'

const router = Router()

router.post('/request', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { roll_id, delivery_desc, operator_id } = req.body

    if (!roll_id || !operator_id) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const tx = db.transaction(() => {
      const id = uuidv4()
      const now = new Date().toISOString()

      db.prepare(`
        INSERT INTO confirm_requests (id, roll_id, delivery_desc, operator_id, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, roll_id, delivery_desc || '', operator_id, now)

      db.prepare(`
        INSERT INTO actions (id, roll_id, action_type, operator_id, operator_role, detail, created_at)
        VALUES (?, ?, 'confirm_request', ?, 'cs', ?, ?)
      `).run(uuidv4(), roll_id, operator_id, `发起客户确认: ${delivery_desc || ''}`, now)

      db.prepare('UPDATE film_rolls SET status = ? WHERE id = ?').run('confirming', roll_id)

      return db.prepare('SELECT * FROM confirm_requests WHERE id = ?').get(id)
    })

    const record = tx()
    res.status(201).json({ success: true, data: record })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.post('/result', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { request_id, roll_id, result, feedback, operator_id } = req.body

    if (!request_id || !roll_id || !result || !operator_id) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const tx = db.transaction(() => {
      const id = uuidv4()
      const now = new Date().toISOString()

      db.prepare(`
        INSERT INTO confirm_results (id, request_id, roll_id, result, feedback, operator_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, request_id, roll_id, result, feedback || '', operator_id, now)

      const actionType = result === 'satisfied' ? 'confirm_ok' : result === 'compensation' ? 'confirm_compensate' : 'confirm_ng'
      const detail = result === 'satisfied' ? '客户满意，确认完成' : result === 'compensation' ? '客户要求赔付' : `客户不满意: ${feedback || ''}`
      db.prepare(`
        INSERT INTO actions (id, roll_id, action_type, operator_id, operator_role, detail, created_at)
        VALUES (?, ?, ?, ?, 'cs', ?, ?)
      `).run(uuidv4(), roll_id, actionType, operator_id, detail, now)

      if (result === 'satisfied') {
        db.prepare('UPDATE film_rolls SET status = ? WHERE id = ?').run('completed', roll_id)
      } else if (result === 'compensation') {
        db.prepare('UPDATE film_rolls SET status = ? WHERE id = ?').run('compensating', roll_id)
      }

      return db.prepare('SELECT * FROM confirm_results WHERE id = ?').get(id)
    })

    const record = tx()
    res.status(201).json({ success: true, data: record })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.post('/compensate', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { confirm_result_id, roll_id, amount, method, reason, approved_by } = req.body

    if (!confirm_result_id || !roll_id || !amount || !method || !approved_by) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const tx = db.transaction(() => {
      const id = uuidv4()
      const now = new Date().toISOString()

      db.prepare(`
        INSERT INTO compensation_records (id, confirm_result_id, roll_id, amount, method, reason, approved_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, confirm_result_id, roll_id, amount, method, reason || '', approved_by, now)

      db.prepare(`
        INSERT INTO actions (id, roll_id, action_type, operator_id, operator_role, detail, created_at)
        VALUES (?, ?, 'compensate', ?, 'owner', ?, ?)
      `).run(uuidv4(), roll_id, approved_by, `赔付完成: ${method} ¥${amount}`, now)

      db.prepare('UPDATE film_rolls SET status = ? WHERE id = ?').run('completed', roll_id)

      return db.prepare('SELECT * FROM compensation_records WHERE id = ?').get(id)
    })

    const record = tx()
    res.status(201).json({ success: true, data: record })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

export default router
