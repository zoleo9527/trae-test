import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db.js'

const router = Router()

router.post('/', (req: Request, res: Response): void => {
  try {
    const { film_id, issue_type, description, photo_urls, operator, operator_role } = req.body
    if (!film_id || !issue_type) {
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
      `INSERT INTO rework_orders (id, film_id, issue_type, description, photo_urls, status, created_at)
       VALUES (?, ?, ?, ?, ?, '待处理', ?)`
    ).run(id, film_id, issue_type, description || '', JSON.stringify(photo_urls || []), now)

    db.prepare(
      `INSERT INTO rework_logs (id, rework_id, action, operator, operator_role, detail, created_at)
       VALUES (?, ?, '创建返工单', ?, ?, ?, ?)`
    ).run(uuidv4(), id, operator || '系统', operator_role || '冲印师', `发现${issue_type}问题，创建返工单`, now)

    db.prepare(
      `INSERT INTO action_logs (id, film_id, action_type, operator, operator_role, detail, created_at)
       VALUES (?, ?, '创建返工单', ?, ?, ?, ?)`
    ).run(uuidv4(), film_id, '创建返工单', operator || '系统', operator_role || '冲印师', `发现${issue_type}问题`, now)

    const rework = db.prepare('SELECT * FROM rework_orders WHERE id = ?').get(id)
    res.status(201).json({ success: true, data: rework })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { status, issue_type } = req.query

    let sql = 'SELECT * FROM rework_orders WHERE 1=1'
    const params: unknown[] = []

    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }
    if (issue_type) {
      sql += ' AND issue_type = ?'
      params.push(issue_type)
    }

    sql += ' ORDER BY created_at DESC'

    const reworks = db.prepare(sql).all(...params)
    res.json({ success: true, data: reworks })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const rework = db.prepare('SELECT * FROM rework_orders WHERE id = ?').get(req.params.id)
    if (!rework) {
      res.status(404).json({ success: false, error: '返工单不存在' })
      return
    }
    const logs = db.prepare('SELECT * FROM rework_logs WHERE rework_id = ? ORDER BY created_at ASC').all(req.params.id)
    res.json({ success: true, data: { ...(rework as Record<string, unknown>), rework_logs: logs } })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.patch('/:id/approve', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const rework = db.prepare('SELECT * FROM rework_orders WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!rework) {
      res.status(404).json({ success: false, error: '返工单不存在' })
      return
    }
    if (rework.status !== '待处理') {
      res.status(400).json({ success: false, error: '当前状态不允许审批' })
      return
    }

    const { decision, decided_by, operator, operator_role } = req.body
    if (!decision || !decided_by) {
      res.status(400).json({ success: false, error: '缺少决策或审批人字段' })
      return
    }

    const now = new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19)
    db.prepare(
      `UPDATE rework_orders SET status = '店主已审批', decision = ?, decided_by = ? WHERE id = ?`
    ).run(decision, decided_by, req.params.id)

    db.prepare(
      `INSERT INTO rework_logs (id, rework_id, action, operator, operator_role, detail, created_at)
       VALUES (?, ?, '审批通过', ?, ?, ?, ?)`
    ).run(uuidv4(), req.params.id, operator || decided_by, operator_role || '店主', `审批决策: ${decision}`, now)

    const updated = db.prepare('SELECT * FROM rework_orders WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.patch('/:id/assign', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const rework = db.prepare('SELECT * FROM rework_orders WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!rework) {
      res.status(404).json({ success: false, error: '返工单不存在' })
      return
    }
    if (rework.status !== '店主已审批') {
      res.status(400).json({ success: false, error: '当前状态不允许分配' })
      return
    }

    const { assigned_to, operator, operator_role } = req.body
    if (!assigned_to) {
      res.status(400).json({ success: false, error: '缺少处理人字段' })
      return
    }

    const now = new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19)
    db.prepare(
      `UPDATE rework_orders SET assigned_to = ?, status = '处理中' WHERE id = ?`
    ).run(assigned_to, req.params.id)

    db.prepare(
      `INSERT INTO rework_logs (id, rework_id, action, operator, operator_role, detail, created_at)
       VALUES (?, ?, '分配处理人', ?, ?, ?, ?)`
    ).run(uuidv4(), req.params.id, operator || '系统', operator_role || '店主', `分配给: ${assigned_to}`, now)

    const updated = db.prepare('SELECT * FROM rework_orders WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.patch('/:id/execute', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const rework = db.prepare('SELECT * FROM rework_orders WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!rework) {
      res.status(404).json({ success: false, error: '返工单不存在' })
      return
    }
    if (rework.status !== '处理中') {
      res.status(400).json({ success: false, error: '当前状态不允许执行' })
      return
    }

    const { operator, operator_role, detail } = req.body
    const now = new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19)

    db.prepare(
      `UPDATE rework_orders SET status = '待复核' WHERE id = ?`
    ).run(req.params.id)

    db.prepare(
      `INSERT INTO rework_logs (id, rework_id, action, operator, operator_role, detail, created_at)
       VALUES (?, ?, '返工完成', ?, ?, ?, ?)`
    ).run(uuidv4(), req.params.id, operator || '系统', operator_role || '冲印师', detail || '返工处理完成', now)

    const updated = db.prepare('SELECT * FROM rework_orders WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.patch('/:id/review', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const rework = db.prepare('SELECT * FROM rework_orders WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!rework) {
      res.status(404).json({ success: false, error: '返工单不存在' })
      return
    }
    if (rework.status !== '待复核') {
      res.status(400).json({ success: false, error: '当前状态不允许复核' })
      return
    }

    const { passed, operator, operator_role, detail } = req.body
    const now = new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19)

    if (passed) {
      db.prepare(
        `UPDATE rework_orders SET status = '已闭环', resolved_at = ? WHERE id = ?`
      ).run(now, req.params.id)

      db.prepare(
        `INSERT INTO rework_logs (id, rework_id, action, operator, operator_role, detail, created_at)
         VALUES (?, ?, '复核通过', ?, ?, ?, ?)`
      ).run(uuidv4(), req.params.id, operator || '系统', operator_role || '店主', detail || '复核通过，返工闭环', now)
    } else {
      db.prepare(
        `UPDATE rework_orders SET status = '处理中' WHERE id = ?`
      ).run(req.params.id)

      db.prepare(
        `INSERT INTO rework_logs (id, rework_id, action, operator, operator_role, detail, created_at)
         VALUES (?, ?, '复核未通过', ?, ?, ?, ?)`
      ).run(uuidv4(), req.params.id, operator || '系统', operator_role || '店主', detail || '复核未通过，需重新处理', now)
    }

    const updated = db.prepare('SELECT * FROM rework_orders WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.patch('/:id/close', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const rework = db.prepare('SELECT * FROM rework_orders WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!rework) {
      res.status(404).json({ success: false, error: '返工单不存在' })
      return
    }

    const { operator, operator_role, detail } = req.body
    const now = new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19)

    db.prepare(
      `UPDATE rework_orders SET status = '已闭环', resolved_at = ? WHERE id = ?`
    ).run(now, req.params.id)

    db.prepare(
      `INSERT INTO rework_logs (id, rework_id, action, operator, operator_role, detail, created_at)
       VALUES (?, ?, '关闭返工单', ?, ?, ?, ?)`
    ).run(uuidv4(), req.params.id, operator || '系统', operator_role || '店主', detail || '返工单已关闭', now)

    const updated = db.prepare('SELECT * FROM rework_orders WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

export default router
