import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { status, search } = req.query

    let query = 'SELECT * FROM film_rolls'
    const params: string[] = []

    if (status || search) {
      query += ' WHERE 1=1'
      if (status) {
        query += ' AND status = ?'
        params.push(status as string)
      }
      if (search) {
        query += ' AND (customer_name LIKE ? OR roll_number LIKE ?)'
        params.push(`%${search}%`, `%${search}%`)
      }
    }

    query += ' ORDER BY registered_at DESC'

    const rolls = db.prepare(query).all(...params)
    res.json({ success: true, data: rolls })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { id } = req.params

    const roll = db.prepare('SELECT * FROM film_rolls WHERE id = ?').get(id)
    if (!roll) {
      res.status(404).json({ success: false, error: '胶卷不存在' })
      return
    }

    const actions = db.prepare('SELECT * FROM actions WHERE roll_id = ? ORDER BY created_at ASC').all(id)
    const qcRecords = db.prepare('SELECT * FROM qc_records WHERE roll_id = ? ORDER BY created_at DESC').all(id)
    const reworkDecisions = db.prepare('SELECT * FROM rework_decisions WHERE roll_id = ? ORDER BY created_at DESC').all(id)
    const reworkExecutions = db.prepare('SELECT * FROM rework_executions WHERE decision_id IN (SELECT id FROM rework_decisions WHERE roll_id = ?) ORDER BY created_at DESC').all(id)
    const recheckRecords = db.prepare('SELECT * FROM recheck_records WHERE execution_id IN (SELECT id FROM rework_executions WHERE decision_id IN (SELECT id FROM rework_decisions WHERE roll_id = ?)) ORDER BY created_at DESC').all(id)
    const confirmRequests = db.prepare('SELECT * FROM confirm_requests WHERE roll_id = ? ORDER BY created_at DESC').all(id)
    const confirmResults = db.prepare('SELECT * FROM confirm_results WHERE request_id IN (SELECT id FROM confirm_requests WHERE roll_id = ?) ORDER BY created_at DESC').all(id)
    const compensationRecords = db.prepare('SELECT * FROM compensation_records WHERE confirm_result_id IN (SELECT id FROM confirm_results WHERE request_id IN (SELECT id FROM confirm_requests WHERE roll_id = ?)) ORDER BY created_at DESC').all(id)

    res.json({
      success: true,
      data: Object.assign({}, roll, {
        actions,
        qc_records: qcRecords,
        rework_decisions: reworkDecisions,
        rework_executions: reworkExecutions,
        recheck_records: recheckRecords,
        confirm_requests: confirmRequests,
        confirm_results: confirmResults,
        compensation_records: compensationRecords,
      }),
    })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { customer_name, customer_contact, film_type, scan_spec, due_date, assignee_id, operator_id, operator_role, notes } = req.body

    if (!customer_name || !film_type || !scan_spec) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const tx = db.transaction(() => {
      const id = uuidv4()
      const now = new Date().toISOString()

      const datePrefix = new Date().toISOString().split('T')[0].replace(/-/g, '')
      const countResult = db.prepare("SELECT COUNT(*) as count FROM film_rolls WHERE roll_number LIKE ?").get(`A-${datePrefix}%`) as { count: number }
      const count = countResult.count
      const rollNumber = `A-${datePrefix}-${String(count + 1).padStart(3, '0')}`

      db.prepare(`
        INSERT INTO film_rolls (id, roll_number, customer_name, customer_contact, film_type, scan_spec, status, registered_at, due_date, assignee_id, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, rollNumber, customer_name, customer_contact || '', film_type, scan_spec, 'registered', now, due_date || null, assignee_id || null, notes || '')

      db.prepare(`
        INSERT INTO actions (id, roll_id, action_type, operator_id, operator_role, detail, created_at)
        VALUES (?, ?, 'register', ?, ?, '胶卷登记入库', ?)
      `).run(uuidv4(), id, operator_id || 'system', operator_role || 'owner', now)

      return db.prepare('SELECT * FROM film_rolls WHERE id = ?').get(id)
    })

    const roll = tx()
    res.status(201).json({ success: true, data: roll })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.patch('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { id } = req.params
    const { status, notes } = req.body

    const roll = db.prepare('SELECT * FROM film_rolls WHERE id = ?').get(id)
    if (!roll) {
      res.status(404).json({ success: false, error: '胶卷不存在' })
      return
    }

    const updates: string[] = []
    const params: string[] = []

    if (status) {
      updates.push('status = ?')
      params.push(status)
    }
    if (notes !== undefined) {
      updates.push('notes = ?')
      params.push(notes)
    }

    if (updates.length > 0) {
      params.push(id)
      db.prepare(`UPDATE film_rolls SET ${updates.join(', ')} WHERE id = ?`).run(...params)
    }

    const updated = db.prepare('SELECT * FROM film_rolls WHERE id = ?').get(id)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

export default router
