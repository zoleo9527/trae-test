import { useEffect, useState } from 'react'
import withAuth from '../components/hoc/withAuth'
import { fetcher } from '../lib/auth'

function statusTag(s) {
  if (s === '已完成') return <span className="tag ok">{s}</span>
  if (s === '已取消') return <span className="tag gray">{s}</span>
  if (s === '进行中') return <span className="tag warn">{s}</span>
  return <span className="tag">{s}</span>
}

function ActivitiesPage() {
  const [list, setList] = useState([])
  const [authors, setAuthors] = useState([])
  const [channels, setChannels] = useState([])
  const [owners, setOwners] = useState([])
  const [meta, setMeta] = useState({ activityStatuses: [], activityTypes: [] })
  const [selected, setSelected] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [noteDraft, setNoteDraft] = useState({ action: '跟进', note: '' })
  const [form, setForm] = useState({
    keyword: '',
    authorId: '',
    channelId: '',
    type: '',
    status: '',
    ownerId: '',
    dateFrom: '',
    dateTo: ''
  })

  useEffect(() => {
    Promise.all([
      fetcher('/api/master/authors'),
      fetcher('/api/master/channels'),
      fetcher('/api/master/owners'),
      fetcher('/api/master/meta')
    ]).then(([a, c, o, m]) => {
      setAuthors(a)
      setChannels(c)
      setOwners(o)
      setMeta(m)
    })
  }, [])

  function load() {
    const qs = new URLSearchParams()
    Object.entries(form).forEach(([k, v]) => {
      if (v) qs.set(k, v)
    })
    fetcher('/api/activities?' + qs.toString()).then((d) => setList(d.list || []))
  }

  useEffect(() => { load() }, [form])

  function reset() {
    setForm({ keyword: '', authorId: '', channelId: '', type: '', status: '', ownerId: '', dateFrom: '', dateTo: '' })
  }

  function onFormChange(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleCreate(e) {
    e.preventDefault()
    const body = {
      title: e.target.title.value,
      authorId: e.target.authorId.value,
      channelId: e.target.channelId.value,
      type: e.target.type.value,
      planDate: e.target.planDate.value,
      location: e.target.location.value,
      expectedQty: e.target.expectedQty.value,
      status: e.target.status.value,
      remarks: e.target.remarks.value
    }
    await fetcher('/api/activities', { method: 'POST', body: JSON.stringify(body) })
    setShowNew(false)
    load()
  }

  async function pushNote() {
    if (!selected) return
    if (!noteDraft.note.trim()) return
    await fetcher(`/api/activities/${selected.id}/timeline`, {
      method: 'POST',
      body: JSON.stringify(noteDraft)
    })
    setNoteDraft({ action: '跟进', note: '' })
    load()
    setSelected((s) => {
      if (!s) return s
      const next = list.find((x) => x.id === s.id)
      return next || null
    })
  }

  async function changeStatus(status) {
    if (!selected) return
    await fetcher(`/api/activities/${selected.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })
    load()
    setSelected(null)
  }

  return (
    <div>
      <div className="page-title">
        <h1>作者活动</h1>
        <div className="desc">多条件筛选 · 过程留痕 · 责任人可见</div>
        <div>
          <button className="btn primary" onClick={() => setShowNew(true)}>新建活动</button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="field">
          <label>关键词</label>
          <input placeholder="活动标题 / 作者 / 地点" value={form.keyword} onChange={(e) => onFormChange('keyword', e.target.value)} />
        </div>
        <div className="field">
          <label>作者</label>
          <select value={form.authorId} onChange={(e) => onFormChange('authorId', e.target.value)}>
            <option value="">全部</option>
            {authors.map((a) => <option key={a.id} value={a.id}>{a.name} · {a.category}</option>)}
          </select>
        </div>
        <div className="field">
          <label>合作渠道</label>
          <select value={form.channelId} onChange={(e) => onFormChange('channelId', e.target.value)}>
            <option value="">全部</option>
            {channels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>活动类型</label>
          <select value={form.type} onChange={(e) => onFormChange('type', e.target.value)}>
            <option value="">全部</option>
            {meta.activityTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="field">
          <label>状态</label>
          <select value={form.status} onChange={(e) => onFormChange('status', e.target.value)}>
            <option value="">全部</option>
            {meta.activityStatuses.map((t) => <option key={t} value={t}>{t}</option>)}
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
          <label>计划日期(起)</label>
          <input type="date" value={form.dateFrom} onChange={(e) => onFormChange('dateFrom', e.target.value)} />
        </div>
        <div className="field">
          <label>计划日期(止)</label>
          <input type="date" value={form.dateTo} onChange={(e) => onFormChange('dateTo', e.target.value)} />
        </div>
        <div className="actions">
          <button className="btn ghost" onClick={reset}>重置</button>
          <button className="btn" onClick={load}>刷新</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {list.length === 0 ? (
          <div className="empty">没有匹配的活动</div>
        ) : (
          <table className="data" style={{ border: 'none' }}>
            <thead>
              <tr>
                <th>活动</th>
                <th>作者</th>
                <th>渠道</th>
                <th>类型</th>
                <th>计划日期</th>
                <th>预计数量</th>
                <th>状态</th>
                <th>责任人</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id}>
                  <td>
                    <button className="link-btn" onClick={() => setSelected(a)}>{a.title}</button>
                  </td>
                  <td>{a.authorName} <span className="tag gray">{a.authorCategory}</span></td>
                  <td>{a.channelName}</td>
                  <td>{a.type}</td>
                  <td>{a.planDate}</td>
                  <td>{a.expectedQty} 册</td>
                  <td>{statusTag(a.status)}</td>
                  <td>{a.ownerName}</td>
                  <td style={{ maxWidth: 220, color: '#6b7280', fontSize: 12 }}>{a.remarks}</td>
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
            <h2>{selected.title}</h2>
            <div className="kv">
              <div className="k">作者</div><div className="v">{selected.authorName} · {selected.authorCategory}</div>
              <div className="k">渠道</div><div className="v">{selected.channelName}</div>
              <div className="k">类型</div><div className="v">{selected.type}</div>
              <div className="k">计划日期</div><div className="v">{selected.planDate}</div>
              <div className="k">地点</div><div className="v">{selected.location}</div>
              <div className="k">预计数量</div><div className="v">{selected.expectedQty} 册</div>
              <div className="k">当前状态</div><div className="v">{statusTag(selected.status)}</div>
              <div className="k">责任人</div><div className="v">{selected.ownerName}</div>
              <div className="k">整体备注</div><div className="v">{selected.remarks || '-'}</div>
            </div>

            <div className="card" style={{ margin: '16px 0', background: '#fafbfc' }}>
              <h3>过程时间线</h3>
              <div className="timeline">
                {selected.timeline.map((t, i) => (
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
                  {['跟进', '样书寄送', '样书回执', '现场协调', '渠道反馈', '完成', '取消', '状态变更'].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
                <input
                  placeholder="请输入备注，例如：已与渠道确认物料"
                  value={noteDraft.note}
                  onChange={(e) => setNoteDraft({ ...noteDraft, note: e.target.value })}
                  style={{ flex: 1 }}
                />
                <button className="btn primary" onClick={pushNote}>提交</button>
              </div>
            </div>

            <div className="form-actions">
              <select onChange={(e) => changeStatus(e.target.value)} defaultValue="">
                <option value="">变更状态…</option>
                {meta.activityStatuses.map((s) => <option key={s}>{s}</option>)}
              </select>
              <button className="btn" onClick={() => setSelected(null)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {showNew && (
        <div className="modal-mask" onClick={() => setShowNew(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleCreate}>
            <button type="button" className="close" onClick={() => setShowNew(false)}>×</button>
            <h2>新建作者活动</h2>
            <div className="form-row"><label>活动标题</label><input required name="title" /></div>
            <div className="form-row"><label>作者</label>
              <select required name="authorId">
                <option value="">请选择</option>
                {authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="form-row"><label>合作渠道</label>
              <select required name="channelId">
                <option value="">请选择</option>
                {channels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-row"><label>类型</label>
              <select name="type">
                {meta.activityTypes.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-row"><label>计划日期</label><input type="date" name="planDate" /></div>
            <div className="form-row"><label>地点</label><input name="location" /></div>
            <div className="form-row"><label>预计数量</label><input type="number" name="expectedQty" defaultValue={0} /></div>
            <div className="form-row"><label>状态</label>
              <select name="status">
                {meta.activityStatuses.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-row"><label>备注</label><textarea name="remarks" rows={3} /></div>
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

export default withAuth(ActivitiesPage)
