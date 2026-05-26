const express = require('express')
const cors = require('cors')
const db = require('./db')

const app = express()
app.use(cors())
app.use(express.json())

const q = (sql, params = []) => db.prepare(sql).all(...params)
const q1 = (sql, params = []) => db.prepare(sql).get(...params)
const run = (sql, params = []) => db.prepare(sql).run(...params)

app.get('/api/kpis', (req, res) => {
  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString().slice(0, 10)
  const batchCount = q1('SELECT COUNT(*) c FROM batches').c
  const inThisMonth = q1(
    "SELECT COALESCE(SUM(qty_kg),0) s FROM stock_movements WHERE type='in' AND date(at) >= ?",
    [monthStart]
  ).s
  const outThisMonth = q1(
    "SELECT COALESCE(SUM(qty_kg),0) s FROM stock_movements WHERE type='out' AND date(at) >= ?",
    [monthStart]
  ).s
  const openCredits = q1(
    "SELECT COALESCE(SUM(amount),0) s FROM credits WHERE status='open' OR status='overdue'"
  ).s
  const overdue = q1(
    "SELECT COALESCE(SUM(amount),0) s FROM credits WHERE status='overdue'"
  ).s
  const pendingLoss = q1(
    "SELECT COALESCE(SUM(qty_kg),0) s FROM losses WHERE status='pending'"
  ).s
  const openClaims = q1(
    "SELECT COUNT(*) c FROM claims WHERE status IN ('open','reviewing')"
  ).c
  res.json({
    batchCount, inThisMonth, outThisMonth,
    openCredits, overdue, pendingLoss, openClaims
  })
})

app.get('/api/batches', (req, res) => {
  const rows = q(`SELECT b.*,
    (SELECT COALESCE(SUM(qty_kg),0) FROM stock_movements WHERE batch_id=b.id AND type='in') in_kg,
    (SELECT COALESCE(SUM(qty_kg),0) FROM stock_movements WHERE batch_id=b.id AND type='out') out_kg,
    (SELECT COALESCE(SUM(qty_kg),0) FROM losses WHERE batch_id=b.id) loss_kg,
    (SELECT COUNT(*) FROM grading WHERE batch_id=b.id) grade_cnt
    FROM batches b ORDER BY received_at DESC`)
  res.json(rows)
})

app.get('/api/batches/:id', (req, res) => {
  const b = q1('SELECT * FROM batches WHERE id=?', [req.params.id])
  if (!b) return res.status(404).json({ error: 'not found' })
  b.movements = q('SELECT * FROM stock_movements WHERE batch_id=? ORDER BY at', [b.id])
  b.gradings = q('SELECT * FROM grading WHERE batch_id=? ORDER BY graded_at', [b.id])
  b.losses = q('SELECT * FROM losses WHERE batch_id=? ORDER BY found_at', [b.id])
  b.pickings = q('SELECT * FROM picking WHERE batch_id=? ORDER BY picked_at', [b.id])
  res.json(b)
})

app.post('/api/batches', (req, res) => {
  const { code, fruit, variety, origin, supplier, received_at, gross_kg, tare_kg, unit_price, grade_rule, warehouse } = req.body
  const net = (gross_kg || 0) - (tare_kg || 0)
  const info = run(
    'INSERT INTO batches(code,fruit,variety,origin,supplier,received_at,gross_kg,tare_kg,net_kg,unit_price,grade_rule,warehouse) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
    [code, fruit, variety, origin, supplier, received_at, gross_kg, tare_kg, net, unit_price, grade_rule, warehouse]
  )
  res.json({ id: info.lastInsertRowid })
})

app.get('/api/movements', (req, res) => {
  const { from, to } = req.query
  const sql = `SELECT sm.*, b.code batch_code, b.fruit FROM stock_movements sm
    LEFT JOIN batches b ON b.id=sm.batch_id
    WHERE 1=1
    ${from ? 'AND date(sm.at) >= ?' : ''}
    ${to ? 'AND date(sm.at) <= ?' : ''}
    ORDER BY sm.at DESC`
  const params = [from, to].filter(Boolean)
  res.json(q(sql, params))
})

app.post('/api/movements', (req, res) => {
  const { batch_id, type, qty_kg, at, operator, note, ref } = req.body
  const info = run(
    'INSERT INTO stock_movements(batch_id,type,qty_kg,at,operator,note,ref) VALUES (?,?,?,?,?,?,?)',
    [batch_id, type, qty_kg, at, operator, note, ref]
  )
  res.json({ id: info.lastInsertRowid })
})

app.get('/api/gradings', (req, res) => {
  const rows = q(`SELECT g.*, b.code batch_code, b.fruit FROM grading g
    LEFT JOIN batches b ON b.id=g.batch_id ORDER BY g.graded_at DESC`)
  res.json(rows)
})

app.post('/api/gradings', (req, res) => {
  const { batch_id, graded_at, grade, qty_kg, operator, note } = req.body
  const info = run(
    'INSERT INTO grading(batch_id,graded_at,grade,qty_kg,operator,note) VALUES (?,?,?,?,?,?)',
    [batch_id, graded_at, grade, qty_kg, operator, note]
  )
  res.json({ id: info.lastInsertRowid })
})

app.get('/api/pickings', (req, res) => {
  const rows = q(`SELECT p.*, b.code batch_code, b.fruit FROM picking p
    LEFT JOIN batches b ON b.id=p.batch_id ORDER BY p.picked_at DESC`)
  res.json(rows)
})

app.post('/api/pickings', (req, res) => {
  const { batch_id, customer, order_no, picked_at, qty_kg, grade, driver, note } = req.body
  const info = run(
    'INSERT INTO picking(batch_id,customer,order_no,picked_at,qty_kg,grade,driver,note) VALUES (?,?,?,?,?,?,?,?)',
    [batch_id, customer, order_no, picked_at, qty_kg, grade, driver, note]
  )
  res.json({ id: info.lastInsertRowid })
})

app.get('/api/credits', (req, res) => {
  const rows = q(`SELECT c.*, p.order_no, p.qty_kg pick_qty, p.grade, p.customer,
    (SELECT COALESCE(SUM(amount),0) FROM payments WHERE credit_id=c.id) paid
    FROM credits c
    LEFT JOIN picking p ON p.id=c.picking_id
    ORDER BY c.issued_at DESC`)
  res.json(rows.map(r => ({ ...r, balance: r.amount - (r.paid || 0) })))
})

app.post('/api/credits', (req, res) => {
  const { customer, picking_id, amount, issued_at, due_at, note } = req.body
  const info = run(
    'INSERT INTO credits(customer,picking_id,amount,issued_at,due_at,note) VALUES (?,?,?,?,?,?)',
    [customer, picking_id, amount, issued_at, due_at, note]
  )
  res.json({ id: info.lastInsertRowid })
})

app.post('/api/payments', (req, res) => {
  const { credit_id, amount, paid_at, method, note } = req.body
  const tx = db.transaction(() => {
    run('INSERT INTO payments(credit_id,amount,paid_at,method,note) VALUES (?,?,?,?,?)',
      [credit_id, amount, paid_at, method, note])
    const c = q1('SELECT amount, (SELECT COALESCE(SUM(amount),0) FROM payments WHERE credit_id=?) paid FROM credits WHERE id=?',
      [credit_id, credit_id])
    const bal = c.amount - c.paid
    if (bal <= 0) {
      run("UPDATE credits SET status='settled', settled_at=COALESCE(settled_at, ?) WHERE id=?",
        [paid_at, credit_id])
    } else {
      run("UPDATE credits SET status='partial' WHERE id=?", [credit_id])
    }
  })
  tx()
  res.json({ ok: true })
})

app.get('/api/claims', (req, res) => {
  const rows = q(`SELECT cl.*, p.order_no, p.customer, p.qty_kg pick_qty,
    b.code batch_code, b.fruit,
    (SELECT GROUP_CONCAT(l.id || ':' || l.qty_kg || 'kg:' || l.status, ';') FROM losses l WHERE l.claim_id=cl.id) linked_losses
    FROM claims cl
    LEFT JOIN picking p ON p.id=cl.picking_id
    LEFT JOIN batches b ON b.id=p.batch_id
    ORDER BY cl.reported_at DESC`)
  res.json(rows)
})

app.post('/api/claims', (req, res) => {
  const { customer, picking_id, reported_at, reason, qty_kg, amount, note } = req.body
  const info = run(
    'INSERT INTO claims(customer,picking_id,reported_at,reason,qty_kg,amount,note) VALUES (?,?,?,?,?,?,?)',
    [customer, picking_id, reported_at, reason, qty_kg, amount, note]
  )
  res.json({ id: info.lastInsertRowid })
})

app.put('/api/claims/:id', (req, res) => {
  const { status, resolution } = req.body
  const info = run('UPDATE claims SET status=COALESCE(?,status), resolution=COALESCE(?,resolution) WHERE id=?',
    [status, resolution, req.params.id])
  res.json({ changes: info.changes })
})

app.get('/api/losses', (req, res) => {
  const rows = q(`SELECT l.*, b.code batch_code, b.fruit,
    cl.id claim_id, cl.reason claim_reason, cl.status claim_status, cl.customer claim_customer
    FROM losses l
    LEFT JOIN batches b ON b.id=l.batch_id
    LEFT JOIN claims cl ON cl.id=l.claim_id
    ORDER BY l.found_at DESC`)
  res.json(rows)
})

app.post('/api/losses', (req, res) => {
  const { batch_id, found_at, kind, qty_kg, cause, amount, reviewed_by, note, claim_id } = req.body
  const info = run(
    'INSERT INTO losses(batch_id,found_at,kind,qty_kg,cause,amount,reviewed_by,note,claim_id) VALUES (?,?,?,?,?,?,?,?,?)',
    [batch_id, found_at, kind, qty_kg, cause, amount, reviewed_by, note, claim_id || null]
  )
  res.json({ id: info.lastInsertRowid })
})

app.put('/api/losses/:id', (req, res) => {
  const { status, reviewed_by, note, claim_id } = req.body
  const info = run('UPDATE losses SET status=COALESCE(?,status), reviewed_by=COALESCE(?,reviewed_by), note=COALESCE(?,note), claim_id=COALESCE(?,claim_id) WHERE id=?',
    [status, reviewed_by, note, claim_id, req.params.id])
  res.json({ changes: info.changes })
})

app.get('/api/operators', (req, res) => {
  res.json(q('SELECT * FROM operators ORDER BY id'))
})

app.get('/api/day-actions', (req, res) => {
  const { date } = req.query
  if (!date) return res.status(400).json({ error: 'date required' })
  const actions = []
  q(`SELECT sm.*, b.code batch_code, b.fruit FROM stock_movements sm
    LEFT JOIN batches b ON b.id=sm.batch_id WHERE date(sm.at)=?`, [date])
    .forEach(m => actions.push({
      id: 'sm-' + m.id, type: 'move', at: m.at, kind: m.type,
      title: m.type === 'in' ? '入库' : '出库',
      detail: `${m.batch_code} ${m.fruit} ${m.qty_kg}kg · ${m.operator || ''}`,
      note: m.note, ref: m.ref, batch_id: m.batch_id
    }))
  q(`SELECT g.*, b.code batch_code, b.fruit FROM grading g
    LEFT JOIN batches b ON b.id=g.batch_id WHERE date(g.graded_at)=?`, [date])
    .forEach(g => actions.push({
      id: 'g-' + g.id, type: 'grade', at: g.graded_at, kind: 'grade',
      title: `分级 ${g.grade}`,
      detail: `${g.batch_code} ${g.fruit} ${g.qty_kg}kg · ${g.operator || ''}`,
      note: g.note, batch_id: g.batch_id
    }))
  q(`SELECT p.*, b.code batch_code, b.fruit FROM picking p
    LEFT JOIN batches b ON b.id=p.batch_id WHERE date(p.picked_at)=?`, [date])
    .forEach(p => actions.push({
      id: 'p-' + p.id, type: 'pick', at: p.picked_at, kind: 'pick',
      title: '配货',
      detail: `${p.customer} ${p.batch_code} ${p.fruit} ${p.qty_kg}kg ${p.grade || ''}`,
      note: p.note, batch_id: p.batch_id, picking_id: p.id
    }))
  q(`SELECT l.*, b.code batch_code, b.fruit,
    cl.customer claim_customer, cl.reason claim_reason, cb.code claim_batch_code
    FROM losses l
    LEFT JOIN batches b ON b.id=l.batch_id
    LEFT JOIN claims cl ON cl.id=l.claim_id
    LEFT JOIN picking cp ON cp.id=cl.picking_id
    LEFT JOIN batches cb ON cb.id=cp.batch_id
    WHERE date(l.found_at)=?`, [date])
    .forEach(l => {
      const claimLink = l.claim_id ? ` · 关联客诉#${l.claim_id}(${l.claim_customer}) · 客诉批次:${l.claim_batch_code}` : ''
      actions.push({
        id: 'l-' + l.id, type: 'loss', at: l.found_at, kind: 'loss',
        title: `损耗 · ${l.kind}`,
        detail: `${l.batch_code} ${l.fruit} ${l.qty_kg}kg · 状态:${l.status}${claimLink}`,
        note: l.note, batch_id: l.batch_id, claim_id: l.claim_id,
        claim_customer: l.claim_customer, claim_reason: l.claim_reason, claim_batch_code: l.claim_batch_code
      })
    })
  q(`SELECT cl.*, p.order_no, p.customer, b.code batch_code, b.fruit,
    (SELECT GROUP_CONCAT(lb.code || ':' || l.qty_kg || 'kg:' || l.status, ';')
     FROM losses l LEFT JOIN batches lb ON lb.id=l.batch_id WHERE l.claim_id=cl.id) linked_loss_summary
    FROM claims cl
    LEFT JOIN picking p ON p.id=cl.picking_id
    LEFT JOIN batches b ON b.id=p.batch_id WHERE date(cl.reported_at)=?`, [date])
    .forEach(cl => {
      const lossLink = cl.linked_loss_summary ? ` · 关联损耗:${cl.linked_loss_summary.split(';').map(s => { const [c,q,st] = s.split(':'); return `${c} ${q}(${st})`; }).join(', ')}` : ''
      actions.push({
        id: 'cl-' + cl.id, type: 'claim', at: cl.reported_at, kind: 'claim',
        title: '客诉',
        detail: `${cl.customer} ${cl.batch_code} ${cl.reason} · 争议¥${cl.amount || '-'}${lossLink}`,
        note: cl.note, batch_id: cl.batch_id, claim_id: cl.id,
        linked_loss_summary: cl.linked_loss_summary
      })
    })
  q(`SELECT c.*, p.order_no, p.customer, b.code batch_code, b.fruit FROM credits c
    LEFT JOIN picking p ON p.id=c.picking_id
    LEFT JOIN batches b ON b.id=p.batch_id WHERE date(c.issued_at)=?`, [date])
    .forEach(c => actions.push({
      id: 'c-' + c.id, type: 'credit', at: c.issued_at, kind: 'credit',
      title: '赊销开单',
      detail: `${c.customer} ¥${c.amount} · 到期${c.due_at}`,
      note: c.note, batch_id: c.batch_id, credit_id: c.id
    }))
  q(`SELECT py.*, c.customer, c.amount credit_amount, p.batch_id, b.code batch_code, b.fruit FROM payments py
    LEFT JOIN credits c ON c.id=py.credit_id
    LEFT JOIN picking p ON p.id=c.picking_id
    LEFT JOIN batches b ON b.id=p.batch_id WHERE date(py.paid_at)=?`, [date])
    .forEach(py => actions.push({
      id: 'py-' + py.id, type: 'payment', at: py.paid_at, kind: 'payment',
      title: '回款',
      detail: `${py.customer} ¥${py.amount} · ${py.method || ''}`,
      note: py.note, batch_id: py.batch_id, credit_id: py.credit_id
    }))
  q(`SELECT c.*, p.order_no, p.customer, b.code batch_code, b.fruit FROM credits c
    LEFT JOIN picking p ON p.id=c.picking_id
    LEFT JOIN batches b ON b.id=p.batch_id WHERE date(c.settled_at)=?`, [date])
    .forEach(c => actions.push({
      id: 'cs-' + c.id, type: 'settle', at: c.settled_at, kind: 'settle',
      title: '结算完成',
      detail: `${c.customer} ¥${c.amount} 已结清`,
      note: c.note, batch_id: c.batch_id, credit_id: c.id
    }))
  actions.sort((a, b) => a.at.localeCompare(b.at))
  res.json(actions)
})

app.get('/api/calendar', (req, res) => {
  const { y, m } = req.query
  const year = Number(y)
  const month = Number(m)
  const start = new Date(year, month - 1, 1).toISOString().slice(0, 10)
  const end = new Date(year, month, 0).toISOString().slice(0, 10)
  const events = []
  const sm = q(`SELECT date(at) d, type, COUNT(*) c FROM stock_movements
    WHERE date(at) BETWEEN ? AND ? GROUP BY date(at), type`, [start, end])
  sm.forEach(r => events.push({ date: r.d, kind: r.type === 'in' ? 'in' : 'out', count: r.c, label: r.type === 'in' ? '入库' : '出库' }))
  const lg = q(`SELECT date(found_at) d, COUNT(*) c FROM losses WHERE date(found_at) BETWEEN ? AND ? GROUP BY date(found_at)`, [start, end])
  lg.forEach(r => events.push({ date: r.d, kind: 'loss', count: r.c, label: '损耗' }))
  const st = q(`SELECT date(settled_at) d, COUNT(*) c FROM credits WHERE date(settled_at) BETWEEN ? AND ? GROUP BY date(settled_at)`, [start, end])
  st.forEach(r => events.push({ date: r.d, kind: 'settle', count: r.c, label: '结算' }))
  const cl = q(`SELECT date(reported_at) d, COUNT(*) c FROM claims WHERE date(reported_at) BETWEEN ? AND ? GROUP BY date(reported_at)`, [start, end])
  cl.forEach(r => events.push({ date: r.d, kind: 'claim', count: r.c, label: '客诉' }))
  const pay = q(`SELECT date(paid_at) d, COUNT(*) c FROM payments WHERE date(paid_at) BETWEEN ? AND ? GROUP BY date(paid_at)`, [start, end])
  pay.forEach(r => events.push({ date: r.d, kind: 'pay', count: r.c, label: '回款' }))
  res.json(events)
})

app.get('/api/timeline/:batchId', (req, res) => {
  const id = req.params.batchId
  const rows = []
  q('SELECT * FROM batches WHERE id=?', [id]).forEach(b => rows.push({
    at: b.received_at, type: 'batch', title: '到仓',
    detail: `${b.fruit} ${b.variety} 净重${b.net_kg}kg`
  }))
  q('SELECT * FROM stock_movements WHERE batch_id=? ORDER BY at', [id]).forEach(m => rows.push({
    at: m.at, type: 'move', title: m.type === 'in' ? '入库' : '出库',
    detail: `${m.qty_kg}kg · ${m.operator || ''} · ${m.note || ''}`,
    ref: m.ref
  }))
  q('SELECT * FROM grading WHERE batch_id=? ORDER BY graded_at', [id]).forEach(g => rows.push({
    at: g.graded_at, type: 'grade', title: `分级 ${g.grade}`,
    detail: `${g.qty_kg}kg · ${g.operator || ''} · ${g.note || ''}`
  }))
  q('SELECT * FROM picking WHERE batch_id=? ORDER BY picked_at', [id]).forEach(p => rows.push({
    at: p.picked_at, type: 'pick', title: '配货',
    detail: `${p.customer} ${p.qty_kg}kg ${p.grade || ''} · ${p.driver || ''}`,
    picking_id: p.id
  }))
  q(`SELECT c.*, p.id pid FROM credits c
    LEFT JOIN picking p ON p.id=c.picking_id WHERE p.batch_id=? ORDER BY c.issued_at`, [id])
    .forEach(c => rows.push({
      at: c.issued_at, type: 'credit', title: '赊销开单',
      detail: `${c.customer} ¥${c.amount} · 到期${c.due_at} · 状态:${c.status}`,
      credit_id: c.id
    }))
  q(`SELECT cl.*, b.code claim_batch_code, b.fruit claim_fruit,
    (SELECT GROUP_CONCAT(l.id || ':' || l.batch_id || ':' || lb.code || ':' || l.qty_kg || 'kg:' || l.status, ';')
     FROM losses l LEFT JOIN batches lb ON lb.id=l.batch_id WHERE l.claim_id=cl.id) linked_loss_detail
    FROM claims cl
    LEFT JOIN picking p ON p.id=cl.picking_id
    LEFT JOIN batches b ON b.id=p.batch_id
    WHERE p.batch_id=? ORDER BY cl.reported_at`, [id])
    .forEach(cl => {
      const losses = []
      if (cl.linked_loss_detail) {
        cl.linked_loss_detail.split(';').forEach(s => {
          const [lid, lbid, lbcode, lqty, lstatus] = s.split(':')
          losses.push({ id: lid, batch_id: lbid, batch_code: lbcode, qty_kg: lqty, status: lstatus })
        })
      }
      rows.push({
        at: cl.reported_at, type: 'claim', title: '客诉',
        detail: `${cl.customer} ${cl.reason} · ${cl.qty_kg || '-'}kg · 争议¥${cl.amount || '-'} · 状态:${cl.status}`,
        claim_id: cl.id, claim_batch_code: cl.claim_batch_code, claim_fruit: cl.claim_fruit,
        linked_losses: losses
      })
    })
  q(`SELECT l.*, cl.customer claim_customer, cl.reason claim_reason, cl.status claim_status,
    cb.code claim_batch_code, cb.fruit claim_fruit
    FROM losses l
    LEFT JOIN claims cl ON cl.id=l.claim_id
    LEFT JOIN picking cp ON cp.id=cl.picking_id
    LEFT JOIN batches cb ON cb.id=cp.batch_id
    WHERE l.batch_id=? ORDER BY l.found_at`, [id])
    .forEach(l => {
      const claimLink = l.claim_id
        ? ` · 关联客诉#${l.claim_id}(${l.claim_customer}) · 原因:${l.claim_reason} · 客诉批次:${l.claim_batch_code}`
        : ''
      rows.push({
        at: l.found_at, type: 'loss', title: `损耗 · ${l.kind}`,
        detail: `${l.qty_kg}kg · ${l.cause || ''} · 状态:${l.status}${claimLink}`,
        loss_id: l.id, claim_id: l.claim_id,
        claim_customer: l.claim_customer, claim_reason: l.claim_reason, claim_batch_code: l.claim_batch_code
      })
    })
  q(`SELECT py.*, c.customer, p.batch_id FROM payments py
    LEFT JOIN credits c ON c.id=py.credit_id
    LEFT JOIN picking p ON p.id=c.picking_id
    WHERE p.batch_id=? ORDER BY py.paid_at`, [id])
    .forEach(py => rows.push({
      at: py.paid_at, type: 'payment', title: '回款',
      detail: `${py.customer} ¥${py.amount} · ${py.method || ''} · ${py.note || ''}`,
      payment_id: py.id
    }))
  q(`SELECT c.*, p.batch_id FROM credits c
    LEFT JOIN picking p ON p.id=c.picking_id
    WHERE p.batch_id=? AND c.settled_at IS NOT NULL ORDER BY c.settled_at`, [id])
    .forEach(c => rows.push({
      at: c.settled_at, type: 'settle', title: '结算完成',
      detail: `${c.customer} ¥${c.amount} 已结清`,
      credit_id: c.id
    }))
  rows.sort((a, b) => a.at.localeCompare(b.at))
  res.json(rows)
})

const PORT = process.env.PORT || 4001
app.listen(PORT, () => console.log(`api on :${PORT}`))
