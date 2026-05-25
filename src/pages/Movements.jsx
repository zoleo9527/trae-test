import React, { useEffect, useState } from 'react'

export default function Movements() {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ batch_id: '', type: 'in', qty_kg: '', at: '', operator: '', note: '', ref: '' })
  useEffect(() => { fetch('/api/movements').then(r => r.json()).then(setRows) }, [])

  const submit = (e) => {
    e.preventDefault()
    fetch('/api/movements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      .then(r => r.json()).then(() => {
        fetch('/api/movements').then(r => r.json()).then(setRows)
        setForm({ batch_id: '', type: 'in', qty_kg: '', at: '', operator: '', note: '', ref: '' })
      })
  }

  return (
    <div>
      <div className="head">
        <h1>出入库流水</h1>
        <div className="sub">每一笔入库、出库都保留：磅单编号、操作人、时间、去向</div>
      </div>
      <div className="split">
        <div className="card">
          <h2>登记新动作</h2>
          <form className="form-grid" onSubmit={submit}>
            <label>批次 ID</label><input value={form.batch_id} onChange={e => setForm({ ...form, batch_id: e.target.value })} required />
            <label>类型</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="in">入库</option>
              <option value="out">出库</option>
            </select>
            <label>数量(kg)</label><input type="number" step="0.1" value={form.qty_kg} onChange={e => setForm({ ...form, qty_kg: e.target.value })} required />
            <label>时间</label><input value={form.at} onChange={e => setForm({ ...form, at: e.target.value })} placeholder="2026-05-25 10:00" required />
            <label>操作人</label><input value={form.operator} onChange={e => setForm({ ...form, operator: e.target.value })} />
            <label>磅单/凭证号</label><input value={form.ref} onChange={e => setForm({ ...form, ref: e.target.value })} />
            <label>备注</label><textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
            <div /><button className="btn primary">登记</button>
          </form>
        </div>
        <div className="card">
          <h2>流水列表</h2>
          <table>
            <thead><tr><th>时间</th><th>类型</th><th>批次</th><th>kg</th><th>操作</th><th>凭证</th><th>备注</th></tr></thead>
            <tbody>
              {rows.map(m => (
                <tr key={m.id}>
                  <td className="small">{m.at}</td>
                  <td><span className={`tag ${m.type === 'in' ? 'green' : 'gray'}`}>{m.type === 'in' ? '入库' : '出库'}</span></td>
                  <td className="small">{m.batch_code} {m.fruit}</td>
                  <td>{m.qty_kg}</td>
                  <td>{m.operator}</td>
                  <td className="small">{m.ref}</td>
                  <td className="small">{m.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
