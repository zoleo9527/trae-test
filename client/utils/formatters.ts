export const formatCurrency = (amount: number, currency: string = 'CNY'): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency
  }).format(amount)
}

export const formatNumber = (num: number, minimumFractionDigits: number = 0): string => {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits,
    maximumFractionDigits: minimumFractionDigits
  }).format(num)
}

export const formatPercent = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`
}

export const formatPhone = (phone: string): string => {
  if (phone.length === 11) {
    return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3')
  }
  return phone
}

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    draft: '草稿',
    pending: '待审核',
    approved: '已批准',
    rejected: '已拒绝',
    delivered: '已发货',
    completed: '已完成',
    cancelled: '已取消',
    normal: '正常',
    late: '迟到',
    early_leave: '早退',
    absent: '缺勤',
    open: '未处理',
    in_progress: '处理中',
    resolved: '已解决',
    excellent: '优秀',
    good: '良好',
    pass: '合格',
    fail: '不合格',
    scheduled: '已排期',
    active: '进行中',
    expiring: '即将到期',
    ended: '已结束'
  }
  return statusMap[status] || status
}

export const getSeverityColor = (severity: string): string => {
  const colorMap: Record<string, string> = {
    info: 'primary',
    warning: 'warning',
    critical: 'danger'
  }
  return colorMap[severity] || 'gray'
}

export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    delivered: 'primary',
    completed: 'success',
    cancelled: 'gray',
    normal: 'success',
    late: 'warning',
    early_leave: 'warning',
    absent: 'danger',
    open: 'danger',
    in_progress: 'warning',
    resolved: 'success',
    excellent: 'success',
    good: 'primary',
    pass: 'success',
    fail: 'danger',
    scheduled: 'primary',
    active: 'success',
    expiring: 'warning',
    ended: 'gray'
  }
  return colorMap[status] || 'gray'
}

export const getRoleText = (role: string): string => {
  const roleMap: Record<string, string> = {
    project_manager: '项目主管',
    scheduling_specialist: '排班专员',
    quality_inspector: '质检员'
  }
  return roleMap[role] || role
}

export const getCategoryText = (category: string): string => {
  const categoryMap: Record<string, string> = {
    detergent: '清洁剂',
    tool: '清洁工具',
    disposable: '一次性用品',
    protective: '防护用品'
  }
  return categoryMap[category] || category
}

export const getTaskTypeText = (type: string): string => {
  const typeMap: Record<string, string> = {
    daily: '日常清洁',
    deep: '深度清洁',
    special: '专项清洁'
  }
  return typeMap[type] || type
}

export const getAlertTypeText = (type: string): string => {
  const typeMap: Record<string, string> = {
    missing_punch: '漏打卡',
    rectification: '整改通知',
    low_stock: '库存预警',
    contract_expiry: '合同到期',
    overdue_task: '任务逾期'
  }
  return typeMap[type] || type
}

export const getRectificationStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: '待处理',
    in_progress: '进行中',
    completed: '已完成',
    overdue: '已逾期'
  }
  return statusMap[status] || status
}

export const getRectificationStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700'
  }
  return colorMap[status] || 'bg-gray-100 text-gray-700'
}

export const getOverallStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    excellent: '优秀',
    good: '良好',
    pass: '合格',
    fail: '不合格'
  }
  return statusMap[status] || status
}

export const getOverallStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    excellent: 'bg-green-100 text-green-700',
    good: 'bg-blue-100 text-blue-700',
    pass: 'bg-yellow-100 text-yellow-700',
    fail: 'bg-red-100 text-red-700'
  }
  return colorMap[status] || 'bg-gray-100 text-gray-700'
}

export const getOverallStatusBg = (status: string): string => {
  const bgMap: Record<string, string> = {
    excellent: 'bg-green-50',
    good: 'bg-blue-50',
    pass: 'bg-yellow-50',
    fail: 'bg-red-50'
  }
  return bgMap[status] || 'bg-gray-50'
}
