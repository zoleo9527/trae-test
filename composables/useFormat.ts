const parseDateSafe = (dateInput: string | Date): Date => {
  if (dateInput instanceof Date) {
    return dateInput
  }
  if (dateInput.includes('T')) {
    return new Date(dateInput)
  }
  const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) {
    return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]))
  }
  return new Date(dateInput)
}

export const useFormat = () => {
  const formatDate = (dateInput: string | Date | null | undefined): string => {
    if (!dateInput) return ''
    const date = parseDateSafe(dateInput)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const relativeTime = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return formatDate(dateString)
  }

  const statusText: Record<string, string> = {
    pending: '待审批',
    approved: '已批准',
    rejected: '已驳回',
    processing: '处理中',
    completed: '已完成',
    abnormal: '异常'
  }

  const typeText: Record<string, string> = {
    restock: '补货',
    loss: '损耗'
  }

  const priorityText: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高'
  }

  const lossReasonText: Record<string, string> = {
    '顾客损坏': '顾客损坏',
    '活动赠礼': '活动赠礼',
    '活动消耗': '活动消耗',
    '自然损耗': '自然损耗',
    '丢失': '丢失',
    '其他': '其他'
  }

  const calendarEventTypeText: Record<string, string> = {
    restock: '补货',
    loss: '损耗',
    exhibition: '展览',
    event: '活动',
    ticket_peak: '客流高峰'
  }

  return {
    formatDate,
    formatDateTime,
    formatTime,
    relativeTime,
    statusText,
    typeText,
    priorityText,
    lossReasonText,
    calendarEventTypeText
  }
}
