import { WorkOrderStatus, WorkOrderPriority, WorkOrderType } from '@/types'

export const statusLabels: Record<WorkOrderStatus, string> = {
  pending: '待分配',
  assigned: '已分配',
  processing: '处理中',
  returned: '已退回',
  escalated: '已升级',
  completed: '已完成',
  closed: '已关闭',
}

export const statusColors: Record<WorkOrderStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  assigned: 'bg-blue-100 text-blue-700',
  processing: 'bg-amber-100 text-amber-700',
  returned: 'bg-red-100 text-red-700',
  escalated: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  closed: 'bg-slate-100 text-slate-700',
}

export const priorityLabels: Record<WorkOrderPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
}

export const priorityColors: Record<WorkOrderPriority, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600',
}

export const typeLabels: Record<WorkOrderType, string> = {
  repair: '设备维修',
  refund: '退款申诉',
  consumable: '耗材补货',
  other: '其他',
}

export const typeColors: Record<WorkOrderType, string> = {
  repair: 'bg-indigo-100 text-indigo-700',
  refund: 'bg-rose-100 text-rose-700',
  consumable: 'bg-teal-100 text-teal-700',
  other: 'bg-gray-100 text-gray-700',
}

export const roleLabels: Record<string, string> = {
  admin: '运营主管',
  inspector: '巡检员',
  service: '客服',
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

export function getTimeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  return '刚刚'
}

export function isOverdue(deadline?: string): boolean {
  if (!deadline) return false
  return new Date(deadline) < new Date()
}

export function getOverdueTime(deadline?: string): string {
  if (!deadline) return ''
  const now = new Date()
  const d = new Date(deadline)
  const diff = now.getTime() - d.getTime()
  if (diff <= 0) return ''
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  if (hours > 0) return `已超时 ${hours}小时${minutes}分`
  return `已超时 ${minutes}分钟`
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10)
}
