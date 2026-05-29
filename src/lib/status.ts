import type { RollStatus } from '@/stores/rollStore'

export const STATUS_LABEL: Record<RollStatus, string> = {
  registered: '已登记',
  developing: '冲扫中',
  qc_pending: '待质检',
  qc_passed: '质检通过',
  qc_failed: '质检未通过',
  reworking: '返工中',
  recheck: '待复检',
  confirming: '待客户确认',
  compensating: '待赔付',
  completed: '已完成',
}

export const STATUS_COLOR: Record<RollStatus, string> = {
  registered: 'bg-gray-100 text-gray-600',
  developing: 'bg-blue-100 text-blue-600',
  qc_pending: 'bg-yellow-100 text-yellow-600',
  qc_passed: 'bg-green-100 text-green-600',
  qc_failed: 'bg-red-100 text-red-600',
  reworking: 'bg-orange-100 text-orange-600',
  recheck: 'bg-purple-100 text-purple-600',
  confirming: 'bg-cyan-100 text-cyan-600',
  compensating: 'bg-red-100 text-red-600',
  completed: 'bg-green-100 text-green-600',
}

export const ACTION_TYPE_LABEL: Record<string, string> = {
  register: '登记入库',
  develop: '开始冲扫',
  qc_pass: '质检通过',
  qc_fail: '质检未通过',
  rework_decide: '返工决策',
  rework_execute: '返工执行',
  recheck_pass: '复检通过',
  recheck_fail: '复检未通过',
  confirm_request: '发起确认',
  confirm_pass: '客户确认',
  confirm_fail: '客户拒绝',
  confirm_ok: '客户确认完成',
  confirm_compensate: '客户申请赔付',
  compensate: '赔付处理',
  compensate_approve: '赔付审批通过',
  compensate_reject: '赔付审批拒绝',
  complete: '完成交付',
}

export const ACTION_COLOR: Record<string, string> = {
  register: 'bg-gray-400',
  develop: 'bg-blue-400',
  qc_pass: 'bg-green-400',
  qc_fail: 'bg-red-400',
  rework_decide: 'bg-orange-400',
  rework_execute: 'bg-orange-500',
  recheck_pass: 'bg-purple-400',
  recheck_fail: 'bg-red-500',
  confirm_request: 'bg-cyan-400',
  confirm_pass: 'bg-green-500',
  confirm_fail: 'bg-red-600',
  confirm_ok: 'bg-green-500',
  confirm_compensate: 'bg-rose-400',
  compensate: 'bg-rose-500',
  compensate_approve: 'bg-rose-600',
  compensate_reject: 'bg-gray-500',
  complete: 'bg-green-600',
}

export const ROLE_LABEL: Record<string, string> = {
  owner: '店主',
  developer: '冲印师',
  cs: '客服',
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function isOverdue(dueDate: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return due < today
}

export function getOverdueDays(dueDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const diff = today.getTime() - due.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}
