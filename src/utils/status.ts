import type { WorkOrderStatus, WorkOrderPriority, AlarmLevel, AlarmStatus, SparePartStatus } from '../types';

export const workOrderStatusLabels: Record<WorkOrderStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  waiting_spare: '待备件',
  reviewing: '待审核',
  returned: '已退回',
  closed: '已关闭',
};

export const workOrderStatusColors: Record<WorkOrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  processing: 'bg-blue-100 text-blue-800 border-blue-200',
  waiting_spare: 'bg-orange-100 text-orange-800 border-orange-200',
  reviewing: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  returned: 'bg-red-100 text-red-800 border-red-200',
  closed: 'bg-gray-100 text-gray-600 border-gray-200',
};

export const workOrderPriorityLabels: Record<WorkOrderPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '紧急',
};

export const workOrderPriorityColors: Record<WorkOrderPriority, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export const alarmLevelLabels: Record<AlarmLevel, string> = {
  critical: '严重',
  warning: '重要',
  info: '一般',
};

export const alarmLevelColors: Record<AlarmLevel, string> = {
  critical: 'bg-red-500',
  warning: 'bg-orange-500',
  info: 'bg-yellow-500',
};

export const alarmStatusLabels: Record<AlarmStatus, string> = {
  active: '活动',
  acknowledged: '已确认',
  resolved: '已解决',
};

export const sparePartStatusLabels: Record<SparePartStatus, string> = {
  pending: '待审批',
  approved: '已批准',
  issued: '已发放',
  returned: '已归还',
  rejected: '已拒绝',
};

export const sparePartStatusColors: Record<SparePartStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-blue-100 text-blue-800',
  issued: 'bg-green-100 text-green-800',
  returned: 'bg-gray-100 text-gray-600',
  rejected: 'bg-red-100 text-red-800',
};

export const actionLabels: Record<string, string> = {
  create: '创建工单',
  assign: '分派工单',
  start: '开始处理',
  request_spare: '申请备件',
  approve_spare: '批准备件',
  reject_spare: '拒绝备件',
  issue_spare: '发放备件',
  return_spare: '归还备件',
  complete: '提交完成',
  reject: '退回重处理',
  close: '关闭工单',
  update: '更新信息',
  reopen: '重新打开',
  link_alarm: '关联预警',
};
