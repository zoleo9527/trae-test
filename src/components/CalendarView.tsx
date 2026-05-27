import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Order } from '@/stores/studio'
import { statusDot, statusLabel } from '@/stores/studio'

interface Props {
  orders: Order[]
  onSelectOrder: (id: string) => void
}

function ymd(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function CalendarView({ orders, onSelectOrder }: Props) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [selected, setSelected] = useState<string>(ymd(new Date()))

  const weeks = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const first = new Date(year, month, 1)
    const startDay = (first.getDay() + 6) % 7
    const start = new Date(year, month, 1 - startDay)
    const out: Date[] = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      out.push(d)
    }
    return out
  }, [cursor])

  const byDate = useMemo(() => {
    const map = new Map<string, Order[]>()
    for (const o of orders) {
      if (!o.shoot_date) continue
      const key = o.shoot_date
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(o)
    }
    return map
  }, [orders])

  const monthLabel = `${cursor.getFullYear()} 年 ${cursor.getMonth() + 1} 月`
  const today = ymd(new Date())

  const selectedOrders = byDate.get(selected) || []

  return (
    <div className="flex h-full flex-col gap-4 lg:flex-row">
      <div className="flex-1 rounded-2xl border border-ink-700/70 bg-ink-900/60 p-4 shadow-glow">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="font-serif text-xl text-gold-300">{monthLabel}</div>
            <div className="text-xs text-ink-500">点击日期查看当日档期与订单</div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              className="rounded-lg border border-ink-600 px-2 py-1 text-ink-500 hover:border-gold-400 hover:text-gold-300"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCursor(new Date())}
              className="rounded-lg border border-ink-600 px-3 py-1 text-xs text-ink-500 hover:border-gold-400 hover:text-gold-300"
            >
              今天
            </button>
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              className="rounded-lg border border-ink-600 px-2 py-1 text-ink-500 hover:border-gold-400 hover:text-gold-300"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-ink-500">
          {['一', '二', '三', '四', '五', '六', '日'].map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {weeks.map((d) => {
            const key = ymd(d)
            const list = byDate.get(key) || []
            const inMonth = d.getMonth() === cursor.getMonth()
            const isSelected = key === selected
            const isToday = key === today
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={cn(
                  'flex min-h-[86px] flex-col rounded-lg border p-1.5 text-left transition',
                  isSelected
                    ? 'border-gold-400 bg-gold-500/10'
                    : 'border-ink-700/70 hover:border-gold-500/60',
                  !inMonth && 'opacity-40'
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'text-xs',
                      isToday ? 'rounded-full bg-gold-400 px-1.5 py-0.5 text-ink-950' : 'text-ink-500'
                    )}
                  >
                    {d.getDate()}
                  </span>
                  {list.length > 0 && (
                    <span className="text-[10px] text-gold-400">{list.length}单</span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {list.slice(0, 3).map((o) => (
                    <span
                      key={o.id}
                      className={cn('h-1.5 w-1.5 rounded-full', statusDot[o.status] || 'bg-ink-500')}
                      title={`${o.customer_name} · ${statusLabel[o.status] || o.status}`}
                    />
                  ))}
                  {list.length > 3 && (
                    <span className="text-[10px] text-ink-500">+{list.length - 3}</span>
                  )}
                </div>
                <div className="mt-auto space-y-0.5 overflow-hidden">
                  {list.slice(0, 2).map((o) => (
                    <div
                      key={o.id}
                      className="truncate text-[10px] text-ink-500"
                      title={o.customer_name}
                    >
                      {o.customer_name}
                    </div>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="w-full rounded-2xl border border-ink-700/70 bg-ink-900/60 p-4 lg:w-80">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="font-serif text-lg text-gold-300">{selected}</div>
            <div className="text-xs text-ink-500">当日订单 {selectedOrders.length} 条</div>
          </div>
        </div>
        {selectedOrders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink-600 py-12 text-center text-sm text-ink-500">
            当日无拍摄档期
          </div>
        ) : (
          <div className="space-y-2">
            {selectedOrders.map((o) => (
              <button
                key={o.id}
                onClick={() => onSelectOrder(o.id)}
                className="w-full rounded-xl border border-ink-700 bg-ink-900/70 p-3 text-left transition hover:border-gold-500/60 hover:bg-ink-800/70"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium text-ink-100">{o.customer_name}</div>
                  <span className={cn('h-2 w-2 shrink-0 rounded-full', statusDot[o.status] || 'bg-ink-500')} />
                </div>
                <div className="mt-1 text-[11px] text-ink-500">
                  {o.order_no} · {statusLabel[o.status] || o.status}
                </div>
                <div className="mt-1 text-[11px] text-ink-500">
                  尾款 ¥{(o.total_amount - o.paid_amount).toLocaleString()} / ¥
                  {o.total_amount.toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
