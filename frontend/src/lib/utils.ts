import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(iso: string | undefined): string {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function formatDate(iso: string | undefined): string {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function formatTime(iso: string | undefined): string {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function formatPrice(amount: number): string {
  return `¥${amount.toFixed(2)}`
}

export function formatPhone(phone: string): string {
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3')
}

export const orderStatusLabels: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  scheduled: '已排产',
  producing: '制作中',
  completed: '已完成',
  exception: '异常',
  refunded: '已退款',
}

export const pickupStatusLabels: Record<string, string> = {
  waiting: '待取货',
  notified: '已通知',
  verified: '已核销',
  completed: '已完成',
}

export const remakeStatusLabels: Record<string, string> = {
  open: '待处理',
  scheduled: '已排产',
  producing: '重做中',
  completed: '已完成',
  closed: '已关闭',
}

export const refundStatusLabels: Record<string, string> = {
  requested: '待审核',
  tracing: '追溯中',
  approved: '已完成',
  completed: '已完成',
  rejected: '已拒绝',
}

export const changeTypeLabels: Record<string, string> = {
  item_change: '商品变更',
  time_change: '时间变更',
  quantity_change: '数量变更',
  cancel_item: '取消商品',
}

export const remakeCategoryLabels: Record<string, string> = {
  quality: '品质问题',
  customer_complaint: '客户投诉',
  wrong_item: '做错商品',
  damaged: '损坏',
}

export const roleLabels: Record<string, string> = {
  manager: '门店主理人',
  kitchen: '后厨负责人',
  service: '客服',
}

export const reviewTypeLabels: Record<string, string> = {
  change: '改单审核',
  remake: '补做审核',
  refund: '退款审核',
}

export const traceTypeLabels: Record<string, string> = {
  order: '原始订单',
  change: '订单变更',
  remake: '重做工单',
  loss: '材料损耗',
  refund: '退款结论',
}

