import { useEffect, useState } from 'react'
import withAuth from '../components/hoc/withAuth'
import { fetcher, useAuth } from '../lib/auth'

function statusTag(s) {
  if (s === '已回款') return <span className="tag ok">{s}</span>
  if (s === '样书待回执') return <span className="tag danger">{s}</span>
  if (s === '待对账') return <span className="tag warn">{s}</span>
  if (s === '销售中') return <span className="tag">{s}</span>
  return <span className="tag gray">{s}</span>
}

function money(n) {
  return '¥' + Number(n || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function canCreate(role) {
  return role === 'admin' || role === 'channel_manager' || role === 'distribution_specialist'
}

function canEdit(role, ownerId, userId) {
  if (role === 'admin' || role === 'channel_manager') return true
  if (role === 'distribution_specialist') return ownerId === userId
  return false
}

function canSettle(role) {
  return role === 'admin' || role === 'finance' || role === 'channel_manager'
}

function DistributionsPage() {
  const { auth } = useAuth()
  const [list, setList] = useState([])
  const [books, setBooks] = useState([])
  const [channels, setChannels] = useState([])
  const [owners, setOwners] = useState([])
  const [meta, setMeta] = useState({ distributionStatuses: [], channelTypes: [] })
  const [selected, setSelected] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [noteDraft, setNoteDraft] = useState({ action: '跟进', note: '' })
  const [form, setForm] = useState({
    keyword: '',
    bookId: '',
    channelId: '',
    channelType: '',
    status: '',
    sampleReceived: '',
    ownerId: '',
    shippedFrom: '',
    shippedTo: ''
  })

  useEffect(() => {
    Promise.all([
      fetcher('/api/master/books'),
      fetcher('/api/master/channels'),
      fetcher('/api/master/owners'),
      fetcher('/api/master/meta')
    ]).then(([b, c, o, m]) => {
      setBooks(b)
      setChannels(c)
      setOwners(o)
      setMeta(m)
    })
  }, [])

  function load() {
    const qs = new URLSearchParams()
    Object.entries(form).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) qs.set(k, v)
    })
    fetcher('/api/distributions?' + qs.toString()).then((d) => setList(d.list || []))
  }

  useEffect(() => { load() }, [form])

  function reset() {
    setForm({
      keyword: '',
      bookId: '',
      channelId: '',
      channelType: '',
      status: '',
      sampleReceived: '',
      ownerId: '',
      shippedFrom: '',
      shippedTo: ''
    })
  }

  function onFormChange(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function pushNote() {
    if (!selected) return
    if (!noteDraft.note.trim()) return
    await fetcher(`/api/distributions/${selected.id}/records`, {
      method: 'POST',
      body: JSON.stringify(noteDraft)
    })
    setNoteDraft({ action: '跟进', note: '' })
    load()
  }

  async function changeStatus(status) {
    if (!selected) return
    await fetcher(`/api/distributions/${selected.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })
    load()
    setSelected(null)
  }

  async function patchField(field, value) {
    if (!selected) return
    await fetcher(`/api/distributions/${selected.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ [field]: value })
    })
    load()
  }

  async function handleCreate(e) {
    e.preventDefault()
    const body = {
      bookId: e.target.bookId.value,
      channelId: e.target.channelId.value,
      qty: Number(e.target.qty.value) || 0,
      shippedAt: e.target.shippedAt.value || new Date().toISOString().slice(0, 10),
      sampleExpress: e.target.sampleExpress.value,
      sampleQty: Number(e.target.sampleQty.value) || 0,
      ownerId: e.target.ownerId.value || auth.user.id,
      note: e.target.note.value
    }
    await fetcher('/api/distributions', { method: 'POST', body: JSON.stringify(body) })
    setShowNew(false)
    load()
  }

  async function settleDistribution() {
    if (!selected) return
    const amt = prompt('请输入回款金额：')
    if (!amt) return
    await fetcher(`/api/distributions/${selected.id}/settle`, {
      method: 'PATCH',
      body: JSON.stringify({ amount: Number(amt), date: new Date().toISOString().slice(0, 10) })
    })
    load()
    setSelected(null)
  }

  const role = auth?.user?.role
  const userId = auth?.user?.id

  return (
    <div>
      <div className="page-title">
        <h1>渠道对接</h1>
        <div className="desc">铺货 · 样书回执 · 退货 · 对账回款，链路过程在同一处留痕</div>
        {canCreate(role) && (
          <div>
            <button className="btn primary" onClick={() => setShowNew(true)}>新建铺货单</button>
          </div>
        )}
      </div>

      <div className="filter-bar">
        <div className="field">
          <label>关键词</label>
          <input placeholder="批次 / 书名 / 渠道 / 快递单号" value={form.keyword} onChange={(e) => onFormChange('keyword', e.target.value)} />
        </div>
        <div className="field">
          <label>图书</label>
          <select value={form.bookId} onChange={(e) => onFormChange('bookId', e.target.value)}>
            <option value="">全部</option>
            {books.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
          </select>
        </div>
        <div className="field">
          <label>渠道</label>
          <select value={form.channelId} onChange={(e) => onFormChange('channelId', e.target.value)}>
            <option value="">全部</option>
            {channels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>渠道类型</label>
          <select value={form.channelType} onChange={(e) => onFormChange('channelType', e.target.value)}>
            <option value="">全部</option>
            {meta.channelTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="field">
          <label>状态</label>
          <select value={form.status} onChange={(e) => onFormChange('status', e.target.value)}>
            <option value="">全部</option>
            {meta.distributionStatuses.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="field">
          <label>样书回执</label>
          <select value={form.sampleReceived} onChange={(e) => onFormChange('sampleReceived', e.target.value)}>
            <option value="">全部</option>
            <option value="true">已回执</option>
            <option value="false">未回执</option>
          </select>
        </div>
        <div className="field">
          <label>责任人</label>
          <select value={form.ownerId} onChange={(e) => onFormChange('ownerId', e.target.value)}>
            <option value="">全部</option>
            {owners.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>发货日期(起)</label>
          <input type="date" value={form.shippedFrom} onChange={(e) => onFormChange('shippedFrom', e.target.value)} />
        </div>
        <div className="field">
          <label>发货日期(止)</label>
          <input type="date" value={form.shippedTo} onChange={(e) => onFormChange('shippedTo', e.target.value)} />
        </div>
        <div className="actions">
          <button className="btn ghost" onClick={reset}>重置</button>
          <button className="btn" onClick={load}>刷新</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {list.length === 0 ? (
          <div className="empty">没有匹配的铺货单</div>
        ) : (
          <table className="data" style={{ border: 'none' }}>
            <thead>
              <tr>
                <th>批次</th>
                <th>图书</th>
                <th>ISBN</th>
                <th>渠道</th>
                <th>发货</th>
                <th>样书</th>
                <th>退货</th>
                <th>回款</th>
                <th>状态</th>
                <th>责任人</th>
              </tr>
            </thead>
            <tbody>
              {list.map((d) => (
                <tr key={d.id}>
                  <td>
                    <button className="link-btn" onClick={() => setSelected(d)}>{d.batch}</button>
                  </td>
                  <td>{d.bookTitle}</td>
                  <td style={{ color: '#6b7280', fontSize: 12 }}>{d.bookISBN}</td>
                  <td>{d.channelName} <span className="tag gray">{d.channelType}</span></td>
                  <td>{d.shippedAt}<br /><span style={{ color: '#6b7280', fontSize: 12 }}>共 {d.qty} 册</span></td>
                  <td>
                    {d.sampleReceived
                      ? <span className="tag ok">已回执</span>
                      : <span className="tag danger">未回执</span>}
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{d.sampleExpress}</div>
                  </td>
                  <td>
                    {d.returnedQty > 0 ? (
                      <>
                        <div>{d.returnedQty} 册</div>
                        <div style={{ fontSize: 12, color: '#b45309' }}>{d.returnNote}</div>
                        {d.returnedAt && <div style={{ fontSize: 12, color: '#6b7280' }}>{d.returnedAt}</div>}
                      </>
                    ) : <span style={{ color: '#9ca3af' }}>—</span>}
                  </td>
                  <td>
                    {d.status === '已回款'
                      ? <><div>{money(d.settledAmount)}</div><div style={{ fontSize: 12, color: '#6b7280' }}>{d.settledAt}</div></>
                      : <span style={{ color: '#9ca3af' }}>—</span>}
                  </td>
                  <td>{statusTag(d.status)}</td>
                  <td>{d.ownerName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <div className="modal-mask" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setSelected(null)}>×</button>
            <h2>{selected.batch} · {selected.bookTitle}</h2>
            <div className="kv">
              <div className="k">渠道</div><div className="v">{selected.channelName} · {selected.channelType}</div>
              <div className="k">发货</div><div className="v">{selected.shippedAt} · {selected.qty} 册</div>
              <div className="k">样书</div>
              <div className="v">
                {selected.sampleExpress} · {selected.sampleQty} 册 · 
                {selected.sampleReceived
                  ? <span className="tag ok" style={{ marginLeft: 6 }}>已回执 {selected.sampleReceivedAt}</span>
                  : <span className="tag danger" style={{ marginLeft: 6 }}>未回执</span>}
              </div>
              <div className="k">退货</div>
              <div className="v">
                {selected.returnedQty > 0
                  ? <>
                      {selected.returnedQty} 册 · {selected.returnedAt || '-'}
                      <div style={{ marginTop: 4, color: '#b45309' }}>退货口径：{selected.returnNote || '-'}</div>
                    </>
                  : '无'}
              </div>
              <div className="k">回款</div>
              <div className="v">
                {selected.status === '已回款'
                  ? <>{money(selected.settledAmount)} · {selected.settledAt}</>
                  : '待回款'}
              </div>
              <div className="k">状态</div><div className="v">{statusTag(selected.status)}</div>
              <div className="k">责任人</div><div className="v">{selected.ownerName}</div>
            </div>

            <div className="card" style={{ margin: '12px 0', background: '#fafbfc' }}>
              <h3>过程记录（留痕）</h3>
              <div className="timeline">
                {selected.records.map((t, i) => (
                  <div key={i} className="item">
                    <div className="time">{t.time} · {t.actor}</div>
                    <div className="body"><strong>{t.action}</strong></div>
                    {t.note && <div className="note">{t.note}</div>}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-row">
              <label>追加跟进</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={noteDraft.action}
                  onChange={(e) => setNoteDraft({ ...noteDraft, action: e.target.value })}
                  style={{ width: 140 }}
                >
                  {['跟进', '新建铺货单', '样书寄出', '样书回执', '退货登记', '退货入库', '对账备注', '回款登记', '状态变更'].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
                <input
                  placeholder="过程备注，例如：渠道回复预计月底回款"
                  value={noteDraft.note}
                  onChange={(e) => setNoteDraft({ ...noteDraft, note: e.target.value })}
                  style={{ flex: 1 }}
                />
                <button className="btn primary" onClick={pushNote}>提交</button>
              </div>
            </div>

            <div className="form-row">
              <label>快速处理</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {canEdit(role, selected.ownerId, userId) && !selected.sampleReceived && (
                  <button
                    className="btn"
                    onClick={() => {
                      const now = new Date().toISOString().slice(0, 10)
                      patchField('sampleReceived', true)
                      patchField('sampleReceivedAt', now)
                      fetcher(`/api/distributions/${selected.id}/records`, {
                        method: 'POST',
                        body: JSON.stringify({ action: '样书回执', note: '渠道确认收到样书' })
                      })
                      load()
                    }}
                  >
                    确认样书回执
                  </button>
                )}
                {canEdit(role, selected.ownerId, userId) && selected.returnedQty === 0 && (
                  <button
                    className="btn"
                    onClick={() => {
                      const qty = prompt('请输入退货数量：')
                      if (!qty) return
                      const note = prompt('请输入退货口径（如 3 个月未动销）：') || ''
                      patchField('returnedQty', Number(qty))
                      patchField('returnNote', note)
                      patchField('returnedAt', new Date().toISOString().slice(0, 10))
                      fetcher(`/api/distributions/${selected.id}/records`, {
                        method: 'POST',
                        body: JSON.stringify({ action: '退货登记', note: `${qty} 册，口径：${note}` })
                      })
                      load()
                    }}
                  >
                    登记退货
                  </button>
                )}
                {canSettle(role) && selected.status !== '已回款' && (
                  <button
                    className="btn"
                    onClick={settleDistribution}
                  >
                    登记回款
                  </button>
                )}
                {canEdit(role, selected.ownerId, userId) && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) changeStatus(e.target.value)
                      e.target.value = ''
                    }}
                    defaultValue=""
                  >
                    <option value="">变更状态…</option>
                    {meta.distributionStatuses.map((s) => <option key={s}>{s}</option>)}
                  </select>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button className="btn" onClick={() => setSelected(null)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {showNew && (
        <div className="modal-mask" onClick={() => setShowNew(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleCreate}>
            <button type="button" className="close" onClick={() => setShowNew(false)}>×</button>
            <h2>新建铺货单</h2>
            <div className="form-row"><label>图书</label>
              <select required name="bookId">
                <option value="">请选择</option>
                {books.map((b) => <option key={b.id} value={b.id}>{b.title} · {b.isbn}</option>)}
              </select>
            </div>
            <div className="form-row"><label>渠道</label>
              <select required name="channelId">
                <option value="">请选择</option>
                {channels.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.type}</option>)}
              </select>
            </div>
            <div className="form-row"><label>铺货数量</label><input type="number" name="qty" defaultValue={1000} required min="1" /></div>
            <div className="form-row"><label>发货日期</label><input type="date" name="shippedAt" defaultValue={new Date().toISOString().slice(0, 10)} /></div>
            <div className="form-row"><label>样书快递单号</label><input name="sampleExpress" placeholder="如 SF123456" /></div>
            <div className="form-row"><label>样书数量</label><input type="number" name="sampleQty" defaultValue={10} min="0" /></div>
            <div className="form-row"><label>责任人</label>
              {(role === 'admin' || role === 'channel_manager') ? (
                <select name="ownerId" defaultValue={auth?.user?.id}>
                  <option value="">请选择</option>
                  {owners.map((u) => <option key={u.id} value={u.id}>{u.name} · {u.roleName}</option>)}
                </select>
              ) : (
                <div style={{ padding: '8px 12px', background: '#f3f4f6', borderRadius: 6, color: '#374151' }}>
                  {auth?.user?.name} · {auth?.user?.roleName}
                  <input type="hidden" name="ownerId" value={auth?.user?.id} />
                </div>
              )}
            </div>
            <div className="form-row"><label>备注</label><textarea name="note" rows={3} placeholder="折扣、合同条款等" /></div>
            <div className="form-actions">
              <button type="button" className="btn" onClick={() => setShowNew(false)}>取消</button>
              <button type="submit" className="btn primary">创建</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default withAuth(DistributionsPage)
