import type {
  AppealType,
  AppealStatus,
  SubsidyType,
  SubsidyStatus,
  AssessmentType,
  AssessmentStatus,
  TrainingType,
  TrainingStatus,
  ResponsibleParty,
} from '@/types';

export const APPEAL_TYPE_LABELS: Record<AppealType, string> = {
  timeout: '超时',
  wrong_item: '错送漏送',
  damage: '物品损坏',
  rude: '服务态度',
  refund: '退款申请',
  other: '其他',
};

export const APPEAL_STATUS_LABELS: Record<AppealStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  rejected: '已驳回',
};

export const APPEAL_STATUS_VARIANTS: Record<AppealStatus, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending: 'warning',
  processing: 'info',
  resolved: 'success',
  rejected: 'danger',
};

export const SUBSIDY_TYPE_LABELS: Record<SubsidyType, string> = {
  merchant_delay: '商家出餐慢',
  weather: '恶劣天气',
  traffic: '交通异常',
  address: '地址错误',
  other: '其他',
};

export const SUBSIDY_STATUS_LABELS: Record<SubsidyStatus, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
};

export const SUBSIDY_STATUS_VARIANTS: Record<SubsidyStatus, 'default' | 'success' | 'warning' | 'danger'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

export const ASSESSMENT_TYPE_LABELS: Record<AssessmentType, string> = {
  timeout: '配送超时',
  complaint: '用户投诉',
  violation: '违规操作',
  service_issue: '服务问题',
};

export const ASSESSMENT_STATUS_LABELS: Record<AssessmentStatus, string> = {
  draft: '草稿',
  pending_approval: '待审核',
  approved: '已通过',
  appealed: '已申诉',
  rejected: '已驳回',
};

export const ASSESSMENT_STATUS_VARIANTS: Record<AssessmentStatus, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  draft: 'default',
  pending_approval: 'warning',
  approved: 'success',
  appealed: 'info',
  rejected: 'danger',
};

export const TRAINING_TYPE_LABELS: Record<TrainingType, string> = {
  mandatory: '强制培训',
  remedial: '强化培训',
  optional: '选修培训',
};

export const TRAINING_STATUS_LABELS: Record<TrainingStatus, string> = {
  pending: '待学习',
  in_progress: '学习中',
  completed: '已完成',
  expired: '已过期',
};

export const TRAINING_STATUS_VARIANTS: Record<TrainingStatus, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending: 'warning',
  in_progress: 'info',
  completed: 'success',
  expired: 'danger',
};

export const RESPONSIBLE_PARTY_LABELS: Record<ResponsibleParty | string, string> = {
  rider: '骑手',
  merchant: '商家',
  platform: '平台',
  user: '用户',
  unclear: '待判定',
};

export const SEVERITY_LABELS: Record<string, string> = {
  severe: '严重',
  moderate: '中度',
  minor: '轻微',
};

export function getAppealTypeLabel(type: string): string {
  return APPEAL_TYPE_LABELS[type as AppealType] || type;
}

export function getAppealStatusLabel(status: string): string {
  return APPEAL_STATUS_LABELS[status as AppealStatus] || status;
}

export function getAppealStatusVariant(status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  return APPEAL_STATUS_VARIANTS[status as AppealStatus] || 'default';
}

export function getSubsidyTypeLabel(type: string): string {
  return SUBSIDY_TYPE_LABELS[type as SubsidyType] || type;
}

export function getSubsidyStatusLabel(status: string): string {
  return SUBSIDY_STATUS_LABELS[status as SubsidyStatus] || status;
}

export function getSubsidyStatusVariant(status: string): 'default' | 'success' | 'warning' | 'danger' {
  return SUBSIDY_STATUS_VARIANTS[status as SubsidyStatus] || 'default';
}

export function getAssessmentTypeLabel(type: string): string {
  return ASSESSMENT_TYPE_LABELS[type as AssessmentType] || type;
}

export function getAssessmentStatusLabel(status: string): string {
  return ASSESSMENT_STATUS_LABELS[status as AssessmentStatus] || status;
}

export function getAssessmentStatusVariant(status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  return ASSESSMENT_STATUS_VARIANTS[status as AssessmentStatus] || 'default';
}

export function getTrainingTypeLabel(type: string): string {
  return TRAINING_TYPE_LABELS[type as TrainingType] || type;
}

export function getTrainingStatusLabel(status: string): string {
  return TRAINING_STATUS_LABELS[status as TrainingStatus] || status;
}

export function getTrainingStatusVariant(status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  return TRAINING_STATUS_VARIANTS[status as TrainingStatus] || 'default';
}

export function getResponsiblePartyLabel(party: string): string {
  return RESPONSIBLE_PARTY_LABELS[party] || party;
}

export function getSeverityLabel(severity: string): string {
  return SEVERITY_LABELS[severity] || severity;
}

export function getAssessmentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    pending_approval: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    appealed: 'bg-blue-100 text-blue-700',
    rejected: 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-600';
}
