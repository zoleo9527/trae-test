import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

const fmt = (n) => n ? Math.round(n * 100) / 100 : 0

export default function Dashboard() {
  const [search, setSearch] = useSearchParams()
  const [kpis, setKpis] = useState(null)
  const [losses, setLosses] = useState([])
  const [claims, setClaims] = useState([])
  const [credits, setCredits] = useState([])
  const [pickings, setPickings] = useState([])
  const today = new Date(2026, 4, 25)
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [events, setEvents] = useState([])
  const [selected, setSelected] = useState(search.get('date') || null)

  useEffect(() => {
    fetch('/api/kpis').then(r => r.json()).then(setKpis)
    fetch('/api/losses').then(r => r.json()).then(d => setLosses(d.slice(0, 5)))
    fetch('/api/claims').then(r => r.json()).then(d => setClaims(d.slice(0, 5)))
    fetch('/api/credits').then(r => r.json()).then(d => setCredits(d.filter(c => c.status !== 'settled').slice(0, 6)))
    fetch('/api/pickings').then(r => r.json()).then(d => setPickings(d.slice(0, 5)))
  }, [])

  useEffect(() => {
    fetch(`/api/calendar?y=${cursor.getFullYear()}&m=${cursor.getMonth() + 1}`)
      .then(r => r.json()).then(setEvents)
  }, [cursor])

  const firstDow = new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay()
  const lastDay = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDow; i++) cells.push({ empty: true })
  for (let d = 1; d <= lastDay; d++) {
    const dateStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ date: dateStr, day: d, isToday: dateStr === '2026-05-25' })
  }
  while (cells.length % 7) cells.push({ empty: true })

  const eventsByDate = {}
  events.forEach(e => { (eventsByDate[e.date] = eventsByDate[e.date] || []).push(e) })

  const shift = (n) => {
    const c = new Date(cursor)
    c.setMonth(c.getMonth() + n)
    setCursor(c)
  }

  const pickDay = (date) => {
    setSelected(date)
    const params = new URLSearchParams(search)
    params.set('date', date)
    setSearch(params)
  }

  return (
    <div>
      <div className="head">
        <h1>工作台</h1>
        <div className="sub">联动日期 · 批次流向 · 风险提醒</div>
        <div className="actions">
          <Link className="btn" to="/batches">批次列表</Link>
          <Link className="btn primary" to="/examples">查看样例回放</Link>
        </div>
      </div>

      <div className="kpis">
        <div className="kpi">
          <div className="label">在库批次</div>
          <div className="value">{kpis?.batchCount ?? '-'}</div>
          <div className="delta">本月入库 {fmt(kpis?.inThisMonth)} kg · 出库 {fmt(kpis?.outThisMonth)} kg</div>
        </div>
        <div className="kpi">
          <div className="label">待赊销款</div>
          <div className="value">¥{fmt(kpis?.openCredits)}</div>
          <div className="delta" style={{ color: 'var(--bad)' }}>逾期 ¥{fmt(kpis?.overdue)}</div>
        </div>
        <div className="kpi">
          <div className="label">待复核损耗</div>
          <div className="value">{fmt(kpis?.pendingLoss)} kg</div>
          <div className="delta">需要冷库/档口复核后计入成本</div>
        </div>
        <div className="kpi">
          <div className="label">未闭环客诉</div>
          <div className="value">{kpis?.openClaims ?? '-'}</div>
          <div className="delta">进入客诉页查看证据链</div>
        </div>
      </div>

      <div className="split">
        <div className="card">
          <div className="row gap">
            <h2>联动日历 · {cursor.getFullYear()} 年 {cursor.getMonth() + 1} 月</h2>
            <div className="row">
              <button className="btn" onClick={() => shift(-1)}>‹ 上月</button>
              <button className="btn" onClick={() => shift(1)}>下月 ›</button>
            </div>
          </div>
          <div className="legend" style={{ marginTop: 4 }}>
            <span><i className="dot" style={{ background: '#e4f1ea' }} />入库</span>
            <span><i className="dot" style={{ background: '#e8f0fa' }} />出库</span>
            <span><i className="dot" style={{ background: '#fce7e3' }} />损耗</span>
            <span><i className="dot" style={{ background: '#fff3dc' }} />结算</span>
            <span><i className="dot" style={{ background: '#f0e4f4' }} />客诉</span>
            <span><i className="dot" style={{ background: '#e4f1ea' }} />回款</span>
          </div>
          <div className="sep" />
          <div className="calendar">
            {['日', '一', '二', '三', '四', '五', '六'].map(w =>
              <div key={w} className="dow">{w}</div>
            )}
            {cells.map((c, i) => c.empty ? (
              <div key={i} className="day empty" />
            ) : (
              <div key={i}
                className={`day ${c.isToday ? 'today' : ''} ${selected === c.date ? 'selected' : ''}`}
                onClick={() => pickDay(c.date)}>
                <div className="num">{c.day}</div>
                <div className="dots">
                  {(eventsByDate[c.date] || []).slice(0, 3).map((e, j) => (
                    <span key={j} className={`dot ${e.kind}`}>{e.label}{e.count > 1 ? `×${e.count}` : ''}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="muted small" style={{ marginTop: 10 }}>
            选中日期可在右侧查看当日所有动作。关联记录可直接点击跳转。
          </div>
        </div>

        <div className="card">
          <h2>当日动作 · {selected || '点击日历选择日期'}</h2>
          {selected ? (
            <DayDetail date={selected} />
          ) : (
            <div className="muted small">
              点击上方任一天，右侧展示这一天发生的所有业务动作，把「过磅单、冷库表、客户电话单」
              真正串成一条可回看的线。
            </div>
          )}
        </div>
      </div>

      <div className="split">
        <div className="card">
          <h2>损耗复核队列</h2>
          <table>
            <thead>
              <tr><th>批次</th><th>发现</th><th>类型</th><th>kg</th><th>状态</th><th></th></tr>
            </thead>
            <tbody>
              {losses.map(l => (
                <tr key={l.id}>
                  <td>{l.batch_code} <span className="small muted">{l.fruit}</span></td>
                  <td>{l.found_at}</td>
                  <td>{l.kind}</td>
                  <td>{l.qty_kg}</td>
                  <td><span className={`tag ${l.status === 'confirmed' ? 'green' : l.status === 'pending' ? 'red' : 'yellow'}`}>{l.status}</span></td>
                  <td><Link className="btn ghost" to="/losses">去处理</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2>未闭环客诉</h2>
          <table>
            <thead>
              <tr><th>客户</th><th>原因</th><th>状态</th><th></th></tr>
            </thead>
            <tbody>
              {claims.map(c => (
                <tr key={c.id}>
                  <td>{c.customer}</td>
                  <td className="small">{c.reason}</td>
                  <td><span className={`tag ${c.status === 'resolved' ? 'green' : c.status === 'open' ? 'red' : 'yellow'}`}>{c.status}</span></td>
                  <td><Link className="btn ghost" to="/claims">去处理</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="split">
        <div className="card">
          <h2>赊销待回款</h2>
          <table>
            <thead>
              <tr><th>客户</th><th>开单</th><th>到期</th><th>金额</th><th>状态</th></tr>
            </thead>
            <tbody>
              {credits.map(c => (
                <tr key={c.id}>
                  <td>{c.customer}</td>
                  <td>{c.issued_at}</td>
                  <td>{c.due_at}</td>
                  <td>¥{fmt(c.balance)}</td>
                  <td><span className={`tag ${c.status === 'overdue' ? 'red' : 'yellow'}`}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h2>最近配货</h2>
          <table>
            <thead>
              <tr><th>客户</th><th>批次</th><th>等级</th><th>kg</th><th>司机</th></tr>
            </thead>
            <tbody>
              {pickings.map(p => (
                <tr key={p.id}>
                  <td>{p.customer}</td>
                  <td className="small">{p.batch_code} {p.fruit}</td>
                  <td>{p.grade}</td>
                  <td>{p.qty_kg}</td>
                  <td>{p.driver}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function DayDetail({ date }) {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetch(`/api/day-actions?date=${date}`).then(r => r.json()).then(m => {
      setData(m)
    })
  }, [date])

  const tagFor = (a) => {
    switch (a.type) {
      case 'move': return <span className={`tag ${a.kind === 'in' ? 'green' : 'gray'}`}>{a.title}</span>
      case 'grade': return <span className="tag">{a.title}</span>
      case 'pick': return <span className="tag yellow">{a.title}</span>
      case 'loss': return <span className="tag red">{a.title}</span>
      case 'claim': return <span className="tag red">{a.title}</span>
      case 'credit': return <span className="tag yellow">{a.title}</span>
      case 'payment': return <span className="tag green">{a.title}</span>
      case 'settle': return <span className="tag green">{a.title}</span>
      default: return <span className="tag">{a.type}</span>
    }
  }

  if (!data) return <div className="muted small">加载中…</div>
  if (!data.length) return <div className="muted small">当日暂无任何业务动作。</div>
  return (
    <table>
      <thead>
        <tr><th style={{ width: 70 }}>时间</th><th style={{ width: 80 }}>类型</th><th>动作详情</th><th style={{ width: 170 }}>关联跳转</th></tr>
      </thead>
      <tbody>
        {data.map(a => (
          <tr key={a.id}>
            <td className="small muted">{a.at.slice(11, 16)}</td>
            <td>{tagFor(a)}</td>
            <td className="small">
              <div>{a.detail}</div>
              {a.note && <div className="muted" style={{ marginTop: 2 }}>备注：{a.note}</div>}
              {a.ref && <div className="muted" style={{ marginTop: 2 }}>凭证：{a.ref}</div>}
            </td>
            <td className="small">
              {a.claim_id && <div className="muted" style={{ fontSize: 11 }}>客诉 #{a.claim_id}</div>}
              {a.credit_id && <div className="muted" style={{ fontSize: 11 }}>赊销 #{a.credit_id}</div>}
              {a.picking_id && <div className="muted" style={{ fontSize: 11 }}>配货 #{a.picking_id}</div>}
              {a.claim_batch_id && a.type === 'loss' && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 11 }}>关联客诉 · {a.claim_customer || ''}</div>
                  <Link
                    to={`/batches?batchId=${a.claim_batch_id}&date=${a.claim_reported_at?.slice(0, 10) || ''}`}
                    className="btn ghost" style={{ padding: '3px 8px', fontSize: 12, marginTop: 2 }}>
                    查看 {a.claim_batch_code}
                  </Link>
                </div>
              )}
              {a.type === 'claim' && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 11 }}>关联损耗：</div>
                  {a.linked_loss_summary ? a.linked_loss_summary.split(';').map((s, j) => {
                    const [lossId, lossBatchId, lossBatchCode, lossQty, lossStatus, lossDate] = s.split(':')
                    return (
                      <div key={j} style={{ marginTop: 2 }}>
                        <Link
                          to={`/batches?batchId=${lossBatchId}&date=${lossDate?.slice(0, 10) || ''}`}
                          className={`btn ${lossStatus === 'confirmed' ? '' : 'ghost'}`}
                          style={{ padding: '3px 8px', fontSize: 12 }}>
                          {lossBatchCode} {lossQty}
                        </Link>
                        <span className="muted" style={{ marginLeft: 4, fontSize: 11 }}>
                          {lossStatus === 'confirmed' ? '已确认' : '待复核'}
                        </span>
                      </div>
                    )
                  }) : <span style={{ fontSize: 11 }} className="muted">暂无关联损耗</span>}
                </div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
