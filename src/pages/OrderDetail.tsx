import { useEffect, useState } from 'react'
import { CalendarDays, AlertTriangle, Receipt, MessageSquare, RotateCcw, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  collectionMethodLabel,
  collectionResultLabel,
  roleLabel,
  statusDot,
  statusLabel,
  useStudio,
  type Collection,
  type Order,
  type Reschedule,
  type Retouch,
  type TimelineEvent,
} from '@/stores/studio'
import { cn } from '@/lib/utils'
import Timeline from '@/components/Timeline'

type Tab = 'timeline' | 'reschedule' | 'collection' | 'retouch'

interface Detail {
  order: Order
  events: TimelineEvent[]
  reschedules: Reschedule[]
  collections: Collection[]
  retouches: Retouch[]
}

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const role = useStudio((s) => s.role)
  const loadAll = useStudio((s) => s.loadAll)
  const [detail, setDetail] = useState<Detail | null>(null)
  const [tab, setTab] = useState<Tab>('timeline')
  const [note, setNote] = useState('')
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [collectionOpen, setCollectionOpen] = useState(false)
  const [retouchOpen, setRetouchOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/studio/orders/${id}`)
      .then((r) => r.json())
      .then((j) => setDetail(j.data))
  }, [id])

  async function refresh() {
    if (!id) return
    const r = await fetch(`/api/studio/orders/${id}`)
    const j = await r.json()
    setDetail(j.data)
    loadAll()
  }

  async function submitNote() {
    if (!id || !note.trim()) return
    setBusy(true)
    await fetch(`/api/studio/orders/${id}/note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: note.trim(), actorRole: role }),
    })
    setNote('')
    setBusy(false)
    refresh()
  }

  async function remind() {
    if (!id) return
    await fetch(`/api/studio/orders/${id}/remind`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorRole: role }),
    })
    refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="rounded-lg border border-ink-600 px-3 py-1 text-xs text-ink-500 hover:border-gold-400 hover:text-gold-300"
        >
          ← 返回
        </button>
        <div className="text-xs text-ink-500">当前身份：{roleLabel[role]}</div>
      </div>

      {!detail && <div className="text-sm text-ink-500">加载中...</div>}

      {detail && (
        <>
          <div className="rounded-2xl border border-ink-700/70 bg-ink-900/60 p-5 shadow-glow">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn('h-2.5 w-2.5 rounded-full', statusDot[detail.order.status] || 'bg-ink-500')}
                  />
                  <h2 className="font-serif text-2xl text-gold-300">{detail.order.customer_name}</h2>
                </div>
                <div className="mt-1 text-xs text-ink-500">
                  {detail.order.order_no} · 拍摄 {detail.order.shoot_date}
                  {detail.order.select_date ? ` · 选片 ${detail.order.select_date}` : ''}
                </div>
                <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-900 px-3 py-1 text-xs text-ink-300">
                  {statusLabel[detail.order.status] || detail.order.status}
                  {detail.order.collection_level > 0 && (
                    <span className="text-gold-400">催收 L{detail.order.collection_level}</span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-right">
                <div>
                  <div className="text-xs text-ink-500">套餐金额</div>
                  <div className="text-lg text-ink-100">¥{detail.order.total_amount.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-ink-500">已收</div>
                  <div className="text-lg text-ink-100">¥{detail.order.paid_amount.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-ink-500">尾款</div>
                  <div className="text-lg text-gold-400">
                    ¥{(detail.order.total_amount - detail.order.paid_amount).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {role === 'butler' && (
                <>
                  <button
                    onClick={remind}
                    className="inline-flex items-center gap-1 rounded-lg border border-gold-500/60 bg-gold-500/10 px-3 py-1.5 text-sm text-gold-300 hover:bg-gold-500/20"
                  >
                    <Receipt size={14} /> 触发催收提醒
                  </button>
                  <button
                    onClick={() => setCollectionOpen(true)}
                    className="inline-flex items-center gap-1 rounded-lg border border-ink-600 px-3 py-1.5 text-sm text-ink-200 hover:border-gold-500/60"
                  >
                    <AlertTriangle size={14} /> 登记催收记录
                  </button>
                </>
              )}
              {(role === 'selector' || role === 'butler') && (
                <button
                  onClick={() => setRetouchOpen(true)}
                  className="inline-flex items-center gap-1 rounded-lg border border-ink-600 px-3 py-1.5 text-sm text-ink-200 hover:border-gold-500/60"
                >
                  <RotateCcw size={14} /> 上传修片版本
                </button>
              )}
              {(role === 'selector' || role === 'butler') && (
                <button
                  onClick={() => setRescheduleOpen(true)}
                  className="inline-flex items-center gap-1 rounded-lg border border-ink-600 px-3 py-1.5 text-sm text-ink-200 hover:border-gold-500/60"
                >
                  <CalendarDays size={14} /> 发起改期
                </button>
              )}
              <button
                onClick={() => setTab('timeline')}
                className="inline-flex items-center gap-1 rounded-lg border border-ink-600 px-3 py-1.5 text-sm text-ink-200 hover:border-gold-500/60"
              >
                <MessageSquare size={14} /> 时间线
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <div className="flex gap-1 rounded-xl border border-ink-700/70 bg-ink-900/60 p-1">
                {(
                  [
                    { k: 'timeline', label: '时间线' },
                    { k: 'reschedule', label: '改期记录' },
                    { k: 'collection', label: '催收记录' },
                    { k: 'retouch', label: '修片版本' },
                  ] as { k: Tab; label: string }[]
                ).map((t) => (
                  <button
                    key={t.k}
                    onClick={() => setTab(t.k)}
                    className={cn(
                      'flex-1 rounded-lg px-3 py-1.5 text-sm transition',
                      tab === t.k
                        ? 'bg-gold-500/15 text-gold-300'
                        : 'text-ink-500 hover:text-ink-200'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {tab === 'timeline' && (
                <div className="rounded-2xl border border-ink-700/70 bg-ink-900/60 p-5">
                  <Timeline events={detail.events} />
                </div>
              )}

              {tab === 'reschedule' && (
                <div className="rounded-2xl border border-ink-700/70 bg-ink-900/60 p-5">
                  {detail.reschedules.length === 0 ? (
                    <div className="text-sm text-ink-500">无改期申请</div>
                  ) : (
                    <ul className="space-y-3">
                      {detail.reschedules.map((r) => (
                        <li
                          key={r.id}
                          className="rounded-xl border border-ink-700 bg-ink-900/80 p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-ink-100">
                              {r.suggested_from} → {r.suggested_to}
                            </div>
                            <StatusTag status={r.status} />
                          </div>
                          <div className="mt-1 text-xs text-ink-500">原因：{r.reason}</div>
                          <div className="mt-1 text-[11px] text-ink-500">
                            申请时间：{new Date(r.created_at).toLocaleString('zh-CN', { hour12: false })}
                          </div>
                          {r.status === 'rejected' && r.reject_reason && (
                            <div className="mt-1 text-xs text-status-overdue">
                              驳回理由：{r.reject_reason}
                            </div>
                          )}
                          {r.status === 'approved' && r.approver_name && (
                            <div className="mt-1 text-xs text-status-completed">
                              批准人：{r.approver_name}
                            </div>
                          )}
                          {r.status === 'pending' && role === 'manager' && (
                            <ManagerRescheduleActions id={r.id} onDone={refresh} />
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {tab === 'collection' && (
                <div className="rounded-2xl border border-ink-700/70 bg-ink-900/60 p-5">
                  {detail.collections.length === 0 ? (
                    <div className="text-sm text-ink-500">暂无催收记录</div>
                  ) : (
                    <ul className="space-y-3">
                      {detail.collections.map((c) => (
                        <li
                          key={c.id}
                          className="rounded-xl border border-ink-700 bg-ink-900/80 p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-ink-100">
                              {collectionMethodLabel[c.method] || c.method} ·{' '}
                              {collectionResultLabel[c.result] || c.result}
                            </div>
                            <div className="text-[11px] text-ink-500">{c.actor_name}</div>
                          </div>
                          {c.remark && <div className="mt-1 text-xs text-ink-500">{c.remark}</div>}
                          <div className="mt-1 text-[11px] text-ink-500">
                            {new Date(c.created_at).toLocaleString('zh-CN', { hour12: false })}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {tab === 'retouch' && (
                <div className="rounded-2xl border border-ink-700/70 bg-ink-900/60 p-5">
                  {detail.retouches.length === 0 ? (
                    <div className="text-sm text-ink-500">暂无修片版本</div>
                  ) : (
                    <ul className="space-y-3">
                      {detail.retouches.map((r) => (
                        <li
                          key={r.id}
                          className="rounded-xl border border-ink-700 bg-ink-900/80 p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-ink-100">V{r.version_no}</div>
                            <div className="text-[11px] text-ink-500">{r.actor_name}</div>
                          </div>
                          {r.remark && <div className="mt-1 text-xs text-ink-500">{r.remark}</div>}
                          <div className="mt-1 text-[11px] text-ink-500">
                            {new Date(r.created_at).toLocaleString('zh-CN', { hour12: false })}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-ink-700/70 bg-ink-900/60 p-4">
                <div className="mb-2 text-sm text-gold-300">新增备注</div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  placeholder="在此记录与客户沟通要点，例如：客户担心修片肤色、要求加拍花絮等"
                  className="w-full resize-none rounded-lg border border-ink-700 bg-ink-900/80 p-2 text-sm text-ink-100 placeholder:text-ink-500 focus:border-gold-500 focus:outline-none"
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-ink-500">
                    将以 {roleLabel[role]} 身份写入时间线
                  </span>
                  <button
                    disabled={busy || !note.trim()}
                    onClick={submitNote}
                    className="rounded-lg border border-gold-500/60 bg-gold-500/10 px-3 py-1 text-sm text-gold-300 hover:bg-gold-500/20 disabled:opacity-50"
                  >
                    保存
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-ink-700/70 bg-ink-900/60 p-4">
                <div className="mb-2 text-sm text-gold-300">流程快照</div>
                <div className="space-y-2 text-xs text-ink-500">
                  <div>改期申请：{detail.reschedules.length} 条</div>
                  <div>催收记录：{detail.collections.length} 条</div>
                  <div>修片版本：{detail.retouches.length} 个</div>
                  <div>时间线事件：{detail.events.length} 条</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {rescheduleOpen && detail && (
        <Modal title="发起改期申请" onClose={() => setRescheduleOpen(false)}>
          <RescheduleForm
            orderId={detail.order.id}
            role={role}
            onDone={() => {
              setRescheduleOpen(false)
              refresh()
            }}
          />
        </Modal>
      )}

      {collectionOpen && detail && (
        <Modal title="登记催收记录" onClose={() => setCollectionOpen(false)}>
          <CollectionForm
            orderId={detail.order.id}
            role={role}
            onDone={() => {
              setCollectionOpen(false)
              refresh()
            }}
          />
        </Modal>
      )}

      {retouchOpen && detail && (
        <Modal title="上传修片版本" onClose={() => setRetouchOpen(false)}>
          <RetouchForm
            orderId={detail.order.id}
            role={role}
            onDone={() => {
              setRetouchOpen(false)
              refresh()
            }}
          />
        </Modal>
      )}
    </div>
  )
}

function StatusTag({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-status-awaiting_payment/20 text-gold-400 border-gold-500/40',
    approved: 'bg-status-completed/20 text-status-completed border-status-completed/40',
    rejected: 'bg-status-overdue/20 text-status-overdue border-status-overdue/40',
  }
  const label: Record<string, string> = {
    pending: '待审批',
    approved: '已批准',
    rejected: '已驳回',
  }
  return (
    <span className={cn('rounded-full border px-2 py-0.5 text-[11px]', map[status] || '')}>
      {label[status] || status}
    </span>
  )
}

function ManagerRescheduleActions({ id, onDone }: { id: string; onDone: () => void }) {
  const [reason, setReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  async function approve() {
    await fetch(`/api/studio/reschedules/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorRole: 'manager' }),
    })
    onDone()
  }
  async function reject() {
    await fetch(`/api/studio/reschedules/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorRole: 'manager', rejectReason: reason }),
    })
    onDone()
  }
  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-2">
        <button
          onClick={approve}
          className="rounded-lg border border-status-completed/40 bg-status-completed/10 px-3 py-1 text-xs text-status-completed hover:bg-status-completed/20"
        >
          批准
        </button>
        <button
          onClick={() => setShowReject((s) => !s)}
          className="rounded-lg border border-status-overdue/40 bg-status-overdue/10 px-3 py-1 text-xs text-status-overdue hover:bg-status-overdue/20"
        >
          驳回
        </button>
      </div>
      {showReject && (
        <div className="flex gap-2">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="驳回理由"
            className="flex-1 rounded-lg border border-ink-700 bg-ink-900 px-2 py-1 text-xs text-ink-100 focus:border-gold-500 focus:outline-none"
          />
          <button
            onClick={reject}
            className="rounded-lg border border-status-overdue/40 px-3 py-1 text-xs text-status-overdue hover:bg-status-overdue/20"
          >
            提交驳回
          </button>
        </div>
      )}
    </div>
  )
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-4">
      <div className="w-full max-w-md rounded-2xl border border-ink-700 bg-ink-900 p-5 shadow-glow">
        <div className="mb-4 flex items-center justify-between">
          <div className="font-serif text-lg text-gold-300">{title}</div>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-200">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block text-sm">
      <div className="mb-1 text-xs text-ink-500">{label}</div>
      {children}
    </label>
  )
}

function inputCls() {
  return 'w-full rounded-lg border border-ink-700 bg-ink-900/80 px-3 py-2 text-sm text-ink-100 focus:border-gold-500 focus:outline-none'
}

function RescheduleForm({
  orderId,
  role,
  onDone,
}: {
  orderId: string
  role: string
  onDone: () => void
}) {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [reason, setReason] = useState('')
  async function submit() {
    await fetch('/api/studio/reschedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, from, to, reason, actorRole: role }),
    })
    onDone()
  }
  return (
    <div className="space-y-3">
      <Field label="原拍摄日期">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls()} />
      </Field>
      <Field label="新档期（拟）">
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls()} />
      </Field>
      <Field label="改期原因">
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className={inputCls()}
          placeholder="客户临时出差 / 身体不适等"
        />
      </Field>
      <button
        disabled={!from || !to || !reason.trim()}
        onClick={submit}
        className="w-full rounded-lg border border-gold-500/60 bg-gold-500/10 py-2 text-sm text-gold-300 hover:bg-gold-500/20 disabled:opacity-50"
      >
        提交改期申请
      </button>
    </div>
  )
}

function CollectionForm({
  orderId,
  role,
  onDone,
}: {
  orderId: string
  role: string
  onDone: () => void
}) {
  const [method, setMethod] = useState('wechat')
  const [result, setResult] = useState('contacted')
  const [remark, setRemark] = useState('')
  async function submit() {
    await fetch('/api/studio/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, method, result, remark, actorRole: role }),
    })
    onDone()
  }
  return (
    <div className="space-y-3">
      <Field label="催收方式">
        <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputCls()}>
          <option value="wechat">微信</option>
          <option value="phone">电话</option>
          <option value="onsite">到店</option>
          <option value="other">其他</option>
        </select>
      </Field>
      <Field label="沟通结果">
        <select value={result} onChange={(e) => setResult(e.target.value)} className={inputCls()}>
          <option value="contacted">已联系</option>
          <option value="responded">已回应</option>
          <option value="escalated">已升级</option>
          <option value="unpaid">未付款</option>
          <option value="paid">已付清</option>
        </select>
      </Field>
      <Field label="备注">
        <textarea
          rows={3}
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          className={inputCls()}
          placeholder="客户承诺 / 关键沟通点"
        />
      </Field>
      <button
        onClick={submit}
        className="w-full rounded-lg border border-gold-500/60 bg-gold-500/10 py-2 text-sm text-gold-300 hover:bg-gold-500/20"
      >
        保存催收记录
      </button>
    </div>
  )
}

function RetouchForm({
  orderId,
  role,
  onDone,
}: {
  orderId: string
  role: string
  onDone: () => void
}) {
  const [remark, setRemark] = useState('')
  async function submit() {
    await fetch('/api/studio/retouches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, remark, actorRole: role }),
    })
    onDone()
  }
  return (
    <div className="space-y-3">
      <Field label="版本说明">
        <textarea
          rows={4}
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          className={inputCls()}
          placeholder="例：二修：肤色调整、瘦脸 0.8、背景去瑕疵"
        />
      </Field>
      <button
        disabled={!remark.trim()}
        onClick={submit}
        className="w-full rounded-lg border border-gold-500/60 bg-gold-500/10 py-2 text-sm text-gold-300 hover:bg-gold-500/20 disabled:opacity-50"
      >
        新增版本
      </button>
    </div>
  )
}
