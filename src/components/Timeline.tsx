import { cn } from '@/lib/utils'
import { eventTypeLabel, statusLabel, statusDot } from '@/stores/studio'
import type { TimelineEvent } from '@/stores/studio'

function parsePayload(p: string) {
  try {
    return JSON.parse(p)
  } catch {
    return { raw: p }
  }
}

function describe(e: TimelineEvent): string {
  const p = parsePayload(e.payload)
  switch (e.type) {
    case 'status':
      return `${statusLabel[p.from] || p.from} → ${statusLabel[p.to] || p.to}${p.note ? ' · ' + p.note : ''}`
    case 'reschedule':
      if (p.action === 'created')
        return `申请改期 ${p.from} → ${p.to}${p.reason ? ' · ' + p.reason : ''}`
      if (p.action === 'approved') return '改期已批准'
      if (p.action === 'rejected') return `改期被驳回${p.reject_reason ? ' · ' + p.reject_reason : ''}`
      return `改期 ${p.action || ''}`
    case 'collection':
      return `催收：${p.method} · 结果 ${p.result}${p.remark ? ' · ' + p.remark : ''}`
    case 'retouch':
      return `修片 V${p.version_no}${p.remark ? ' · ' + p.remark : ''}`
    case 'note':
      return `备注：${p.content || ''}`
    case 'remind':
      return p.content || '催收提醒'
    default:
      return e.type
  }
}

function color(e: TimelineEvent): string {
  switch (e.type) {
    case 'status':
      return 'bg-status-awaiting_payment'
    case 'reschedule':
      return 'bg-status-rescheduling'
    case 'collection':
      return 'bg-status-overdue'
    case 'retouch':
      return 'bg-status-selected'
    case 'note':
      return 'bg-ink-500'
    case 'remind':
      return 'bg-status-awaiting_payment'
    default:
      return 'bg-ink-500'
  }
}

interface Props {
  events: TimelineEvent[]
  compact?: boolean
}

export default function Timeline({ events, compact }: Props) {
  const list = [...events].sort((a, b) => a.at.localeCompare(b.at))
  return (
    <div className="relative">
      <div className="absolute left-2 top-2 bottom-2 w-px bg-ink-700" />
      <ul className="space-y-3">
        {list.map((e) => (
          <li key={e.id} className={cn('relative pl-8', compact && 'pl-7')}>
            <span
              className={cn(
                'absolute left-[5px] top-1.5 h-3 w-3 rounded-full ring-2 ring-ink-900',
                color(e) || statusDot[e.type]
              )}
            />
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-[11px] text-ink-500">
                {new Date(e.at).toLocaleString('zh-CN', { hour12: false })}
              </span>
              <span className="text-[11px] text-gold-400">{eventTypeLabel[e.type] || e.type}</span>
              <span className="text-[11px] text-ink-500">{e.actor_name}</span>
            </div>
            <div className="mt-0.5 text-sm text-ink-100">{describe(e)}</div>
          </li>
        ))}
        {list.length === 0 && (
          <li className="pl-8 text-sm text-ink-500">暂无事件记录</li>
        )}
      </ul>
    </div>
  )
}
