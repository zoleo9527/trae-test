import { Clock, User } from 'lucide-react'
import { statusConfig, formatDate } from '../utils/format'

export default function StatusTimeline({ histories }) {
  if (!histories || histories.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-gray-500">
        暂无状态变更记录
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {histories.map((history, index) => {
        const status = statusConfig[history.to_status] || statusConfig.pending
        return (
          <div key={history.id} className="relative pl-10 timeline-line">
            <div className={`timeline-dot absolute left-0 top-1 h-8 w-8 rounded-full flex items-center justify-center ${status.dot}`}>
              <div className="h-3 w-3 rounded-full bg-white"></div>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                    {history.from_status && (
                      <span className="text-sm text-gray-500">
                        从 {statusConfig[history.from_status]?.label || history.from_status} 变更
                      </span>
                    )}
                  </div>
                  {history.comment && (
                    <p className="mt-2 text-sm text-gray-700">{history.comment}</p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <User size={12} />
                  {history.operator?.name || '系统'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {formatDate(history.created_at)}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
