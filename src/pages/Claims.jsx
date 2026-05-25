import React, { useEffect, useState } from 'react'

export default function Claims() {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ customer: '', picking_id: '', reported_at: '', reason: '', qty_kg: '', amount: '', note: '' })
  useEffect(() => { fetch('/api/claims').then(r => r.json()).then(setRows) }, [])

  const submit = (e) => {
    e.preventDefault()
    fetch('/api/claims', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, qty_kg: Number(form.qty_kg) || 0, amount: Number(form.amount) || 0 }) })
      .then(r => r.json()).then(() => {
        fetch('/api/claims').then(r => r.json()).then(setRows)
        setForm({ customer: '', picking_id: '', reported_at: '', reason: '', qty_kg: '', amount: '', note: '' })
      })
  }

  const updateStatus = (id, status) => {
    fetch(`/api/claims/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      .then(() => fetch('/api/claims').then(r => r.json()).then(setRows))
  }

  return (
    <div>
      <div className="head">
        <h1>客诉赔付</h1>
        <div className="sub">客户电话/到货投诉 → 关联配货单与批次 → 复核证据 → 赔付或驳回，全程留痕</div>
      </div>
      <div className="split">
        <div className="card">
          <h2>登记新客诉</h2>
          <form className="form-grid" onSubmit={submit}>
            <label>客户</label><input value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })} required />
            <label>配货单 ID</label><input value={form.picking_id} onChange={e => setForm({ ...form, picking_id: e.target.value })} />
            <label>投诉日期</label><input value={form.reported_at} onChange={e => setForm({ ...form, reported_at: e.target.value })} placeholder="2026-05-25" required />
            <label>原因</label><input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
            <label>涉及重量kg</label><input type="number" step="0.1" value={form.qty_kg} onChange={e => setForm({ ...form, qty_kg: e.target.value })} />
            <label>争议金额¥</label><input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            <label>备注</label><textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
            <div /><button className="btn primary">登记</button>
          </form>
        </div>
        <div className="card">
          <h2>客诉列表</h2>
          <table>
            <thead>
              <tr><th>客户</th><th>批次/配货</th><th>投诉</th><th>原因</th><th>状态</th><th>处理</th></tr>
            </thead>
            <tbody>
              {rows.map(c => (
                <tr key={c.id}>
                  <td>{c.customer}</td>
                  <td className="small">{c.batch_code} · {c.order_no}</td>
                  <td className="small">{c.reported_at}</td>
                  <td className="small">{c.reason}</td>
                  <td><span className={`tag ${c.status === 'resolved' ? 'green' : c.status === 'rejected' ? 'gray' : c.status === 'open' ? 'red' : 'yellow'}`}>{c.status}</span></td>
                  <td>
                    {c.status !== 'resolved' && <button className="btn" onClick={() => updateStatus(c.id, 'resolved')}>已解决</button>}
                    {c.status === 'open' && <button className="btn" onClick={() => updateStatus(c.id, 'reviewing')}>复核中</button>}
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
