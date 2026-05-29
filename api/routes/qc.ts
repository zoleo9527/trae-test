import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db.js'

const router = Router()

router.post('/submit', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { roll_id, result, issue_desc, impact_scope, operator_id } = req.body

    if (!roll_id || !result || !operator_id) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const tx = db.transaction(() => {
      const id = uuidv4()
      const now = new Date().toISOString()

      db.prepare(`
        INSERT INTO qc_records (id, roll_id, result, issue_desc, impact_scope, operator_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, roll_id, result, issue_desc || '', impact_scope || '', operator_id, now)

      const actionType = result === 'pass' ? 'qc_pass' : 'qc_fail'
      const detail = result === 'pass' ? '质检通过' : `质检未通过: ${issue_desc || '有问题'}`
      db.prepare(`
        INSERT INTO actions (id, roll_id, action_type, operator_id, operator_role, detail, created_at)
        VALUES (?, ?, ?, ?, 'owner', ?, ?)
      `).run(uuidv4(), roll_id, actionType, operator_id, detail, now)

      const newStatus = result === 'pass' ? 'qc_passed' : 'qc_failed'
      db.prepare('UPDATE film_rolls SET status = ? WHERE id = ?').run(newStatus, roll_id)

      return db.prepare('SELECT * FROM qc_records WHERE id = ?').get(id)
    })

    const record = tx()
    res.status(201).json({ success: true, data: record })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.post('/rework-decision', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { qc_id, roll_id, decision, reason, decided_by } = req.body

    if (!qc_id || !roll_id || !decision || !decided_by) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const tx = db.transaction(() => {
      const id = uuidv4()
      const now = new Date().toISOString()

      db.prepare(`
        INSERT INTO rework_decisions (id, qc_id, roll_id, decision, reason, decided_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, qc_id, roll_id, decision, reason || '', decided_by, now)

      const detail = decision === 'rework' ? '店主决定返工重新冲扫' : decision === 'compensate' ? '店主决定进行赔付处理' : '店主决定通过质检'
      db.prepare(`
        INSERT INTO actions (id, roll_id, action_type, operator_id, operator_role, detail, created_at)
        VALUES (?, ?, 'rework_decide', ?, 'owner', ?, ?)
      `).run(uuidv4(), roll_id, decided_by, detail, now)

      if (decision === 'rework') {
        db.prepare('UPDATE film_rolls SET status = ? WHERE id = ?').run('reworking', roll_id)
      } else if (decision === 'compensate') {
        db.prepare('UPDATE film_rolls SET status = ? WHERE id = ?').run('compensating', roll_id)
      } else {
        db.prepare('UPDATE film_rolls SET status = ? WHERE id = ?').run('qc_passed', roll_id)
      }

      return db.prepare('SELECT * FROM rework_decisions WHERE id = ?').get(id)
    })

    const record = tx()
    res.status(201).json({ success: true, data: record })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.post('/rework-execute', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { decision_id, roll_id, action_detail, result, operator_id } = req.body

    if (!decision_id || !roll_id || !result || !operator_id) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const tx = db.transaction(() => {
      const id = uuidv4()
      const now = new Date().toISOString()

      db.prepare(`
        INSERT INTO rework_executions (id, decision_id, roll_id, action_detail, result, operator_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, decision_id, roll_id, action_detail || '', result, operator_id, now)

      const detail = result === 'completed' ? '返工完成' : '返工失败'
      db.prepare(`
        INSERT INTO actions (id, roll_id, action_type, operator_id, operator_role, detail, created_at)
        VALUES (?, ?, 'rework_execute', ?, 'developer', ?, ?)
      `).run(uuidv4(), roll_id, operator_id, `${detail}: ${action_detail || ''}`, now)

      db.prepare('UPDATE film_rolls SET status = ? WHERE id = ?').run('recheck', roll_id)

      return db.prepare('SELECT * FROM rework_executions WHERE id = ?').get(id)
    })

    const record = tx()
    res.status(201).json({ success: true, data: record })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.post('/recheck', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { execution_id, roll_id, result, note, checked_by, operator_role } = req.body

    if (!execution_id || !roll_id || !result || !checked_by) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const tx = db.transaction(() => {
      const id = uuidv4()
      const now = new Date().toISOString()

      db.prepare(`
        INSERT INTO recheck_records (id, execution_id, roll_id, result, note, checked_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, execution_id, roll_id, result, note || '', checked_by, now)

      const actionType = result === 'pass' ? 'recheck_pass' : 'recheck_fail'
      const detail = result === 'pass' ? '复检通过' : `复检未通过: ${note || ''}`
      db.prepare(`
        INSERT INTO actions (id, roll_id, action_type, operator_id, operator_role, detail, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), roll_id, actionType, checked_by, operator_role || 'owner', detail, now)

      if (result === 'pass') {
        db.prepare('UPDATE film_rolls SET status = ? WHERE id = ?').run('qc_passed', roll_id)
      } else {
        db.prepare('UPDATE film_rolls SET status = ? WHERE id = ?').run('reworking', roll_id)
      }

      return db.prepare('SELECT * FROM recheck_records WHERE id = ?').get(id)
    })

    const record = tx()
    res.status(201).json({ success: true, data: record })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

export default router
