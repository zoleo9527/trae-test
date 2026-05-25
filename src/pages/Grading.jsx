import React, { useEffect, useState } from 'react'

export default function Grading() {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ batch_id: '', graded_at: '', grade: 'A', qty_kg: '', operator: '陈立', note: '' })
  useEffect(() => { fetch('/api/gradings').then(r => r.json()).then(setRows) }, [])
  const submit = (e) => {
    e.preventDefault()
    fetch('/api/gradings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      .then(r => r.json()).then(() => {
        fetch('/api/gradings').then(r => r.json()).then(setRows)
        setForm({ batch_id: '', graded_at: '', grade: 'A', qty_kg: '', operator: '陈立', note: '' })
      })
  }
  return (
    <div>
      <div className="head">
        <h1>分级</h1>
        <div className="sub">档口负责人按规则分级，数量与入库净重对账，作为配货与客诉依据</div>
      </div>
      <div className="split">
        <div className="card">
          <h2>新增分级记录</h2>
          <form className="form-grid" onSubmit={submit}>
            <label>批次 ID</label><input value={form.batch_id} onChange={e => setForm({ ...form, batch_id: e.target.value })} required />
            <label>分级时间</label><input value={form.graded_at} onChange={e => setForm({ ...form, graded_at: e.target.value })} placeholder="2026-05-25 14:00" required />
            <label>等级</label>
            <select value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })}>
              <option>A</option><option>B</option><option>C</option><option>处理</option>
            </select>
            <label>数量(kg)</label><input type="number" step="0.1" value={form.qty_kg} onChange={e => setForm({ ...form, qty_kg: e.target.value })} required />
            <label>操作人</label><input value={form.operator} onChange={e => setForm({ ...form, operator: e.target.value })} />
            <label>备注</label><textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
            <div /><button className="btn primary">保存</button>
          </form>
        </div>
        <div className="card">
          <h2>分级列表</h2>
          <table>
            <thead><tr><th>时间</th><th>批次</th><th>等级</th><th>kg</th><th>操作</th><th>备注</th></tr></thead>
            <tbody>
              {rows.map(g => (
                <tr key={g.id}>
                  <td className="small">{g.graded_at}</td>
                  <td className="small">{g.batch_code} {g.fruit}</td>
                  <td><span className="tag">{g.grade}</span></td>
                  <td>{g.qty_kg}</td>
                  <td>{g.operator}</td>
                  <td className="small">{g.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
