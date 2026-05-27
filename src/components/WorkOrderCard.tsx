import { MapPin, Clock, AlertTriangle, User } from 'lucide-react'
import type { WorkOrder } from '@/types'
import { StatusBadge, PriorityBadge, TypeBadge } from '@/components/Badge'
import { getTimeAgo, isOverdue, getOverdueTime } from '@/utils/format'

interface WorkOrderCardProps {
  workOrder: WorkOrder
  onClick: () => void
}

export function WorkOrderCard({ workOrder, onClick }: WorkOrderCardProps) {
  const overdue = isOverdue(workOrder.deadline)

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer ${
        overdue ? 'ring-2 ring-red-200 border-red-300' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <StatusBadge status={workOrder.status} />
          <PriorityBadge priority={workOrder.priority} />
        </div>
        {overdue && (
          <span className="text-xs text-red-600 font-medium flex items-center">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {getOverdueTime(workOrder.deadline)}
          </span>
        )}
      </div>

      <h4 className="font-semibold text-slate-900 mb-2 line-clamp-2">
        {workOrder.title}
      </h4>

      <p className="text-sm text-slate-500 mb-3 line-clamp-2">
        {workOrder.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-xs text-slate-500">
          <span className="flex items-center">
            <MapPin className="w-3.5 h-3.5 mr-1" />
            {workOrder.siteName}
          </span>
          {workOrder.assigneeName && (
            <span className="flex items-center">
              <User className="w-3.5 h-3.5 mr-1" />
              {workOrder.assigneeName}
            </span>
          )}
        </div>
        <span className="text-xs text-slate-400 flex items-center">
          <Clock className="w-3.5 h-3.5 mr-1" />
          {getTimeAgo(workOrder.createdAt)}
        </span>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100">
        <TypeBadge type={workOrder.type} />
      </div>
    </div>
  )
}
