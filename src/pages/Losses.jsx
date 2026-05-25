import React, { useEffect, useState } from 'react'

export default function Losses() {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ batch_id: '', found_at: '', kind: '自然损耗', qty_kg: '', cause: '', amount: '', reviewed_by: '', note: '', claim_id: '' })
  useEffect(() => { fetch('/api/losses').then(r => r.json()).then(setRows) }, [])

  const submit = (e) => {
    e.preventDefault()
    fetch('/api/losses', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, qty_kg: Number(form.qty_kg) || 0, amount: Number(form.amount) || 0, claim_id: form.claim_id ? Number(form.claim_id) : null }) })
      .then(r => r.json()).then(() => {
        fetch('/api/losses').then(r => r.json()).then(setRows)
        setForm({ batch_id: '', found_at: '', kind: '自然损耗', qty_kg: '', cause: '', amount: '', reviewed_by: '', note: '', claim_id: '' })
      })
  }

  const update = (id, status) => {
    fetch(`/api/losses/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      .then(() => fetch('/api/losses').then(r => r.json()).then(setRows))
  }

  return (
    <div>
      <div className="head">
        <h1>损耗复核</h1>
        <div className="sub">冷库管理/档口发现损耗 → 档口负责人确认 → 与批次时间线关联；与客诉争议联动</div>
      </div>
      <div className="split">
        <div className="card">
          <h2>登记新损耗</h2>
          <form className="form-grid" onSubmit={submit}>
            <label>批次 ID</label><input value={form.batch_id} onChange={e => setForm({ ...form, batch_id: e.target.value })} required />
            <label>发现日期</label><input value={form.found_at} onChange={e => setForm({ ...form, found_at: e.target.value })} placeholder="2026-05-25" required />
            <label>类型</label>
            <select value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value })}>
              <option>自然损耗</option><option>配货损伤</option><option>客户损耗争议</option><option>库内温度异常</option><option>其他</option>
            </select>
            <label>数量kg</label><input type="number" step="0.1" value={form.qty_kg} onChange={e => setForm({ ...form, qty_kg: e.target.value })} required />
            <label>原因</label><input value={form.cause} onChange={e => setForm({ ...form, cause: e.target.value })} />
            <label>金额¥</label><input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            <label>复核人</label><input value={form.reviewed_by} onChange={e => setForm({ ...form, reviewed_by: e.target.value })} />
            <label>关联客诉 ID</label><input value={form.claim_id} onChange={e => setForm({ ...form, claim_id: e.target.value })} placeholder="可选，如 1" />
            <label>备注</label><textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
            <div /><button className="btn primary">登记</button>
          </form>
        </div>
        <div className="card">
          <h2>损耗列表</h2>
          <table>
            <thead>
              <tr><th>批次</th><th>发现</th><th>类型</th><th>kg</th><th>原因</th><th>关联客诉</th><th>复核人</th><th>状态</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map(l => (
                <tr key={l.id}>
                  <td className="small">{l.batch_code} {l.fruit}</td>
                  <td className="small">{l.found_at}</td>
                  <td>{l.kind}</td>
                  <td>{l.qty_kg}</td>
                  <td className="small">{l.cause}</td>
                  <td className="small">
                    {l.claim_id
                      ? <><span className="tag red">#{l.claim_id}</span> <span className="muted">{l.claim_customer}</span></>
                      : <span className="muted">—</span>}
                  </td>
                  <td>{l.reviewed_by || '-'}</td>
                  <td><span className={`tag ${l.status === 'confirmed' ? 'green' : l.status === 'pending' ? 'red' : 'yellow'}`}>{l.status}</span></td>
                  <td>
                    {l.status !== 'confirmed' && <button className="btn" onClick={() => update(l.id, 'confirmed')}>确认</button>}
                    {l.status === 'pending' && <button className="btn" onClick={() => update(l.id, 'reviewing')}>复核中</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
