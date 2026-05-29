import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db.js'

const router = Router()

const STATUS_TRANSITIONS: Record<string, string[]> = {
  '待冲印': ['冲印中'],
  '冲印中': ['待扫描'],
  '待扫描': ['扫描中'],
  '扫描中': ['待质检'],
  '待质检': ['已质检'],
  '已质检': ['待交付'],
  '待交付': ['已交付'],
  '已交付': [],
}

router.post('/', (req: Request, res: Response): void => {
  try {
    const { brand, model, format, customer_name, customer_contact, process_type, scan_resolution } = req.body
    if (!brand || !model || !format || !customer_name || !customer_contact || !process_type || !scan_resolution) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const db = getDb()
    const id = uuidv4()
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')

    const countResult = db.prepare(
      "SELECT COUNT(*) as count FROM film_rolls WHERE roll_no LIKE ?"
    ).get(`FL-${dateStr}-%`) as { count: number }
    const seq = String(countResult.count + 1).padStart(3, '0')
    const roll_no = `FL-${dateStr}-${seq}`

    const createdAt = now.toISOString().replace('T', ' ').replace('Z', '').slice(0, 19)

    db.prepare(
      `INSERT INTO film_rolls (id, roll_no, brand, model, format, customer_name, customer_contact, process_type, scan_resolution, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '待冲印', ?, ?)`
    ).run(id, roll_no, brand, model, format, customer_name, customer_contact, process_type, scan_resolution, createdAt, createdAt)

    const operator = req.body.operator || '系统'
    const operatorRole = req.body.operator_role || '客服'
    db.prepare(
      `INSERT INTO action_logs (id, film_id, action_type, operator, operator_role, detail, created_at)
       VALUES (?, ?, '接单', ?, ?, ?, ?)`
    ).run(uuidv4(), id, operator, operatorRole, `新胶卷 ${roll_no} 已登记`, createdAt)

    const film = db.prepare('SELECT * FROM film_rolls WHERE id = ?').get(id)
    res.status(201).json({ success: true, data: film })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { status, search } = req.query

    let sql = 'SELECT * FROM film_rolls WHERE 1=1'
    const params: unknown[] = []

    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }
    if (search) {
      sql += ' AND (roll_no LIKE ? OR customer_name LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    sql += ' ORDER BY created_at DESC'

    const films = db.prepare(sql).all(...params)
    res.json({ success: true, data: films })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const film = db.prepare('SELECT * FROM film_rolls WHERE id = ?').get(req.params.id)
    if (!film) {
      res.status(404).json({ success: false, error: '胶卷不存在' })
      return
    }
    const logs = db.prepare('SELECT * FROM action_logs WHERE film_id = ? ORDER BY created_at ASC').all(req.params.id)
    res.json({ success: true, data: { ...(film as Record<string, unknown>), action_logs: logs } })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.patch('/:id/status', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const film = db.prepare('SELECT * FROM film_rolls WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!film) {
      res.status(404).json({ success: false, error: '胶卷不存在' })
      return
    }

    const { status, operator, operator_role, detail } = req.body
    if (!status) {
      res.status(400).json({ success: false, error: '缺少状态字段' })
      return
    }

    const currentStatus = film.status as string
    const allowed = STATUS_TRANSITIONS[currentStatus] || []
    if (!allowed.includes(status)) {
      res.status(400).json({ success: false, error: `状态不能从"${currentStatus}"变更为"${status}"` })
      return
    }

    const now = new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19)
    db.prepare('UPDATE film_rolls SET status = ?, updated_at = ? WHERE id = ?').run(status, now, req.params.id)

    db.prepare(
      `INSERT INTO action_logs (id, film_id, action_type, operator, operator_role, detail, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(uuidv4(), req.params.id, `状态变更为${status}`, operator || '系统', operator_role || '客服', detail || '', now)

    const updated = db.prepare('SELECT * FROM film_rolls WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.patch('/:id/assign', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const film = db.prepare('SELECT * FROM film_rolls WHERE id = ?').get(req.params.id)
    if (!film) {
      res.status(404).json({ success: false, error: '胶卷不存在' })
      return
    }

    const { assigned_processor, operator, operator_role } = req.body
    if (!assigned_processor) {
      res.status(400).json({ success: false, error: '缺少冲印师字段' })
      return
    }

    const now = new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19)
    db.prepare('UPDATE film_rolls SET assigned_processor = ?, updated_at = ? WHERE id = ?').run(assigned_processor, now, req.params.id)

    db.prepare(
      `INSERT INTO action_logs (id, film_id, action_type, operator, operator_role, detail, created_at)
       VALUES (?, ?, '分配冲印师', ?, ?, ?, ?)`
    ).run(uuidv4(), req.params.id, operator || '系统', operator_role || '店主', `分配冲印师: ${assigned_processor}`, now)

    const updated = db.prepare('SELECT * FROM film_rolls WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

export default router
