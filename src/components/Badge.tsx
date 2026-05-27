import type { WorkOrderStatus, WorkOrderPriority, WorkOrderType } from '@/types'
import { statusLabels, statusColors, priorityLabels, priorityColors, typeLabels, typeColors } from '@/utils/format'

interface StatusBadgeProps {
  status: WorkOrderStatus
  className?: string
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]} ${className}`}>
      {statusLabels[status]}
    </span>
  )
}

interface PriorityBadgeProps {
  priority: WorkOrderPriority
  className?: string
}

export function PriorityBadge({ priority, className = '' }: PriorityBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityColors[priority]} ${className}`}>
      {priorityLabels[priority]}优先级
    </span>
  )
}

interface TypeBadgeProps {
  type: WorkOrderType
  className?: string
}

export function TypeBadge({ type, className = '' }: TypeBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeColors[type]} ${className}`}>
      {typeLabels[type]}
    </span>
  )
}
