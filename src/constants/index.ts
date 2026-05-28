import type { FilmStatus, ProcessAction, ReminderType } from '@/types'

export const FILM_STATUS_OPTIONS: { value: FilmStatus; label: string; color: string }[] = [
  { value: 'registered', label: '已登记', color: 'default' },
  { value: 'waiting_process', label: '待冲扫', color: 'blue' },
  { value: 'processing', label: '冲扫中', color: 'processing' },
  { value: 'rework', label: '待返工', color: 'warning' },
  { value: 'waiting_delivery', label: '待交付', color: 'purple' },
  { value: 'delivered', label: '已交付', color: 'success' },
  { value: 'stored', label: '寄存中', color: 'cyan' },
  { value: 'expired', label: '已过期', color: 'error' },
]

export const PROCESS_ACTION_OPTIONS: { value: ProcessAction; label: string; nextStatus: FilmStatus }[] = [
  { value: 'start_process', label: '开始冲扫', nextStatus: 'processing' },
  { value: 'reject', label: '质量驳回', nextStatus: 'rework' },
  { value: 'rework', label: '重新处理', nextStatus: 'processing' },
  { value: 'finish_process', label: '冲扫完成', nextStatus: 'waiting_delivery' },
  { value: 'ready_delivery', label: '准备交付', nextStatus: 'waiting_delivery' },
  { value: 'deliver', label: '确认交付', nextStatus: 'delivered' },
  { value: 'store', label: '入库寄存', nextStatus: 'stored' },
]

export const REMINDER_TYPE_OPTIONS: { value: ReminderType; label: string; color: string }[] = [
  { value: 'expire', label: '到期提醒', color: 'error' },
  { value: 'rework', label: '返工提醒', color: 'warning' },
  { value: 'reject', label: '驳回提醒', color: 'error' },
  { value: 'pending', label: '待处理', color: 'processing' },
]

export const REMINDER_PRIORITY_OPTIONS: { value: 'low' | 'medium' | 'high'; label: string; color: string }[] = [
  { value: 'low', label: '低', color: 'default' },
  { value: 'medium', label: '中', color: 'blue' },
  { value: 'high', label: '高', color: 'error' },
]

export const MEMBER_LEVEL_OPTIONS: { value: 'normal' | 'silver' | 'gold' | 'diamond'; label: string; color: string; months: number }[] = [
  { value: 'normal', label: '普通会员', color: 'default', months: 3 },
  { value: 'silver', label: '银卡会员', color: 'cyan', months: 6 },
  { value: 'gold', label: '金卡会员', color: 'gold', months: 12 },
  { value: 'diamond', label: '钻石会员', color: 'purple', months: 24 },
]

export const FILM_TYPE_OPTIONS = [
  { value: '彩色负片', label: '彩色负片' },
  { value: '黑白负片', label: '黑白负片' },
  { value: '彩色反转片', label: '彩色反转片' },
  { value: '黑白反转片', label: '黑白反转片' },
  { value: '电影胶片', label: '电影胶片' },
]

export const FILM_BRAND_OPTIONS = [
  { value: 'Kodak', label: 'Kodak 柯达' },
  { value: 'Fujifilm', label: 'Fujifilm 富士' },
  { value: 'Ilford', label: 'Ilford 伊尔福' },
  { value: 'Cinestill', label: 'Cinestill' },
  { value: 'Agfa', label: 'Agfa 爱克发' },
  { value: '其他', label: '其他' },
]

export const FORMAT_OPTIONS = [
  { value: '135', label: '135 格式' },
  { value: '120', label: '120 格式' },
  { value: 'large_format', label: '大画幅' },
]

export const ISO_OPTIONS = [
  { value: '100', label: 'ISO 100' },
  { value: '200', label: 'ISO 200' },
  { value: '400', label: 'ISO 400' },
  { value: '800', label: 'ISO 800' },
  { value: '1600', label: 'ISO 1600' },
  { value: '3200', label: 'ISO 3200' },
]

export const PROCESS_TYPE_OPTIONS = [
  { value: 'C-41', label: 'C-41 彩色负片' },
  { value: 'D-76', label: 'D-76 黑白负片' },
  { value: 'E-6', label: 'E-6 彩色反转片' },
  { value: '其他', label: '其他工艺' },
]

export const SCAN_RESOLUTION_OPTIONS = [
  { value: '2000dpi', label: '2000 dpi' },
  { value: '3000dpi', label: '3000 dpi' },
  { value: '4000dpi', label: '4000 dpi' },
  { value: '6000dpi', label: '6000 dpi' },
]

export const DELIVERY_VERSION_OPTIONS = [
  { value: 'standard', label: '标准版' },
  { value: 'high', label: '高清版' },
  { value: 'raw', label: 'RAW原片' },
]

export const HANDLER_OPTIONS = [
  { value: '冲扫员A', label: '冲扫员A' },
  { value: '冲扫员B', label: '冲扫员B' },
  { value: '冲扫员C', label: '冲扫员C' },
]

export const getStatusLabel = (status: FilmStatus) => {
  return FILM_STATUS_OPTIONS.find(o => o.value === status)?.label || status
}

export const getStatusColor = (status: FilmStatus) => {
  return FILM_STATUS_OPTIONS.find(o => o.value === status)?.color || 'default'
}

export const getMemberLevelLabel = (level: string) => {
  return MEMBER_LEVEL_OPTIONS.find(o => o.value === level)?.label || level
}

export const getMemberLevelColor = (level: string) => {
  return MEMBER_LEVEL_OPTIONS.find(o => o.value === level)?.color || 'default'
}

export const getReminderTypeLabel = (type: ReminderType) => {
  return REMINDER_TYPE_OPTIONS.find(o => o.value === type)?.label || type
}

export const getReminderTypeColor = (type: ReminderType) => {
  return REMINDER_TYPE_OPTIONS.find(o => o.value === type)?.color || 'default'
}

export const getPriorityLabel = (priority: string) => {
  return REMINDER_PRIORITY_OPTIONS.find(o => o.value === priority)?.label || priority
}

export const getPriorityColor = (priority: string) => {
  return REMINDER_PRIORITY_OPTIONS.find(o => o.value === priority)?.color || 'default'
}
