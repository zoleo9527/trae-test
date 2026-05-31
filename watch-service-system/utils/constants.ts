import type { WorkOrderStatus, Priority, UserRole } from '~/types/workorder';

export const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  pending_review: '待检测',
  quoting: '报价中',
  pending_approval: '待审批',
  rejected: '已驳回',
  pending_confirm: '待客户确认',
  customer_rejected: '客户驳回',
  repairing: '维修中',
  completed: '已完成',
  picked_up: '已取件',
};

export const STATUS_COLORS: Record<WorkOrderStatus, string> = {
  pending_review: 'amber',
  quoting: 'blue',
  pending_approval: 'orange',
  rejected: 'red',
  pending_confirm: 'purple',
  customer_rejected: 'red',
  repairing: 'cyan',
  completed: 'green',
  picked_up: 'gray',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'gray',
  medium: 'blue',
  high: 'orange',
  urgent: 'red',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  manager: '售后经理',
  consultant: '接件顾问',
  technician: '维修技师',
};

export const WATCH_BRANDS = [
  '劳力士', '欧米茄', '卡地亚', '万国', '浪琴',
  '天梭', '美度', '梅花', '精工', '西铁城',
  '江诗丹顿', '百达翡丽', '爱彼', '积家', '伯爵'
];

export const REPAIR_PROGRESS_LABELS: Record<string, string> = {
  inspecting: '检测中',
  parts_preparing: '配件准备',
  repairing: '维修中',
  testing: '测试中',
  completed: '已完成',
};

export const REPAIR_PROGRESS_COLORS: Record<string, string> = {
  inspecting: 'bg-blue-500',
  parts_preparing: 'bg-amber-500',
  repairing: 'bg-cyan-500',
  testing: 'bg-purple-500',
  completed: 'bg-green-500',
};

export const REPAIR_PROGRESS_ICONS: Record<string, string> = {
  inspecting: 'mdi:magnify',
  parts_preparing: 'mdi:package-variant',
  repairing: 'mdi:hammer-wrench',
  testing: 'mdi:check-circle-outline',
  completed: 'mdi:check',
};

export const STATUS_GROUPS: Record<string, WorkOrderStatus[]> = {
  pending: ['pending_review', 'quoting', 'pending_approval', 'pending_confirm', 'repairing'],
  rejected: ['rejected', 'customer_rejected'],
  approval: ['pending_approval'],
  followup: ['picked_up'],
  completed: ['completed'],
  pending_confirm: ['pending_confirm'],
};
