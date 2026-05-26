import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function Batches() {
  const [rows, setRows] = useState([])
  const [detail, setDetail] = useState(null)
  const [timeline, setTimeline] = useState([])
  useEffect(() => {
    fetch('/api/batches').then(r => r.json()).then(setRows)
  }, [])

  const loadDetail = (id) => {
    fetch(`/api/batches/${id}`).then(r => r.json()).then(d => {
      setDetail(d)
      fetch(`/api/timeline/${id}`).then(r => r.json()).then(setTimeline)
    })
  }

  return (
    <div>
      <div className="head">
        <h1>批次 · 冷库</h1>
        <div className="sub">每个批次关联：入库称重、分级、配货、损耗、客诉、回款，整条线可回看</div>
      </div>

      <div className="split">
        <div className="card">
          <h2>批次列表</h2>
          <table>
            <thead>
              <tr>
                <th>批次号</th>
                <th>品类</th>
                <th>到仓</th>
                <th>净重(kg)</th>
                <th>在库</th>
                <th>损耗</th>
                <th>分级</th>
                <th>冷库</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(b => {
                const remaining = Math.max(0, (b.in_kg || 0) - (b.out_kg || 0) - (b.loss_kg || 0))
                return (
                  <tr key={b.id} onClick={() => loadDetail(b.id)} style={{ cursor: 'pointer' }} className={detail?.id === b.id ? 'selected' : ''}>
                    <td><strong>{b.code}</strong></td>
                    <td>{b.fruit} <span className="small muted">{b.variety}</span></td>
                    <td className="small">{b.received_at}</td>
                    <td>{b.net_kg}</td>
                    <td>{Math.round(remaining)}</td>
                    <td>{b.loss_kg || 0}</td>
                    <td>{b.grade_cnt ? '已分级' : '-'}</td>
                    <td className="small">{b.warehouse}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2>批次详情</h2>
          {!detail && <div className="muted small">点击左侧某一行，查看该批次从入库到回款的完整时间线。</div>}
          {detail && (
            <>
              <div className="row">
                <strong>{detail.code}</strong>
                <span className="chip">{detail.fruit} / {detail.variety}</span>
                <span className="small muted">{detail.origin} · {detail.supplier}</span>
              </div>
              <div className="metric-grid" style={{ marginTop: 10 }}>
                <div className="kpi"><div className="label">入库净重</div><div className="value">{detail.net_kg} kg</div></div>
                <div className="kpi"><div className="label">单价</div><div className="value">¥{detail.unit_price}/kg</div></div>
                <div className="kpi"><div className="label">冷库位</div><div className="value">{detail.warehouse}</div></div>
                <div className="kpi"><div className="label">分级规则</div><div className="value" style={{ fontSize: 14 }}>{detail.grade_rule}</div></div>
              </div>
              <div className="sep" />
              <h3 style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>时间线（含客诉、赊销、回款）</h3>
              <div className="timeline" style={{ marginTop: 6, gridTemplateColumns: '140px 110px 1fr 100px' }}>
                <div className="h">时间</div><div className="h">动作</div><div className="h">详情</div><div className="h">关联 ID</div>
                {timeline.map((t, i) => {
                  let tagClass = 'tag'
                  if (t.type === 'move' && t.title === '入库') tagClass = 'tag green'
                  else if (t.type === 'move') tagClass = 'tag gray'
                  else if (t.type === 'grade') tagClass = 'tag'
                  else if (t.type === 'pick') tagClass = 'tag yellow'
                  else if (t.type === 'loss') tagClass = 'tag red'
                  else if (t.type === 'claim') tagClass = 'tag red'
                  else if (t.type === 'credit') tagClass = 'tag yellow'
                  else if (t.type === 'payment') tagClass = 'tag green'
                  else if (t.type === 'settle') tagClass = 'tag green'
                  return (
                    <React.Fragment key={i}>
                      <div className="c small">{t.at}</div>
                      <div className="c"><span className={tagClass}>{t.title}</span></div>
                      <div className="c notes small">{t.detail}</div>
                      <div className="c small muted">
                        {t.picking_id && <div>配货 #{t.picking_id}</div>}
                        {t.claim_id && <div>客诉 #{t.claim_id}</div>}
                        {t.credit_id && <div>赊销 #{t.credit_id}</div>}
                        {t.payment_id && <div>回款 #{t.payment_id}</div>}
                        {t.ref && <div>凭证 {t.ref}</div>}
                        {t.type === 'claim' && t.linked_losses?.length > 0 && (
                          <div style={{ marginTop: 6 }}>
                            <div className="muted" style={{ fontSize: 11 }}>关联损耗：</div>
                            {t.linked_losses.map((l, j) => (
                              <div key={j} style={{ marginTop: 2 }}>
                                <span className={`tag ${l.status === 'confirmed' ? 'green' : 'red'}`}>
                                  {l.batch_code}
                                </span>
                                <span style={{ marginLeft: 4, fontSize: 11 }}>
                                  {l.qty_kg} · {l.status === 'confirmed' ? '已确认' : '待复核'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        {t.type === 'loss' && t.claim_batch_code && (
                          <div style={{ marginTop: 6 }}>
                            <div className="muted" style={{ fontSize: 11 }}>
                              关联客诉 · {t.claim_customer || ''}
                            </div>
                            <div style={{ marginTop: 2 }}>
                              <span className="tag red">{t.claim_batch_code}</span>
                              <span style={{ marginLeft: 4, fontSize: 11 }}>
                                {t.claim_reason || ''}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  )
                })}
              </div>
              <div className="sep" />
              <div className="row">
                <Link className="btn" to="/losses">去损耗复核</Link>
                <Link className="btn" to="/claims">去客诉复核</Link>
                <Link className="btn" to="/credits">去赊销结算</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
