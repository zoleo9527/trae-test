import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export const useFormat = () => {
  const formatDate = (date: Date | string | undefined, pattern: string = 'yyyy-MM-dd'): string => {
    if (!date) return '-'
    const d = typeof date === 'string' ? new Date(date) : date
    return format(d, pattern, { locale: zhCN })
  }

  const formatDateTime = (date: Date | string | undefined): string => {
    return formatDate(date, 'yyyy-MM-dd HH:mm')
  }

  const formatPrice = (price: number | undefined): string => {
    if (price === undefined) return '-'
    return `¥${price.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatWeight = (weight: number | undefined): string => {
    if (weight === undefined) return '-'
    return `${weight}g`
  }

  const formatCarat = (carat: number | undefined): string => {
    if (carat === undefined) return '-'
    return `${carat}ct`
  }

  const getOrderTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      custom: '定制',
      repair: '返修',
      remodel: '改款',
      transfer: '调货',
    }
    return labels[type] || type
  }

  const getOrderStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      pending: '待处理',
      preparing: '准备中',
      processing: '加工中',
      quality_check: '质检中',
      completed: '已完成',
      abnormal: '异常',
    }
    return labels[status] || status
  }

  const getOrderStatusClass = (status: string): string => {
    const classes: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-700',
      preparing: 'bg-blue-100 text-blue-700',
      processing: 'bg-gold-100 text-gold-700',
      quality_check: 'bg-purple-100 text-purple-700',
      completed: 'bg-forest-100 text-forest-700',
      abnormal: 'bg-coral-100 text-coral-700',
    }
    return classes[status] || 'bg-gray-100 text-gray-700'
  }

  const getAbnormalTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      stone_shortage: '石缺货',
      craft_issue: '工艺问题',
      customer_change: '客户改款',
      quality_issue: '质量问题',
      damage: '货品损坏',
      other: '其他',
    }
    return labels[type] || type
  }

  const getAbnormalLevelLabel = (level: string): string => {
    const labels: Record<string, string> = {
      low: '低',
      medium: '中',
      high: '高',
      critical: '紧急',
    }
    return labels[level] || level
  }

  const getAbnormalLevelClass = (level: string): string => {
    const classes: Record<string, string> = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-coral-100 text-coral-700 animate-breathe',
    }
    return classes[level] || 'bg-gray-100 text-gray-700'
  }

  const getAbnormalStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      pending: '待处理',
      processing: '处理中',
      resolved: '已解决',
      closed: '已关闭',
    }
    return labels[status] || status
  }

  const getAbnormalStatusClass = (status: string): string => {
    const classes: Record<string, string> = {
      pending: 'bg-coral-100 text-coral-700',
      processing: 'bg-blue-100 text-blue-700',
      resolved: 'bg-forest-100 text-forest-700',
      closed: 'bg-gray-100 text-gray-700',
    }
    return classes[status] || 'bg-gray-100 text-gray-700'
  }

  const getHandoverTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      receive: '收货',
      transfer: '转送',
      deliver: '交付',
      return: '退回',
    }
    return labels[type] || type
  }

  const getHandoverTypeClass = (type: string): string => {
    const classes: Record<string, string> = {
      receive: 'bg-blue-100 text-blue-700',
      transfer: 'bg-purple-100 text-purple-700',
      deliver: 'bg-forest-100 text-forest-700',
      return: 'bg-coral-100 text-coral-700',
    }
    return classes[type] || 'bg-gray-100 text-gray-700'
  }

  const getJewelryCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      ring: '戒指',
      necklace: '项链',
      bracelet: '手链',
      earring: '耳钉',
      pendant: '吊坠',
    }
    return labels[category] || category
  }

  const getProgressStatusClass = (status: string): string => {
    const classes: Record<string, string> = {
      pending: '',
      in_progress: 'current',
      completed: 'completed',
      skipped: '',
      abnormal: 'abnormal',
    }
    return classes[status] || ''
  }

  return {
    formatDate,
    formatDateTime,
    formatPrice,
    formatWeight,
    formatCarat,
    getOrderTypeLabel,
    getOrderStatusLabel,
    getOrderStatusClass,
    getAbnormalTypeLabel,
    getAbnormalLevelLabel,
    getAbnormalLevelClass,
    getAbnormalStatusLabel,
    getAbnormalStatusClass,
    getHandoverTypeLabel,
    getHandoverTypeClass,
    getJewelryCategoryLabel,
    getProgressStatusClass,
  }
}
