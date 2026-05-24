export const statusConfig = {
  pending: { label: '待处理', color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' },
  created: { label: '已创建', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400' },
  in_progress: { label: '进行中', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  rectifying: { label: '整改中', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400' },
  rechecking: { label: '待复查', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-400' },
  disputed: { label: '有异议', color: 'bg-red-100 text-red-700', dot: 'bg-red-400' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700', dot: 'bg-green-400' },
  passed: { label: '已通过', color: 'bg-green-100 text-green-700', dot: 'bg-green-400' },
  failed: { label: '未通过', color: 'bg-red-100 text-red-700', dot: 'bg-red-400' },
}

export const severityConfig = {
  low: { label: '轻微', color: 'bg-gray-100 text-gray-700' },
  medium: { label: '一般', color: 'bg-yellow-100 text-yellow-700' },
  high: { label: '严重', color: 'bg-orange-100 text-orange-700' },
  critical: { label: '致命', color: 'bg-red-100 text-red-700' },
}

export const priorityConfig = {
  low: { label: '低', color: 'bg-gray-100 text-gray-700' },
  normal: { label: '中', color: 'bg-blue-100 text-blue-700' },
  high: { label: '高', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: '紧急', color: 'bg-red-100 text-red-700' },
}

export const typeConfig = {
  routine: '日常巡检',
  acceptance: '验收检查',
  review: '复查',
  special: '专项检查',
}

export const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const formatDateSimple = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

export const isOverdue = (deadline) => {
  if (!deadline) return false
  return new Date(deadline) < new Date()
}
