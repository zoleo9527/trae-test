import { db } from '../db/schema.js'
import { Router, type Request, type Response } from 'express'

const router = Router()

const ROLE_NAME: Record<string, string> = {
  manager: '店长·周嘉诚',
  selector: '选片师·江书言',
  butler: '客服管家·谢予安',
}

function roleName(role: string) {
  return ROLE_NAME[role] || role
}

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

function pushEvent(orderId: string, type: string, actorRole: string, payload: any) {
  const id = newId('e')
  const at = new Date().toISOString()
  db.prepare(
    `INSERT INTO timeline_events (id, order_id, type, actor_role, actor_name, at, payload)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, orderId, type, actorRole, roleName(actorRole), at, JSON.stringify(payload))
  return id
}

function touchOrder(orderId: string) {
  db.prepare(`UPDATE orders SET updated_at = ? WHERE id = ?`).run(new Date().toISOString(), orderId)
}

router.get('/orders', (req: Request, res: Response) => {
  const rows = db
    .prepare(
      `SELECT o.*,
        (SELECT COUNT(*) FROM timeline_events WHERE order_id = o.id) as event_count,
        (SELECT COUNT(*) FROM reschedule_requests WHERE order_id = o.id AND status = 'pending') as pending_reschedule_count,
        (SELECT MAX(version_no) FROM retouch_versions WHERE order_id = o.id) as latest_retouch_version
       FROM orders o
       ORDER BY o.shoot_date DESC`
    )
    .all()
  res.json({ success: true, data: rows })
})

router.get('/orders/:id', (req: Request, res: Response) => {
  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(req.params.id)
  if (!order) return res.status(404).json({ success: false, error: '订单不存在' })
  const events = db
    .prepare(`SELECT * FROM timeline_events WHERE order_id = ? ORDER BY at ASC`)
    .all(req.params.id)
  const reschedules = db
    .prepare(`SELECT * FROM reschedule_requests WHERE order_id = ? ORDER BY created_at ASC`)
    .all(req.params.id)
  const collections = db
    .prepare(`SELECT * FROM collection_records WHERE order_id = ? ORDER BY created_at DESC`)
    .all(req.params.id)
  const retouches = db
    .prepare(`SELECT * FROM retouch_versions WHERE order_id = ? ORDER BY version_no DESC`)
    .all(req.params.id)
  res.json({ success: true, data: { order, events, reschedules, collections, retouches } })
})

router.post('/orders/:id/note', (req: Request, res: Response) => {
  const { content, actorRole } = req.body as { content: string; actorRole: string }
  if (!content?.trim()) return res.status(400).json({ success: false, error: '内容不能为空' })
  pushEvent(req.params.id, 'note', actorRole || 'butler', { content: content.trim() })
  touchOrder(req.params.id)
  res.json({ success: true })
})

router.post('/orders/:id/remind', (req: Request, res: Response) => {
  const { actorRole } = req.body as { actorRole: string }
  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(req.params.id) as any
  if (!order) return res.status(404).json({ success: false, error: '订单不存在' })
  pushEvent(req.params.id, 'remind', actorRole || 'butler', {
    content: `触发尾款催收提醒（当前级别 ${order.collection_level}）`,
  })
  db.prepare(`UPDATE orders SET collection_level = collection_level + 1, updated_at = ? WHERE id = ?`).run(
    new Date().toISOString(),
    req.params.id
  )
  res.json({ success: true })
})

router.get('/reschedules', (req: Request, res: Response) => {
  const rows = db
    .prepare(
      `SELECT r.*, o.customer_name, o.order_no, o.shoot_date as original_shoot_date
       FROM reschedule_requests r
       JOIN orders o ON o.id = r.order_id
       ORDER BY CASE r.status WHEN 'pending' THEN 0 ELSE 1 END, r.created_at DESC`
    )
    .all()
  res.json({ success: true, data: rows })
})

router.post('/reschedules', (req: Request, res: Response) => {
  const { orderId, from, to, reason, actorRole } = req.body as {
    orderId: string
    from: string
    to: string
    reason: string
    actorRole: string
  }
  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId) as any
  if (!order) return res.status(404).json({ success: false, error: '订单不存在' })
  const id = newId('rs')
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO reschedule_requests (id, order_id, suggested_from, suggested_to, reason, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'pending', ?)`
  ).run(id, orderId, from, to, reason, now)
  db.prepare(
    `UPDATE orders SET status = 'rescheduling', current_reschedule_id = ?, updated_at = ? WHERE id = ?`
  ).run(id, now, orderId)
  pushEvent(orderId, 'reschedule', actorRole || 'selector', {
    reschedule_id: id,
    action: 'created',
    from,
    to,
    reason,
  })
  res.json({ success: true, data: { id } })
})

router.post('/reschedules/:id/approve', (req: Request, res: Response) => {
  const { actorRole } = req.body as { actorRole: string }
  const r = db.prepare(`SELECT * FROM reschedule_requests WHERE id = ?`).get(req.params.id) as any
  if (!r) return res.status(404).json({ success: false, error: '改期申请不存在' })
  if (r.status !== 'pending') return res.status(400).json({ success: false, error: '申请已处理' })
  const now = new Date().toISOString()
  db.prepare(
    `UPDATE reschedule_requests SET status = 'approved', approver_role = ?, approver_name = ?, approved_at = ? WHERE id = ?`
  ).run(actorRole || 'manager', roleName(actorRole || 'manager'), now, req.params.id)
  db.prepare(
    `UPDATE orders SET shoot_date = ?, status = 'scheduled', current_reschedule_id = NULL, updated_at = ? WHERE id = ?`
  ).run(r.suggested_to, now, r.order_id)
  pushEvent(r.order_id, 'reschedule', actorRole || 'manager', {
    reschedule_id: r.id,
    action: 'approved',
  })
  pushEvent(r.order_id, 'status', actorRole || 'manager', {
    from: 'rescheduling',
    to: 'scheduled',
    note: `改期已确认，新档期：${r.suggested_to}`,
  })
  res.json({ success: true })
})

router.post('/reschedules/:id/reject', (req: Request, res: Response) => {
  const { rejectReason, actorRole } = req.body as { rejectReason: string; actorRole: string }
  const r = db.prepare(`SELECT * FROM reschedule_requests WHERE id = ?`).get(req.params.id) as any
  if (!r) return res.status(404).json({ success: false, error: '改期申请不存在' })
  if (r.status !== 'pending') return res.status(400).json({ success: false, error: '申请已处理' })
  db.prepare(
    `UPDATE reschedule_requests SET status = 'rejected', approver_role = ?, approver_name = ?, reject_reason = ?, approved_at = NULL WHERE id = ?`
  ).run(actorRole || 'manager', roleName(actorRole || 'manager'), rejectReason, req.params.id)
  db.prepare(
    `UPDATE orders SET status = CASE
       WHEN paid_amount = total_amount THEN 'completed'
       WHEN paid_amount > 0 AND paid_amount < total_amount THEN 'awaiting_payment'
       ELSE 'scheduled' END,
       current_reschedule_id = NULL, updated_at = ? WHERE id = ?`
  ).run(new Date().toISOString(), r.order_id)
  pushEvent(r.order_id, 'reschedule', actorRole || 'manager', {
    reschedule_id: r.id,
    action: 'rejected',
    reject_reason: rejectReason || '',
  })
  res.json({ success: true })
})

router.post('/collections', (req: Request, res: Response) => {
  const { orderId, method, result, remark, actorRole } = req.body as {
    orderId: string
    method: string
    result: string
    remark: string
    actorRole: string
  }
  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId) as any
  if (!order) return res.status(404).json({ success: false, error: '订单不存在' })
  const id = newId('cl')
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO collection_records (id, order_id, method, result, remark, actor_role, actor_name, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, orderId, method, result, remark || '', actorRole || 'butler', roleName(actorRole || 'butler'), now)
  pushEvent(orderId, 'collection', actorRole || 'butler', { method, result, remark: remark || '' })
  if (result === 'paid') {
    db.prepare(
      `UPDATE orders SET paid_amount = total_amount, status = 'completed', collection_level = 0, updated_at = ? WHERE id = ?`
    ).run(now, orderId)
    pushEvent(orderId, 'status', actorRole || 'butler', {
      from: order.status,
      to: 'completed',
      note: '尾款结清，订单完成',
    })
  }
  touchOrder(orderId)
  res.json({ success: true, data: { id } })
})

router.post('/retouches', (req: Request, res: Response) => {
  const { orderId, remark, actorRole } = req.body as {
    orderId: string
    remark: string
    actorRole: string
  }
  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId) as any
  if (!order) return res.status(404).json({ success: false, error: '订单不存在' })
  const last = db.prepare(`SELECT MAX(version_no) as v FROM retouch_versions WHERE order_id = ?`).get(
    orderId
  ) as { v: number } | null
  const next = (last?.v || 0) + 1
  const id = newId('rt')
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO retouch_versions (id, order_id, version_no, remark, created_at, actor_role, actor_name)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, orderId, next, remark || '', now, actorRole || 'selector', roleName(actorRole || 'selector'))
  pushEvent(orderId, 'retouch', actorRole || 'selector', {
    version_no: next,
    remark: remark || '',
  })
  touchOrder(orderId)
  res.json({ success: true, data: { id, version_no: next } })
})

router.get('/alerts', (_req: Request, res: Response) => {
  const overdue = db.prepare(`SELECT COUNT(*) as c FROM orders WHERE status = 'overdue'`).get() as { c: number }
  const pendingReschedule = db.prepare(
    `SELECT COUNT(*) as c FROM reschedule_requests WHERE status = 'pending'`
  ).get() as { c: number }
  const awaiting = db.prepare(`SELECT COUNT(*) as c FROM orders WHERE status = 'awaiting_payment'`).get() as {
    c: number
  }
  const rescheduling = db.prepare(`SELECT COUNT(*) as c FROM orders WHERE status = 'rescheduling'`).get() as {
    c: number
  }
  res.json({
    success: true,
    data: {
      overdue: overdue.c,
      pendingReschedule: pendingReschedule.c,
      awaitingPayment: awaiting.c,
      rescheduling: rescheduling.c,
    },
  })
})

router.get('/timeline', (_req: Request, res: Response) => {
  const rows = db
    .prepare(
      `SELECT t.*, o.customer_name, o.order_no
       FROM timeline_events t
       JOIN orders o ON o.id = t.order_id
       ORDER BY t.at DESC
       LIMIT 80`
    )
    .all()
  res.json({ success: true, data: rows })
})

export default router
