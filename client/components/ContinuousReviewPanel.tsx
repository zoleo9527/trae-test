'use client'

import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
    AlertCircle,
    AlertTriangle,
    Box,
    CheckCircle, Package,
    Wrench
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface AfterSalesData {
  order_id: number
  order_no: string
  customer_name: string
  overdue_samples: number
  unreturned_samples: number
  damaged_arrivals: number
  missing_arrivals: number
  pending_replacements: number
  timeline: any[]
}

export default function ContinuousReviewPanel({ orderId }: { orderId: number }) {
  const [data, setData] = useState<AfterSalesData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [orderId])

  async function loadData() {
    try {
      const res = await api.getAfterSales(orderId)
      setData(res)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  if (loading || !data) return null

  const issues = []
  if (data.overdue_samples > 0) {
    issues.push({
      type: 'sample_overdue',
      icon: <AlertCircle className="w-4 h-4" />,
      label: '超期样品',
      count: data.overdue_samples,
      color: 'bg-red-50 text-red-700 border-red-200',
    })
  }
  if (data.unreturned_samples > 0) {
    issues.push({
      type: 'sample_unreturned',
      icon: <Box className="w-4 h-4" />,
      label: '未还样品',
      count: data.unreturned_samples,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    })
  }
  if (data.damaged_arrivals > 0) {
    issues.push({
      type: 'arrival_damaged',
      icon: <AlertTriangle className="w-4 h-4" />,
      label: '到货损坏',
      count: data.damaged_arrivals,
      color: 'bg-red-50 text-red-700 border-red-200',
    })
  }
  if (data.missing_arrivals > 0) {
    issues.push({
      type: 'arrival_missing',
      icon: <Package className="w-4 h-4" />,
      label: '到货缺失',
      count: data.missing_arrivals,
      color: 'bg-orange-50 text-orange-700 border-orange-200',
    })
  }
  if (data.pending_replacements > 0) {
    issues.push({
      type: 'replacement_pending',
      icon: <Wrench className="w-4 h-4" />,
      label: '待处理补件',
      count: data.pending_replacements,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    })
  }

  const totalIssues = issues.reduce((s, i) => s + i.count, 0)

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">连续回查面板</h2>
          <p className="text-xs text-slate-500 mt-0.5">订单链路异常实时监控</p>
        </div>
        {totalIssues > 0 && (
          <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded font-medium">
            {totalIssues} 项待处理
          </span>
        )}
      </div>

      <div className="p-4">
        {issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <CheckCircle className="w-8 h-8 mb-2 text-green-400" />
            <p className="text-sm">无异常项</p>
          </div>
        ) : (
          <div className="space-y-2">
            {issues.map(issue => (
              <div
                key={issue.type}
                className={cn(
                  'flex items-center justify-between px-4 py-3 rounded-lg border',
                  issue.color
                )}
              >
                <div className="flex items-center gap-2">
                  {issue.icon}
                  <span className="text-sm font-medium">{issue.label}</span>
                </div>
                <span className="text-lg font-bold">{issue.count}</span>
              </div>
            ))}
          </div>
        )}

        {data.timeline.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-2">最近操作</p>
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
              {data.timeline.slice(0, 5).map((evt: any) => (
                <div key={evt.id} className="flex items-start gap-2 text-xs">
                  <span className="text-slate-400 mt-0.5">{evt.event_time?.slice(5, 16)}</span>
                  <span className="text-slate-700 flex-1">{evt.event_description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}