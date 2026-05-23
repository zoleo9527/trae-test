export enum WorkOrderStatus {
  ABNORMAL_REPORTED = 'abnormal_reported',
  DOWNTIME_CONFIRMED = 'downtime_confirmed',
  PART_REQUESTED = 'part_requested',
  PART_APPROVED = 'part_approved',
  PART_RECEIVED = 'part_received',
  REPAIR_COMPLETED = 'repair_completed',
  REVIEW_SUBMITTED = 'review_submitted',
  CLOSED = 'closed',
}

export const WorkOrderStatusLabels: Record<WorkOrderStatus, string> = {
  [WorkOrderStatus.ABNORMAL_REPORTED]: '异常上报',
  [WorkOrderStatus.DOWNTIME_CONFIRMED]: '停机确认',
  [WorkOrderStatus.PART_REQUESTED]: '备件申请',
  [WorkOrderStatus.PART_APPROVED]: '备件审批通过',
  [WorkOrderStatus.PART_RECEIVED]: '备件已领取',
  [WorkOrderStatus.REPAIR_COMPLETED]: '维修完成',
  [WorkOrderStatus.REVIEW_SUBMITTED]: '复盘已提交',
  [WorkOrderStatus.CLOSED]: '已关闭',
};

export const WorkOrderStatusFlow: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  [WorkOrderStatus.ABNORMAL_REPORTED]: [WorkOrderStatus.DOWNTIME_CONFIRMED],
  [WorkOrderStatus.DOWNTIME_CONFIRMED]: [WorkOrderStatus.PART_REQUESTED, WorkOrderStatus.REPAIR_COMPLETED],
  [WorkOrderStatus.PART_REQUESTED]: [WorkOrderStatus.PART_APPROVED],
  [WorkOrderStatus.PART_APPROVED]: [WorkOrderStatus.PART_RECEIVED],
  [WorkOrderStatus.PART_RECEIVED]: [WorkOrderStatus.REPAIR_COMPLETED],
  [WorkOrderStatus.REPAIR_COMPLETED]: [WorkOrderStatus.REVIEW_SUBMITTED],
  [WorkOrderStatus.REVIEW_SUBMITTED]: [WorkOrderStatus.CLOSED],
  [WorkOrderStatus.CLOSED]: [],
};

export enum AbnormalType {
  INVERTER_FAULT = 'inverter_fault',
  STRING_ABNORMAL = 'string_abnormal',
  COMMUNICATION_FAILURE = 'communication_failure',
  GRID_ABNORMAL = 'grid_abnormal',
  WEATHER_ISSUE = 'weather_issue',
  OTHER = 'other',
}

export const AbnormalTypeLabels: Record<AbnormalType, string> = {
  [AbnormalType.INVERTER_FAULT]: '逆变器故障',
  [AbnormalType.STRING_ABNORMAL]: '组串异常',
  [AbnormalType.COMMUNICATION_FAILURE]: '通信故障',
  [AbnormalType.GRID_ABNORMAL]: '电网异常',
  [AbnormalType.WEATHER_ISSUE]: '天气问题',
  [AbnormalType.OTHER]: '其他',
};
