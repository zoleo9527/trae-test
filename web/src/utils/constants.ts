export const orderStatusMap: Record<string, { label: string; type: string }> = {
  pending: { label: '待确认', type: 'info' },
  confirmed: { label: '已确认', type: 'primary' },
  producing: { label: '生产中', type: 'warning' },
  delivered: { label: '已到货', type: 'success' },
  installing: { label: '安装中', type: 'primary' },
  completed: { label: '已完成', type: 'success' },
  cancelled: { label: '已取消', type: 'info' },
  exception: { label: '异常', type: 'danger' },
}

export const appointmentStatusMap: Record<string, { label: string; type: string }> = {
  pending: { label: '待确认', type: 'info' },
  confirmed: { label: '已确认', type: 'primary' },
  in_progress: { label: '进行中', type: 'warning' },
  completed: { label: '已完成', type: 'success' },
  cancelled: { label: '已取消', type: 'info' },
  rescheduled: { label: '已改期', type: 'warning' },
}

export const acceptanceStatusMap: Record<string, { label: string; type: string }> = {
  pending: { label: '待验收', type: 'info' },
  in_progress: { label: '验收中', type: 'primary' },
  passed: { label: '验收通过', type: 'success' },
  failed: { label: '验收未通过', type: 'danger' },
  rectified: { label: '已整改', type: 'success' },
}

export const exceptionTypeMap: Record<string, { label: string; type: string }> = {
  sample_not_returned: { label: '样品未归还', type: 'warning' },
  missing_parts: { label: '缺件', type: 'danger' },
  quality_issue: { label: '质量问题', type: 'danger' },
  installation_problem: { label: '安装问题', type: 'warning' },
  customer_complaint: { label: '客户投诉', type: 'danger' },
  delivery_delay: { label: '发货延迟', type: 'warning' },
  custom_config_issue: { label: '定制配置问题', type: 'warning' },
  other: { label: '其他', type: 'info' },
}

export const exceptionStatusMap: Record<string, { label: string; type: string }> = {
  open: { label: '待处理', type: 'danger' },
  in_progress: { label: '处理中', type: 'warning' },
  awaiting_customer: { label: '待客户确认', type: 'info' },
  awaiting_supplier: { label: '待供应商', type: 'info' },
  resolved: { label: '已解决', type: 'success' },
  closed: { label: '已关闭', type: 'success' },
}

export const sampleStatusMap: Record<string, { label: string; type: string }> = {
  borrowed: { label: '借出中', type: 'primary' },
  returned: { label: '已归还', type: 'success' },
  overdue: { label: '逾期未还', type: 'danger' },
  lost: { label: '遗失', type: 'danger' },
  kept_by_customer: { label: '客户留购', type: 'success' },
}

export const repairPartStatusMap: Record<string, { label: string; type: string }> = {
  requested: { label: '已申请', type: 'info' },
  approved: { label: '已审批', type: 'primary' },
  ordered: { label: '已下单', type: 'warning' },
  shipped: { label: '已发货', type: 'warning' },
  received: { label: '已到货', type: 'success' },
  installed: { label: '已安装', type: 'success' },
  cancelled: { label: '已取消', type: 'info' },
}

export const notificationPriorityMap: Record<string, { label: string; type: string }> = {
  low: { label: '低', type: 'info' },
  medium: { label: '中', type: 'primary' },
  high: { label: '高', type: 'warning' },
  urgent: { label: '紧急', type: 'danger' },
}

export function formatDate(date: string | Date): string {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN')
}

export function formatDateTime(date: string | Date): string {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}
