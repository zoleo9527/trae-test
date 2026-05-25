import React, { useEffect, useState } from 'react'

export default function Picking() {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ batch_id: '', customer: '', order_no: '', picked_at: '', qty_kg: '', grade: 'A', driver: '', note: '' })
  useEffect(() => { fetch('/api/pickings').then(r => r.json()).then(setRows) }, [])
  const submit = (e) => {
    e.preventDefault()
    fetch('/api/pickings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      .then(r => r.json()).then(() => {
        fetch('/api/pickings').then(r => r.json()).then(setRows)
        setForm({ batch_id: '', customer: '', order_no: '', picked_at: '', qty_kg: '', grade: 'A', driver: '', note: '' })
      })
  }
  return (
    <div>
      <div className="head">
        <h1>配货</h1>
        <div className="sub">配货员凭单装车，按批次/等级出冷库；出库、客户、司机三方留痕</div>
      </div>
      <div className="split">
        <div className="card">
          <h2>新增配货</h2>
          <form className="form-grid" onSubmit={submit}>
            <label>批次 ID</label><input value={form.batch_id} onChange={e => setForm({ ...form, batch_id: e.target.value })} required />
            <label>客户</label><input value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })} required />
            <label>订单号</label><input value={form.order_no} onChange={e => setForm({ ...form, order_no: e.target.value })} />
            <label>配货时间</label><input value={form.picked_at} onChange={e => setForm({ ...form, picked_at: e.target.value })} placeholder="2026-05-25 09:00" required />
            <label>数量(kg)</label><input type="number" step="0.1" value={form.qty_kg} onChange={e => setForm({ ...form, qty_kg: e.target.value })} required />
            <label>等级</label>
            <select value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })}>
              <option>A</option><option>B</option><option>C</option>
            </select>
            <label>司机</label><input value={form.driver} onChange={e => setForm({ ...form, driver: e.target.value })} />
            <label>备注</label><textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
            <div /><button className="btn primary">保存</button>
          </form>
        </div>
        <div className="card">
          <h2>配货列表</h2>
          <table>
            <thead><tr><th>时间</th><th>客户</th><th>批次</th><th>等级</th><th>kg</th><th>司机</th><th>状态</th></tr></thead>
            <tbody>
              {rows.map(p => (
                <tr key={p.id}>
                  <td className="small">{p.picked_at}</td>
                  <td>{p.customer}</td>
                  <td className="small">{p.batch_code} {p.fruit}</td>
                  <td>{p.grade}</td>
                  <td>{p.qty_kg}</td>
                  <td>{p.driver}</td>
                  <td><span className={`tag ${p.status === 'delivered' ? 'green' : 'yellow'}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
