import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  Clock,
  AlertTriangle,
  Wallet,
  Users,
  ChevronRight,
  History,
  Sparkles,
} from 'lucide-react'
import {
  roleLabel,
  roleName,
  statusDot,
  statusLabel,
  useStudio,
  type Role,
} from '@/stores/studio'
import { cn } from '@/lib/utils'
import CalendarView from '@/components/CalendarView'
import Timeline from '@/components/Timeline'
import type { FeedEvent } from '@/stores/studio'

const ROLE_DESC: Record<Role, string> = {
  manager: '负责审批改期、处理客诉、查看全局风险',
  selector: '负责选片推进、上传修片版本、记录客户反馈',
  butler: '负责档期提醒、发起改期、登记催收、维护客户备注',
}

export default function Home() {
  const navigate = useNavigate()
  const role = useStudio((s) => s.role)
  const setRole = useStudio((s) => s.setRole)
  const loadAll = useStudio((s) => s.loadAll)
  const orders = useStudio((s) => s.orders)
  const alerts = useStudio((s) => s.alerts)
  const feed = useStudio((s) => s.feed)
  const loading = useStudio((s) => s.loading)

  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  const stats = [
    { label: '已排期', value: alerts.awaitingPayment + alerts.rescheduling, icon: Clock, tone: 'text-gold-400' },
    { label: '待尾款', value: alerts.awaitingPayment, icon: Wallet, tone: 'text-status-awaiting_payment' },
    { label: '待审批改期', value: alerts.pendingReschedule, icon: CalendarDays, tone: 'text-status-rescheduling' },
    { label: '逾期订单', value: alerts.overdue, icon: AlertTriangle, tone: 'text-status-overdue' },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-ink-950 text-ink-100">
      <TopBar role={role} onRoleChange={setRole} />

      <div className="mx-auto flex w-full max-w-[1400px] flex-1 gap-4 px-4 py-4 lg:px-6">
        <aside className="hidden w-64 shrink-0 flex-col gap-3 lg:flex">
          <RoleCard role={role} onRoleChange={setRole} />
          <AlertsCard alerts={alerts} onClickAlert={(k) => setFilter(k)} />
          <OrderFilters current={filter} onChange={setFilter} />
        </aside>

        <main className="flex-1 space-y-4 overflow-hidden">
          <Hero role={role} />

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-ink-700/70 bg-ink-900/60 p-4"
              >
                <div className="flex items-center justify-between">
                  <s.icon size={18} className={cn('text-ink-500', s.tone)} />
                  <span className="text-2xl font-serif text-gold-300">{s.value}</span>
                </div>
                <div className="mt-1 text-xs text-ink-500">{s.label}</div>
              </div>
            ))}
          </div>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-serif text-lg text-gold-300">
                <CalendarDays size={18} /> 联动日历
              </h3>
              <div className="text-xs text-ink-500">按拍摄档期聚合订单，点击右侧卡片进入详情</div>
            </div>
            <CalendarView orders={orders} onSelectOrder={(id) => navigate(`/orders/${id}`)} />
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-serif text-lg text-gold-300">
                <Users size={18} /> 订单列表
                {filter !== 'all' && (
                  <button
                    onClick={() => setFilter('all')}
                    className="ml-2 rounded-full border border-ink-600 px-2 py-0.5 text-xs text-ink-500 hover:border-gold-500/60"
                  >
                    清除筛选
                  </button>
                )}
              </h3>
              <div className="text-xs text-ink-500">共 {filtered.length} 条</div>
            </div>
            <div className="rounded-2xl border border-ink-700/70 bg-ink-900/60">
              <table className="w-full text-sm">
                <thead className="text-xs text-ink-500">
                  <tr>
                    <th className="px-4 py-3 text-left">客户 / 单号</th>
                    <th className="px-4 py-3 text-left">拍摄</th>
                    <th className="px-4 py-3 text-left">选片</th>
                    <th className="px-4 py-3 text-right">尾款</th>
                    <th className="px-4 py-3 text-left">状态</th>
                    <th className="px-4 py-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-ink-500">
                        加载中...
                      </td>
                    </tr>
                  ) : (
                    filtered.map((o) => (
                      <tr
                        key={o.id}
                        className="border-t border-ink-800 hover:bg-ink-800/50"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-ink-100">{o.customer_name}</div>
                          <div className="text-[11px] text-ink-500">{o.order_no}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-ink-500">{o.shoot_date}</td>
                        <td className="px-4 py-3 text-xs text-ink-500">{o.select_date || '—'}</td>
                        <td className="px-4 py-3 text-right text-xs text-gold-400">
                          ¥{(o.total_amount - o.paid_amount).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs">
                            <span
                              className={cn(
                                'h-2 w-2 rounded-full',
                                statusDot[o.status] || 'bg-ink-500'
                              )}
                            />
                            {statusLabel[o.status] || o.status}
                            {o.pending_reschedule_count > 0 && (
                              <span className="rounded-full bg-status-rescheduling/20 px-1.5 text-[10px] text-status-rescheduling">
                                待改期 {o.pending_reschedule_count}
                              </span>
                            )}
                            {o.collection_level > 0 && (
                              <span className="rounded-full bg-gold-500/20 px-1.5 text-[10px] text-gold-400">
                                催 L{o.collection_level}
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => navigate(`/orders/${o.id}`)}
                            className="inline-flex items-center gap-1 text-xs text-gold-400 hover:text-gold-300"
                          >
                            查看 <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-ink-500">
                        无符合条件的订单
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-serif text-lg text-gold-300">
                <History size={18} /> 全局动态
              </h3>
              <div className="text-xs text-ink-500">所有门店的时间线事件，最近 80 条</div>
            </div>
            <div className="rounded-2xl border border-ink-700/70 bg-ink-900/60 p-5">
              {feed.length === 0 ? (
                <div className="text-sm text-ink-500">暂无动态</div>
              ) : (
                <FeedList feed={feed} onJump={(id) => navigate(`/orders/${id}`)} />
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

function TopBar({ role, onRoleChange }: { role: Role; onRoleChange: (r: Role) => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-ink-800 bg-ink-950/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500/15 text-gold-400">
            <Sparkles size={16} />
          </span>
          <div>
            <div className="font-serif text-base text-gold-300">婚纱影楼 · 尾款催收与改期协商</div>
            <div className="text-[11px] text-ink-500">把零散的档期 · 选片 · 修片 · 尾款串成一条能回看的线</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(['butler', 'selector', 'manager'] as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => onRoleChange(r)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition',
                role === r
                  ? 'border-gold-400 bg-gold-500/15 text-gold-300'
                  : 'border-ink-700 text-ink-500 hover:border-gold-500/60 hover:text-ink-200'
              )}
            >
              切到{roleLabel[r]}
            </button>
          ))}
          <div className="ml-2 rounded-full border border-ink-700 px-3 py-1 text-[11px] text-ink-500">
            当前：{roleName[role]}
          </div>
        </div>
      </div>
    </header>
  )
}

function Hero({ role }: { role: Role }) {
  return (
    <div className="rounded-2xl border border-ink-700/70 bg-gradient-to-r from-ink-900 to-ink-800 p-5 shadow-glow">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-serif text-xl text-gold-300">
            早上好，{roleLabel[role]}。今天有 {focusToday(role)} 件事情值得优先处理。
          </div>
          <div className="mt-1 text-xs text-ink-500">{ROLE_DESC[role]}</div>
        </div>
        <div className="text-right text-xs text-ink-500">
          <div>按 <span className="text-gold-300">角色切换</span> 体验不同入口</div>
          <div>所有动作都会写入时间线，附带来源和责任人</div>
        </div>
      </div>
    </div>
  )
}

function focusToday(role: Role) {
  if (role === 'manager') return 2
  if (role === 'selector') return 3
  return 4
}

function RoleCard({ role, onRoleChange }: { role: Role; onRoleChange: (r: Role) => void }) {
  return (
    <div className="rounded-2xl border border-ink-700/70 bg-ink-900/60 p-4">
      <div className="mb-2 text-xs text-ink-500">当前视角</div>
      <div className="flex flex-col gap-1">
        {(['butler', 'selector', 'manager'] as Role[]).map((r) => (
          <button
            key={r}
            onClick={() => onRoleChange(r)}
            className={cn(
              'flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition',
              role === r
                ? 'border-gold-500/60 bg-gold-500/10 text-gold-300'
                : 'border-ink-700 text-ink-300 hover:border-gold-500/40'
            )}
          >
            <span>{roleLabel[r]}</span>
            <span className="text-[11px] text-ink-500">{roleName[r]}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 text-[11px] leading-relaxed text-ink-500">{ROLE_DESC[role]}</div>
    </div>
  )
}

function AlertsCard({
  alerts,
  onClickAlert,
}: {
  alerts: { overdue: number; pendingReschedule: number; awaitingPayment: number; rescheduling: number }
  onClickAlert: (k: string) => void
}) {
  const items = [
    { label: '已逾期', value: alerts.overdue, k: 'overdue', tone: 'text-status-overdue' },
    {
      label: '改期中',
      value: alerts.rescheduling + alerts.pendingReschedule,
      k: 'rescheduling',
      tone: 'text-status-rescheduling',
    },
    {
      label: '待尾款',
      value: alerts.awaitingPayment,
      k: 'awaiting_payment',
      tone: 'text-status-awaiting_payment',
    },
  ]
  return (
    <div className="rounded-2xl border border-ink-700/70 bg-ink-900/60 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs text-ink-500">风险提醒</div>
        <AlertTriangle size={14} className="text-ink-500" />
      </div>
      <div className="space-y-2">
        {items.map((i) => (
          <button
            key={i.k}
            onClick={() => onClickAlert(i.k)}
            className="flex w-full items-center justify-between rounded-lg border border-ink-700 px-3 py-2 text-left hover:border-gold-500/40"
          >
            <span className="text-sm text-ink-200">{i.label}</span>
            <span className={cn('font-serif text-lg', i.tone)}>{i.value}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function OrderFilters({ current, onChange }: { current: string; onChange: (k: string) => void }) {
  const items = [
    { k: 'all', label: '全部' },
    { k: 'scheduled', label: '已排期' },
    { k: 'rescheduling', label: '改期中' },
    { k: 'selected', label: '已选片' },
    { k: 'awaiting_payment', label: '待尾款' },
    { k: 'overdue', label: '已逾期' },
    { k: 'completed', label: '已完成' },
  ]
  return (
    <div className="rounded-2xl border border-ink-700/70 bg-ink-900/60 p-4">
      <div className="mb-2 text-xs text-ink-500">订单筛选</div>
      <div className="flex flex-col gap-1">
        {items.map((i) => (
          <button
            key={i.k}
            onClick={() => onChange(i.k)}
            className={cn(
              'flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm',
              current === i.k
                ? 'border-gold-500/60 bg-gold-500/10 text-gold-300'
                : 'border-ink-700 text-ink-300 hover:border-gold-500/40'
            )}
          >
            <span className="flex items-center gap-2">
              <span className={cn('h-2 w-2 rounded-full', statusDot[i.k] || 'bg-ink-500')} />
              {i.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function FeedList({ feed, onJump }: { feed: FeedEvent[]; onJump: (id: string) => void }) {
  return (
    <div className="space-y-2">
      {feed.map((e) => (
        <div key={e.id} className="rounded-xl border border-ink-800 bg-ink-900/60 p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-sm text-ink-100">{e.customer_name}</span>
                <span className="text-[11px] text-ink-500">{e.order_no}</span>
                <span className="text-[11px] text-gold-400">{e.type}</span>
              </div>
              <TimelineCompactLine e={e} />
            </div>
            <button
              onClick={() => onJump(e.order_id)}
              className="text-xs text-gold-400 hover:text-gold-300"
            >
              进入订单
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function TimelineCompactLine({ e }: { e: FeedEvent }) {
  const single: any[] = [e]
  return <Timeline events={single as any} compact />
}
