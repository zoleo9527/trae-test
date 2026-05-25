import React, { useEffect, useState } from 'react'

const fmt = (n) => n ? Math.round(n * 100) / 100 : 0

export default function Credits() {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ customer: '', picking_id: '', amount: '', issued_at: '', due_at: '', note: '' })
  const [payForm, setPayForm] = useState({ credit_id: '', amount: '', paid_at: '', method: '银行转账', note: '' })
  useEffect(() => { fetch('/api/credits').then(r => r.json()).then(setRows) }, [])

  const submit = (e) => {
    e.preventDefault()
    fetch('/api/credits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, amount: Number(form.amount) }) })
      .then(r => r.json()).then(() => {
        fetch('/api/credits').then(r => r.json()).then(setRows)
        setForm({ customer: '', picking_id: '', amount: '', issued_at: '', due_at: '', note: '' })
      })
  }
  const pay = (e) => {
    e.preventDefault()
    fetch('/api/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payForm, amount: Number(payForm.amount) }) })
      .then(r => r.json()).then(() => {
        fetch('/api/credits').then(r => r.json()).then(setRows)
        setPayForm({ credit_id: '', amount: '', paid_at: '', method: '银行转账', note: '' })
      })
  }

  return (
    <div>
      <div className="head">
        <h1>赊销结算</h1>
        <div className="sub">财务按批次配货单开出赊销单，到账后核销；逾期自动标红，回款全程留痕</div>
      </div>
      <div className="split">
        <div className="card">
          <h2>新增赊销单</h2>
          <form className="form-grid" onSubmit={submit}>
            <label>客户</label><input value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })} required />
            <label>配货单 ID</label><input value={form.picking_id} onChange={e => setForm({ ...form, picking_id: e.target.value })} />
            <label>金额 ¥</label><input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
            <label>开单日期</label><input value={form.issued_at} onChange={e => setForm({ ...form, issued_at: e.target.value })} placeholder="2026-05-25" required />
            <label>到期日期</label><input value={form.due_at} onChange={e => setForm({ ...form, due_at: e.target.value })} placeholder="2026-06-01" />
            <label>备注</label><textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
            <div /><button className="btn primary">开单</button>
          </form>
          <div className="sep" />
          <h2>登记回款</h2>
          <form className="form-grid" onSubmit={pay}>
            <label>赊销单 ID</label><input value={payForm.credit_id} onChange={e => setPayForm({ ...payForm, credit_id: e.target.value })} required />
            <label>金额 ¥</label><input type="number" step="0.01" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} required />
            <label>到账日期</label><input value={payForm.paid_at} onChange={e => setPayForm({ ...payForm, paid_at: e.target.value })} placeholder="2026-05-25" required />
            <label>方式</label>
            <select value={payForm.method} onChange={e => setPayForm({ ...payForm, method: e.target.value })}>
              <option>银行转账</option><option>微信转账</option><option>现金</option>
            </select>
            <label>备注</label><textarea value={payForm.note} onChange={e => setPayForm({ ...payForm, note: e.target.value })} />
            <div /><button className="btn primary">记账</button>
          </form>
        </div>
        <div className="card">
          <h2>赊销单列表</h2>
          <table>
            <thead>
              <tr><th>ID</th><th>客户</th><th>开单</th><th>到期</th><th>金额</th><th>已收</th><th>结余</th><th>状态</th></tr>
            </thead>
            <tbody>
              {rows.map(c => (
                <tr key={c.id}>
                  <td>#{c.id}</td>
                  <td>{c.customer}</td>
                  <td className="small">{c.issued_at}</td>
                  <td className="small">{c.due_at}</td>
                  <td>¥{fmt(c.amount)}</td>
                  <td>¥{fmt(c.paid)}</td>
                  <td>¥{fmt(c.balance)}</td>
                  <td><span className={`tag ${c.status === 'settled' ? 'green' : c.status === 'overdue' ? 'red' : c.status === 'partial' ? 'yellow' : 'gray'}`}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
