import type { AssessmentType, ResponsibleParty } from '@/types';

export interface AssessmentRule {
  type: AssessmentType;
  minScore: number;
  maxScore: number;
  minFine: number;
  maxFine: number;
  description: string;
  triggersTrainingAt: number;
}

export const ASSESSMENT_RULES: Record<AssessmentType, AssessmentRule> = {
  timeout: {
    type: 'timeout',
    minScore: 2,
    maxScore: 10,
    minFine: 10,
    maxFine: 100,
    description: '配送超时',
    triggersTrainingAt: 5,
  },
  complaint: {
    type: 'complaint',
    minScore: 3,
    maxScore: 15,
    minFine: 50,
    maxFine: 300,
    description: '用户投诉',
    triggersTrainingAt: 5,
  },
  violation: {
    type: 'violation',
    minScore: 5,
    maxScore: 20,
    minFine: 100,
    maxFine: 500,
    description: '违规操作',
    triggersTrainingAt: 5,
  },
  service_issue: {
    type: 'service_issue',
    minScore: 2,
    maxScore: 8,
    minFine: 20,
    maxFine: 100,
    description: '服务问题',
    triggersTrainingAt: 5,
  },
};

export interface CalculatedAssessment {
  scoreDeducted: number;
  fineAmount: number;
  requiresTraining: boolean;
  reasoning: string[];
}

export function calculateAssessment(
  type: AssessmentType,
  responsibleParty: ResponsibleParty,
  severity: 'minor' | 'moderate' | 'severe' = 'moderate',
  isRepeatOffense: boolean = false
): CalculatedAssessment {
  const rule = ASSESSMENT_RULES[type];
  const reasoning: string[] = [];

  if (responsibleParty !== 'rider') {
    return {
      scoreDeducted: 0,
      fineAmount: 0,
      requiresTraining: false,
      reasoning: [`责任方为${getPartyLabel(responsibleParty)}，不对骑手进行考核`],
    };
  }

  let scoreMultiplier = 1;
  let fineMultiplier = 1;

  if (severity === 'minor') {
    scoreMultiplier = 0.5;
    fineMultiplier = 0.5;
    reasoning.push('情节较轻，扣分和罚款减半');
  } else if (severity === 'severe') {
    scoreMultiplier = 1.5;
    fineMultiplier = 1.5;
    reasoning.push('情节严重，扣分和罚款加倍');
  }

  if (isRepeatOffense) {
    scoreMultiplier *= 1.5;
    fineMultiplier *= 1.5;
    reasoning.push('30天内重复违规，扣分和罚款追加50%');
  }

  const midScore = (rule.minScore + rule.maxScore) / 2;
  const midFine = (rule.minFine + rule.maxFine) / 2;

  const scoreDeducted = Math.round(midScore * scoreMultiplier);
  const fineAmount = Math.round(midFine * fineMultiplier);

  const requiresTraining = scoreDeducted >= rule.triggersTrainingAt;

  if (requiresTraining) {
    reasoning.push(`扣分 ${scoreDeducted} 分 ≥ 触发培训阈值 ${rule.triggersTrainingAt} 分，需参加培训`);
  }

  reasoning.unshift(`违规类型：${rule.description}`);

  return {
    scoreDeducted,
    fineAmount,
    requiresTraining,
    reasoning,
  };
}

export function getAssessmentTypeLabel(type: AssessmentType): string {
  const labels: Record<AssessmentType, string> = {
    timeout: '配送超时',
    complaint: '用户投诉',
    violation: '违规操作',
    service_issue: '服务问题',
  };
  return labels[type] || type;
}

export function getAssessmentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: '草稿',
    pending_approval: '待审核',
    approved: '已通过',
    appealed: '已申诉',
    rejected: '已驳回',
  };
  return labels[status] || status;
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

export function getSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    severe: '严重',
    moderate: '中度',
    minor: '轻微',
  };
  return labels[severity] || severity;
}

export function getResponsiblePartyLabel(party: string): string {
  const labels: Record<string, string> = {
    rider: '骑手',
    merchant: '商家',
    platform: '平台',
    user: '用户',
    unclear: '待判定',
  };
  return labels[party] || party;
}

function getPartyLabel(party: string): string {
  const labels: Record<string, string> = {
    rider: '骑手',
    merchant: '商家',
    platform: '平台',
    user: '用户',
    unclear: '待判定',
  };
  return labels[party] || party;
}
