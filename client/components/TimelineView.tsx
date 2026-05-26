'use client'

import type { Order } from '@/lib/api'
import { cn, EVENT_TYPE_MAP } from '@/lib/utils'
import {
    AlertCircle,
    AlertOctagon,
    AlertTriangle,
    Box,
    Calendar,
    CalendarClock,
    CheckCheck,
    CheckCircle,
    CheckCircle2,
    Clock,
    FileText,
    Package,
    PackageCheck,
    Plus,
    PlusCircle,
    RefreshCw, Settings,
    ShoppingCart,
    Truck,
    Undo2,
    Wrench, XCircle,
    XOctagon
} from 'lucide-react'

const ICON_MAP: Record<string, any> = {
  FileText, RefreshCw, Settings, CheckCircle, Clock,
  Truck, Package, AlertTriangle, AlertOctagon, Calendar,
  CalendarClock, CheckCircle2, Wrench, XCircle, Undo2,
  AlertCircle, PlusCircle, ShoppingCart, PackageCheck,
  CheckCheck, XOctagon, Plus, Box,
}

export default function TimelineView({ order }: { order: Order }) {
  const events = [...order.timeline].sort(
    (a, b) => new Date(b.event_time).getTime() - new Date(a.event_time).getTime()
  )

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-900">处理链路时间线</h2>
        <p className="text-xs text-slate-500 mt-0.5">全流程接力操作记录</p>
      </div>
      <div className="p-4 max-h-[500px] overflow-y-auto scrollbar-thin">
        {events.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">暂无记录</p>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-200" />
            <div className="space-y-4">
              {events.map((evt, idx) => {
                const typeInfo = EVENT_TYPE_MAP[evt.event_type] || {
                  label: evt.event_type,
                  icon: 'FileText',
                  color: 'text-slate-500 bg-slate-50',
                }
                const IconComp = ICON_MAP[typeInfo.icon] || FileText

                return (
                  <div key={evt.id} className="relative pl-10">
                    <div className={cn(
                      'absolute left-2 w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white',
                      typeInfo.color
                    )}>
                      <IconComp className="w-3 h-3" />
                    </div>
                    <div className="bg-slate-50 rounded-lg px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-700">{typeInfo.label}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(evt.event_time).toLocaleString('zh-CN', {
                            month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {evt.event_description}
                      </p>
                      {evt.operator_name && (
                        <p className="text-xs text-slate-400 mt-1">— {evt.operator_name}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}