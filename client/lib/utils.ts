import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待确认', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  confirmed: { label: '已确认', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  producing: { label: '生产中', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  shipped: { label: '已发货', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  partial_arrived: { label: '部分到货', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  arrived: { label: '已到货', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  installing: { label: '安装中', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  completed: { label: '已完成', color: 'bg-green-50 text-green-700 border-green-200' },
  cancelled: { label: '已取消', color: 'bg-red-50 text-red-700 border-red-200' },
  after_sales: { label: '售后中', color: 'bg-orange-50 text-orange-700 border-orange-200' },
}

export const ITEM_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'bg-gray-100 text-gray-700' },
  producing: { label: '生产中', color: 'bg-purple-50 text-purple-700' },
  shipped: { label: '已发货', color: 'bg-indigo-50 text-indigo-700' },
  arrived: { label: '已到货', color: 'bg-teal-50 text-teal-700' },
  installed: { label: '已安装', color: 'bg-green-50 text-green-700' },
  damaged: { label: '已损坏', color: 'bg-red-50 text-red-700' },
  missing: { label: '缺失', color: 'bg-orange-50 text-orange-700' },
  returned: { label: '已退回', color: 'bg-gray-50 text-gray-600' },
}

export const ARRIVAL_STATUS_MAP: Record<string, { label: string; color: string }> = {
  arrived: { label: '已到货', color: 'bg-green-50 text-green-700' },
  partial: { label: '部分到货', color: 'bg-amber-50 text-amber-700' },
  damaged: { label: '有损坏', color: 'bg-red-50 text-red-700' },
  pending: { label: '待到货', color: 'bg-gray-100 text-gray-700' },
}

export const INSTALL_STATUS_MAP: Record<string, { label: string; color: string }> = {
  scheduled: { label: '已预约', color: 'bg-blue-50 text-blue-700' },
  confirmed: { label: '已确认', color: 'bg-indigo-50 text-indigo-700' },
  completed: { label: '已完成', color: 'bg-green-50 text-green-700' },
  cancelled: { label: '已取消', color: 'bg-gray-50 text-gray-600' },
  rescheduled: { label: '已改期', color: 'bg-amber-50 text-amber-700' },
  problem: { label: '有问题', color: 'bg-red-50 text-red-700' },
}

export const SAMPLE_STATUS_MAP: Record<string, { label: string; color: string }> = {
  lent: { label: '借出中', color: 'bg-blue-50 text-blue-700' },
  returned: { label: '已归还', color: 'bg-green-50 text-green-700' },
  overdue: { label: '超期未还', color: 'bg-red-50 text-red-700' },
  lost: { label: '已丢失', color: 'bg-gray-50 text-gray-600' },
}

export const REPLACEMENT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'bg-gray-100 text-gray-700' },
  ordered: { label: '已下单', color: 'bg-blue-50 text-blue-700' },
  arrived: { label: '已到货', color: 'bg-teal-50 text-teal-700' },
  installed: { label: '已安装', color: 'bg-green-50 text-green-700' },
  confirmed: { label: '已确认', color: 'bg-green-100 text-green-800' },
  rejected: { label: '已拒绝', color: 'bg-red-50 text-red-700' },
}

export const EVENT_TYPE_MAP: Record<string, { label: string; icon: string; color: string }> = {
  order_created: { label: '订单创建', icon: 'FileText', color: 'text-blue-500 bg-blue-50' },
  status_change: { label: '状态变更', icon: 'RefreshCw', color: 'text-purple-500 bg-purple-50' },
  config_added: { label: '添加配置', icon: 'Settings', color: 'text-cyan-500 bg-cyan-50' },
  config_confirmed: { label: '配置确认', icon: 'CheckCircle', color: 'text-green-500 bg-green-50' },
  config_pending: { label: '配置待确认', icon: 'Clock', color: 'text-amber-500 bg-amber-50' },
  arrival: { label: '到货', icon: 'Truck', color: 'text-teal-500 bg-teal-50' },
  arrival_partial: { label: '部分到货', icon: 'Package', color: 'text-amber-500 bg-amber-50' },
  arrival_damaged: { label: '到货损坏', icon: 'AlertTriangle', color: 'text-red-500 bg-red-50' },
  arrival_missing: { label: '到货缺失', icon: 'AlertOctagon', color: 'text-orange-500 bg-orange-50' },
  installation_scheduled: { label: '安装预约', icon: 'Calendar', color: 'text-indigo-500 bg-indigo-50' },
  installation_rescheduled: { label: '安装改期', icon: 'CalendarClock', color: 'text-amber-500 bg-amber-50' },
  installation_completed: { label: '安装完成', icon: 'CheckCircle2', color: 'text-green-500 bg-green-50' },
  installation_problem: { label: '安装问题', icon: 'Wrench', color: 'text-red-500 bg-red-50' },
  installation_cancelled: { label: '安装取消', icon: 'XCircle', color: 'text-gray-500 bg-gray-50' },
  sample_lent: { label: '样品借出', icon: 'Box', color: 'text-blue-500 bg-blue-50' },
  sample_returned: { label: '样品归还', icon: 'Undo2', color: 'text-green-500 bg-green-50' },
  sample_overdue: { label: '样品超期', icon: 'AlertCircle', color: 'text-red-500 bg-red-50' },
  sample_lost: { label: '样品丢失', icon: 'XCircle', color: 'text-gray-500 bg-gray-50' },
  replacement_requested: { label: '补件申请', icon: 'PlusCircle', color: 'text-amber-500 bg-amber-50' },
  replacement_ordered: { label: '补件下单', icon: 'ShoppingCart', color: 'text-blue-500 bg-blue-50' },
  replacement_arrived: { label: '补件到货', icon: 'PackageCheck', color: 'text-teal-500 bg-teal-50' },
  replacement_installed: { label: '补件安装', icon: 'Wrench', color: 'text-green-500 bg-green-50' },
  replacement_confirmed: { label: '补件确认', icon: 'CheckCheck', color: 'text-green-600 bg-green-100' },
  replacement_rejected: { label: '补件拒绝', icon: 'XOctagon', color: 'text-red-500 bg-red-50' },
  item_added: { label: '添加商品', icon: 'Plus', color: 'text-cyan-500 bg-cyan-50' },
}