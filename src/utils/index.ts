import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, pattern: string = 'yyyy-MM-dd HH:mm') {
  return format(new Date(date), pattern, { locale: zhCN })
}

export function formatDateShort(date: string | Date) {
  return format(new Date(date), 'MM-dd HH:mm', { locale: zhCN })
}

export function generateOrderNo(): string {
  const now = new Date()
  const dateStr = format(now, 'yyyyMMdd')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ORD${dateStr}${random}`
}

export function generateDeliveryNo(): string {
  const now = new Date()
  const dateStr = format(now, 'yyyyMMdd')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `DEL${dateStr}${random}`
}

export function generateReturnNo(): string {
  const now = new Date()
  const dateStr = format(now, 'yyyyMMdd')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `BRT${dateStr}${random}`
}

export function generateComplaintNo(): string {
  const now = new Date()
  const dateStr = format(now, 'yyyyMMdd')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `CMP${dateStr}${random}`
}

export function getRoleName(role: string): string {
  const roleMap: Record<string, string> = {
    station_master: '配送站长',
    driver: '配送司机',
    customer_service: '客服专员',
  }
  return roleMap[role] || role
}

export function getOrderStatusName(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '待分配',
    assigned: '已分配',
    delivering: '配送中',
    completed: '已完成',
    cancelled: '已取消',
  }
  return statusMap[status] || status
}

export function getDeliveryStatusName(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '待开始',
    in_transit: '配送中',
    arrived: '已到达',
    completed: '已完成',
    failed: '配送失败',
  }
  return statusMap[status] || status
}

export function getBucketReturnStatusName(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '待回收',
    collected: '已回收',
    disputed: '有争议',
    resolved: '已解决',
    lost: '已遗失',
  }
  return statusMap[status] || status
}

export function getComplaintStatusName(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决',
    closed: '已关闭',
  }
  return statusMap[status] || status
}

export function getComplaintTypeName(type: string): string {
  const typeMap: Record<string, string> = {
    delivery_delay: '配送延迟',
    bucket_dispute: '空桶争议',
    water_quality: '水质问题',
    service_attitude: '服务态度',
    other: '其他问题',
  }
  return typeMap[type] || type
}

export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    assigned: 'bg-blue-100 text-blue-800',
    delivering: 'bg-blue-100 text-blue-800',
    in_transit: 'bg-blue-100 text-blue-800',
    arrived: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    collected: 'bg-green-100 text-green-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-gray-100 text-gray-800',
    disputed: 'bg-red-100 text-red-800',
    processing: 'bg-orange-100 text-orange-800',
    failed: 'bg-red-100 text-red-800',
    lost: 'bg-red-100 text-red-800',
  }
  return colorMap[status] || 'bg-gray-100 text-gray-800'
}

export function getPriorityColor(priority: string): string {
  const colorMap: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  }
  return colorMap[priority] || 'bg-gray-100 text-gray-800'
}

export function getPriorityName(priority: string): string {
  const nameMap: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
  }
  return nameMap[priority] || priority
}
