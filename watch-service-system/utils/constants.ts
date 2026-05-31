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
