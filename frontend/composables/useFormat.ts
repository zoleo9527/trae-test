export const formatDate = (date: string | Date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

export const formatDateTime = (date: string | Date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const formatCurrency = (amount: number) => {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0
  }).format(amount)
}

export const formatArea = (area: number) => {
  if (area === null || area === undefined) return '-'
  return `${area.toFixed(1)} ㎡`
}

export const getStatusBadge = (status: string) => {
  const map: Record<string, { class: string, text: string }> = {
    'in_progress': { class: 'badge-blue', text: '进行中' },
    'completed': { class: 'badge-green', text: '已完成' },
    'submitted': { class: 'badge-yellow', text: '已提交' },
    'approved': { class: 'badge-green', text: '已通过' },
    'exception': { class: 'badge-red', text: '异常' },
    'exception_handled': { class: 'badge-orange', text: '异常已处理' },
    'pending': { class: 'badge-yellow', text: '待处理' },
    'rework_required': { class: 'badge-red', text: '需返工' },
    'rectified': { class: 'badge-orange', text: '已整改' },
    'passed': { class: 'badge-green', text: '合格' },
    'failed': { class: 'badge-red', text: '不合格' },
    'draft': { class: 'badge-gray', text: '草稿' },
    'dispute': { class: 'badge-red', text: '有争议' },
    'dispute_resolved': { class: 'badge-orange', text: '争议已解决' },
    'received': { class: 'badge-green', text: '已签收' },
    'partial_return': { class: 'badge-orange', text: '部分退货' },
  }
  return map[status] || { class: 'badge-gray', text: status }
}

export const getExceptionTypeBadge = (type: string) => {
  const map: Record<string, { class: string, text: string }> = {
    '天气影响': { class: 'badge-blue', text: '天气影响' },
    '材料问题': { class: 'badge-orange', text: '材料问题' },
    '基层问题': { class: 'badge-yellow', text: '基层问题' },
    '人员问题': { class: 'badge-red', text: '人员问题' },
    '设备问题': { class: 'badge-gray', text: '设备问题' },
    '返工整改': { class: 'badge-red', text: '返工整改' },
    '结算争议': { class: 'badge-red', text: '结算争议' },
    '材料质量问题': { class: 'badge-orange', text: '材料质量' },
  }
  return map[type] || { class: 'badge-gray', text: type }
}
