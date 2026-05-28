import React from 'react'
import { OrderStatus, OrderStatusLabels, SplitStatus, SplitStatusLabels, ReceiptStatus, ReceiptStatusLabels, RefundStatus, RefundStatusLabels } from '../../types'

interface StatusBadgeProps {
  status: OrderStatus | SplitStatus | ReceiptStatus | RefundStatus
  showLabel?: boolean
}

const statusStyles: Record<string, string> = {
  draft: 'bg-dark-100 text-dark-600',
  sampling: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
  scheduled: 'bg-purple-100 text-purple-700',
  split: 'bg-yellow-100 text-yellow-700',
  shipped: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
  partial: 'bg-orange-100 text-orange-700',
  signed: 'bg-green-100 text-green-700',
  exception: 'bg-red-100 text-red-700',
  finance_approved: 'bg-blue-100 text-blue-700',
  manager_approved: 'bg-purple-100 text-purple-700',
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, showLabel = true }) => {
  const getLabel = () => {
    if (status in OrderStatusLabels) return OrderStatusLabels[status as OrderStatus]
    if (status in SplitStatusLabels) return SplitStatusLabels[status as SplitStatus]
    if (status in ReceiptStatusLabels) return ReceiptStatusLabels[status as ReceiptStatus]
    if (status in RefundStatusLabels) return RefundStatusLabels[status as RefundStatus]
    return status
  }

  return (
    <span className={`status-badge ${statusStyles[status] || 'bg-dark-100 text-dark-600'}`}>
      {showLabel ? getLabel() : ''}
    </span>
  )
}

export const PriorityBadge: React.FC<{ priority: 'high' | 'medium' | 'low' }> = ({ priority }) => {
  const styles = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700',
  }

  const labels = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级',
  }

  return (
    <span className={`status-badge ${styles[priority]}`}>
      {labels[priority]}
    </span>
  )
}
