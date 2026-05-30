export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatDateTime(timestamp: number): string {
  return `${formatDate(timestamp)} ${formatTime(timestamp)}`
}

export function formatDuration(start: number, end?: number): string {
  const diff = (end || Date.now()) - start
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  }
  return `${minutes}分钟`
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: '待处理',
    sorting: '分拣中',
    washing: '洗涤中',
    drying: '烘干中',
    ironing: '熨烫中',
    qc: '质检中',
    completed: '已完成',
    rewash: '返洗中',
    delivered: '已交付',
    processing: '处理中',
    resolved: '已解决',
    escalated: '已升级'
  }
  return labels[status] || status
}

export function getStatusBadgeClass(status: string): string {
  const classes: Record<string, string> = {
    pending: 'badge-gray',
    sorting: 'badge-primary',
    washing: 'badge-primary',
    drying: 'badge-primary',
    ironing: 'badge-primary',
    qc: 'badge-warning',
    completed: 'badge-success',
    rewash: 'badge-danger',
    delivered: 'badge-success',
    processing: 'badge-primary',
    resolved: 'badge-success',
    escalated: 'badge-danger'
  }
  return classes[status] || 'badge-gray'
}

export function getIssueTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    stain: '污渍',
    damage: '破损',
    missing: '缺失',
    color_fade: '褪色',
    other: '其他'
  }
  return labels[type] || type
}

export function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    normal: '普通',
    urgent: '加急',
    vip: 'VIP'
  }
  return labels[priority] || priority
}

export function getPriorityBadgeClass(priority: string): string {
  const classes: Record<string, string> = {
    normal: 'badge-gray',
    urgent: 'badge-warning',
    vip: 'badge-danger'
  }
  return classes[priority] || 'badge-gray'
}

export function getStageProgress(currentStage: number, totalStages: number = 6): number {
  return Math.round((currentStage / totalStages) * 100)
}

export function formatOrderNo(orderNo: string): string {
  if (orderNo.length >= 10) {
    return orderNo.slice(0, 4) + '-' + orderNo.slice(4, 7) + '-' + orderNo.slice(7)
  }
  return orderNo
}
