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
    b.code batch_code, b.fruit
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
  const rows = q(`SELECT l.*, b.code batch_code, b.fruit FROM losses l
    LEFT JOIN batches b ON b.id=l.batch_id ORDER BY l.found_at DESC`)
  res.json(rows)
})

app.post('/api/losses', (req, res) => {
  const { batch_id, found_at, kind, qty_kg, cause, amount, reviewed_by, note } = req.body
  const info = run(
    'INSERT INTO losses(batch_id,found_at,kind,qty_kg,cause,amount,reviewed_by,note) VALUES (?,?,?,?,?,?,?,?)',
    [batch_id, found_at, kind, qty_kg, cause, amount, reviewed_by, note]
  )
  res.json({ id: info.lastInsertRowid })
})

app.put('/api/losses/:id', (req, res) => {
  const { status, reviewed_by, note } = req.body
  const info = run('UPDATE losses SET status=COALESCE(?,status), reviewed_by=COALESCE(?,reviewed_by), note=COALESCE(?,note) WHERE id=?',
    [status, reviewed_by, note, req.params.id])
  res.json({ changes: info.changes })
})

app.get('/api/operators', (req, res) => {
  res.json(q('SELECT * FROM operators ORDER BY id'))
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
  q('SELECT * FROM batches WHERE id=?', [id]).forEach(b => rows.push({ at: b.received_at, type: 'batch', title: '到仓', detail: `${b.fruit} ${b.variety} 净重${b.net_kg}kg` }))
  q('SELECT * FROM stock_movements WHERE batch_id=? ORDER BY at', [id]).forEach(m => rows.push({ at: m.at, type: 'move', title: m.type === 'in' ? '入库' : '出库', detail: `${m.qty_kg}kg · ${m.operator || ''} · ${m.note || ''}` }))
  q('SELECT * FROM grading WHERE batch_id=? ORDER BY graded_at', [id]).forEach(g => rows.push({ at: g.graded_at, type: 'grade', title: `分级 ${g.grade}`, detail: `${g.qty_kg}kg · ${g.note || ''}` }))
  q('SELECT * FROM losses WHERE batch_id=? ORDER BY found_at', [id]).forEach(l => rows.push({ at: l.found_at, type: 'loss', title: `损耗 · ${l.kind}`, detail: `${l.qty_kg}kg · ${l.cause || ''} · 状态:${l.status}` }))
  q('SELECT * FROM picking WHERE batch_id=? ORDER BY picked_at', [id]).forEach(p => rows.push({ at: p.picked_at, type: 'pick', title: `配货`, detail: `${p.customer} ${p.qty_kg}kg ${p.grade || ''}` }))
  rows.sort((a, b) => a.at.localeCompare(b.at))
  res.json(rows)
})

const PORT = process.env.PORT || 4001
app.listen(PORT, () => console.log(`api on :${PORT}`))
